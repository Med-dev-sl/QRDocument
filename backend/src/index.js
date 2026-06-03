<<<<<<< HEAD
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.js";
import categoriesRoutes from "./routes/categories.js";
import dashboardRoutes from "./routes/dashboard.js";
import documentsRoutes from "./routes/documents.js";
import usersRoutes from "./routes/users.js";
=======
import express from 'express';
import cors from 'cors';
<<<<<<< HEAD
import { getDb } from './db/init.js';
=======
import dotenv from 'dotenv';
>>>>>>> efd0424ff5e98143bf1e1a7a85b0a2149ee961c9
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import documentsRoutes from './routes/documents.js';
import dashboardRoutes from './routes/dashboard.js';
>>>>>>> 08f42d12284a64b1b83f47d3b911ebe278aaa859

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check
app.get("/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

<<<<<<< HEAD
async function start() {
  await getDb();
  console.log('Database ready');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
=======
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
});
>>>>>>> efd0424ff5e98143bf1e1a7a85b0a2149ee961c9
