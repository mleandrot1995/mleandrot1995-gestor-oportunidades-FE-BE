import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';

const router = Router();

const TeamMemberSchema = z.object({
    quantity: z.coerce.number().int().nonnegative().default(1),
    role_id: z.coerce.number().int().nonnegative(),
    seniority_id: z.coerce.number().int().nonnegative(),
    main_technology_id: z.coerce.number().int().nonnegative().nullable().optional(), // Nuevo campo
    assignment: z.enum(['Full-time', 'Part-time']).optional().default('Full-time'),
    project_hours: z.preprocess(v => v === "" ? null : v, z.coerce.number().int().nonnegative().nullable().optional()),
    project_term_months: z.preprocess(v => v === "" ? null : v, z.coerce.number().nonnegative().nullable().optional()),
    technology_ids: z.array(z.coerce.number().int()).optional().default([])
});

const ProjectTeamSchema = z.array(TeamMemberSchema);

const ProjectCharacteristicsSchema = z.object({
    infrastructure_type_id: z.coerce.number().int().positive().nullable().optional(),
    defined_by: z.enum(['Definida por el cliente', 'Definida por CFOTech']).nullable().optional(),
    methodology_id: z.coerce.number().int().positive().nullable().optional()
});

const cleanData = (data: any) => {
    const cleaned: any = {};
    // Definimos explícitamente los campos que esperamos para evitar perder propiedades
    const fields = ['quantity', 'role_id', 'seniority_id', 'main_technology_id', 'assignment', 'project_hours', 'project_term_months'];
    
    fields.forEach(key => {
        const val = data[key];
        if (val === "" || val === undefined || (typeof val === 'number' && isNaN(val))) {
            cleaned[key] = null;
        } else {
            cleaned[key] = val;
        }
    });
    return cleaned;
};

// --- RUTAS DE CATÁLOGOS ABM (Para AdminModal) ---

