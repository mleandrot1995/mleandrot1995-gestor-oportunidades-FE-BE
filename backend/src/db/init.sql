
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
-- Eliminar datos anteriores si existen para reiniciar la secuencia o evitar duplicados en una inserción limpia
TRUNCATE TABLE accounts RESTART IDENTITY CASCADE;
INSERT INTO accounts (id, name, is_active) VALUES (1, 'AcerBrag', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (2, 'Addalia', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (3, 'Aeropuertos 2000', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (4, 'Agrotech', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (5, 'Andreani', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (6, 'Andres Safdie', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (7, 'Aracama Martin', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (8, 'Aramark', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (9, 'ARM Service', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (10, 'ASE Conecta', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (11, 'Atento', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (12, 'Banco del Sol', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (13, 'Banmédica - Chile', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (14, 'Bco Hipotecario', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (15, 'Bco Superville', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (16, 'Bimbo', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (17, 'BNA', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (18, 'Boldt', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (19, 'Brinks Argentina', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (20, 'Británico', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (21, 'BST - Grupo Financiero', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (22, 'Car One', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (23, 'CCB - 1412-2024', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (24, 'CCB - 1425-2024', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (25, 'CCB - 1428-2024', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (26, 'CCB - 1430 -2024', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (27, 'CCB - 1438 -2024', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (28, 'CCB - XXXX', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (29, 'Centaurus', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (30, 'CFOTech - RRHH', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (31, 'Claro', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (32, 'Coelsa', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (33, 'Colinet', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (34, 'Confuturo', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (35, 'Cooperativa Morteros', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (36, 'Cooperativa Unión Agropecuaria', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (37, 'Dadone', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (38, 'Despegar', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (39, 'Dienst', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (40, 'Ecipsa', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (41, 'Econorent', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (42, 'Enex', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (43, 'Famiq', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (44, 'Fango Bachas', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (45, 'Farmanet', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (46, 'Farmashop', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (47, 'FCA', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (48, 'Fravega -  RPA', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (49, 'Funeraria Rufino', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (50, 'GCABA', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (51, 'Gobierno Paraguay-Intendencias', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (52, 'Grupo Solnik', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (53, 'Grupo Tawa', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (54, 'Gruppe Heinlein', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (55, 'Gusta +', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (56, 'Haventic', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (57, 'HOP', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (58, 'Hospital Britanico ', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (59, 'ICBC', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (60, 'Iglesia evangelica', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (61, 'InexLink', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (62, 'Infobae', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (63, 'INSSIDE CIBERSEGURIDAD', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (64, 'Insud', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (65, 'Intcomex', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (66, 'IOL', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (67, 'IRSA', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (68, 'IT SYSTEMS INNOVA', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (69, 'JetSmart', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (70, 'Jorge Poccioni', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (71, 'Kaufmann', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (72, 'La Caja', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (73, 'La caja Tucuman version completa', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (74, 'La caja Tucuman version reducida', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (75, 'La Cámara Corredora de Seguros', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (76, 'La Holando Sudamericana', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (77, 'Laboratorio Argenetics', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (78, 'Laboratorio Raffo', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (79, 'LABORATORIO ROCHE', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (80, 'LAKAUT', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (81, 'LBO', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (82, 'Life Seguros', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (83, 'Logiteck', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (84, 'LotBA', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (85, 'Magiis', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (86, 'MAGIIS Argentina S.A.', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (87, 'MEDIFE', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (88, 'MEGA QM', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (89, 'MetroGas', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (90, 'Molymet', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (91, 'National Brokers', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (92, 'NEC', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (93, 'Ocasa', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (94, 'Omint', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (95, 'Orígenes ', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (96, 'Paraná ART', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (97, 'Paraná Seguro', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (98, 'Provincia Net', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (99, 'PwC', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (100, 'ROCHE', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (101, 'Rotoplas', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (102, 'Sacyr', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (103, 'Saugy', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (104, 'Scania', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (105, 'Scania ', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (106, 'Social Bowling Menphis', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (107, 'SunLoyalty', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (108, 'Superville', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (109, 'Supply Solutions', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (110, 'Synd.IO', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (111, 'Telecom', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (112, 'UDEP', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (113, 'Urbano ', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (114, 'UTN - e-Learning', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (115, 'Veritran', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (116, 'VISITAR SALUD ', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (117, 'Volkswagen', TRUE);
INSERT INTO accounts (id, name, is_active) VALUES (118, 'Yottalan', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;
-- Ajustar la secuencia para que el próximo ID sea 119
SELECT setval('accounts_id_seq', 119, true);

-- Estados de Oportunidad (Req 7)
TRUNCATE TABLE opportunity_statuses RESTART IDENTITY CASCADE;
INSERT INTO opportunity_statuses (id, name) VALUES (1, 'Capacity Desestimada C/P');
INSERT INTO opportunity_statuses (id, name) VALUES (2, 'Capacity Desestimada S/P ');
INSERT INTO opportunity_statuses (id, name) VALUES (3, 'Capacity Ganada S/P');
INSERT INTO opportunity_statuses (id, name) VALUES (4, 'Capacity Perdida S/P');
INSERT INTO opportunity_statuses (id, name) VALUES (5, 'Desestimada C/P');
INSERT INTO opportunity_statuses (id, name) VALUES (6, 'Desestimada S/P');
INSERT INTO opportunity_statuses (id, name) VALUES (7, 'Desestimada S/S');
INSERT INTO opportunity_statuses (id, name) VALUES (8, 'Elaboración');
INSERT INTO opportunity_statuses (id, name) VALUES (9, 'Esperando Resp. Cliente');
INSERT INTO opportunity_statuses (id, name) VALUES (10, 'Esperando Resp. Respuesta Cliente');
INSERT INTO opportunity_statuses (id, name) VALUES (11, 'Evaluación');
INSERT INTO opportunity_statuses (id, name) VALUES (12, 'Ganada');
INSERT INTO opportunity_statuses (id, name) VALUES (13, 'Manpower');
INSERT INTO opportunity_statuses (id, name) VALUES (14, 'Perdida')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
-- Ajustar la secuencia para que el próximo ID sea 15
SELECT setval('opportunity_statuses_id_seq', 14, true);

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
