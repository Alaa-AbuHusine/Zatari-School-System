/**
 * Automated Verification Suite for Student Gateway
 * Includes Multi-Select Grade Levels & i18n Validation
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

// 5. Database Multi-Select Query & Filter Tests
console.log("\n[5] Testing Database Operations with JSON Array Grade Levels...");
const list = getCertificates({ page: 1, limit: 10 });
assert(list.records.length > 0, `Seeded records loaded: ${list.records.length}`);
assert(Array.isArray(list.records[0].grade_level), "Retrieved record grade_level is parsed as Array");

// Filter by Tawjihi
const tawjihiList = getCertificates({ grade: "TAWJIHI" });
assert(tawjihiList.records.length >= 1, "Filter by grade 'TAWJIHI' returns matching records");
assert(tawjihiList.records.every((r) => r.grade_level.includes("TAWJIHI")), "All returned records contain TAWJIHI in array");

// 6. Create Records with Optional Security Number & Custom Arabic Statuses
console.log("\n[6] Testing Certificate Creation with Optional Security Number & Custom Arabic Statuses...");

// 6.1 Record without security number
const recordNoSecNum = createCertificate({
  student_name: "يوسف إبراهيم أحمد السالم",
  grade_level: ["GRADE_9"],
  security_number: null,
  request_date: "2026-09-09",
  academic_year: "2025/2026",
  status: "انتظار",
  notes: "No security number entered",
});
assert(recordNoSecNum && recordNoSecNum.id > 0, `Record without security number created with ID: ${recordNoSecNum.id}`);
assert(recordNoSecNum.security_number === null, "Record has null security_number");
assert(recordNoSecNum.status === "انتظار", "Record created with default status 'انتظار'");

// 6.2 Status transition through the 3 custom Arabic statuses
const writtenRecord = updateCertificateStatus(recordNoSecNum.id, "تمت كتابة الشهادة");
assert(writtenRecord.status === "تمت كتابة الشهادة", "Status successfully updated to 'تمت كتابة الشهادة'");

const submittedRecord = updateCertificateStatus(recordNoSecNum.id, "تم الرفع للتصديق");
assert(submittedRecord.status === "تم الرفع للتصديق", "Status successfully updated to 'تم الرفع للتصديق'");

const waitingRecord = updateCertificateStatus(recordNoSecNum.id, "انتظار");
assert(waitingRecord.status === "انتظار", "Status successfully reset to 'انتظار'");

// 6.3 Verify dashboard metrics reflect custom Arabic statuses
const metrics = getDashboardMetrics();
assert(typeof metrics.total === "number" && metrics.total > 0, "Dashboard metrics returns total count");
assert(typeof metrics.waiting === "number", "Dashboard metrics returns waiting count");
assert(typeof metrics.written === "number", "Dashboard metrics returns written count");
assert(typeof metrics.submitted === "number", "Dashboard metrics returns submitted count");

// 6.4 Clean up test record
deleteCertificate(recordNoSecNum.id);
assert(getCertificateById(recordNoSecNum.id) === undefined, "Test record without security number cleaned up successfully");

// 6.5 Record with multiple grade levels and unique security number
const testSecNumber = `SEC-MULTI-${Date.now()}`;
const newRecord = createCertificate({
  student_name: "طارق سليم إبراهيم العدوان",
  grade_level: ["GRADE_11_SCI", "TAWJIHI"],
  security_number: testSecNumber,
  request_date: "2026-09-09",
  academic_year: "2025/2026",
  status: "تم الرفع للتصديق",
  notes: "Multi-grade attestation request",
});

assert(newRecord && newRecord.id > 0, `Record created with ID: ${newRecord.id}`);
assert(newRecord.school_name === HARDCODED_SCHOOL_NAME, `Record hardcodes school name as '${HARDCODED_SCHOOL_NAME}'`);
assert(Array.isArray(newRecord.grade_level), "Created record grade_level is an array");
assert(newRecord.grade_level.length === 2, "Created record contains both selected grades");
assert(newRecord.grade_level.includes("GRADE_11_SCI") && newRecord.grade_level.includes("TAWJIHI"), "Contains exact grade keys");
assert(newRecord.status === "تم الرفع للتصديق", "Created record has status 'تم الرفع للتصديق'");

// Clean up test record
deleteCertificate(newRecord.id);
const verifyDeleted = getCertificateById(newRecord.id);
assert(verifyDeleted === undefined, "Test record cleaned up successfully");

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

// 8. Full Record Update & Edit Workflow Tests (updateCertificate)
console.log("\n[8] Testing Full Record Update (updateCertificate)...");

const editTestSec = `SEC-EDIT-${Date.now()}`;
const initialRecord = createCertificate({
  student_name: "وليد خالد منصور الحربي",
  grade_level: ["GRADE_10"],
  security_number: editTestSec,
  request_date: "2026-09-01",
  academic_year: "2024/2025",
  status: "انتظار",
  notes: "Original note",
});
assert(initialRecord && initialRecord.id > 0, "Created initial test record for edit testing");

// 8.1 Update student name, grade level to multi-grade, academic year, status, notes
const updatedRecord = updateCertificate(initialRecord.id, {
  student_name: "وليد خالد منصور الحربي الزهراني",
  grade_level: ["GRADE_11_SCI", "TAWJIHI"],
  security_number: editTestSec,
  request_date: "2026-09-09",
  academic_year: "2025/2026",
  status: "تمت كتابة الشهادة",
  notes: "Updated note with approved status",
});

assert(updatedRecord.student_name === "وليد خالد منصور الحربي الزهراني", "Student name successfully updated");
assert(Array.isArray(updatedRecord.grade_level) && updatedRecord.grade_level.length === 2, "Grade levels updated to multi-grade array");
assert(updatedRecord.grade_level.includes("GRADE_11_SCI") && updatedRecord.grade_level.includes("TAWJIHI"), "Contains new grade levels");
assert(updatedRecord.academic_year === "2025/2026", "Academic year updated to 2025/2026");
assert(updatedRecord.status === "تمت كتابة الشهادة", "Status updated to 'تمت كتابة الشهادة'");
assert(updatedRecord.notes === "Updated note with approved status", "Notes updated correctly");

// 8.2 Update security number to null (optional clearing)
const clearedSecNumRecord = updateCertificate(initialRecord.id, {
  student_name: "وليد خالد منصور الحربي الزهراني",
  grade_level: ["GRADE_11_SCI", "TAWJIHI"],
  security_number: "",
  request_date: "2026-09-09",
  academic_year: "2025/2026",
  status: "تم الرفع للتصديق",
  notes: "Cleared security number",
});
assert(clearedSecNumRecord.security_number === null, "Empty security number correctly cleared to null on update");
assert(clearedSecNumRecord.status === "تم الرفع للتصديق", "Status updated to 'تم الرفع للتصديق'");

// 8.3 Duplicate check logic on update (must allow keeping same security number, but disallow stealing another record's)
const secNumA = `SEC-A-${Date.now()}`;
const secNumB = `SEC-B-${Date.now()}`;
const recA = createCertificate({
  student_name: "طالب أ سعيد عمر",
  grade_level: ["GRADE_9"],
  security_number: secNumA,
  request_date: "2026-09-09",
  academic_year: "2025/2026",
  status: "انتظار",
});
const recB = createCertificate({
  student_name: "طالب ب ناصر حسن",
  grade_level: ["GRADE_9"],
  security_number: secNumB,
  request_date: "2026-09-09",
  academic_year: "2025/2026",
  status: "انتظار",
});

// Checking duplicate for recA keeping its own secNumA:
const checkA = getCertificateBySecurityNumber(secNumA);
assert(checkA && checkA.id === recA.id, "Querying recA's own security number returns recA (allowed on edit)");

// Simulating update collision: recA trying to use recB's security number
const duplicateCheck = getCertificateBySecurityNumber(secNumB);
assert(duplicateCheck && duplicateCheck.id !== recA.id, "Detects that secNumB already belongs to a different record (recB)");

// Clean up test records
deleteCertificate(initialRecord.id);
deleteCertificate(recA.id);
deleteCertificate(recB.id);
assert(getCertificateById(initialRecord.id) === undefined, "Edit test record cleaned up");
assert(getCertificateById(recA.id) === undefined, "RecA test record cleaned up");
assert(getCertificateById(recB.id) === undefined, "RecB test record cleaned up");

console.log("\n==================================================");
console.log(` Summary: ${passed} passed, ${failed} failed`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Student Gateway verification tests passed successfully!\n");
  process.exit(0);
}
