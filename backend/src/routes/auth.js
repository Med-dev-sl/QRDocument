import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/init.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
  ).run(firstName, lastName, email, hashed);

  const token = generateToken(result.lastInsertRowid);

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, firstName, lastName, email },
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email },
  });
});

export default router;
