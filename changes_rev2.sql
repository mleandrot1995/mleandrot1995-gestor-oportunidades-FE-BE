      
-- Revisión 2: Autenticación y Perfiles de Usuario
      
-- 7. Perfiles de Usuario
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);
      
-- Insertar los perfiles requeridos
INSERT INTO profiles (name) VALUES
    ('Administrador'),
    ('Arquitecto'),
    ('Asistente'),
    ('Consulta')
ON CONFLICT (name) DO NOTHING;
      
-- 8. Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_id INT NOT NULL REFERENCES profiles(id),
    first_login BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
      
-- Crear un usuario administrador por defecto
-- La contraseña es 'password'
INSERT INTO users (email, password_hash, profile_id, first_login) VALUES
('admin@example.com', '$2b$10$di4U/nIdcUFQQZXi6VUIn..mTx2JRaMYInpG4lgIhVtgYTSfJd0uK', 1, FALSE)
ON CONFLICT (email) DO NOTHING;
      
-- Índice para el email del usuario para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      
-- Fin de los cambios de la Revisión 2.
      
