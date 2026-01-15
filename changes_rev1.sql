-- Revisión 1: Mejoras de rendimiento para la base de datos.
--
-- Añadir índices a las columnas de llaves foráneas más utilizadas para acelerar
-- las consultas de filtrado y unión.

-- 1. Índices para la tabla `opportunities`
CREATE INDEX IF NOT EXISTS idx_opportunities_account_id ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status_id ON opportunities(status_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_manager_id ON opportunities(manager_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_responsible_dc_id ON opportunities(responsible_dc_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_responsible_business_id ON opportunities(responsible_business_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_responsible_tech_id ON opportunities(responsible_tech_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_motive_id ON opportunities(motive_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_archived ON opportunities(is_archived);
CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at ON opportunities(deleted_at);

-- 2. Índice para la tabla `opportunity_observations`
CREATE INDEX IF NOT EXISTS idx_opportunity_observations_opportunity_id ON opportunity_observations(opportunity_id);

-- Fin de los cambios de la Revisión 1.
