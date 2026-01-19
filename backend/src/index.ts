
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import opportunitiesRouter from './routes/opportunities.js';
import accountsRouter from './routes/accounts.js';
import catalogsRouter from './routes/catalogs.js';
import observationsRouter from './routes/observations.js';
import authRouter from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';
import { db } from './db/index.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Rutas públicas
app.use('/api', authRouter);

// Middleware de autenticación
app.use(authenticateToken);

// Rutas protegidas
app.use('/api', opportunitiesRouter);
app.use('/api', accountsRouter);
app.use('/api', catalogsRouter);
app.use('/api', observationsRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now, database: 'connected' });
  } catch (err) {
    console.error('Health check failed', err);
    const msg = err instanceof Error ? err.message : 'Database disconnected';
    res.status(500).json({ status: 'error', database: 'disconnected', error: msg });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
