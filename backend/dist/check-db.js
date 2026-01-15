import { db } from './db/index.js';
async function check() {
    console.log('--- Iniciando chequeo de base de datos ---');
    try {
        // 1. Probar conexión simple
        const timeRes = await db.query('SELECT NOW() as now');
        console.log('✅ Conexión exitosa. Hora del servidor DB:', timeRes.rows[0].now);
        // 2. Verificar tablas existentes
        const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('📋 Tablas encontradas en la base de datos:', tables);
        if (tables.length === 0) {
            console.warn('⚠️  No se encontraron tablas. Es posible que debas ejecutar el script de inicialización (init.sql).');
        }
        else {
            const requiredTables = ['opportunities', 'accounts', 'employees', 'job_roles', 'opportunity_statuses'];
            const missing = requiredTables.filter(t => !tables.includes(t));
            if (missing.length > 0) {
                console.warn('⚠️  Faltan algunas tablas requeridas:', missing);
            }
            else {
                console.log('✅ Todas las tablas principales parecen existir.');
            }
        }
    }
    catch (error) {
        console.error('❌ Error conectando a la base de datos:');
        console.error(error.message);
        if (error.code)
            console.error('Código de error:', error.code);
    }
    finally {
        process.exit(0);
    }
}
check();
