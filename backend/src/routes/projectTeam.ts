import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';

const router = Router();

const TeamMemberSchema = z.object({
    quantity: z.coerce.number().int().nonnegative().default(1),
    role_id: z.coerce.number().int().nonnegative(),
    seniority_id: z.coerce.number().int().nonnegative(),
    assignment: z.enum(['Full-time', 'Part-time']).optional().default('Full-time'),
    project_hours: z.preprocess(v => v === "" ? null : v, z.coerce.number().int().nonnegative().nullable().optional()),
    project_term_months: z.preprocess(v => v === "" ? null : v, z.coerce.number().nonnegative().nullable().optional()),
    technology_ids: z.array(z.coerce.number().int()).optional().default([])
});

const ProjectTeamSchema = z.array(TeamMemberSchema);

const cleanData = (data: any) => {
    const cleaned: any = {};
    // Definimos explícitamente los campos que esperamos para evitar perder propiedades
    const fields = ['quantity', 'role_id', 'seniority_id', 'assignment', 'project_hours', 'project_term_months'];
    
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

router.get('/catalogs', async (_req, res) => {
    try {
        const roles = await db.query('SELECT * FROM team_roles ORDER BY name');
        const seniorities = await db.query('SELECT * FROM seniorities ORDER BY name');
        const technologies = await db.query('SELECT * FROM technologies ORDER BY name');
        
        res.json({
            roles: roles.rows,
            seniorities: seniorities.rows,
            technologies: technologies.rows
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener catálogos' });
    }
});

router.get('/:opportunityId', async (req, res) => {
    try {
        const oppId = parseInt(req.params.opportunityId, 10);
        if (isNaN(oppId)) return res.status(400).json({ error: 'ID de oportunidad inválido' });

        const query = `
            SELECT pt.*, tr.name as role_name, s.name as seniority_name,
                   (SELECT array_agg(technology_id) FROM project_team_technologies WHERE project_team_id = pt.id) as technology_ids
            FROM project_team pt
            JOIN team_roles tr ON pt.role_id = tr.id
            JOIN seniorities s ON pt.seniority_id = s.id
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
            const isEmpty = member.role_id === 0 && member.seniority_id === 0 && member.technology_ids.length === 0;
            if (isEmpty) continue;

            // Si la fila tiene algo de información, debe estar completa para la integridad de la DB
            if (member.role_id === 0 || member.seniority_id === 0) {
                throw new Error("Cada recurso asignado debe tener un Rol y Seniority.");
            }

            const cleanedMember = cleanData(member);
            
            const ptResult = await db.query(
                `INSERT INTO project_team (opportunity_id, quantity, role_id, seniority_id, assignment, project_hours, project_term_months)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [oppId, cleanedMember.quantity, cleanedMember.role_id, cleanedMember.seniority_id, cleanedMember.assignment, cleanedMember.project_hours, cleanedMember.project_term_months]
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