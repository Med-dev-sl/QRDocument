import { Router } from 'express';
import db from '../db/init.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Get dashboard stats
router.get('/stats', verifyToken, (req, res) => {
  try {
    const totalDocuments = db.prepare(
      'SELECT COUNT(*) as count FROM documents WHERE status = "ACTIVE"'
    ).get().count;

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;

    const recentDocuments = db.prepare(`
      SELECT 
        d.document_id,
        d.title,
        d.uploaded_at,
        u.first_name,
        u.last_name
      FROM documents d
      JOIN users u ON d.uploaded_by = u.id
      WHERE d.status = "ACTIVE"
      ORDER BY d.uploaded_at DESC
      LIMIT 10
    `).all();

    const categoryStats = db.prepare(`
      SELECT 
        c.id,
        c.name,
        COUNT(d.id) as document_count
      FROM categories c
      LEFT JOIN documents d ON c.id = d.category_id AND d.status = "ACTIVE"
      GROUP BY c.id
      ORDER BY document_count DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        totalDocuments,
        totalUsers,
        totalCategories
      },
      recentDocuments: recentDocuments.map(d => ({
        documentId: d.document_id,
        title: d.title,
        uploadedBy: `${d.first_name} ${d.last_name}`,
        uploadedAt: d.uploaded_at
      })),
      categoryStats: categoryStats.map(c => ({
        id: c.id,
        name: c.name,
        documentCount: c.document_count
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get access logs
router.get('/logs', verifyToken, (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const logs = db.prepare(`
      SELECT 
        al.id,
        al.user_id,
        al.document_id,
        al.action,
        al.accessed_at,
        u.first_name,
        u.last_name
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.accessed_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM access_logs').get().count;

    res.json({
      total,
      logs: logs.map(l => ({
        id: l.id,
        userId: l.user_id,
        userName: l.first_name && l.last_name ? `${l.first_name} ${l.last_name}` : 'Unknown',
        documentId: l.document_id,
        action: l.action,
        accessedAt: l.accessed_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activity
router.get('/user-activity/:userId', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const activity = db.prepare(`
      SELECT 
        al.id,
        al.document_id,
        al.action,
        al.accessed_at,
        d.title
      FROM access_logs al
      LEFT JOIN documents d ON al.document_id = d.document_id
      WHERE al.user_id = ?
      ORDER BY al.accessed_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM access_logs WHERE user_id = ?'
    ).get(userId).count;

    res.json({
      total,
      activity: activity.map(a => ({
        id: a.id,
        documentId: a.document_id,
        documentTitle: a.title || 'Unknown',
        action: a.action,
        accessedAt: a.accessed_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
