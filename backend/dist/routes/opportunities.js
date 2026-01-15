import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
const router = Router();
const OpportunitySchema = z.object({
    name: z.string().min(3),
    account_id: z.number(),
    status_id: z.number(),
    percentage: z.number().min(0).max(100),
    color_code: z.enum(['RED', 'YELLOW', 'GREEN', 'NONE']),
    delivery_date: z.string().optional()
}).superRefine((data, ctx) => {
    const { percentage, color_code } = data;
    if (color_code === 'RED' && percentage !== 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rojo requiere 0%", path: ['percentage'] });
    }
    if (color_code === 'YELLOW' && (percentage < 50 || percentage >= 70)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Amarillo requiere 50-69%", path: ['percentage'] });
    }
    if (color_code === 'GREEN' && percentage < 70) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Verde requiere >= 70%", path: ['percentage'] });
    }
});
router.get('/opportunities', async (req, res) => {
    try {
        const { view } = req.query; // 'ON', 'ON-OUT', 'TRASH'
        let query = `SELECT * FROM opportunities WHERE deleted_at IS NULL`;
        if (view === 'ON')
            query += ` AND is_archived = FALSE`;
        else if (view === 'ON-OUT')
            query += ` AND is_archived = TRUE`;
        else if (view === 'TRASH')
            query = `SELECT * FROM opportunities WHERE deleted_at IS NOT NULL`;
        const { rows } = await db.query(query);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/opportunities', async (req, res) => {
    try {
        const data = OpportunitySchema.parse(req.body);
        const status = await db.table('opportunity_statuses').find(data.status_id);
        if (!status) {
            return res.status(400).json({ error: 'Invalid status ID' });
        }
        const isArchivable = status.name.includes('Ganada') || status.name.includes('Perdida');
        const result = await db.table('opportunities').insert({
            ...data,
            is_archived: isArchivable
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});
router.delete('/opportunities/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }
        await db.query(`UPDATE opportunities SET deleted_at = NOW() WHERE id = $1`, [id]);
        res.sendStatus(204);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
