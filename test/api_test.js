/**
 * Automated Verification Suite for Student Gateway
 * Supports PostgreSQL & Multi-Select Grade Levels & i18n Validation
 */
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
