-- 1. Catálogos para Equipo de Proyecto
CREATE TABLE team_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE seniorities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE technologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Tabla de Equipo de Proyecto
CREATE TABLE project_team (
    id SERIAL PRIMARY KEY,
    opportunity_id INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    role_id INT NOT NULL REFERENCES team_roles(id),
    seniority_id INT NOT NULL REFERENCES seniorities(id),
    assignment VARCHAR(20) CHECK (assignment IN ('Full-time', 'Part-time')),
    project_hours INT,
    project_term_months NUMERIC(10,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla intermedia para Stack Tecnológico (Muchos a Muchos)
CREATE TABLE project_team_technologies (
    project_team_id INT NOT NULL REFERENCES project_team(id) ON DELETE CASCADE,
    technology_id INT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
    PRIMARY KEY (project_team_id, technology_id)
);

-- 4. Inserción de Roles de Equipo
INSERT INTO team_roles (name) VALUES 
    ('Project Manager/ Project Lider'),
    ('Lider Técnico'),
    ('Arquitecto'),
    ('Analista Negocio'),
    ('Especialista DevOps'),
    ('Developer Back End'),
    ('Developer Mobile'),
    ('Developer Frontend'),
    ('Data Engineer'),
    ('Científica de Datos'),
    ('Tester QA Manual'),
    ('UX / UI Designer'),
    ('Especialista en BI y Analítica'),
    ('Scrum Master'),
    ('Tester QA Automation')
ON CONFLICT (name) DO NOTHING;

-- 5. Inserción de Seniorities
INSERT INTO seniorities (name) VALUES 
    ('Sr'),
    ('SSr'),
    ('Jr')
ON CONFLICT (name) DO NOTHING;

-- 6. Inserción de Tecnologías iniciales
INSERT INTO technologies (name) VALUES 
    ('Node.js'), ('React'), ('PostgreSQL'), ('Python'), ('Java'), 
    ('AWS'), ('Azure'), ('Docker'), ('Kubernetes'), ('TypeScript'),
    ('Angular'), ('Vue.js'), ('MongoDB'), ('SQL Server'), ('Oracle'),
    ('PHP'), ('Laravel'), ('Swift'), ('Kotlin'), ('Flutter'),
    ('React Native'), ('Go'), ('Rust'), ('Terraform'), ('Jenkins'),
    ('Git'), ('Jira'), ('Confluence'), ('Figma'), ('Adobe XD'),
    ('Power BI'), ('Tableau'), ('Spark'), ('Hadoop'), ('Kafka'),
    ('REST API'), ('NET 8/9'), ('Diseño de Soluciones'), ('Bases de datos y componentes'),
    ('GCP'), ('patrones de diseño'), ('Cloud'), ('frameworks / Lider tecnico con capacidad de desarrollo'),
    ('Experiencia en Gestion de proyectos y relacion con Clientes'), ('Relevamiento de historias de usuarios'),
    ('Generacion de Casos de uso'), ('Github'), ('CI/CD'), ('Diseño DB Relacional / NO Relacional'),
    ('Automatización'), ('IaC'), ('monitoreo'), ('seguridad.Cloud'), ('Networking'),
    ('.Net 8/9'), ('Experiencia en Base de datos Relaciones/NO relacionales'), ('Api Rest'),
    ('React Js'), ('Html 5'), ('Javascript'), ('Network'), ('Selenium'), ('sonarqube'),
    ('nodejs'), ('Cypress'), ('NET 9'), ('Testing.Platform'), ('TestCafe'),
    ('Pruebas Manuales y funcionales')
ON CONFLICT (name) DO NOTHING;