# Documentación Técnica Integral: Backend & Persistencia

Este documento detalla la arquitectura de servidor y base de datos para la migración del sistema Excel/VBA a un entorno empresarial basado en **Node.js (Express/TypeScript)** y **PostgreSQL**.

---

## 1. Estructura de Base de Datos (PostgreSQL)

El diseño está normalizado para garantizar integridad y evitar la redundancia de datos del sistema legacy.

### 1.1 Catálogos y Entidades (ABMC)
```sql
-- 1. Puestos y Roles
CREATE TABLE job_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- 'DC', 'Gerente Comercial', etc.
);

-- 2. Empleados (Vendedores, Preventas, Managers)
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    role_id INT REFERENCES job_roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cuentas (Clientes)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    contact_name VARCHAR(100),
    contact_email VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Auxiliares de Negocio
CREATE TABLE opportunity_statuses (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL);
CREATE TABLE document_types (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL);
CREATE TABLE opportunity_types (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL);
```

### 1.2 Tabla Principal: Oportunidades
```sql
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_id INT NOT NULL REFERENCES accounts(id),
    status_id INT NOT NULL REFERENCES opportunity_statuses(id),
    
    -- Responsables
    manager_id INT NOT NULL REFERENCES employees(id), -- Gerente Comercial
    responsible_dc_id INT REFERENCES employees(id),
    responsible_business_id INT REFERENCES employees(id),
    responsible_tech_id INT REFERENCES employees(id),

    -- Semáforo y Reglas de Negocio
    percentage INT NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
    color_code VARCHAR(10) NOT NULL DEFAULT 'NONE', -- 'RED', 'YELLOW', 'GREEN', 'NONE'
    
    -- Cronograma
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    engagement_date DATE,
    scope_date DATE,
    coe_date DATE,
    delivery_date DATE,      -- Fecha Compromiso
    real_delivery_date DATE, -- Fecha Real
    
    -- Métricas de Esfuerzo e Integración
    estimated_hours INT,
    estimated_term_months INT,
    work_plan_link TEXT,
    k_red_index INT DEFAULT 0,
    order_index INT DEFAULT 0,

    -- Estados de Persistencia
    is_archived BOOLEAN DEFAULT FALSE, -- Determina pestaña ON vs ON-OUT
    deleted_at TIMESTAMP DEFAULT NULL,  -- Soft Delete para TRASH
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Implementación del Backend (Node.js)

### 2.1 Esquemas de Validación (Zod)
```typescript
import { z } from 'zod';

// Validación estricta del Semáforo (Reglas VBA Replicadas)
export const OpportunitySchema = z.object({
    name: z.string().min(3),
    account_id: z.number(),
    percentage: z.number().min(0).max(100),
    color_code: z.enum(['RED', 'YELLOW', 'GREEN', 'NONE']),
    delivery_date: z.string().optional()
}).superRefine((data, ctx) => {
    const { percentage, color_code } = data;
    if (color_code === 'RED' && percentage !== 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rojo requiere 0%", path: ['percentage'] });
    }
    if (color_code === 'YELLOW' && (percentage < 50 || percentage >= 70)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Amarillo requiere 50-69%", path: ['percentage'] });
    }
    if (color_code === 'GREEN' && percentage < 70) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Verde requiere >= 70%", path: ['percentage'] });
    }
});
```

### 2.2 Controladores de API

#### A. Gestión de Oportunidades
```typescript
import { Router } from 'express';
const router = Router();

// Listado con filtros de pestaña
router.get('/opportunities', async (req, res) => {
    const { view } = req.query; // 'ON', 'ON-OUT', 'TRASH'
    let query = `SELECT * FROM opportunities WHERE deleted_at IS NULL`;
    
    if (view === 'ON') query += ` AND is_archived = FALSE`;
    else if (view === 'ON-OUT') query += ` AND is_archived = TRUE`;
    else if (view === 'TRASH') query = `SELECT * FROM opportunities WHERE deleted_at IS NOT NULL`;

    // Ejecutar query en DB...
    res.json(await db.execute(query));
});

// Upsert con lógica de auto-archivado
router.post('/opportunities', async (req, res) => {
    const data = OpportunitySchema.parse(req.body);
    
    // Lógica 'MoverFilas': Si el estado es Ganada/Perdida, archivar automáticamente
    const status = await db.table('opportunity_statuses').find(data.status_id);
    const isArchivable = status.name.includes('Ganada') || status.name.includes('Perdida');
    
    const result = await db.table('opportunities').insert({
        ...data,
        is_archived: isArchivable
    });
    res.status(201).json(result);
});

// Soft Delete
router.delete('/opportunities/:id', async (req, res) => {
    await db.execute(`UPDATE opportunities SET deleted_at = NOW() WHERE id = $1`, [req.params.id]);
    res.sendStatus(204);
});
```

#### B. Gestión de Entidades (ABMC)
```typescript
// ABMC Cuentas
router.get('/accounts', async (req, res) => {
    res.json(await db.table('accounts').where('is_active', true).select());
});

router.put('/accounts/:id', async (req, res) => {
    const { name, contact_name, contact_email, is_active } = req.body;
    // Validar que si se desactiva, no tenga oportunidades activas pendientes
    const activeOpps = await db.table('opportunities')
        .where('account_id', req.params.id)
        .where('is_archived', false).count();
    
    if (!is_active && activeOpps > 0) {
        return res.status(400).json({ error: "No se puede desactivar cuenta con oportunidades en curso." });
    }
    
    await db.table('accounts').update(req.params.id, { name, contact_name, contact_email, is_active });
    res.json({ success: true });
});
```

---

## 3. Consideraciones de Infraestructura

1.  **Auditoría (Triggers):** Se recomienda un trigger en PostgreSQL que inserte en una tabla `audit_log` cada vez que el `color_code` o `percentage` cambie, para mantener trazabilidad histórica.
2.  **Sincronización SharePoint:** El campo `work_plan_link` debe ser monitoreado por un Job (Node-cron) que invoque a la **Microsoft Graph API**. Si detecta cambios en las celdas de "Cómputo" del Excel remoto, debe actualizar `estimated_hours` automáticamente.
3.  **Soft Delete:** La recuperación de datos en la pestaña **TRASH** simplemente limpia el campo `deleted_at`.
4.  **Seguridad:** Implementar JWT para asegurar que solo usuarios con rol 'Manager' puedan realizar ABMC de catálogos.