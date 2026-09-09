import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dedicated School Constant
export const HARDCODED_SCHOOL_NAME = "مدرسة مخيم الزعتري الأساسية الثانية للبنين";

// Allowed Statuses
export const VALID_STATUSES = [
  "انتظار",
  "تمت كتابة الشهادة",
  "تم الرفع للتصديق",
];

// Database file path resolved from environment variable (.env) or project root default
const envDbPath = process.env.DATABASE_URL || process.env.DATABASE_PATH;
const dbPath = envDbPath
  ? (path.isAbsolute(envDbPath) ? envDbPath : path.resolve(process.cwd(), envDbPath))
  : path.resolve(__dirname, "..", "student_gateway.db");

const db = new DatabaseSync(dbPath);

// Initialize schema (without school_name column, nullable security_number, custom statuses)
db.exec(`
  CREATE TABLE IF NOT EXISTS certificate_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    security_number TEXT,
    request_date TEXT NOT NULL DEFAULT (DATE('now')),
    academic_year TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'انتظار',
    notes TEXT,
    created_at TEXT DEFAULT (DATETIME('now')),
    updated_at TEXT DEFAULT (DATETIME('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_security_number 
  ON certificate_requests (security_number)
  WHERE security_number IS NOT NULL AND security_number != '';

  CREATE INDEX IF NOT EXISTS idx_cert_student_name 
  ON certificate_requests (student_name);

  CREATE INDEX IF NOT EXISTS idx_cert_academic_year 
  ON certificate_requests (academic_year);

  CREATE INDEX IF NOT EXISTS idx_cert_status 
  ON certificate_requests (status);
`);

