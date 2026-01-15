import { Router } from 'express';
import { db } from '../db/index.js';
const router = Router();
// --- EMPLOYEES ---
router.get('/employees', async (req, res) => {
    try {
        const rows = await db.table('employees').select();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/employees', async (req, res) => {
    try {
        const { full_name, role_id, is_active } = req.body;
        const newRecord = await db.table('employees').insert({ full_name, role_id, is_active });
        res.status(201).json(newRecord);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.put('/employees/:id', async (req, res) => {
    try {
        const { full_name, role_id, is_active } = req.body;
        const updated = await db.table('employees').update(parseInt(req.params.id), { full_name, role_id, is_active });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// --- JOB ROLES ---
router.get('/job-roles', async (req, res) => {
    try {
        const rows = await db.table('job_roles').select();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// (Usually job roles are static, but adding basic CRUD just in case)
router.post('/job-roles', async (req, res) => {
    try {
        const { name } = req.body;
        const newRecord = await db.table('job_roles').insert({ name });
        res.status(201).json(newRecord);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// --- STATUSES ---
router.get('/statuses', async (req, res) => {
    try {
        const rows = await db.table('opportunity_statuses').select();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/statuses', async (req, res) => {
    try {
        const { name } = req.body;
        const newRecord = await db.table('opportunity_statuses').insert({ name });
        res.status(201).json(newRecord);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// --- DOC TYPES ---
router.get('/doc-types', async (req, res) => {
    try {
        const rows = await db.table('document_types').select();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/doc-types', async (req, res) => {
    try {
        const { name } = req.body;
        const newRecord = await db.table('document_types').insert({ name });
        res.status(201).json(newRecord);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// --- OPP TYPES ---
router.get('/opp-types', async (req, res) => {
    try {
        const rows = await db.table('opportunity_types').select();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/opp-types', async (req, res) => {
    try {
        const { name } = req.body;
        const newRecord = await db.table('opportunity_types').insert({ name });
        res.status(201).json(newRecord);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
