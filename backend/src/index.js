import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { initDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import dashboardRoutes from './routes/dashboard.js';
import documentsRoutes from './routes/documents.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (_, res) =>
  res.json({
    name: 'Kyoku API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      documents: '/api/documents',
      categories: '/api/categories',
      dashboard: '/api/dashboard',
    },
  }),
);

app.get('/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function start() {
  await initDatabase();
  console.log('Database ready');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
