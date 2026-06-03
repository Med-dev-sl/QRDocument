import express from 'express';
import cors from 'cors';
import { getDb } from './db/init.js';
import authRoutes from './routes/auth.js';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

async function start() {
  await getDb();
  console.log('Database ready');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
