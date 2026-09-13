import pg from "pg";
const { Pool } = pg;
import "dotenv/config";
import { VALID_STATUSES, normalizeStatus } from "../schemas/validation.js";

// Dedicated School Constant
export const HARDCODED_SCHOOL_NAME = "مدرسة مخيم الزعتري الأساسية الثانية للبنين";

// Re-export allowed statuses and normalizer from schema source of truth
export { VALID_STATUSES, normalizeStatus };

// Connection string from host environment variable (Render / Supabase)
const connectionString = process.env.DATABASE_URL;

// Determine SSL requirements: Supabase and Render require rejectUnauthorized: false for cloud SSL
const isLocal =
  !connectionString ||
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString && !isLocal ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err.message);
});

// Helper: Parse row to ensure grade_level is an array of strings and dates are formatted
export function parseRow(row) {
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

  // Format request_date to YYYY-MM-DD string
  let formattedDate = row.request_date;
  if (row.request_date instanceof Date) {
    const year = row.request_date.getFullYear();
    const month = String(row.request_date.getMonth() + 1).padStart(2, "0");
    const day = String(row.request_date.getDate()).padStart(2, "0");
    formattedDate = `${year}-${month}-${day}`;
  } else if (typeof row.request_date === "string" && row.request_date.includes("T")) {
    formattedDate = row.request_date.split("T")[0];
  }

  return {
    ...row,
    school_name: HARDCODED_SCHOOL_NAME, // Always hardcoded to dedicated school
    grade_level: Array.isArray(parsedGrades) ? parsedGrades : [parsedGrades],
    request_date: formattedDate,
    section: row.section || null,
  };
}

/**
 * Initializes database tables and indexes safely without dropping or recreating existing tables.
 */
