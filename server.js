import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import {
  getCertificates,
  getCertificateById,
  getCertificateBySecurityNumber,
  createCertificate,
  updateCertificate,
  updateCertificateStatus,
  deleteCertificate,
  getDashboardMetrics,
  initDatabase,
  HARDCODED_SCHOOL_NAME,
} from "./database/db.js";
import {
  validateCertificateRequest,
  formatGradeForExport,
  formatDateForExport,
  VALID_STATUSES,
} from "./schemas/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// CORS Configuration for Cloud Deployment
const rawCorsOrigin = process.env.CORS_ORIGIN || "*";
const allowedOrigins = rawCorsOrigin.split(",").map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, server-to-server) or matching origins
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// RESTful API Endpoints (Async PostgreSQL)
// ==========================================

/**
 * GET /api/certificates
 * Paginated list with instant search and status/year/grade filters
 */
app.get("/api/certificates", async (req, res) => {
  try {
    const { search, status, academic_year, grade, page, limit } = req.query;
    const result = await getCertificates({
      search,
      status,
      academic_year,
      grade,
      page,
      limit,
    });
    res.json({
      success: true,
      data: result.records,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve certificate requests" });
  }
});

/**
 * GET /api/certificates/stats
 * Dashboard aggregated metrics
 */
app.get("/api/certificates/stats", async (req, res) => {
  try {
    const stats = await getDashboardMetrics();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("GET /api/certificates/stats error:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve statistics" });
  }
});

/**
 * GET /api/certificates/verify/:securityNumber
 * Fast verification by security number (used for QR code scanning & public lookup)
 */
app.get("/api/certificates/verify/:securityNumber", async (req, res) => {
  try {
    const { securityNumber } = req.params;
    const record = await getCertificateBySecurityNumber(securityNumber);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No certificate attestation found with this security number",
      });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, error: "Verification lookup failed" });
  }
});

/**
 * GET /api/certificates/export
 * Exports all records as CSV matching the required Arabic Excel format
 */
app.get("/api/certificates/export", async (req, res) => {
  try {
    const result = await getCertificates({ limit: 10000 });
    const records = result.records;

    const headers = [
      "الرقم",
      "اسم الطالب من اربع مقاطع",
      "اسم المدرسة",
      "الصف",
      "الشعبة",
      "الرقم الامني",
      "تاريخ الطلب",
      "العام الدراسي",
      "ملاحظات",
    ];

    const rows = records.map((r) => {
      const formattedGrade = formatGradeForExport(r.grade_level);
      const formattedDate = formatDateForExport(r.request_date);

      return [
        r.id,
        `"${(r.student_name || "").replace(/"/g, '""')}"`,
        `"${HARDCODED_SCHOOL_NAME}"`,
        `"${formattedGrade}"`,
        `"${(r.section || "").replace(/"/g, '""')}"`,
        `"${(r.security_number || "").replace(/"/g, '""')}"`,
        `"${formattedDate}"`,
        `"${(r.academic_year || "").replace(/"/g, '""')}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`,
      ];
    });

    // UTF-8 BOM (\uFEFF) ensures Excel opens Arabic CSV without encoding issues
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="certificate_attestations_${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, error: "Failed to export data" });
  }
});

/**
 * GET /api/certificates/:id
 * Retrieve single record
 */
app.get("/api/certificates/:id", async (req, res) => {
  try {
    const record = await getCertificateById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Certificate request not found" });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error("GET /api/certificates/:id error:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve record" });
  }
});

/**
 * POST /api/certificates
 * Create a new certificate attestation with full validation
 */
app.post("/api/certificates", async (req, res) => {
  try {
    // 1. Validate payload
    const validation = validateCertificateRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const { sanitizedData } = validation;

    // 2. Prevent duplicate security numbers (only if security_number is provided)
    if (sanitizedData.security_number) {
      const existing = await getCertificateBySecurityNumber(sanitizedData.security_number);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Duplicate security number",
          errors: {
            security_number: "Security number already exists in the system (الرقم الأمني مسجل مسبقاً)",
          },
        });
      }
    }

    // 3. Insert record
    const createdRecord = await createCertificate(sanitizedData);
    res.status(201).json({
      success: true,
      message: "Certificate request registered successfully",
      data: createdRecord,
    });
  } catch (error) {
    console.error("POST /api/certificates error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * PUT /api/certificates/:id
 * Updates an entire certificate attestation record with full validation
 */
app.put("/api/certificates/:id", async (req, res) => {
  try {
    const existing = await getCertificateById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Certificate request not found" });
    }

    // 1. Validate payload
    const validation = validateCertificateRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const { sanitizedData } = validation;

    // 2. Prevent duplicate security numbers (if provided, must not belong to ANOTHER record)
    if (sanitizedData.security_number) {
      const duplicate = await getCertificateBySecurityNumber(sanitizedData.security_number);
      if (duplicate && String(duplicate.id) !== String(req.params.id)) {
        return res.status(409).json({
          success: false,
          message: "Duplicate security number",
          errors: {
            security_number: "Security number already exists for another record (الرقم الأمني مسجل مسبقاً لطالب آخر)",
          },
        });
      }
    }

    // 3. Update record in database
    const updated = await updateCertificate(req.params.id, sanitizedData);
    res.json({
      success: true,
      message: "Certificate request updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/certificates/:id error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * PATCH /api/certificates/:id/status
 * Updates status (انتظار, تمت كتابة الشهادة, تم الرفع للتصديق)
 */
app.patch("/api/certificates/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value. Allowed statuses: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const existing = await getCertificateById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const updated = await updateCertificateStatus(req.params.id, status, notes);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH status error:", error);
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

/**
 * DELETE /api/certificates/:id
 * Remove record
 */
app.delete("/api/certificates/:id", async (req, res) => {
  try {
    const existing = await getCertificateById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    await deleteCertificate(req.params.id);
    res.json({ success: true, message: "Certificate request deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    res.status(500).json({ success: false, error: "Failed to delete record" });
  }
});

// Start server after initializing database
async function startServer() {
  try {
    await initDatabase();
  } catch (error) {
    console.warn("Database initialization notice:", error.message);
  }

  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(` Student Gateway API & Dashboard running on:`);
    console.log(` http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
    console.log(` Port: ${PORT} | Host: ${HOST} | Node: ${process.version}`);
    console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`====================================================`);
  });
}

startServer();
