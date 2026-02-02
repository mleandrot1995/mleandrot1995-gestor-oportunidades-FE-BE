import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

/**
 * Generador de rutas CRUD para catálogos simples (id, name)
 */
const createCatalogRoutes = (tableName: string) => {
    const r = Router();
    
    r.get('/', async (_req, res) => {
        try {
            const { rows } = await db.query(`SELECT * FROM ${tableName} ORDER BY name`);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener datos' });
        }
    });

    r.post('/', async (req, res) => {
        try {
            const { name, is_active } = req.body;
            if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
            const { rows } = await db.query(`INSERT INTO ${tableName} (name, is_active) VALUES ($1, $2) RETURNING *`, [name, is_active ?? true]);
            res.status(201).json(rows[0]);
        } catch (error) {
            res.status(400).json({ error: 'Error al crear el registro' });
        }
    });

    r.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, is_active } = req.body;
            const { rows } = await db.query(`UPDATE ${tableName} SET name = $1, is_active = $2 WHERE id = $3 RETURNING *`, [name, is_active, id]);
            res.json(rows[0]);
        } catch (error) {
            res.status(400).json({ error: 'Error al actualizar el registro' });
        }
    });

    r.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await db.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
            res.json({ message: 'Eliminado correctamente' });
        } catch (error) {
            res.status(400).json({ error: 'No se puede eliminar: el registro podría estar en uso' });
        }
    });

    return r;
};

router.use('/team-roles', createCatalogRoutes('team_roles'));
router.use('/seniorities', createCatalogRoutes('seniorities'));
router.use('/technologies', createCatalogRoutes('technologies'));

export default router;