export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn(
      "WARNING: DATABASE_URL is not set. Please set DATABASE_URL to a valid PostgreSQL connection string."
    );
    return;
  }

  let client;
  try {
    client = await pool.connect();
    // 1. Create table only if it does not already exist (non-destructive)
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificate_requests (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        grade_level TEXT NOT NULL,
        security_number VARCHAR(100),
        request_date DATE NOT NULL DEFAULT CURRENT_DATE,
        academic_year VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'انتظار',
        notes TEXT,
        section VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS section VARCHAR(50);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_security_number 
      ON certificate_requests (security_number)
      WHERE security_number IS NOT NULL AND security_number != '';

      CREATE INDEX IF NOT EXISTS idx_cert_student_name 
      ON certificate_requests (student_name);

      CREATE INDEX IF NOT EXISTS idx_cert_academic_year 
      ON certificate_requests (academic_year);

      CREATE INDEX IF NOT EXISTS idx_cert_status 
      ON certificate_requests (status);

      -- Non-destructive status migration: Ensure any strict CHECK constraints are removed to allow new custom statuses
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;
        ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS chk_certificate_status;
        ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS check_status;

        FOR r IN (
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          WHERE rel.relname = 'certificate_requests' 
            AND con.contype = 'c'
            AND pg_get_constraintdef(con.oid) ILIKE '%status%'
        ) LOOP
          EXECUTE 'ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
        END LOOP;
      EXCEPTION
        WHEN undefined_object THEN NULL;
        WHEN undefined_table THEN NULL;
      END $$;

      -- Non-destructive ENUM migration: If custom ENUM types exist, append the new status values
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_status') THEN
          BEGIN
            ALTER TYPE certificate_status ADD VALUE IF NOT EXISTS 'تصديق شخصي';
            ALTER TYPE certificate_status ADD VALUE IF NOT EXISTS 'تصديق ع حسابه الشخصي';
            ALTER TYPE certificate_status ADD VALUE IF NOT EXISTS 'تم التصديق';
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_type') THEN
          BEGIN
            ALTER TYPE status_type ADD VALUE IF NOT EXISTS 'تصديق شخصي';
            ALTER TYPE status_type ADD VALUE IF NOT EXISTS 'تصديق ع حسابه الشخصي';
            ALTER TYPE status_type ADD VALUE IF NOT EXISTS 'تم التصديق';
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
        END IF;
      EXCEPTION
        WHEN undefined_object THEN NULL;
      END $$;

      -- Non-destructive row data migration: Update any existing rows from old long status to new short status
      UPDATE certificate_requests 
      SET status = 'تصديق شخصي' 
      WHERE status = 'تصديق ع حسابه الشخصي';

      -- Non-destructive column expansion: Ensure status column can fit long Arabic status strings
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'certificate_requests' AND column_name = 'status'
        ) THEN
          ALTER TABLE certificate_requests ALTER COLUMN status TYPE VARCHAR(100);
        END IF;
      EXCEPTION
        WHEN undefined_table THEN NULL;
      END $$;
    `);

    // 2. Only seed initial records if table is brand new and completely empty
    const countCheck = await client.query(
      "SELECT COUNT(*)::int as count FROM certificate_requests"
    );
    if (countCheck.rows[0]?.count === 0) {
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
        await client.query(
          `INSERT INTO certificate_requests 
           (student_name, grade_level, security_number, request_date, academic_year, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          row
        );
      }
      console.log("Database initialized with default initial records.");
    }

    console.log("PostgreSQL database connection established successfully.");
  } catch (error) {
    console.error("PostgreSQL connection error:", error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

/**
 * Retrieves paginated certificates with search across student_name, security_number, and grade_level
 */
export async function getCertificates({
  search = "",
  status = "",
  exclude_statuses = [],
  academic_year = "",
  grade = "",
  page = 1,
  limit = 10,
} = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const isAll = String(limit).trim().toUpperCase() === "ALL";
  const parsedLimit = isAll ? 50000 : (parseInt(limit, 10) || 10);
  const l = Math.min(50000, Math.max(1, parsedLimit));
  const offset = (p - 1) * l;

  let whereClauses = [];
  let params = [];
  let paramIdx = 1;

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    whereClauses.push(`(
      security_number ILIKE $${paramIdx} OR 
      student_name ILIKE $${paramIdx} OR 
      grade_level ILIKE $${paramIdx}
    )`);
    params.push(q);
    paramIdx++;
  }

  if (status && status.trim() && status !== "ALL" && status !== "جميع الحالات") {
    const trimmedStatus = status.trim();
    if (trimmedStatus === "تصديق شخصي" || trimmedStatus === "تصديق ع حسابه الشخصي") {
      whereClauses.push(`(status = $${paramIdx} OR status = 'تصديق ع حسابه الشخصي')`);
      params.push("تصديق شخصي");
      paramIdx++;
    } else {
      whereClauses.push(`status = $${paramIdx}`);
      params.push(trimmedStatus);
      paramIdx++;
    }
  } else if (Array.isArray(exclude_statuses) && exclude_statuses.length > 0) {
    const validExcludes = exclude_statuses.map((s) => String(s).trim()).filter(Boolean);
    if (validExcludes.length > 0) {
      const placeholders = validExcludes.map(() => `$${paramIdx++}`).join(", ");
      whereClauses.push(`status NOT IN (${placeholders})`);
      params.push(...validExcludes);
    }
  }

  if (
    academic_year &&
    academic_year.trim() &&
    academic_year !== "ALL" &&
    academic_year !== "جميع الأعوام الدراسية"
  ) {
    const trimmedYear = academic_year.trim();
    const match = trimmedYear.match(/^(\d{4})/);
    const startYear = match ? parseInt(match[1], 10) : null;

    if (startYear) {
      // Smart Academic Year Progression Matching:
      // Includes records directly matching the year string,
      // as well as multi-grade progressions active/enrolled in that year
      // (e.g. 9 + 10 + 11 records spanning into this period).
      const pExact = paramIdx++;
      const pLike = paramIdx++;
      const pT1 = paramIdx++;
      const pT2 = paramIdx++;
      const pT3 = paramIdx++;
      const pTm1 = paramIdx++;
      const pTm2 = paramIdx++;
      const pTm3 = paramIdx++;

      whereClauses.push(`(
        academic_year = $${pExact}
        OR academic_year ILIKE $${pLike}
        OR (
          academic_year ~ '^[0-9]{4}' AND (
            -- Completion-anchored progression (base year is T+1, T+2, or T+3)
            (
              CAST(SUBSTRING(academic_year FROM '^[0-9]{4}') AS INTEGER) = $${pT1}
              AND (
                (grade_level ILIKE '%TAWJIHI%' AND (grade_level ILIKE '%GRADE_11%' OR grade_level ~ '(^|[^0-9])11([^0-9]|$)')) OR
                ((grade_level ILIKE '%GRADE_11%' OR grade_level ~ '(^|[^0-9])11([^0-9]|$)') AND (grade_level ILIKE '%GRADE_10%' OR grade_level ~ '(^|[^0-9])10([^0-9]|$)')) OR
                ((grade_level ILIKE '%GRADE_10%' OR grade_level ~ '(^|[^0-9])10([^0-9]|$)') AND (grade_level ILIKE '%GRADE_9%' OR grade_level ~ '(^|[^0-9])9([^0-9]|$)'))
              )
            )
            OR
            (
              CAST(SUBSTRING(academic_year FROM '^[0-9]{4}') AS INTEGER) = $${pT2}
              AND (
                (grade_level ILIKE '%TAWJIHI%' AND (grade_level ILIKE '%GRADE_10%' OR grade_level ~ '(^|[^0-9])10([^0-9]|$)')) OR
                ((grade_level ILIKE '%GRADE_11%' OR grade_level ~ '(^|[^0-9])11([^0-9]|$)') AND (grade_level ILIKE '%GRADE_9%' OR grade_level ~ '(^|[^0-9])9([^0-9]|$)'))
              )
            )
            OR
            (
              CAST(SUBSTRING(academic_year FROM '^[0-9]{4}') AS INTEGER) = $${pT3}
              AND (
                grade_level ILIKE '%TAWJIHI%' AND (grade_level ILIKE '%GRADE_9%' OR grade_level ~ '(^|[^0-9])9([^0-9]|$)')
              )
            )
            -- Start-anchored progression (base year is T-1, T-2, or T-3)
            OR
            (
              CAST(SUBSTRING(academic_year FROM '^[0-9]{4}') AS INTEGER) = $${pTm1}
              AND (
                ((grade_level ILIKE '%GRADE_9%' OR grade_level ~ '(^|[^0-9])9([^0-9]|$)') AND (grade_level ILIKE '%GRADE_10%' OR grade_level ~ '(^|[^0-9])10([^0-9]|$)')) OR
                ((grade_level ILIKE '%GRADE_10%' OR grade_level ~ '(^|[^0-9])10([^0-9]|$)') AND (grade_level ILIKE '%GRADE_11%' OR grade_level ~ '(^|[^0-9])11([^0-9]|$)')) OR
                ((grade_level ILIKE '%GRADE_11%' OR grade_level ~ '(^|[^0-9])11([^0-9]|$)') AND grade_level ILIKE '%TAWJIHI%')
              )
            )
            OR
            (
              CAST(SUBSTRING(academic_year FROM '^[0-9]{4}') AS INTEGER) = $${pTm2}
              AND (
                ((grade_level ILIKE '%GRADE_9%' OR grade_level ~ '(^|[^0-9])9([^0-9]|$)') AND (grade_level ILIKE '%GRADE_11%' OR grade_level ~ '(^|[^0-9])11([^0-9]|$)')) OR
                ((grade_level ILIKE '%GRADE_10%' OR grade_level ~ '(^|[^0-9])10([^0-9]|$)') AND grade_level ILIKE '%TAWJIHI%')
              )
            )
            OR
            (
              CAST(SUBSTRING(academic_year FROM '^[0-9]{4}') AS INTEGER) = $${pTm3}
              AND (
                (grade_level ILIKE '%GRADE_9%' OR grade_level ~ '(^|[^0-9])9([^0-9]|$)') AND grade_level ILIKE '%TAWJIHI%'
              )
            )
          )
        )
      )`);

      params.push(
        trimmedYear,
        `%${trimmedYear}%`,
        startYear + 1,
        startYear + 2,
        startYear + 3,
        startYear - 1,
        startYear - 2,
        startYear - 3
      );
    } else {
      whereClauses.push(`academic_year = $${paramIdx}`);
      params.push(trimmedYear);
      paramIdx++;
    }
  }

  if (grade && grade.trim() && grade !== "ALL") {
    whereClauses.push(`grade_level ILIKE $${paramIdx}`);
    params.push(`%"${grade.trim()}"%`);
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Count total matching records
  const countQuery = `SELECT COUNT(*)::int as total FROM certificate_requests ${whereSql}`;
  const countRes = await pool.query(countQuery, params);
  const totalCount = countRes.rows[0]?.total || 0;

  // Retrieve matching page records
  const dataParams = [...params, l, offset];
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
      section,
      created_at
    FROM certificate_requests
    ${whereSql}
    ORDER BY id DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const recordsRes = await pool.query(dataQuery, dataParams);

  return {
    records: recordsRes.rows.map(parseRow),
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
export async function getCertificateById(id) {
  const res = await pool.query("SELECT * FROM certificate_requests WHERE id = $1", [id]);
  return res.rows.length > 0 ? parseRow(res.rows[0]) : null;
}

/**
 * Find single certificate by unique security number
 */
export async function getCertificateBySecurityNumber(security_number) {
  if (!security_number || !String(security_number).trim()) return null;
  const res = await pool.query(
    "SELECT * FROM certificate_requests WHERE UPPER(security_number) = $1",
    [String(security_number).trim().toUpperCase()]
  );
  return res.rows.length > 0 ? parseRow(res.rows[0]) : null;
}

/**
 * Creates a new certificate attestation record
 */
export async function createCertificate(data) {
  const gradeLevelJson = Array.isArray(data.grade_level)
    ? JSON.stringify(data.grade_level)
    : JSON.stringify([data.grade_level]);

  const secNum =
    data.security_number && String(data.security_number).trim()
      ? String(data.security_number).trim().toUpperCase()
      : null;

  const sec = data.section && String(data.section).trim() ? String(data.section).trim() : null;
  const finalStatus = normalizeStatus(data.status);

  const query = `
    INSERT INTO certificate_requests (
      student_name,
      grade_level,
      security_number,
      request_date,
      academic_year,
      status,
      notes,
      section,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const res = await pool.query(query, [
    data.student_name,
    gradeLevelJson,
    secNum,
    data.request_date,
    data.academic_year,
    finalStatus,
    data.notes || null,
    sec,
  ]);

  return parseRow(res.rows[0]);
}

/**
 * Updates an entire certificate attestation record
 */
export async function updateCertificate(id, data) {
  const gradeLevelJson = Array.isArray(data.grade_level)
    ? JSON.stringify(data.grade_level)
    : JSON.stringify([data.grade_level]);

  const secNum =
    data.security_number && String(data.security_number).trim()
      ? String(data.security_number).trim().toUpperCase()
      : null;

  const sec = data.section !== undefined ? (data.section ? String(data.section).trim() : null) : null;
  const finalStatus = normalizeStatus(data.status);

  const query = `
    UPDATE certificate_requests 
    SET 
      student_name = $1,
      grade_level = $2,
      security_number = $3,
      request_date = $4,
      academic_year = $5,
      status = $6,
      notes = $7,
      section = $8,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING *
  `;

  const res = await pool.query(query, [
    data.student_name,
    gradeLevelJson,
    secNum,
    data.request_date,
    data.academic_year,
    finalStatus,
    data.notes !== undefined ? (data.notes ? String(data.notes).trim() : null) : null,
    sec,
    id,
  ]);

  return res.rows.length > 0 ? parseRow(res.rows[0]) : null;
}

/**
 * Updates status of an attestation
 */
export async function updateCertificateStatus(id, status, notes = null) {
  const finalStatus = normalizeStatus(status);
  const query = `
    UPDATE certificate_requests 
    SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  const res = await pool.query(query, [finalStatus, notes, id]);
  return res.rows.length > 0 ? parseRow(res.rows[0]) : null;
}

/**
 * Deletes an attestation record
 */
export async function deleteCertificate(id) {
  const res = await pool.query("DELETE FROM certificate_requests WHERE id = $1", [id]);
  return res.rowCount > 0;
}

/**
 * Get dashboard aggregate statistics reflecting custom Arabic statuses
 */
export async function getDashboardMetrics() {
  const query = `
    SELECT 
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'انتظار')::int as waiting,
      COUNT(*) FILTER (WHERE status = 'تمت كتابة الشهادة')::int as written,
      COUNT(*) FILTER (WHERE status = 'تم الرفع للتصديق')::int as submitted,
      COUNT(*) FILTER (WHERE status = 'تم التصديق')::int as certified,
      COUNT(*) FILTER (WHERE status = 'تصديق شخصي' OR status = 'تصديق ع حسابه الشخصي')::int as self_certified
    FROM certificate_requests
  `;
  const res = await pool.query(query);
  const row = res.rows[0] || {};

  return {
    total: row.total || 0,
    waiting: row.waiting || 0,
    written: row.written || 0,
    submitted: row.submitted || 0,
    certified: row.certified || 0,
    self_certified: row.self_certified || 0,
  };
}

export default {
  pool,
  initDatabase,
  getCertificates,
  getCertificateById,
  getCertificateBySecurityNumber,
  createCertificate,
  updateCertificate,
  updateCertificateStatus,
  deleteCertificate,
  getDashboardMetrics,
  HARDCODED_SCHOOL_NAME,
  VALID_STATUSES,
  parseRow,
};
