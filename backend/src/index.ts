
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import opportunitiesRouter from './routes/opportunities.js';
import accountsRouter from './routes/accounts.js';
import catalogsRouter from './routes/catalogs.js';
import observationsRouter from './routes/observations.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import projectTeamRouter from './routes/projectTeam.js';
import teamCatalogsRouter from './routes/teamCatalogs.js';
import { authenticateToken } from './middleware/auth.js';
import { db } from './db/index.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Rutas públicas
app.use('/api/auth', authRouter);

// Health check (público)
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

// Middleware de autenticación para todas las rutas siguientes
app.use(authenticateToken);

// Rutas protegidas
app.use('/api', opportunitiesRouter);
app.use('/api', accountsRouter);
app.use('/api', catalogsRouter);
app.use('/api', observationsRouter);
app.use('/api', usersRouter);
app.use('/api/project-team', projectTeamRouter);
app.use('/api', teamCatalogsRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
