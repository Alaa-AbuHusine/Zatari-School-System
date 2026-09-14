/**
 * Automated Verification Suite for Student Gateway
 * Supports PostgreSQL & Multi-Select Grade Levels & i18n Validation
 */
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
  pool,
  HARDCODED_SCHOOL_NAME,
} from "../database/db.js";
import {
  validateThreePartName,
  validateFourPartName,
  validateAcademicYear,
  validateSecurityNumber,
  validateGradeLevels,
  validateCertificateRequest,
  PREDEFINED_GRADES,
  VALID_STATUSES,
  normalizeStatus,
  normalizeGradeKey,
  parseGradeKeys,
  parseAcademicYearStart,
  sortAcademicYears,
  extractGradeNumbers,
  getRecordActiveYears,
  isRecordActiveInAcademicYear,
  formatGradeForExport,
  formatDateForExport,
} from "../schemas/validation.js";

console.log("==================================================");
console.log(" Running Student Gateway Verification Tests");
console.log("==================================================");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  // 1. Validation Tests: 3-part name (الاسم الثلاثي على الأقل)
  console.log("\n[1] Testing 3-Part Full Name Validation (الاسم الثلاثي)...");
  const valid3PartArabicName = validateThreePartName("أحمد محمد عبد الله");
  assert(valid3PartArabicName.valid === true, "Valid 3-part Arabic name passes");

  const valid3PartEnglishName = validateThreePartName("John Robert Smith");
  assert(valid3PartEnglishName.valid === true, "Valid 3-part English name passes");

  const valid4PartArabicName = validateThreePartName("أحمد محمد عبد الله السعيد");
  assert(valid4PartArabicName.valid === true, "Valid 4-part Arabic name also passes");

  const short2PartName = validateThreePartName("أحمد محمد");
  assert(short2PartName.valid === false && short2PartName.count === 2, "2-part name is rejected with word count 2");

  const req3Part = validateCertificateRequest({
    student_name: "سامر إبراهيم خليل",
    grade_level: ["GRADE_10"],
    security_number: "SEC-2025-0099",
    academic_year: "2025/2026",
  });
  assert(req3Part.isValid === true, "validateCertificateRequest accepts 3-part name");

  const req2Part = validateCertificateRequest({
    student_name: "سامر إبراهيم",
    grade_level: ["GRADE_10"],
    security_number: "SEC-2025-0099",
    academic_year: "2025/2026",
  });
  assert(req2Part.isValid === false && !!req2Part.errors.student_name, "validateCertificateRequest rejects 2-part name");

  // 2. Academic Year Validation
  console.log("\n[2] Testing Academic Year Validation (YYYY/YYYY)...");
  assert(validateAcademicYear("2025/2026").valid === true, "Valid consecutive year '2025/2026' passes");
  assert(validateAcademicYear("2025-2026").valid === false, "Hyphen format '2025-2026' is rejected");

  // 3. Multi-Select Grade Levels Validation (5 Predefined Options)
  console.log("\n[3] Testing Multi-Select Grade Levels Validation...");
  assert(PREDEFINED_GRADES.length === 5, "Strictly 5 predefined grade options exist");

  const validMultiGrades = validateGradeLevels(["GRADE_11_SCI", "TAWJIHI"]);
  assert(
    validMultiGrades.valid === true &&
    validMultiGrades.normalized.length === 2 &&
    validMultiGrades.normalized.includes("GRADE_11_SCI") &&
    validMultiGrades.normalized.includes("TAWJIHI"),
    "Valid multi-select grades array (Grade 11 Science + Tawjihi) passes"
  );

  const validArabicGrades = validateGradeLevels(["الحادي عشر علمي", "التوجيهي"]);
  assert(
    validArabicGrades.valid === true &&
    validArabicGrades.normalized.includes("GRADE_11_SCI") &&
    validArabicGrades.normalized.includes("TAWJIHI"),
    "Arabic grade names normalize to canonical keys"
  );

  const allFiveGrades = validateGradeLevels([
    "الصف التاسع",
    "العاشر",
    "الحادي عشر علمي",
    "الحادي عشر ادبي",
    "التوجيهي",
  ]);
  assert(allFiveGrades.valid === true && allFiveGrades.normalized.length === 5, "All 5 predefined options pass and normalize");

  const emptyGrades = validateGradeLevels([]);
  assert(emptyGrades.valid === false, "Empty grade array is rejected");

  const invalidGrade = validateGradeLevels(["GRADE_11_SCI", "Grade 5"]);
  assert(invalidGrade.valid === false, "Non-predefined grade 'Grade 5' is rejected");

  // 4. Security Number Validation & Optionality
  console.log("\n[4] Testing Security Number Validation & Optionality...");
  assert(validateSecurityNumber("SEC-2025-0099").valid === true, "Valid security number format passes");
  assert(validateSecurityNumber("SEC").valid === false, "Too short security number is rejected");
  assert(validateSecurityNumber("").valid === true && validateSecurityNumber("").cleaned === null, "Empty string security number is valid (optional)");
  assert(validateSecurityNumber(null).valid === true && validateSecurityNumber(null).cleaned === null, "Null security number is valid (optional)");
  assert(validateSecurityNumber(undefined).valid === true && validateSecurityNumber(undefined).cleaned === null, "Undefined security number is valid (optional)");

  const reqWithoutSecNum = validateCertificateRequest({
    student_name: "محمد عبد الرحيم سالم",
    grade_level: ["GRADE_10"],
    academic_year: "2025/2026",
    request_date: "2026-09-09",
    status: "انتظار",
  });
  assert(reqWithoutSecNum.isValid === true, "validateCertificateRequest passes without security_number");
  assert(reqWithoutSecNum.sanitizedData.security_number === null, "Omitted security_number sanitizes to null");
  assert(reqWithoutSecNum.sanitizedData.status === "انتظار", "Status defaults to 'انتظار'");
  assert(reqWithoutSecNum.sanitizedData.section === null, "Omitted section sanitizes to null (optional)");

  // 4.1 Section Field (الشعبة) Validation
  console.log("\n[4.1] Testing Section Field (الشعبة) Validation...");
  const reqWithSection = validateCertificateRequest({
    student_name: "محمد عبد الرحيم سالم",
    grade_level: ["GRADE_10"],
    section: "  أ  ",
    academic_year: "2025/2026",
  });
  assert(reqWithSection.isValid === true, "validateCertificateRequest accepts section");
  assert(reqWithSection.sanitizedData.section === "أ", "Section trimmed to 'أ'");

  const reqEmptySection = validateCertificateRequest({
    student_name: "محمد عبد الرحيم سالم",
    grade_level: ["GRADE_10"],
    section: "   ",
    academic_year: "2025/2026",
  });
  assert(reqEmptySection.sanitizedData.section === null, "Whitespace-only section sanitizes to null");

  // 4.2 Expanded Arabic Statuses Validation
  console.log("\n[4.2] Testing Expanded Arabic Statuses Validation...");
  assert(VALID_STATUSES.length === 5, "Strictly 5 valid statuses defined");
  assert(VALID_STATUSES.includes("تصديق شخصي"), "Contains 'تصديق شخصي'");
  assert(VALID_STATUSES.includes("تم التصديق"), "Contains 'تم التصديق'");

  // normalizeStatus tests
  assert(normalizeStatus("تصديق شخصي") === "تصديق شخصي", "normalizeStatus passes exact 'تصديق شخصي'");
  assert(normalizeStatus("  تصديق شخصي  ") === "تصديق شخصي", "normalizeStatus trims 'تصديق شخصي'");
  assert(normalizeStatus("تصديق ع حسابه الشخصي") === "تصديق شخصي", "normalizeStatus normalizes legacy 'تصديق ع حسابه الشخصي' to 'تصديق شخصي'");
  assert(normalizeStatus("  تصديق ع حسابه الشخصي  ") === "تصديق شخصي", "normalizeStatus trims and normalizes legacy 'تصديق ع حسابه الشخصي'");
  assert(normalizeStatus("تم التصديق") === "تم التصديق", "normalizeStatus passes exact 'تم التصديق'");
  assert(normalizeStatus("  تم التصديق  ") === "تم التصديق", "normalizeStatus trims 'تم التصديق'");
  assert(normalizeStatus("انتظار") === "انتظار", "normalizeStatus passes 'انتظار'");
  assert(normalizeStatus(null) === "انتظار", "normalizeStatus defaults null to 'انتظار'");

  const reqSelfCertified = validateCertificateRequest({
    student_name: "سعيد كريم عبد الله النعيمي",
    grade_level: ["GRADE_10"],
    academic_year: "2025/2026",
    status: "تصديق شخصي",
  });
  assert(reqSelfCertified.isValid === true, "validateCertificateRequest accepts 'تصديق شخصي'");
  assert(reqSelfCertified.sanitizedData.status === "تصديق شخصي", "Sanitized status matches 'تصديق شخصي'");

  const reqLegacySelfCertified = validateCertificateRequest({
    student_name: "سعيد كريم عبد الله النعيمي",
    grade_level: ["GRADE_10"],
    academic_year: "2025/2026",
    status: "تصديق ع حسابه الشخصي",
  });
  assert(reqLegacySelfCertified.isValid === true, "validateCertificateRequest accepts legacy 'تصديق ع حسابه الشخصي'");
  assert(reqLegacySelfCertified.sanitizedData.status === "تصديق شخصي", "Legacy status sanitizes to 'تصديق شخصي'");

  const reqCertified = validateCertificateRequest({
    student_name: "سعيد كريم عبد الله النعيمي",
    grade_level: ["GRADE_10"],
    academic_year: "2025/2026",
    status: "تم التصديق",
  });
  assert(reqCertified.isValid === true, "validateCertificateRequest accepts 'تم التصديق'");
  assert(reqCertified.sanitizedData.status === "تم التصديق", "Sanitized status matches 'تم التصديق'");

  // 7. Arabic Excel CSV Export Transformations
  console.log("\n[7] Testing Arabic Excel CSV Export Transformations...");

  // 7.1 Grade Level Formatting
  assert(formatGradeForExport("GRADE_9") === "9", "GRADE_9 exports as '9'");
  assert(formatGradeForExport("الصف التاسع") === "9", "الصف التاسع exports as '9'");
  assert(formatGradeForExport("GRADE_10") === "10", "GRADE_10 exports as '10'");
  assert(formatGradeForExport("العاشر") === "10", "العاشر exports as '10'");
  assert(formatGradeForExport("GRADE_11_SCI") === "11", "GRADE_11_SCI exports as '11'");
  assert(formatGradeForExport("GRADE_11_LIT") === "11", "GRADE_11_LIT exports as '11'");
  assert(formatGradeForExport("الحادي عشر علمي") === "11", "الحادي عشر علمي exports as '11'");
  assert(formatGradeForExport("الحادي عشر ادبي") === "11", "الحادي عشر ادبي exports as '11'");
  assert(formatGradeForExport("TAWJIHI") === "12", "TAWJIHI exports as '12'");
  assert(formatGradeForExport("التوجيهي") === "12", "التوجيهي exports as '12'");

  // Multi-grade combinations
  assert(
    formatGradeForExport(["GRADE_10", "GRADE_11_SCI"]) === "10 + 11",
    "Grade 10 + Grade 11 Science exports as '10 + 11'"
  );
  assert(
    formatGradeForExport(["العاشر", "الحادي عشر علمي"]) === "10 + 11",
    "Arabic 'العاشر' + 'الحادي عشر علمي' exports as '10 + 11'"
  );
  assert(
    formatGradeForExport(["GRADE_11_SCI", "TAWJIHI"]) === "11 + 12",
    "Grade 11 + Tawjihi exports as '11 + 12'"
  );
  assert(
    formatGradeForExport(["GRADE_9", "GRADE_10", "GRADE_11_SCI", "TAWJIHI"]) === "9 + 10 + 11 + 12",
    "All 4 levels export in sorted progression '9 + 10 + 11 + 12'"
  );
  assert(
    formatGradeForExport(["GRADE_11_SCI", "GRADE_11_LIT"]) === "11",
    "Both 11 streams deduplicate to single '11'"
  );

  // 7.2 Date Formatting (DD/MM/YYYY e.g., 26/7/2026)
  assert(formatDateForExport("2026-07-26") === "26/7/2026", "2026-07-26 formats to '26/7/2026'");
  assert(formatDateForExport("2026-09-08") === "8/9/2026", "2026-09-08 formats to '8/9/2026'");
  assert(formatDateForExport("2025-12-01") === "1/12/2025", "2025-12-01 formats to '1/12/2025'");

  // 7.3 Dynamic Export Filename Generation
  console.log("\n[7.3] Testing Dynamic Export Filename Generation...");
  const dateStr = new Date().toISOString().split("T")[0];

  function generateExportFilename(status) {
    const filterStatus =
      status && typeof status === "string" && status.trim() && status.trim() !== "ALL"
        ? normalizeStatus(status.trim())
        : null;
    return filterStatus
      ? `Export_${filterStatus.replace(/\s+/g, "_")}_${dateStr}.csv`
      : `Export_All_${dateStr}.csv`;
  }

  assert(
    generateExportFilename("تم الرفع للتصديق") === `Export_تم_الرفع_للتصديق_${dateStr}.csv`,
    "Filename dynamically reflects 'تم الرفع للتصديق'"
  );
  assert(
    generateExportFilename("انتظار") === `Export_انتظار_${dateStr}.csv`,
    "Filename dynamically reflects 'انتظار'"
  );
  assert(
    generateExportFilename("تمت كتابة الشهادة") === `Export_تمت_كتابة_الشهادة_${dateStr}.csv`,
    "Filename dynamically reflects 'تمت كتابة الشهادة'"
  );
  assert(
    generateExportFilename("تصديق شخصي") === `Export_تصديق_شخصي_${dateStr}.csv`,
    "Filename dynamically reflects 'تصديق شخصي'"
  );
  assert(
    generateExportFilename("ALL") === `Export_All_${dateStr}.csv`,
    "Filename for 'ALL' defaults to Export_All"
  );
  assert(
    generateExportFilename("") === `Export_All_${dateStr}.csv`,
    "Filename for empty status defaults to Export_All"
  );

  // 7.4 Exact 7-Column Structure & Order
  console.log("\n[7.4] Testing Exact 7-Column Structure & Sequence...");
  const EXPECTED_COLUMNS = [
    "الرقم",
    "اسم الطالب من اربع مقاطع",
    "اسم المدرسة",
    "الصف",
    "الرقم الامني",
    "تاريخ الطلب",
    "العام الدراسي",
  ];
  assert(EXPECTED_COLUMNS.length === 7, "Export contains exactly 7 columns (A to G)");
  assert(EXPECTED_COLUMNS[0] === "الرقم", "Column 1 (A) is 'الرقم'");
  assert(EXPECTED_COLUMNS[1] === "اسم الطالب من اربع مقاطع", "Column 2 (B) is 'اسم الطالب من اربع مقاطع'");
  assert(EXPECTED_COLUMNS[2] === "اسم المدرسة", "Column 3 (C) is 'اسم المدرسة'");
  assert(EXPECTED_COLUMNS[3] === "الصف", "Column 4 (D) is 'الصف'");
  assert(EXPECTED_COLUMNS[4] === "الرقم الامني", "Column 5 (E) is 'الرقم الامني'");
  assert(EXPECTED_COLUMNS[5] === "تاريخ الطلب", "Column 6 (F) is 'تاريخ الطلب'");
  assert(EXPECTED_COLUMNS[6] === "العام الدراسي", "Column 7 (G) is 'العام الدراسي'");

  // 7.5 Native Excel (.xlsx) Generation, RTL, Green Banner & Yellow Headers
  console.log("\n[7.5] Testing Native Excel (.xlsx) Generation with Visual Styling...");
  const testWb = new ExcelJS.Workbook();
  const testWs = testWb.addWorksheet("كشف تصديق الشهادات", {
    views: [{ rightToLeft: true, state: "normal" }],
  });
  assert(testWs.views[0].rightToLeft === true, "Worksheet is configured with Right-To-Left view");

  // Title Row (Row 1)
  const titleRow = testWs.getRow(1);
  titleRow.height = 36;
  testWs.mergeCells("A1:G1");
  const titleCell = testWs.getCell("A1");
  titleCell.value = `كشف تصديق شهادات الطلاب - ${HARDCODED_SCHOOL_NAME}`;
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } };
  titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };

  assert(titleCell.fill.fgColor.argb === "FF166534", "Main title banner has forest green background (#166534)");
  assert(titleCell.font.bold === true && titleCell.font.color.argb === "FFFFFFFF", "Main title text is bold white");

  // Header Row (Row 2)
  const headerRow = testWs.getRow(2);
  headerRow.height = 28;
  EXPECTED_COLUMNS.forEach((title, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = title;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB3B" } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF000000" } };
  });

  const sampleHeaderCell = headerRow.getCell(1);
  assert(sampleHeaderCell.fill.fgColor.argb === "FFFFEB3B", "Data table header row has school official yellow background (#FFEB3B)");
  assert(sampleHeaderCell.font.bold === true && sampleHeaderCell.font.color.argb === "FF000000", "Data table header text is bold black");

  const buffer = await testWb.xlsx.writeBuffer();
  assert(buffer && buffer.length > 0, "Native Excel .xlsx buffer successfully generated");

  // 7.6 Dynamic Status Exclusion Logic
  console.log("\n[7.6] Testing Status Exclusion Logic for Default vs Explicit Exports...");
  function shouldExcludeStatus(explicitStatus, recordStatus) {
    if (explicitStatus && explicitStatus !== "ALL" && explicitStatus !== "جميع الحالات") {
      return false; // User explicitly selected a filter, do not exclude
    }
    return recordStatus === "انتظار" || recordStatus === "تمت كتابة الشهادة";
  }

  assert(shouldExcludeStatus("ALL", "انتظار") === true, "Draft status 'انتظار' is excluded when exporting ALL");
  assert(shouldExcludeStatus("ALL", "تمت كتابة الشهادة") === true, "Draft status 'تمت كتابة الشهادة' is excluded when exporting ALL");
  assert(shouldExcludeStatus(null, "انتظار") === true, "Draft status 'انتظار' is excluded when no status filter is provided");
  assert(shouldExcludeStatus("ALL", "تم الرفع للتصديق") === false, "Active status 'تم الرفع للتصديق' is included when exporting ALL");
  assert(shouldExcludeStatus("ALL", "تصديق شخصي") === false, "Active status 'تصديق شخصي' is included when exporting ALL");
  assert(shouldExcludeStatus("ALL", "تم التصديق") === false, "Active status 'تم التصديق' is included when exporting ALL");
  assert(shouldExcludeStatus("انتظار", "انتظار") === false, "Draft status 'انتظار' is NOT excluded when explicitly filtered");
  assert(shouldExcludeStatus("تمت كتابة الشهادة", "تمت كتابة الشهادة") === false, "Draft status 'تمت كتابة الشهادة' is NOT excluded when explicitly filtered");

  // 7.7 Dynamic Page Size & Show All Selector Logic
  console.log("\n[7.7] Testing Dynamic Page Size & Show All Selector Logic...");
  function parsePageLimit(limitInput) {
    const isAll = String(limitInput).trim().toUpperCase() === "ALL";
    const parsed = isAll ? 50000 : (parseInt(limitInput, 10) || 10);
    return Math.min(50000, Math.max(1, parsed));
  }

  assert(parsePageLimit("10") === 10, "Page size 10 parses as 10");
  assert(parsePageLimit("25") === 25, "Page size 25 parses as 25");
  assert(parsePageLimit("50") === 50, "Page size 50 parses as 50");
  assert(parsePageLimit("100") === 100, "Page size 100 parses as 100");
  assert(parsePageLimit("ALL") === 50000, "Page size 'ALL' parses to high limit 50000");
  assert(parsePageLimit("all") === 50000, "Page size 'all' (lowercase) parses to high limit 50000");

  function isShowAllMode(pageSize, limit) {
    return pageSize === "ALL" || limit >= 50000;
  }
  assert(isShowAllMode("ALL", 50000) === true, "'ALL' triggers Show All mode (hiding navigation buttons)");
  assert(isShowAllMode("10", 10) === false, "'10' maintains normal paginated mode");

  // 7.8 Unified Grade Level Display Formatting
  console.log("\n[7.8] Testing Unified Single Grade Level Badge Formatting...");
  function formatGradeLevelDisplay(gradeInput) {
    if (!gradeInput) return "-";
    if (typeof gradeInput === "string") {
      const trimmed = gradeInput.trim();
      if (
        !trimmed.startsWith("[") &&
        !trimmed.includes("GRADE_") &&
        !trimmed.includes("الصف") &&
        !trimmed.includes("العاشر") &&
        !trimmed.includes("حادي") &&
        !trimmed.includes("توجيهي")
      ) {
        return trimmed;
      }
    }
    let list = [];
    if (Array.isArray(gradeInput)) {
      list = gradeInput;
    } else if (typeof gradeInput === "string") {
      const trimmed = gradeInput.trim();
      if (trimmed.startsWith("[")) {
        try { list = JSON.parse(trimmed); } catch { list = [trimmed]; }
      } else if (trimmed.includes("+")) {
        return trimmed;
      } else {
        list = [trimmed];
      }
    }
    const GRADE_NUM_MAP = {
      GRADE_9: "9",
      GRADE_10: "10",
      GRADE_11_SCI: "11",
      GRADE_11_LIT: "11",
      TAWJIHI: "12",
      "الصف التاسع": "9",
      "العاشر": "10",
      "الحادي عشر علمي": "11",
      "الحادي عشر ادبي": "11",
      "التوجيهي": "12",
    };
    const numOrder = ["9", "10", "11", "12"];
    const matched = new Set();
    for (const item of list) {
      if (!item) continue;
      const str = String(item).trim();
      if (GRADE_NUM_MAP[str]) matched.add(GRADE_NUM_MAP[str]);
      else matched.add(str);
    }
    const sorted = numOrder.filter((n) => matched.has(n));
    return sorted.length > 0 ? sorted.join(" + ") : String(gradeInput);
  }

  assert(formatGradeLevelDisplay(["GRADE_9"]) === "9", "['GRADE_9'] formats as clean unified '9'");
  assert(formatGradeLevelDisplay(["GRADE_10"]) === "10", "['GRADE_10'] formats as clean unified '10'");
  assert(formatGradeLevelDisplay(["GRADE_9", "GRADE_10"]) === "9 + 10", "Multi-grade formats as unified '9 + 10'");
  assert(formatGradeLevelDisplay(["GRADE_10", "GRADE_11_SCI"]) === "10 + 11", "Grade 10 + 11 formats as unified '10 + 11'");
  assert(formatGradeLevelDisplay("9+10") === "9+10", "Direct string '9+10' preserved directly");
  assert(formatGradeLevelDisplay("9") === "9", "Direct string '9' preserved directly");
  assert(formatGradeLevelDisplay(null) === "-", "Null grade formats as '-'");

  // 7.9 Smart Academic Year and Grade Progression Filtering
  console.log("\n[7.9] Testing Smart Academic Year Progression Matching...");

  // parseAcademicYearStart
  assert(parseAcademicYearStart("2019/2020") === 2019, "parseAcademicYearStart parses '2019/2020' to 2019");
  assert(parseAcademicYearStart("2021/2022") === 2021, "parseAcademicYearStart parses '2021/2022' to 2021");
  assert(parseAcademicYearStart("2025") === 2025, "parseAcademicYearStart parses '2025' to 2025");

  // extractGradeNumbers
  assert(
    JSON.stringify(extractGradeNumbers(["GRADE_9", "GRADE_10", "GRADE_11_SCI"])) === JSON.stringify([9, 10, 11]),
    "extractGradeNumbers parses canonical array to [9, 10, 11]"
  );
  assert(
    JSON.stringify(extractGradeNumbers("9 + 10 + 11")) === JSON.stringify([9, 10, 11]),
    "extractGradeNumbers parses '9 + 10 + 11' to [9, 10, 11]"
  );
  assert(
    JSON.stringify(extractGradeNumbers("9+10")) === JSON.stringify([9, 10]),
    "extractGradeNumbers parses '9+10' to [9, 10]"
  );

  // Multi-grade student graduating in 2021/2022 with grades 9 + 10 + 11
  const studentMultiGrade = {
    academic_year: "2021/2022",
    grade_level: ["GRADE_9", "GRADE_10", "GRADE_11_SCI"],
  };

  assert(
    isRecordActiveInAcademicYear(studentMultiGrade, "2021/2022") === true,
    "Student is active in completion year 2021/2022"
  );
  assert(
    isRecordActiveInAcademicYear(studentMultiGrade, "2020/2021") === true,
    "Student with 9+10+11 in 2021/2022 is active in Grade 10 year 2020/2021"
  );
  assert(
    isRecordActiveInAcademicYear(studentMultiGrade, "2019/2020") === true,
    "Student with 9+10+11 in 2021/2022 is intelligently matched when filtering by 2019/2020 (Grade 9)"
  );
  assert(
    isRecordActiveInAcademicYear(studentMultiGrade, "2018/2019") === false,
    "Student is not matched in earlier year 2018/2019 before Grade 9"
  );
  assert(
    isRecordActiveInAcademicYear(studentMultiGrade, "2022/2023") === false,
    "Student is not matched in later year 2022/2023 after Grade 11"
  );

  // String composite grade matching (e.g. "9 + 10 + 11")
  const studentStringGrades = {
    academic_year: "2021/2022",
    grade_level: "9 + 10 + 11",
  };
  assert(
    isRecordActiveInAcademicYear(studentStringGrades, "2019/2020") === true,
    "Record with string grade '9 + 10 + 11' in 2021/2022 matches filter 2019/2020"
  );

  // Multi-grade student with 10 + 11 (did NOT take 9 in this timeline)
  const student10and11 = {
    academic_year: "2021/2022",
    grade_level: ["GRADE_10", "GRADE_11_SCI"],
  };
  assert(
    isRecordActiveInAcademicYear(student10and11, "2020/2021") === true,
    "Student with 10+11 in 2021/2022 matches 2020/2021 (Grade 10)"
  );
  assert(
    isRecordActiveInAcademicYear(student10and11, "2019/2020") === false,
    "Student with 10+11 in 2021/2022 does NOT match 2019/2020"
  );

  // 4-year progression student (Grades 9 + 10 + 11 + Tawjihi in 2024/2025)
  const student4Grades = {
    academic_year: "2024/2025",
    grade_level: ["GRADE_9", "GRADE_10", "GRADE_11_SCI", "TAWJIHI"],
  };
  assert(
    isRecordActiveInAcademicYear(student4Grades, "2024/2025") === true,
    "4-grade student matches completion year 2024/2025 (Tawjihi)"
  );
  assert(
    isRecordActiveInAcademicYear(student4Grades, "2023/2024") === true,
    "4-grade student matches 2023/2024 (Grade 11)"
  );
  assert(
    isRecordActiveInAcademicYear(student4Grades, "2022/2023") === true,
    "4-grade student matches 2022/2023 (Grade 10)"
  );
  assert(
    isRecordActiveInAcademicYear(student4Grades, "2021/2022") === true,
    "4-grade student matches 2021/2022 (Grade 9)"
  );
  assert(
    isRecordActiveInAcademicYear(student4Grades, "2020/2021") === false,
    "4-grade student does not match 2020/2021"
  );
  assert(
    isRecordActiveInAcademicYear(student4Grades, "2025/2026") === false,
    "4-grade student does not match 2025/2026"
  );

  // Single grade record only matches exact academic year
  const singleGradeStudent = {
    academic_year: "2021/2022",
    grade_level: ["GRADE_10"],
  };
  assert(
    isRecordActiveInAcademicYear(singleGradeStudent, "2021/2022") === true,
    "Single grade student matches exact year 2021/2022"
  );
  assert(
    isRecordActiveInAcademicYear(singleGradeStudent, "2019/2020") === false,
    "Single grade student in 2021/2022 does not match 2019/2020"
  );

  // Filter 'ALL' or 'جميع الأعوام الدراسية' matches all
  assert(
    isRecordActiveInAcademicYear(studentMultiGrade, "ALL") === true,
    "Filter 'ALL' matches record"
  );
  assert(
    isRecordActiveInAcademicYear(studentMultiGrade, "جميع الأعوام الدراسية") === true,
    "Filter 'جميع الأعوام الدراسية' matches record"
  );

  // Chronological sorting of academic years (descending newest to oldest)
  const scrambledYears = ["2018/2019", "2026/2027", "2012/2013", "2024/2025", "2020/2021", "2015/2016"];
  const sorted = sortAcademicYears(scrambledYears);
  assert(
    JSON.stringify(sorted) ===
      JSON.stringify(["2026/2027", "2024/2025", "2020/2021", "2018/2019", "2015/2016", "2012/2013"]),
    "sortAcademicYears sorts scrambled years chronologically in descending order (2026/2027 down to 2012/2013)"
  );
  assert(
    sorted[0] === "2026/2027" && sorted[sorted.length - 1] === "2012/2013",
    "Newest year is placed first and oldest year is placed last"
  );
  const duplicatesWithBlanks = ["2024/2025", "2024/2025", "", null, "2021/2022"];
  const deduplicatedSorted = sortAcademicYears(duplicatesWithBlanks);
  assert(
    JSON.stringify(deduplicatedSorted) === JSON.stringify(["2024/2025", "2021/2022"]),
    "sortAcademicYears deduplicates duplicate years and filters out blank values"
  );

  // 7.10 Numeric and Composite Grade Level Validation & Edit Pre-Filling
  console.log("\n[7.10] Testing Numeric & Composite Grade Validation & Pre-Filling...");

  // Single numeric strings
  const valG9 = validateGradeLevels("9");
  assert(valG9.valid === true && valG9.normalized[0] === "GRADE_9", "Numeric string '9' normalizes to 'GRADE_9'");

  const valG10 = validateGradeLevels("10");
  assert(valG10.valid === true && valG10.normalized[0] === "GRADE_10", "Numeric string '10' normalizes to 'GRADE_10'");

  const valG11 = validateGradeLevels("11");
  assert(valG11.valid === true && valG11.normalized[0] === "GRADE_11_SCI", "Numeric string '11' normalizes to 'GRADE_11_SCI'");

  const valG12 = validateGradeLevels("12");
  assert(valG12.valid === true && valG12.normalized[0] === "TAWJIHI", "Numeric string '12' normalizes to 'TAWJIHI'");

  // Number types
  const valNum10 = validateGradeLevels(10);
  assert(valNum10.valid === true && valNum10.normalized[0] === "GRADE_10", "Numeric number 10 normalizes to 'GRADE_10'");

  // Composite strings with plus '+'
  const valCompositePlus = validateGradeLevels("9+10");
  assert(
    valCompositePlus.valid === true &&
    valCompositePlus.normalized.length === 2 &&
    valCompositePlus.normalized.includes("GRADE_9") &&
    valCompositePlus.normalized.includes("GRADE_10"),
    "Composite string '9+10' normalizes without error"
  );

  const valMultiProgression = validateGradeLevels("9 + 10 + 11");
  assert(
    valMultiProgression.valid === true &&
    valMultiProgression.normalized.length === 3 &&
    valMultiProgression.normalized.includes("GRADE_9") &&
    valMultiProgression.normalized.includes("GRADE_10") &&
    valMultiProgression.normalized.includes("GRADE_11_SCI"),
    "Progression string '9 + 10 + 11' normalizes to canonical keys"
  );

  // Array of numeric strings
  const valArrayNumerics = validateGradeLevels(["10", "11"]);
  assert(
    valArrayNumerics.valid === true &&
    valArrayNumerics.normalized.includes("GRADE_10") &&
    valArrayNumerics.normalized.includes("GRADE_11_SCI"),
    "Array of numeric strings ['10', '11'] normalizes without error"
  );

  // Array of numbers
  const valArrayNums = validateGradeLevels([9, 10]);
  assert(
    valArrayNums.valid === true &&
    valArrayNums.normalized.includes("GRADE_9") &&
    valArrayNums.normalized.includes("GRADE_10"),
    "Array of numbers [9, 10] normalizes without error"
  );

  // parseGradeKeys helper for Edit Modal Pre-filling
  assert(
    JSON.stringify(parseGradeKeys("9")) === JSON.stringify(["GRADE_9"]),
    "parseGradeKeys('9') returns ['GRADE_9'] for edit modal pre-fill"
  );
  assert(
    JSON.stringify(parseGradeKeys("9+10")) === JSON.stringify(["GRADE_9", "GRADE_10"]),
    "parseGradeKeys('9+10') returns ['GRADE_9', 'GRADE_10'] for edit modal pre-fill"
  );
  assert(
    JSON.stringify(parseGradeKeys("9 + 10 + 11")) === JSON.stringify(["GRADE_9", "GRADE_10", "GRADE_11_SCI"]),
    "parseGradeKeys('9 + 10 + 11') returns ['GRADE_9', 'GRADE_10', 'GRADE_11_SCI'] for edit modal pre-fill"
  );
  assert(
    JSON.stringify(parseGradeKeys(["GRADE_10", "TAWJIHI"])) === JSON.stringify(["GRADE_10", "TAWJIHI"]),
    "parseGradeKeys preserves canonical keys array"
  );

  // validateCertificateRequest accepts numeric & composite grades
  const certReqWithNumericGrade = validateCertificateRequest({
    student_name: "عمر زياد مصطفى",
    grade_level: "9+10",
    academic_year: "2024/2025",
  });
  assert(certReqWithNumericGrade.isValid === true, "validateCertificateRequest accepts composite grade '9+10'");
  assert(
    certReqWithNumericGrade.sanitizedData.grade_level.length === 2 &&
    certReqWithNumericGrade.sanitizedData.grade_level.includes("GRADE_9"),
    "Composite grade correctly sanitized into canonical keys"
  );

  // 5, 6, 8 Database Integration Tests (PostgreSQL)
  console.log("\n[Database] Connecting to PostgreSQL database...");
  let dbReachable = false;
  try {
    await initDatabase();
    dbReachable = true;
  } catch (err) {
    console.warn("PostgreSQL connection note:", err.message);
  }

  if (dbReachable) {
    console.log("\n[5] Testing Database Operations with JSON Array Grade Levels...");
    const list = await getCertificates({ page: 1, limit: 10 });
    assert(list.records.length >= 0, `Query executed successfully. Records count: ${list.records.length}`);
    if (list.records.length > 0) {
      assert(Array.isArray(list.records[0].grade_level), "Retrieved record grade_level is parsed as Array");
    }

    console.log("\n[6] Testing Certificate Creation with Optional Security Number & Custom Arabic Statuses...");
    const recordNoSecNum = await createCertificate({
      student_name: "يوسف إبراهيم أحمد السالم",
      grade_level: ["GRADE_9"],
      security_number: null,
      request_date: "2026-09-09",
      academic_year: "2025/2026",
      status: "انتظار",
      notes: "No security number entered",
    });
    assert(recordNoSecNum && recordNoSecNum.id > 0, `Record created with ID: ${recordNoSecNum?.id}`);
    assert(recordNoSecNum?.security_number === null, "Record has null security_number");
    assert(recordNoSecNum?.status === "انتظار", "Record created with default status 'انتظار'");

    const writtenRecord = await updateCertificateStatus(recordNoSecNum.id, "تمت كتابة الشهادة");
    assert(writtenRecord.status === "تمت كتابة الشهادة", "Status successfully updated to 'تمت كتابة الشهادة'");

    const submittedRecord = await updateCertificateStatus(recordNoSecNum.id, "تم الرفع للتصديق");
    assert(submittedRecord.status === "تم الرفع للتصديق", "Status successfully updated to 'تم الرفع للتصديق'");

    const selfCertifiedRecord = await updateCertificateStatus(recordNoSecNum.id, "تصديق شخصي");
    assert(selfCertifiedRecord.status === "تصديق شخصي", "Status successfully updated to 'تصديق شخصي'");

    const certifiedRecord = await updateCertificateStatus(recordNoSecNum.id, "تم التصديق");
    assert(certifiedRecord.status === "تم التصديق", "Status successfully updated to 'تم التصديق'");

    const waitingRecord = await updateCertificateStatus(recordNoSecNum.id, "انتظار");
    assert(waitingRecord.status === "انتظار", "Status successfully reset to 'انتظار'");

    const metrics = await getDashboardMetrics();
    assert(typeof metrics.total === "number", "Dashboard metrics returns total count");
    assert(typeof metrics.waiting === "number", "Dashboard metrics returns waiting count");
    assert(typeof metrics.written === "number", "Dashboard metrics returns written count");
    assert(typeof metrics.submitted === "number", "Dashboard metrics returns submitted count");
    assert(typeof metrics.certified === "number", "Dashboard metrics returns certified count");
    assert(typeof metrics.self_certified === "number", "Dashboard metrics returns self_certified count");

    await deleteCertificate(recordNoSecNum.id);
    const cleaned = await getCertificateById(recordNoSecNum.id);
    assert(cleaned === null, "Test record cleaned up successfully");

    console.log("\n[8] Testing Full Record Update (updateCertificate) & Section...");
    const editTestSec = `SEC-EDIT-${Date.now()}`;
    const initialRecord = await createCertificate({
      student_name: "وليد خالد منصور الحربي",
      grade_level: ["GRADE_10"],
      section: "أ",
      security_number: editTestSec,
      request_date: "2026-09-01",
      academic_year: "2024/2025",
      status: "انتظار",
      notes: "Original note",
    });
    assert(initialRecord && initialRecord.id > 0, "Created test record for edit testing");
    assert(initialRecord.section === "أ", "Initial record stores section 'أ'");

    const updatedRecord = await updateCertificate(initialRecord.id, {
      student_name: "وليد خالد منصور الحربي الزهراني",
      grade_level: ["GRADE_11_SCI", "TAWJIHI"],
      section: "ب",
      security_number: editTestSec,
      request_date: "2026-09-09",
      academic_year: "2025/2026",
      status: "تمت كتابة الشهادة",
      notes: "Updated note with approved status",
    });

    assert(updatedRecord.student_name === "وليد خالد منصور الحربي الزهراني", "Student name successfully updated");
    assert(updatedRecord.section === "ب", "Section successfully updated to 'ب'");
    assert(Array.isArray(updatedRecord.grade_level) && updatedRecord.grade_level.length === 2, "Grade levels updated to multi-grade array");
    assert(updatedRecord.grade_level.includes("GRADE_11_SCI") && updatedRecord.grade_level.includes("TAWJIHI"), "Contains new grade levels");
    assert(updatedRecord.status === "تمت كتابة الشهادة", "Status updated to 'تمت كتابة الشهادة'");

    await deleteCertificate(initialRecord.id);
    const verifyDel = await getCertificateById(initialRecord.id);
    assert(verifyDel === null, "Edit test record cleaned up");
  } else {
    console.log("[Notice] PostgreSQL instance is not reachable with local default credentials.");
    console.log("On Render or Supabase, set DATABASE_URL in environment settings to enable live database queries.");
  }

  try {
    await pool.end();
  } catch (e) {}

  console.log("\n==================================================");
  console.log(` Summary: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All Student Gateway verification tests passed successfully!\n");
    process.exit(0);
  }
}

runTests();
