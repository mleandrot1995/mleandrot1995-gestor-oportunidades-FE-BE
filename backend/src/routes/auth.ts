
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ChangePasswordSchema = z.object({
  password: z.string().min(6),
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    
    const result = await db.query(
      'SELECT u.*, p.name as role FROM users u LEFT JOIN profiles p ON u.profile_id = p.id WHERE u.email = $1',
      [email]
    );
    const user = result.rows[0];

    // Verificación robusta de usuario y contraseña
    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verificación segura del rol
    const userRole = user.role || '';
    const isAdmin = userRole.toLowerCase() === 'administrador';

    const token = jwt.sign(
      { 
        id: user.id, 
        role: userRole, 
        is_admin: isAdmin 
      },
      process.env.JWT_SECRET || 'secret',
      {
        expiresIn: '1h',
      }
    );

    res.json({ token, first_login: user.first_login });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('[Login Error]:', error);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

// ... (el resto del fichero se mantiene igual)

// Change password
router.post('/auth/change-password', async (req, res) => {
    try {
        const { password } = ChangePasswordSchema.parse(req.body);
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: number };
        const password_hash = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password_hash = $1, first_login = FALSE WHERE id = $2', [password_hash, decoded.id]);
        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
});


// Get all users
router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT u.id, u.email, u.profile_id, p.name as role, u.first_login, u.is_active FROM users u LEFT JOIN profiles p ON u.profile_id = p.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  profile_id: z.number(),
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { email, password, profile_id } = UserCreateSchema.parse(req.body);
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO users (email, password_hash, profile_id) VALUES ($1, $2, $3) RETURNING id, email, profile_id', [email, password_hash, profile_id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
     if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  profile_id: z.number().optional(),
  is_active: z.boolean().optional(),
});


// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { email, profile_id, is_active } = UserUpdateSchema.parse(req.body);

    let query = 'UPDATE users SET ';
    const values = [];
    let i = 1;

    if (email) {
      query += `email = $${i++}, `;
      values.push(email);
    }
    if (profile_id) {
      query += `profile_id = $${i++}, `;
      values.push(profile_id);
    }
    if (is_active !== undefined) {
        query += `is_active = $${i++}, `;
        values.push(is_active);
    }

    query = query.slice(0, -2); // Remove last comma and space
    query += ` WHERE id = $${i}`;
    values.push(id);

    await db.query(query, values);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get all profiles
router.get('/profiles', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM profiles');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


export default router;
