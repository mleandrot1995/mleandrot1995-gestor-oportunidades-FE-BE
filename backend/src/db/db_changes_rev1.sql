-- Eliminar tablas si existen para permitir reejecución limpia
DROP TABLE IF EXISTS project_characteristics;
DROP TABLE IF EXISTS work_methodologies;
DROP TABLE IF EXISTS infrastructure_types;
DROP TABLE IF EXISTS project_team_technologies;
DROP TABLE IF EXISTS project_team;
DROP TABLE IF EXISTS technologies;
DROP TABLE IF EXISTS seniorities;
DROP TABLE IF EXISTS team_roles;

-- 9. Tablas para Equipo de Proyecto (Project Team)
CREATE TABLE IF NOT EXISTS team_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS seniorities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS technologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS project_team (
    id SERIAL PRIMARY KEY,
    opportunity_id INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    role_id INT REFERENCES team_roles(id),
    seniority_id INT REFERENCES seniorities(id),
    main_technology_id INT REFERENCES technologies(id),
    assignment VARCHAR(50) DEFAULT 'Full-time',
    project_hours INT,
    project_term_months NUMERIC(10,1)
);

CREATE TABLE IF NOT EXISTS project_team_technologies (
    project_team_id INT REFERENCES project_team(id) ON DELETE CASCADE,
    technology_id INT REFERENCES technologies(id),
    PRIMARY KEY (project_team_id, technology_id)
);

-- Datos Semilla para Equipo de Proyecto
INSERT INTO team_roles (name) VALUES 
('Desarrollador'), ('QA'), ('Arquitecto'), ('Líder Técnico'), ('Analista Funcional'), ('Scrum Master'),
('Project Manager/Project Leader'), ('Developer Back-End'), ('Developer Front-End'), ('Developer Full Stack'), ('Developer Mobile'), ('Implementador'), ('DevOps Engineer'), ('Tester QA Automation'), ('Tester QA Manual'), ('UX/UI Designer'), ('Referente Técnico'), ('Analista de reclamos y siniestros'), ('Developer Base de Datos'), ('Developer WordPress'), ('Developer RPA'), ('Arquitecto RPA'), ('Líder Automation'), ('Líder Infra OnPrem/Cloud'), ('Ingeniero Cloud'), ('Administrador de Middleware'), ('Especialista en IA y Analítica'), ('Especialista en SO Linux'), ('Developer PHP'), ('AI Engineer'), ('DBA'), ('SysAdm'), ('Developer PL/SQL'), ('Líder Funcional/Analista Proyectos'), ('Developer Python'), ('It Operations Manager'), ('Help Desk Nivel 1'), ('Help Desk Nivel 2'), ('Design System'), ('Líder de Preventa')
ON CONFLICT DO NOTHING;

INSERT INTO seniorities (name) VALUES 
('Trainee'), ('Junior'), ('Semi-Senior'), ('Senior'), ('Expert')
ON CONFLICT DO NOTHING;

INSERT INTO technologies (name) VALUES 
('Java'), ('Python'), ('Node.js'), ('.NET'), ('React'), ('Angular'), ('Vue'), 
('SQL'), ('NoSQL'), ('AWS'), ('Azure'), ('GCP'), ('Docker'), ('Kubernetes'),
('PHP'), ('C#'), ('Go'), ('Ruby'), ('Swift'), ('Kotlin'), ('Rust'), ('Scala'),
('TypeScript'), ('JavaScript'), ('HTML/CSS'), ('Sass/Less'), ('Tailwind'),
('Bootstrap'), ('Material UI'), ('Ant Design'), ('Chakra UI'), ('Styled Components'),
('Redux'), ('MobX'), ('Recoil'), ('Zustand'), ('React Query'), ('SWR'), ('Apollo Client'),
('Next.js'), ('Nuxt.js'), ('Gatsby'), ('Remix'), ('Svelte'), ('SvelteKit'), ('Vite'),
('Webpack'), ('Rollup'), ('Parcel'), ('Babel'), ('Jest'), ('Mocha'), ('Chai'), ('Jasmine'),
('Cypress'), ('Playwright'), ('Puppeteer'), ('Selenium'), ('Testing Library'), ('Enzyme'),
('Storybook'), ('Lighthouse'), ('ESLint'), ('Prettier'), ('Husky'), ('Lint Staged'),
('Git'), ('GitHub'), ('GitLab'), ('Bitbucket'), ('Jira'), ('Trello'), ('Asana'), ('Slack'),
('Discord'), ('Teams'), ('Zoom'), ('Google Meet'), ('Skype'), ('WebEx'), ('Outlook'),
('SharePoint'), ('OneDrive'), ('Google Drive'), ('Dropbox'), ('Box'), ('Notion'), ('Evernote'),
('N/A'), ('PL-SQL'), ('Android'), ('RPA'), ('Gestion Proyectos'), ('CI/CD'), ('Figma'), ('Relevamiento'), ('Machine Learning'), ('Power Automate')
ON CONFLICT DO NOTHING;

-- Nuevos catálogos para Características del Proyecto
CREATE TABLE IF NOT EXISTS infrastructure_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS work_methodologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS project_characteristics (
    id SERIAL PRIMARY KEY,
    opportunity_id INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    infrastructure_type_id INT REFERENCES infrastructure_types(id),
    defined_by VARCHAR(50), -- 'Definida por el cliente' o 'Definida por CFOTech'
    methodology_id INT REFERENCES work_methodologies(id),
    UNIQUE(opportunity_id)
);

-- Datos Semilla para Características del Proyecto
INSERT INTO infrastructure_types (name) VALUES ('Cloud AWS'), ('Cloud Azure'), ('Cloud GCP'), ('On-Premise'), ('Híbrida') ON CONFLICT DO NOTHING;
INSERT INTO work_methodologies (name) VALUES ('Agile'), ('Scrum'), ('Llave en mano'), ('Kanban'), ('Waterfall') ON CONFLICT DO NOTHING;