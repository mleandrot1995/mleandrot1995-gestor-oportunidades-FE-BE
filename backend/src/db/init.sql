
-- Eliminar tablas si existen para un reinicio limpio (orden inverso de dependencias)
DROP TABLE IF EXISTS opportunity_observations;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS job_roles;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS opportunity_statuses;
DROP TABLE IF EXISTS opportunity_types;
DROP TABLE IF EXISTS motives;

-- 1. Puestos y Roles
CREATE TABLE job_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- 'Aprobador', 'Gerente Comercial', etc.
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
CREATE TABLE opportunity_types (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL);
CREATE TABLE motives (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL);

-- 5. Tabla Principal: Oportunidades
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_id INT NOT NULL REFERENCES accounts(id),
    status_id INT NOT NULL REFERENCES opportunity_statuses(id),
    opportunity_type_id INT REFERENCES opportunity_types(id),
    
    -- Responsables
    manager_id INT NOT NULL REFERENCES employees(id), -- Gerente Comercial
    responsible_dc_id INT REFERENCES employees(id), -- Aprobador
    responsible_business_id INT REFERENCES employees(id),
    responsible_tech_id INT REFERENCES employees(id),

    -- Semáforo y Reglas de Negocio
    percentage INT NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
    color_code VARCHAR(10) NOT NULL DEFAULT 'NONE', -- 'RED', 'YELLOW', 'GREEN', 'NONE'
    has_ia_proposal BOOLEAN DEFAULT FALSE,
    has_prototype BOOLEAN DEFAULT FALSE,
    has_rfp BOOLEAN DEFAULT FALSE, -- NUEVO CAMPO: RFP
    has_anteproyecto BOOLEAN DEFAULT FALSE, -- NUEVO CAMPO: Anteproyecto
    reason_motive TEXT,
    motive_id INT REFERENCES motives(id),
    
    -- Cronograma (Campos mantenidos originalmente)
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    understanding_date DATE,
    engagement_date DATE,
    scope_date DATE,
    coe_date DATE,
    delivery_date DATE,      -- Fecha Compromiso
    commitment_date DATE,     -- Alias/Adicional de compromiso
    real_delivery_date DATE, -- Fecha Real
    
    -- Métricas de Esfuerzo e Integración
    estimated_hours INT,
    estimated_term_months NUMERIC(10,1), -- Modificado para permitir decimales (ej. 2.5)
    work_plan_link TEXT,
    k_red_index INT DEFAULT 0,
    order_index INT DEFAULT 0,

    -- Estados de Persistencia
    is_archived BOOLEAN DEFAULT FALSE, -- Determina pestaña ON vs ON-OUT
    deleted_at TIMESTAMP DEFAULT NULL,  -- Soft Delete para TRASH
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Observaciones de Oportunidades
CREATE TABLE opportunity_observations (
    id SERIAL PRIMARY KEY,
    opportunity_id INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- INSERCIÓN DE DATOS SEGÚN REQUERIMIENTOS ---

-- Puestos y Roles (Req 12, 13, 14)
INSERT INTO job_roles (name) VALUES
('Gerente Comercial'),
('Aprobador'),
('Analista de negocios'),
('Responsable técnico');

-- Empleados (Req 3, 12, 13, 14)
INSERT INTO employees (full_name, role_id, is_active) VALUES
('Matias Lopez Barrios', 2, TRUE),
('Esteban Rodriguez', 2, TRUE),
('Laura Martínez', 1, TRUE),
('Carlos Sánchez', 1, TRUE),
('Ana Gómez', 3, TRUE),
('Javier Torres', 4, TRUE),
('Sebastian', 3, TRUE); -- Agregado Sebastian como Analista de negocios

-- Cuentas (Req 5)
INSERT INTO accounts (name, contact_name, contact_email) VALUES
('Innovatech Corp.', 'Ricardo Palma', 'ricardo.palma@innovatech.com'),
('Quantum Solutions', 'Sofía Loren', 'sofia.loren@quantumsol.com'),
('Legacy Systems Ltd.', 'Juan Pérez', 'juan.perez@legacysys.com'),
('Kaufmann', 'Hans Müller', 'hans@kaufmann.com'),
('GCABA', 'Buenos Aires', 'contacto@gcaba.gov.ar'),
('ICBC', 'Bank Corp', 'info@icbc.com');

-- Estados de Oportunidad (Req 7)
INSERT INTO opportunity_statuses (name) VALUES
('Ganada'),
('Perdida'),
('Desestimada'),
('Evaluación'),
('Elaboración'),
('Esperando Respuesta'),
('En Progreso'),
('Stand-by');

-- Tipos de Oportunidad / ON (Req 11)
INSERT INTO opportunity_types (name) VALUES 
('RPA'), 
('Desa Web'), 
('Servicio SW de soporte tecnico'), 
('Licencias'),
('Renovación de Licencia');

-- Motivos (Req 23)
-- Eliminar datos anteriores si existen para reiniciar la secuencia o evitar duplicados en una inserción limpia
TRUNCATE TABLE motives RESTART IDENTITY CASCADE;

INSERT INTO motives (id, name) VALUES 
(1, '3'),
(2, 'Alcance'),
(3, 'Baja Dirección'),
(4, 'Cerrada por el cliente'),
(5, 'Cliente sin Presupuesto'),
(6, 'Cliente sin respuesta'),
(7, 'Costo'),
(8, 'Costo Experiencia'),
(9, 'Costo Tiempo'),
(10, 'Falta Motivo'),
(11, 'Sin Presupuesto'),
(12, 'Sin Relevar'),
(13, 'Sin Servicio')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Ajustar la secuencia para que el próximo ID sea 14
SELECT setval('motives_id_seq', 13, true);

-- Oportunidades de Ejemplo
INSERT INTO opportunities 
    (name, account_id, status_id, manager_id, responsible_dc_id, responsible_business_id, responsible_tech_id, percentage, color_code, start_date, delivery_date, real_delivery_date, estimated_hours, estimated_term_months, work_plan_link, has_ia_proposal, has_prototype, has_rfp, has_anteproyecto, order_index)
VALUES
    ('MIGRACIÓN A CLOUD DE SISTEMA ERP', 3, 7, 3, NULL, 7, NULL, 60, 'YELLOW', '2024-07-01', '2025-01-15', '2026-01-23', 1200, 6.5, 'https://plan-trabajo-link', TRUE, TRUE, FALSE, TRUE, 1),
    ('PROPUESTA DE PRUEBA', 1, 4, 3, 4, 7, NULL, 0, 'RED', '2026-01-08', NULL, NULL, 1223, 2.5, 'https://otro-plan', TRUE, FALSE, TRUE, FALSE, 2);

-- Observaciones de Ejemplo
INSERT INTO opportunity_observations (opportunity_id, text) VALUES
(1, 'Se requiere validar compatibilidad con base de datos Oracle antigua.'),
(2, 'Nueva observación');
