import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data.db');

let _db = null;

class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  get(...params) {
    const stmt = _db.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    let row;
    if (stmt.step()) row = stmt.getAsObject();
    stmt.free();
    return row;
  }

  all(...params) {
    const stmt = _db.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  run(...params) {
    _db.run(this.sql, params);
    const idResult = _db.exec('SELECT last_insert_rowid()');
    const lastInsertRowid = idResult[0].values[0][0];
    const changes = _db.getRowsModified();
    return { lastInsertRowid, changes };
  }
}

const db = {
  prepare(sql) {
    return new Statement(sql);
  },
  exec(sql) {
    return _db.exec(sql);
  },
};

export async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'VIEWER' CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'VIEWER')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_name TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DELETED')),
      uploaded_by INTEGER NOT NULL,
      uploaded_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS qr_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT NOT NULL UNIQUE,
      qr_code_path TEXT NOT NULL,
      qr_data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(document_id)
    );

    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      document_id TEXT,
      action TEXT NOT NULL,
      ip_address TEXT,
      accessed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (document_id) REFERENCES documents(document_id)
    );
  `);

  saveDatabase();
}

export function saveDatabase() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export default db;
