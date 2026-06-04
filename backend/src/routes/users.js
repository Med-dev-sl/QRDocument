import bcrypt from "bcryptjs";
import { Router } from "express";
import db from "../db/init.js";
import { requireRole, verifyToken } from "../middleware/auth.js";

const router = Router();

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.prepare(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?',
    ).get(req.userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/",
  verifyToken,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      const validRoles = ["SUPER_ADMIN", "ADMIN", "VIEWER"];
      const userRole = role && validRoles.includes(role) ? role : "VIEWER";

      const existing = await db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashed = bcrypt.hashSync(password, 10);
      const result = await db
        .prepare(
          "INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)",
        )
        .run(firstName, lastName, email, hashed, userRole);

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: result.lastInsertRowid,
          firstName,
          lastName,
          email,
          role: userRole,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/",
  verifyToken,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res) => {
    try {
      const users = await db
        .prepare(
          "SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC",
        )
        .all();
      res.json({
        total: users.length,
        users: users.map((u) => ({
          id: u.id,
          firstName: u.first_name,
          lastName: u.last_name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get("/profile/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (
      req.userId !== parseInt(userId) &&
      !["SUPER_ADMIN", "ADMIN"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const user = await db
      .prepare(
        "SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?",
      )
      .get(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete(
  "/:userId",
  verifyToken,
  requireRole(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (parseInt(userId) === req.userId) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own account" });
      }

      const user = await db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.prepare("DELETE FROM users WHERE id = ?").run(userId);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