// Migration: Drop school_name column, make security_number nullable, and migrate legacy statuses
try {
  // Drop any obsolete indexes that reference school_name first
  db.exec("DROP INDEX IF EXISTS idx_cert_academic_year_school;");
  db.exec("DROP INDEX IF EXISTS idx_cert_school_name;");

  const tableInfo = db.prepare("PRAGMA table_info(certificate_requests)").all();
  const hasSchoolName = tableInfo.some((col) => col.name === "school_name");
  const secNumCol = tableInfo.find((col) => col.name === "security_number");
  const isSecNumNotNull = secNumCol && secNumCol.notnull === 1;

  const oldStatusCount = db.prepare(
    "SELECT COUNT(*) as count FROM certificate_requests WHERE status IN ('PENDING', 'VERIFIED', 'REJECTED')"
  ).get()?.count || 0;

  if (hasSchoolName || isSecNumNotNull || oldStatusCount > 0) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS certificate_requests_migration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        grade_level TEXT NOT NULL,
        security_number TEXT,
        request_date TEXT NOT NULL DEFAULT (DATE('now')),
        academic_year TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'انتظار',
        notes TEXT,
        created_at TEXT DEFAULT (DATETIME('now')),
        updated_at TEXT DEFAULT (DATETIME('now'))
      );

      INSERT INTO certificate_requests_migration (id, student_name, grade_level, security_number, request_date, academic_year, status, notes, created_at, updated_at)
      SELECT 
        id,
        student_name,
        grade_level,
        CASE WHEN security_number = '' THEN NULL ELSE security_number END,
        request_date,
        academic_year,
        CASE 
          WHEN status = 'VERIFIED' THEN 'تم الرفع للتصديق'
          WHEN status = 'PENDING' THEN 'انتظار'
          WHEN status = 'REJECTED' THEN 'انتظار'
          WHEN status IN ('انتظار', 'تمت كتابة الشهادة', 'تم الرفع للتصديق') THEN status
          ELSE 'انتظار'
        END,
        notes,
        created_at,
        updated_at
      FROM certificate_requests;

      DROP TABLE certificate_requests;
      ALTER TABLE certificate_requests_migration RENAME TO certificate_requests;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_security_number 
      ON certificate_requests (security_number)
      WHERE security_number IS NOT NULL AND security_number != '';

      CREATE INDEX IF NOT EXISTS idx_cert_student_name 
      ON certificate_requests (student_name);

      CREATE INDEX IF NOT EXISTS idx_cert_academic_year 
      ON certificate_requests (academic_year);

      CREATE INDEX IF NOT EXISTS idx_cert_status 
      ON certificate_requests (status);
    `);
    console.log("Database updated: Migrated schema (nullable security_number and custom Arabic statuses).");
  }
} catch (e) {
  console.warn("Column migration notice:", e.message);
}

// Helper: Parse row to ensure grade_level is an array of strings
function parseRow(row) {
  if (!row) return row;
  let parsedGrades = [];
  try {
    if (typeof row.grade_level === "string") {
      if (row.grade_level.startsWith("[")) {
        parsedGrades = JSON.parse(row.grade_level);
      } else {
        parsedGrades = [row.grade_level];
      }
    } else if (Array.isArray(row.grade_level)) {
      parsedGrades = row.grade_level;
    }
  } catch (e) {
    parsedGrades = [row.grade_level];
  }

  return {
    ...row,
    school_name: HARDCODED_SCHOOL_NAME, // Always hardcoded to the single school
    grade_level: Array.isArray(parsedGrades) ? parsedGrades : [parsedGrades],
  };
}

// Seed initial realistic data with new statuses
const seedInsert = db.prepare(`
  INSERT OR IGNORE INTO certificate_requests 
  (student_name, grade_level, security_number, request_date, academic_year, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const initialSeed = [
  [
    "أحمد محمد عبد الله السعيد",
    JSON.stringify(["GRADE_11_SCI", "TAWJIHI"]),
    "SEC-2025-00101",
    "2026-09-08",
    "2025/2026",
    "تم الرفع للتصديق",
    "تم تصديق الشهادة وختمها رسمياً",
  ],
  [
    "فاطمة علي حسن الجابري",
    JSON.stringify(["TAWJIHI"]),
    "SEC-2025-00102",
    "2026-09-07",
    "2025/2026",
    "انتظار",
    "قيد المراجعة والتدقيق الإداري",
  ],
  [
    "خالد عبد الرحمن إبراهيم الزهراني",
    JSON.stringify(["GRADE_11_SCI"]),
    "SEC-2025-00103",
    "2026-09-06",
    "2025/2026",
    "تمت كتابة الشهادة",
    "مطابق لسجلات وزارة التعليم",
  ],
  [
    "طارق يوسف محمد الحسين",
    JSON.stringify(["GRADE_11_LIT", "TAWJIHI"]),
    "SEC-2025-00104",
    "2026-09-05",
    "2024/2025",
    "تم الرفع للتصديق",
    "Equivalency verified",
  ],
  [
    "عمر زياد مصطفى النجار",
    JSON.stringify(["GRADE_10"]),
    "SEC-2025-00105",
    "2026-09-04",
    "2025/2026",
    "انتظار",
    "بانتظار اعتماد كشف الدرجات",
  ],
  [
    "مريم سالم مبارك الكواري",
    JSON.stringify(["GRADE_9", "GRADE_10"]),
    "SEC-2025-00106",
    "2026-09-03",
    "2024/2025",
    "تمت كتابة الشهادة",
    "نقص في الأوراق الثبوتية",
  ],
];

for (const row of initialSeed) {
  seedInsert.run(...row);
}

/**
 * Retrieves paginated certificates with instant search across student_name and security_number
 */
export function getCertificates({
  search = "",
  status = "",
  academic_year = "",
  grade = "",
  page = 1,
  limit = 10,
} = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (p - 1) * l;

  let whereClauses = [];
  let params = [];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    whereClauses.push(`(
      security_number LIKE ? OR 
      student_name LIKE ? OR 
      grade_level LIKE ?
    )`);
    params.push(q, q, q);
  }

  if (status && status.trim() && status !== "ALL") {
    whereClauses.push(`status = ?`);
    params.push(status.trim());
  }

  if (academic_year && academic_year.trim() && academic_year !== "ALL") {
    whereClauses.push(`academic_year = ?`);
    params.push(academic_year.trim());
  }

  if (grade && grade.trim() && grade !== "ALL") {
    whereClauses.push(`grade_level LIKE ?`);
    params.push(`%"${grade.trim()}"%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Count total matching records
  const countQuery = `SELECT COUNT(*) as total FROM certificate_requests ${whereSql}`;
  const totalCount = db.prepare(countQuery).get(...params).total;

  // Retrieve matching page records (school_name omitted from DB query)
  const dataQuery = `
    SELECT 
      id,
      student_name,
      grade_level,
      security_number,
      request_date,
      academic_year,
      status,
      notes,
      created_at
    FROM certificate_requests
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const records = db.prepare(dataQuery).all(...params, l, offset);

  return {
    records: records.map(parseRow),
    pagination: {
      page: p,
      limit: l,
      total: totalCount,
      totalPages: Math.ceil(totalCount / l) || 1,
    },
  };
}

/**
 * Find single certificate by ID
 */
export function getCertificateById(id) {
  const stmt = db.prepare("SELECT * FROM certificate_requests WHERE id = ?");
  const row = stmt.get(id);
  return parseRow(row);
}

/**
 * Find single certificate by unique security number
 */
export function getCertificateBySecurityNumber(security_number) {
  if (!security_number || !String(security_number).trim()) return null;
  const stmt = db.prepare("SELECT * FROM certificate_requests WHERE security_number = ?");
  const row = stmt.get(String(security_number).trim().toUpperCase());
  return parseRow(row);
}

/**
 * Creates a new certificate attestation record (without school_name, optional security_number)
 */
export function createCertificate(data) {
  const gradeLevelJson = Array.isArray(data.grade_level)
    ? JSON.stringify(data.grade_level)
    : JSON.stringify([data.grade_level]);

  const secNum = data.security_number && String(data.security_number).trim()
    ? String(data.security_number).trim().toUpperCase()
    : null;

  const finalStatus = VALID_STATUSES.includes(data.status) ? data.status : "انتظار";

  const stmt = db.prepare(`
    INSERT INTO certificate_requests (
      student_name,
      grade_level,
      security_number,
      request_date,
      academic_year,
      status,
      notes,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, DATETIME('now'))
  `);

  const result = stmt.run(
    data.student_name,
    gradeLevelJson,
    secNum,
    data.request_date,
    data.academic_year,
    finalStatus,
    data.notes || null
  );

  return getCertificateById(result.lastInsertRowid);
}

/**
 * Updates an entire certificate attestation record
 */
export function updateCertificate(id, data) {
  const gradeLevelJson = Array.isArray(data.grade_level)
    ? JSON.stringify(data.grade_level)
    : JSON.stringify([data.grade_level]);

  const secNum = data.security_number && String(data.security_number).trim()
    ? String(data.security_number).trim().toUpperCase()
    : null;

  const finalStatus = VALID_STATUSES.includes(data.status) ? data.status : "انتظار";

  const stmt = db.prepare(`
    UPDATE certificate_requests 
    SET 
      student_name = ?,
      grade_level = ?,
      security_number = ?,
      request_date = ?,
      academic_year = ?,
      status = ?,
      notes = ?,
      updated_at = DATETIME('now')
    WHERE id = ?
  `);

  stmt.run(
    data.student_name,
    gradeLevelJson,
    secNum,
    data.request_date,
    data.academic_year,
    finalStatus,
    data.notes !== undefined ? (data.notes ? String(data.notes).trim() : null) : null,
    id
  );

  return getCertificateById(id);
}

/**
 * Updates status of an attestation
 */
export function updateCertificateStatus(id, status, notes = null) {
  const finalStatus = VALID_STATUSES.includes(status) ? status : "انتظار";
  const stmt = db.prepare(`
    UPDATE certificate_requests 
    SET status = ?, notes = COALESCE(?, notes), updated_at = DATETIME('now')
    WHERE id = ?
  `);
  stmt.run(finalStatus, notes, id);
  return getCertificateById(id);
}

/**
 * Deletes an attestation record
 */
export function deleteCertificate(id) {
  const stmt = db.prepare("DELETE FROM certificate_requests WHERE id = ?");
  return stmt.run(id);
}

/**
 * Get dashboard aggregate statistics reflecting the three custom Arabic statuses
 */
export function getDashboardMetrics() {
  const total = db.prepare("SELECT COUNT(*) as count FROM certificate_requests").get().count;
  const waiting = db.prepare("SELECT COUNT(*) as count FROM certificate_requests WHERE status = 'انتظار'").get().count;
  const written = db.prepare("SELECT COUNT(*) as count FROM certificate_requests WHERE status = 'تمت كتابة الشهادة'").get().count;
  const submitted = db.prepare("SELECT COUNT(*) as count FROM certificate_requests WHERE status = 'تم الرفع للتصديق'").get().count;

  return {
    total,
    waiting,
    written,
    submitted,
  };
}

export default db;
