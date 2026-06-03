import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import db from "../db/init.js";
import { requireRole, verifyToken } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, "..", "..");
const uploadsDir = path.join(backendDir, "uploads");
const pdfsDir = path.join(uploadsDir, "pdfs");
const qrcodesDir = path.join(uploadsDir, "qrcodes");

// Ensure directories exist
[pdfsDir, qrcodesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
const router = Router();

// Generate unique document ID
function generateDocumentId() {
  const lastDoc = db
    .prepare("SELECT document_id FROM documents ORDER BY id DESC LIMIT 1")
    .get();

  let nextNumber = 1;
  if (lastDoc) {
    const match = lastDoc.document_id.match(/PDF(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `PDF${String(nextNumber).padStart(6, "0")}`;
}

// Upload document (ADMIN and above)
router.post(
  "/upload",
  verifyToken,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, description, categoryId } = req.body;

      if (!title || title.trim().length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Title is required" });
      }

      // Validate category if provided
      if (categoryId) {
        const category = db
          .prepare("SELECT id FROM categories WHERE id = ?")
          .get(categoryId);
        if (!category) {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ error: "Category not found" });
        }
      }

      const documentId = generateDocumentId();
      const fileStat = fs.statSync(req.file.path);

      // Insert document
      const result = db
        .prepare(
          `
      INSERT INTO documents 
      (document_id, title, description, category_id, file_path, file_size, file_name, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        )
        .run(
          documentId,
          title.trim(),
          description || null,
          categoryId || null,
          req.file.path,
          fileStat.size,
          req.file.originalname,
          req.userId,
        );

      // Generate QR code
      const qrPath = path.join(qrcodesDir, `${documentId}.png`);
      await QRCode.toFile(qrPath, documentId, { width: 300 });

      // Insert QR code record
      db.prepare(
        `
      INSERT INTO qr_codes (document_id, qr_code_path, qr_data)
      VALUES (?, ?, ?)
    `,
      ).run(documentId, qrPath, documentId);

      // Log access
      db.prepare(
        `
      INSERT INTO access_logs (user_id, document_id, action, ip_address)
      VALUES (?, ?, ?, ?)
    `,
      ).run(req.userId, documentId, "UPLOAD", req.ip);

      res.status(201).json({
        message: "Document uploaded successfully",
        document: {
          id: result.lastInsertRowid,
          documentId,
          title: title.trim(),
          description,
          categoryId,
          fileName: req.file.originalname,
          fileSize: fileStat.size,
          uploadedBy: req.userId,
        },
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  },
);

// Get all documents
router.get("/", verifyToken, (req, res) => {
  try {
    const { search, categoryId, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM documents WHERE status = "ACTIVE"';
    const params = [];

    if (search) {
      query += " AND (title LIKE ? OR document_id LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (categoryId) {
      query += " AND category_id = ?";
      params.push(categoryId);
    }

    query += " ORDER BY uploaded_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const documents = db.prepare(query).all(...params);

    const countQuery =
      'SELECT COUNT(*) as total FROM documents WHERE status = "ACTIVE"' +
      (search ? " AND (title LIKE ? OR document_id LIKE ?)" : "") +
      (categoryId ? " AND category_id = ?" : "");

    const countParams = [];
    if (search) {
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      countParams.push(categoryId);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      total,
      documents: documents.map((d) => ({
        id: d.id,
        documentId: d.document_id,
        title: d.title,
        description: d.description,
        categoryId: d.category_id,
        fileName: d.file_name,
        fileSize: d.file_size,
        uploadedBy: d.uploaded_by,
        uploadedAt: d.uploaded_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single document
router.get("/:documentId", verifyToken, (req, res) => {
  try {
    const { documentId } = req.params;

    const document = db
      .prepare(
        'SELECT * FROM documents WHERE document_id = ? AND status = "ACTIVE"',
      )
      .get(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Log access
    db.prepare(
      `
      INSERT INTO access_logs (user_id, document_id, action, ip_address)
      VALUES (?, ?, ?, ?)
    `,
    ).run(req.userId, documentId, "VIEW", req.ip);

    res.json({
      id: document.id,
      documentId: document.document_id,
      title: document.title,
      description: document.description,
      categoryId: document.category_id,
      fileName: document.file_name,
      fileSize: document.file_size,
      uploadedBy: document.uploaded_by,
      uploadedAt: document.uploaded_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document
router.get("/:documentId/download", verifyToken, (req, res) => {
  try {
    const { documentId } = req.params;

    const document = db
      .prepare(
        'SELECT * FROM documents WHERE document_id = ? AND status = "ACTIVE"',
      )
      .get(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Log access
    db.prepare(
      `
      INSERT INTO access_logs (user_id, document_id, action, ip_address)
      VALUES (?, ?, ?, ?)
    `,
    ).run(req.userId, documentId, "DOWNLOAD", req.ip);

    res.download(document.file_path, document.file_name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get QR code
router.get("/:documentId/qr", verifyToken, (req, res) => {
  try {
    const { documentId } = req.params;

    const qr = db
      .prepare("SELECT qr_code_path FROM qr_codes WHERE document_id = ?")
      .get(documentId);

    if (!qr || !fs.existsSync(qr.qr_code_path)) {
      return res.status(404).json({ error: "QR code not found" });
    }

    res.sendFile(qr.qr_code_path);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Soft delete document (ADMIN and above)
router.delete(
  "/:documentId",
  verifyToken,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  (req, res) => {
    try {
      const { documentId } = req.params;

      const document = db
        .prepare(
          'SELECT * FROM documents WHERE document_id = ? AND status = "ACTIVE"',
        )
        .get(documentId);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      db.prepare(
        'UPDATE documents SET status = "DELETED", deleted_at = datetime("now") WHERE document_id = ?',
      ).run(documentId);

      // Log access
      db.prepare(
        `
      INSERT INTO access_logs (user_id, document_id, action, ip_address)
      VALUES (?, ?, ?, ?)
    `,
      ).run(req.userId, documentId, "DELETE", req.ip);

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Search documents
router.get("/search", verifyToken, (req, res) => {
  try {
    const { query, type = "all" } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTerm = `%${query}%`;
    let results = [];

    if (type === "all" || type === "title") {
      results = db
        .prepare(
          `
        SELECT * FROM documents 
        WHERE status = "ACTIVE" AND title LIKE ?
        ORDER BY uploaded_at DESC
        LIMIT 100
      `,
        )
        .all(searchTerm);
    }

    if (type === "all" || type === "document_id") {
      const idResults = db
        .prepare(
          `
        SELECT * FROM documents 
        WHERE status = "ACTIVE" AND document_id LIKE ?
        ORDER BY uploaded_at DESC
        LIMIT 100
      `,
        )
        .all(searchTerm);
      results = type === "document_id" ? idResults : [...results, ...idResults];
    }

    res.json({
      total: results.length,
      results: results.map((d) => ({
        id: d.id,
        documentId: d.document_id,
        title: d.title,
        description: d.description,
        categoryId: d.category_id,
        fileName: d.file_name,
        fileSize: d.file_size,
        uploadedAt: d.uploaded_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
