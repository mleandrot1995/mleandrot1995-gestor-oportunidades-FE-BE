
-- Eliminar tablas si existen para un reinicio limpio (orden inverso de dependencias)
DROP TABLE IF EXISTS opportunity_observations;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS job_roles;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS opportunity_statuses;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS opportunity_types;
DROP TABLE IF EXISTS motives;

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
CREATE TABLE motives (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL);

-- 5. Tabla Principal: Oportunidades
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_id INT NOT NULL REFERENCES accounts(id),
    status_id INT NOT NULL REFERENCES opportunity_statuses(id),
    opportunity_type_id INT REFERENCES opportunity_types(id),
    document_type_id INT REFERENCES document_types(id),
    
    -- Responsables
    manager_id INT NOT NULL REFERENCES employees(id), -- Gerente Comercial
    responsible_dc_id INT REFERENCES employees(id),
    responsible_business_id INT REFERENCES employees(id),
    responsible_tech_id INT REFERENCES employees(id),

    -- Semáforo y Reglas de Negocio
    percentage INT NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
    color_code VARCHAR(10) NOT NULL DEFAULT 'NONE', -- 'RED', 'YELLOW', 'GREEN', 'NONE'
    has_ia_proposal BOOLEAN DEFAULT FALSE,
    has_prototype BOOLEAN DEFAULT FALSE,
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
    estimated_term_months INT,
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
('DC'),
('Analista de negocios'),
('Responsable técnico');

-- Empleados (Req 3, 12, 13, 14)
INSERT INTO employees (full_name, role_id, is_active) VALUES
('Matias Lopez Barrios', 2, TRUE),
('Esteban Rodriguez', 2, TRUE),
('Laura Martínez', 1, TRUE),
('Carlos Sánchez', 1, TRUE),
('Ana Gómez', 3, TRUE),
('Javier Torres', 4, TRUE);

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
('Esperando Respuesta');

-- Tipos de Documento (Req 10)
INSERT INTO document_types (name) VALUES 
('Documento'), 
('Reunión'),
('Video'),
('RFP');

-- Tipos de Oportunidad / ON (Req 11)
INSERT INTO opportunity_types (name) VALUES 
('RPA'), 
('Desa Web'), 
('Servicio SW de soporte tecnico'), 
('Licencias');

-- Motivos (Req 23)
INSERT INTO motives (name) VALUES 
('Precio'), 
('Plazo'), 
('Capacidad Técnica'), 
('Otros');

-- Oportunidades de Ejemplo
INSERT INTO opportunities 
    (name, account_id, status_id, manager_id, responsible_dc_id, responsible_business_id, responsible_tech_id, percentage, color_code, start_date, delivery_date, estimated_hours, estimated_term_months, work_plan_link, has_ia_proposal, has_prototype, order_index)
VALUES
    ('Capacitación en RPA', 4, 1, 3, 1, 5, 6, 100, 'GREEN', '2025-09-01', '2025-09-26', 120, 30, 'https://sharepoint.com/kaufmann-rpa', TRUE, TRUE, 1),
    ('Sistema JUCO Servicio', 5, 5, 3, 2, 5, 6, 55, 'YELLOW', '2025-11-01', '2025-12-01', 400, 60, '', FALSE, FALSE, 2),
    ('Desarrollo Plataforma CIE', 6, 6, 4, 1, 5, 6, 0, 'RED', '2025-10-01', '2025-10-13', 0, 0, '', FALSE, FALSE, 3);

-- Observaciones de Ejemplo
INSERT INTO opportunity_observations (opportunity_id, text) VALUES
(1, 'Cliente solicitó capacitación modulo cero.'),
(2, 'Se espera la OC y entrega de código.'),
(3, 'El cliente holdea la oportunidad.');
