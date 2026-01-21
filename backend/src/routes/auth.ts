
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
router.post('/login', async (req, res) => {
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


// Change password
router.post('/change-password', async (req, res) => {
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

export default router;
