import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

function fixSQL(sql) {
  let s = sql;
  const replacements = [
    [/datetime\('now'\)/gi, "NOW()"],
    [/datetime\("now"\)/gi, "NOW()"],
    [/"ACTIVE"/g, "'ACTIVE'"],
    [/"DELETED"/g, "'DELETED'"],
  ];
  for (const [pattern, replacement] of replacements) {
    s = s.replace(pattern, replacement);
  }
  return s;
}

function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

class Statement {
  constructor(sql) {
    this.sql = fixSQL(sql);
    this.convertedSQL = convertPlaceholders(this.sql);
  }

  async get(...params) {
    const result = await pool.query(this.convertedSQL, params);
    return result.rows[0] || null;
  }

  async all(...params) {
    const result = await pool.query(this.convertedSQL, params);
    return result.rows;
  }

  async run(...params) {
    const trimmedSQL = this.sql.trim().toUpperCase();
    if (trimmedSQL.startsWith("INSERT")) {
      const sqlWithReturning = this.convertedSQL + " RETURNING id";
      const result = await pool.query(sqlWithReturning, params);
      return {
        lastInsertRowid: result.rows[0]?.id,
        changes: result.rowCount,
      };
    }
    const result = await pool.query(this.convertedSQL, params);
    return { changes: result.rowCount };
  }
}

const db = {
  prepare(sql) {
    return new Statement(sql);
  },
  exec(sql) {
    return pool.query(sql);
  },
};

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'VIEWER' CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'VIEWER')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        document_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id),
        file_path TEXT NOT NULL,
        file_size INTEGER,
        file_name TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DELETED')),
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        uploaded_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS qr_codes (
        id SERIAL PRIMARY KEY,
        document_id TEXT NOT NULL UNIQUE REFERENCES documents(document_id),
        qr_code_path TEXT NOT NULL,
        qr_data TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        document_id TEXT REFERENCES documents(document_id),
        action TEXT NOT NULL,
        ip_address TEXT,
        accessed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Database tables ready");
  } finally {
    client.release();
  }
}

export default db;
