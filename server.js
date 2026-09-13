import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import ExcelJS from "exceljs";
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
  normalizeStatus,
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
app.use(
  express.static(path.join(__dirname, "public"), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    },
  })
);

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
 * Exports records matching the school's official sheet style:
 * 1. Native .xlsx file with RTL orientation, green title row, yellow table headers, and clean borders.
 * 2. Excludes draft statuses ('انتظار' and 'تمت كتابة الشهادة') by default unless explicitly filtered.
 * 3. Exact 7-column sequence: الرقم, اسم الطالب من اربع مقاطع, اسم المدرسة, الصف, الرقم الامني, تاريخ الطلب, العام الدراسي.
 * 4. Supports ?format=csv as fallback.
 */
app.get("/api/certificates/export", async (req, res) => {
  try {
    const rawStatus = req.query.status ? String(req.query.status).trim() : "";
    const isExplicitStatus = Boolean(
      rawStatus &&
      rawStatus !== "ALL" &&
      rawStatus !== "جميع الحالات"
    );
    const filterStatus = isExplicitStatus ? normalizeStatus(rawStatus) : null;
    const format = (req.query.format || "xlsx").toLowerCase().trim();

    console.log(
      `[Export] Request received with status: "${rawStatus}" (explicit: ${isExplicitStatus}) -> Normalized filter: "${filterStatus || "ALL"}", format: ${format}`
    );

    let result;
    if (filterStatus) {
      // Explicitly filtered by user: fetch ONLY records for this status
      result = await getCertificates({
        status: filterStatus,
        limit: 50000,
      });
    } else {
      // Not explicitly filtered: EXCLUDE draft statuses ('انتظار' and 'تمت كتابة الشهادة')
      result = await getCertificates({
        exclude_statuses: ["انتظار", "تمت كتابة الشهادة"],
        limit: 50000,
      });
    }
    const records = result.records;

    const dateStr = new Date().toISOString().split("T")[0];
    const baseName = filterStatus
      ? `Export_${filterStatus.replace(/\s+/g, "_")}_${dateStr}`
      : `Export_All_${dateStr}`;

    const headers = [
      "الرقم",
      "اسم الطالب من اربع مقاطع",
      "اسم المدرسة",
      "الصف",
      "الرقم الامني",
      "تاريخ الطلب",
      "العام الدراسي",
    ];

    if (format === "csv") {
      const rows = records.map((r) => {
        const formattedGrade = formatGradeForExport(r.grade_level);
        const formattedDate = formatDateForExport(r.request_date);

        return [
          r.id,
          `"${(r.student_name || "").replace(/"/g, '""')}"`,
          `"${HARDCODED_SCHOOL_NAME}"`,
          `"${formattedGrade}"`,
          `"${(r.security_number || "").replace(/"/g, '""')}"`,
          `"${formattedDate}"`,
          `"${(r.academic_year || "").replace(/"/g, '""')}"`,
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
      const filename = `${baseName}.csv`;
      const encodedFilename = encodeURIComponent(filename);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
      );
      return res.send(csvContent);
    }

    // Default: Native .xlsx Workbook with official school visual styling
    const workbook = new ExcelJS.Workbook();
    workbook.creator = HARDCODED_SCHOOL_NAME;
    workbook.lastModifiedBy = HARDCODED_SCHOOL_NAME;
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("كشف تصديق الشهادات", {
      views: [{ rightToLeft: true, state: "normal" }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // Configure exact 7 column widths (A to G)
    worksheet.columns = [
      { key: "id", width: 10 },
      { key: "student_name", width: 34 },
      { key: "school_name", width: 44 },
      { key: "grade_level", width: 18 },
      { key: "security_number", width: 22 },
      { key: "request_date", width: 16 },
      { key: "academic_year", width: 16 },
    ];

    // Row 1: Green Main Title Row (Merged A1:G1)
    const titleRow = worksheet.getRow(1);
    titleRow.height = 36;
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    const titleText = filterStatus
      ? `كشف تصديق شهادات الطلاب (${filterStatus}) - ${HARDCODED_SCHOOL_NAME}`
      : `كشف تصديق شهادات الطلاب - ${HARDCODED_SCHOOL_NAME}`;
    titleCell.value = titleText;
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF166534" }, // Forest Green (Official School Header)
    };
    titleCell.border = {
      top: { style: "medium", color: { argb: "FF14532D" } },
      left: { style: "medium", color: { argb: "FF14532D" } },
      bottom: { style: "medium", color: { argb: "FF14532D" } },
      right: { style: "medium", color: { argb: "FF14532D" } },
    };

    // Row 2: Yellow Table Header Row (A2:G2)
    const headerRow = worksheet.getRow(2);
    headerRow.height = 28;
    headers.forEach((title, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = title;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF000000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEB3B" }, // Official School Yellow
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF9CA3AF" } },
        left: { style: "thin", color: { argb: "FF9CA3AF" } },
        bottom: { style: "medium", color: { argb: "FF4B5563" } },
        right: { style: "thin", color: { argb: "FF9CA3AF" } },
      };
    });

    // Rows 3+: Data Rows (Alternating clean styling, borders, and proper alignments)
    records.forEach((r, index) => {
      const rowIndex = index + 3;
      const row = worksheet.getRow(rowIndex);
      row.height = 24;

      const formattedGrade = formatGradeForExport(r.grade_level);
      const formattedDate = formatDateForExport(r.request_date);

      row.values = [
        r.id,
        r.student_name || "",
        HARDCODED_SCHOOL_NAME,
        formattedGrade,
        r.security_number || "",
        formattedDate,
        r.academic_year || "",
      ];

      const isEven = index % 2 === 1;
      const rowBgColor = isEven ? "FFF9FAFB" : "FFFFFFFF";

      for (let col = 1; col <= 7; col++) {
        const cell = row.getCell(col);
        cell.font = { name: "Calibri", size: 11, color: { argb: "FF1F2937" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowBgColor },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };

        // Col 2 (Student Name) is right-aligned in Arabic; Col 1, 3, 4, 5, 6, 7 are centered
        if (col === 2) {
          cell.alignment = { vertical: "middle", horizontal: "right" };
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${baseName}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    res.send(Buffer.from(buffer));
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
    if (req.body.status) {
      sanitizedData.status = normalizeStatus(req.body.status);
    }

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
 * Updates status (انتظار, تمت كتابة الشهادة, تم الرفع للتصديق, تصديق شخصي, تم التصديق)
 */
app.patch("/api/certificates/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const normalizedStatus = normalizeStatus(status);
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value. Allowed statuses: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const existing = await getCertificateById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const updated = await updateCertificateStatus(req.params.id, normalizedStatus, notes);
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