// Infrastructure Types
router.get('/infrastructure-types', async (_req, res) => {
    const result = await db.query('SELECT * FROM infrastructure_types ORDER BY name');
    res.json(result.rows);
});
router.post('/infrastructure-types', async (req, res) => {
    const { name, is_active } = req.body;
    await db.query('INSERT INTO infrastructure_types (name, is_active) VALUES ($1, $2)', [name, is_active]);
    res.json({ message: 'Created' });
});
router.put('/infrastructure-types/:id', async (req, res) => {
    const { name, is_active } = req.body;
    await db.query('UPDATE infrastructure_types SET name = $1, is_active = $2 WHERE id = $3', [name, is_active, req.params.id]);
    res.json({ message: 'Updated' });
});
router.delete('/infrastructure-types/:id', async (req, res) => {
    await db.query('DELETE FROM infrastructure_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
});

// Work Methodologies
router.get('/work-methodologies', async (_req, res) => {
    const result = await db.query('SELECT * FROM work_methodologies ORDER BY name');
    res.json(result.rows);
});
router.post('/work-methodologies', async (req, res) => {
    const { name, is_active } = req.body;
    await db.query('INSERT INTO work_methodologies (name, is_active) VALUES ($1, $2)', [name, is_active]);
    res.json({ message: 'Created' });
});
router.put('/work-methodologies/:id', async (req, res) => {
    const { name, is_active } = req.body;
    await db.query('UPDATE work_methodologies SET name = $1, is_active = $2 WHERE id = $3', [name, is_active, req.params.id]);
    res.json({ message: 'Updated' });
});
router.delete('/work-methodologies/:id', async (req, res) => {
    await db.query('DELETE FROM work_methodologies WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
});

// --- RUTAS PRINCIPALES ---

router.get('/catalogs', async (_req, res) => {
    try {
        const roles = await db.query('SELECT * FROM team_roles ORDER BY name');
        const seniorities = await db.query('SELECT * FROM seniorities ORDER BY name');
        const technologies = await db.query('SELECT * FROM technologies ORDER BY name');
        const infraTypes = await db.query('SELECT * FROM infrastructure_types WHERE is_active = true ORDER BY name');
        const methodologies = await db.query('SELECT * FROM work_methodologies WHERE is_active = true ORDER BY name');
        
        res.json({
            roles: roles.rows,
            seniorities: seniorities.rows,
            technologies: technologies.rows,
            infrastructure_types: infraTypes.rows,
            work_methodologies: methodologies.rows
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener catálogos' });
    }
});

router.get('/export-all', async (_req, res) => {
    try {
        const teamsQuery = `
            SELECT pt.*, tr.name as role_name, s.name as seniority_name,
                   t.name as main_technology_name,
                   (
                       SELECT string_agg(t2.name, ', ')
                       FROM project_team_technologies ptt
                       JOIN technologies t2 ON ptt.technology_id = t2.id
                       WHERE ptt.project_team_id = pt.id
                   ) as stack_technologies
            FROM project_team pt
            LEFT JOIN team_roles tr ON pt.role_id = tr.id
            LEFT JOIN seniorities s ON pt.seniority_id = s.id
            LEFT JOIN technologies t ON pt.main_technology_id = t.id
            ORDER BY pt.opportunity_id, pt.id
        `;
        
        const charsQuery = `
            SELECT pc.*, it.name as infra_name, wm.name as methodology_name
            FROM project_characteristics pc
            LEFT JOIN infrastructure_types it ON pc.infrastructure_type_id = it.id
            LEFT JOIN work_methodologies wm ON pc.methodology_id = wm.id
        `;

        const [teamsRes, charsRes] = await Promise.all([
            db.query(teamsQuery),
            db.query(charsQuery)
        ]);

        res.json({
            teams: teamsRes.rows,
            characteristics: charsRes.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al exportar datos de equipos' });
    }
});

router.get('/:opportunityId/characteristics', async (req, res) => {
    try {
        const oppId = parseInt(req.params.opportunityId, 10);
        if (isNaN(oppId)) return res.status(400).json({ error: 'ID inválido' });
        const { rows } = await db.query('SELECT * FROM project_characteristics WHERE opportunity_id = $1', [oppId]);
        res.json(rows[0] || {});
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener características' });
    }
});

router.post('/:opportunityId/characteristics', async (req, res) => {
    try {
        const oppId = parseInt(req.params.opportunityId, 10);
        if (isNaN(oppId)) return res.status(400).json({ error: 'ID inválido' });
        
        const data = ProjectCharacteristicsSchema.parse(req.body);
        
        await db.query(
            `INSERT INTO project_characteristics (opportunity_id, infrastructure_type_id, defined_by, methodology_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (opportunity_id) 
             DO UPDATE SET infrastructure_type_id = EXCLUDED.infrastructure_type_id,
                           defined_by = EXCLUDED.defined_by,
                           methodology_id = EXCLUDED.methodology_id`,
            [oppId, data.infrastructure_type_id, data.defined_by, data.methodology_id]
        );
        res.json({ message: 'Características guardadas' });
    } catch (error) {
        res.status(400).json({ error: 'Error al guardar características' });
    }
});

router.get('/:opportunityId', async (req, res) => {
    try {
        const oppId = parseInt(req.params.opportunityId, 10);
        if (isNaN(oppId)) return res.status(400).json({ error: 'ID de oportunidad inválido' });

        const query = `
            SELECT pt.*, tr.name as role_name, s.name as seniority_name,
                   t.name as main_technology_name,
                   (SELECT array_agg(technology_id) FROM project_team_technologies WHERE project_team_id = pt.id) as technology_ids
            FROM project_team pt
            LEFT JOIN team_roles tr ON pt.role_id = tr.id
            LEFT JOIN seniorities s ON pt.seniority_id = s.id
            LEFT JOIN technologies t ON pt.main_technology_id = t.id
            WHERE pt.opportunity_id = $1
        `;
        const { rows } = await db.query(query, [oppId]);
        res.json(rows.map(row => ({
            ...row,
            technology_ids: row.technology_ids || []
        })));
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:opportunityId', async (req, res) => {
    try {
        const oppId = parseInt(req.params.opportunityId, 10);
        if (isNaN(oppId)) return res.status(400).json({ error: 'ID de oportunidad inválido' });

        const teamMembers = ProjectTeamSchema.parse(req.body);

        await db.query('BEGIN');
        await db.query('DELETE FROM project_team WHERE opportunity_id = $1', [oppId]);

        for (const member of teamMembers) {
            // Ignorar filas totalmente vacías (evita errores si el usuario agrega una fila y no la usa)
            const isEmpty = member.role_id === 0 && member.seniority_id === 0 && member.technology_ids.length === 0 && !member.main_technology_id;
            if (isEmpty) continue;

            // Si la fila tiene algo de información, debe estar completa para la integridad de la DB
            if (member.role_id === 0 || member.seniority_id === 0) {
                throw new Error("Cada recurso asignado debe tener un Rol y Seniority.");
            }

            const cleanedMember = cleanData(member);
            
            const ptResult = await db.query(
                `INSERT INTO project_team (opportunity_id, quantity, role_id, seniority_id, main_technology_id, assignment, project_hours, project_term_months)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [oppId, cleanedMember.quantity, cleanedMember.role_id, cleanedMember.seniority_id, cleanedMember.main_technology_id, cleanedMember.assignment, cleanedMember.project_hours, cleanedMember.project_term_months]
            );

            const projectTeamId = ptResult.rows[0].id;

            // Usamos member.technology_ids que viene validado por Zod
            if (Array.isArray(member.technology_ids) && member.technology_ids.length > 0) {
                for (const techId of member.technology_ids) {
                    await db.query(
                        'INSERT INTO project_team_technologies (project_team_id, technology_id) VALUES ($1, $2)',
                        [projectTeamId, techId]
                    );
                }
            }
        }

        await db.query('COMMIT');
        res.json({ message: 'Equipo guardado correctamente' });
    } catch (error) {
        await db.query('ROLLBACK');
        const msg = error instanceof Error ? error.message : 'Error al guardar';
        res.status(400).json({ error: msg });
    }
});

export default router;