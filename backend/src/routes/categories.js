import { Router } from "express";
import db from "../db/init.js";
import { requireRole, verifyToken } from "../middleware/auth.js";

const router = Router();

router.post(
  "/",
  verifyToken,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Category name is required" });
      }

      const existing = await db
        .prepare("SELECT id FROM categories WHERE name = ?")
        .get(name.trim());
      if (existing) {
        return res.status(409).json({ error: "Category already exists" });
      }

      const result = await db
        .prepare("INSERT INTO categories (name, description) VALUES (?, ?)")
        .run(name.trim(), description || null);

      res.status(201).json({
        message: "Category created successfully",
        category: {
          id: result.lastInsertRowid,
          name: name.trim(),
          description: description || null,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get("/", verifyToken, async (req, res) => {
  try {
    const categories = await db
      .prepare(
        `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(d.id) as document_count
      FROM categories c
      LEFT JOIN documents d ON c.id = d.category_id AND d.status = 'ACTIVE'
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.name ASC
    `,
      )
      .all();

    res.json({
      total: categories.length,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        documentCount: c.document_count,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:categoryId", verifyToken, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await db
      .prepare(
        "SELECT id, name, description, created_at FROM categories WHERE id = ?",
      )
      .get(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete(
  "/:categoryId",
  verifyToken,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res) => {
    try {
      const { categoryId } = req.params;

      const category = await db
        .prepare("SELECT id FROM categories WHERE id = ?")
        .get(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const docCount = await db
        .prepare(
          "SELECT COUNT(*)::int as count FROM documents WHERE category_id = ? AND status = ?",
        )
        .get(categoryId, "ACTIVE");

      if (docCount.count > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete category with active documents" });
      }

      await db.prepare("DELETE FROM categories WHERE id = ?").run(categoryId);

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
