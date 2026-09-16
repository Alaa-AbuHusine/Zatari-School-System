/**
 * Data Validation Layer for Student Certificate Attestation Requests
 * Implements strict rules:
 * 1. 4-part full name (الاسم الرباعي الكامل) - minimum 4 words separated by whitespace.
 * 2. Academic year format (YYYY/YYYY) e.g., '2025/2026'.
 * 3. Alphanumeric security number (unique barcode/attestation token).
 * 4. Multi-Select Grade Levels strictly limited to the 5 predefined options:
 *    - الصف التاسع (Grade 9)
 *    - العاشر (Grade 10)
 *    - الحادي عشر علمي (Grade 11 Science)
 *    - الحادي عشر ادبي (Grade 11 Arts)
 *    - التوجيهي (Tawjihi)
 */

export const PREDEFINED_GRADES = [
  { key: "GRADE_9", ar: "الصف التاسع", en: "Grade 9" },
  { key: "GRADE_10", ar: "العاشر", en: "Grade 10" },
  { key: "GRADE_11_SCI", ar: "الحادي عشر علمي", en: "Grade 11 Science" },
  { key: "GRADE_11_LIT", ar: "الحادي عشر ادبي", en: "Grade 11 Arts" },
  { key: "TAWJIHI", ar: "التوجيهي", en: "Tawjihi" },
];

export const VALID_GRADE_KEYS = PREDEFINED_GRADES.map((g) => g.key);

/**
 * Normalizes a grade input string, number, or key into a canonical key
 */
export function normalizeGradeKey(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str) return null;

  // Match canonical key
  if (VALID_GRADE_KEYS.includes(str)) return str;

  const lower = str.toLowerCase();

  // Numeric and standard alias matching
  if (
    str === "9" ||
    lower === "grade 9" ||
    str === "الصف التاسع" ||
    str.includes("تاسع") ||
    lower.includes("grade 9")
  ) {
    return "GRADE_9";
  }

  if (
    str === "10" ||
    lower === "grade 10" ||
    str === "العاشر" ||
    str === "الصف العاشر" ||
    str.includes("عاشر") ||
    lower.includes("grade 10")
  ) {
    return "GRADE_10";
  }

  if (
    str === "GRADE_11_LIT" ||
    lower === "grade 11 lit" ||
    lower === "grade 11 arts" ||
    str.includes("ادبي") ||
    str.includes("أدبي")
  ) {
    return "GRADE_11_LIT";
  }

  if (
    str === "GRADE_11_SCI" ||
    str === "GRADE_11" ||
    str === "11" ||
    lower === "grade 11" ||
    lower.includes("grade 11 science") ||
    str.includes("علمي") ||
    str.includes("حادي عشر")
  ) {
    return "GRADE_11_SCI";
  }

  if (
    str === "TAWJIHI" ||
    str === "12" ||
    lower === "tawjihi" ||
    lower === "grade 12" ||
    str.includes("توجيهي") ||
    str.includes("ثانوية")
  ) {
    return "TAWJIHI";
  }

  // Fallback scan across predefined options
  for (const grade of PREDEFINED_GRADES) {
    if (
      grade.key.toLowerCase() === lower ||
      grade.en.toLowerCase() === lower ||
      grade.ar === str ||
      str.includes(grade.ar) ||
      lower.includes(grade.en.toLowerCase())
    ) {
      return grade.key;
    }
  }

  return null;
}

/**
 * Validates whether a full name contains at least 3 parts (الاسم الثلاثي على الأقل)
 */
export function validateThreePartName(name) {
  if (!name || typeof name !== "string") {
    return { valid: false, count: 0, message: "Student name is required" };
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 3) {
    return {
      valid: false,
      count: parts.length,
      message: `Student name must contain at least 3 parts (يجب أن يتضمن اسم الطالب 3 مقاطع على الأقل). Currently entered ${parts.length} of 3 parts.`,
    };
  }

  return { valid: true, count: parts.length };
}

// Backwards compatibility aliases
export const validateFourPartName = validateThreePartName;
export const validateStudentName = validateThreePartName;

/**
 * Validates academic year format: YYYY/YYYY (e.g. 2025/2026)
 */
export function validateAcademicYear(year) {
  if (!year || typeof year !== "string") {
    return { valid: false, message: "Academic year is required" };
  }

  const match = year.trim().match(/^(\d{4})\/(\d{4})$/);
  if (!match) {
    return { valid: false, message: "Academic year must follow the format YYYY/YYYY (e.g., 2025/2026)" };
  }

  const startYear = parseInt(match[1], 10);
  const endYear = parseInt(match[2], 10);
  if (endYear !== startYear + 1) {
    return {
      valid: false,
      message: `Academic year second year must be consecutive (e.g., ${startYear}/${startYear + 1})`,
    };
  }

  return { valid: true };
}

export const VALID_STATUSES = [
  "انتظار",
  "تمت كتابة الشهادة",
  "تم الرفع للتصديق",
  "تصديق شخصي",
  "تم التصديق",
];

/**
 * Normalizes input status into one of the 5 canonical status strings.
 * Handles whitespace, slight dialect/keyboard variations, and English equivalents.
 */
export function normalizeStatus(val) {
  if (!val || typeof val !== "string") return "انتظار";
  const trimmed = val.trim();
  if (VALID_STATUSES.includes(trimmed)) return trimmed;

  // Handle common typing / encoding variations
  if (
    trimmed.includes("حسابه") ||
    trimmed.includes("شخصي") ||
    trimmed.includes("Self-Financed") ||
    trimmed.includes("Self Attestation")
  ) {
    return "تصديق شخصي";
  }
  if (
    trimmed === "تم التصديق" ||
    trimmed.includes("تم التصديق") ||
    trimmed.includes("Certified") ||
    trimmed.includes("Completed")
  ) {
    return "تم التصديق";
  }
  if (trimmed.includes("كتابة") || trimmed.includes("Written")) {
    return "تمت كتابة الشهادة";
  }
  if (trimmed.includes("الرفع") || trimmed.includes("Submitted")) {
    return "تم الرفع للتصديق";
  }
  if (trimmed.includes("انتظار") || trimmed.includes("Waiting")) {
    return "انتظار";
  }

  return "انتظار";
}

/**
 * Validates security number (Barcode/Serial) - Completely Optional
 */
export function validateSecurityNumber(secNum) {
  if (!secNum || typeof secNum !== "string" || !secNum.trim()) {
    return { valid: true, cleaned: null };
  }

  const cleaned = secNum.trim();
  if (cleaned.length < 4 || cleaned.length > 50) {
    return { valid: false, message: "Security number must be between 4 and 50 characters" };
  }

  if (!/^[A-Za-z0-9\-_/]+$/.test(cleaned)) {
    return { valid: false, message: "Security number can only contain letters, numbers, hyphens, and slashes" };
  }

  return { valid: true, cleaned };
}

/**
 * Validates multi-select grade levels array, string, number, or composite progression (e.g. '9+10', '9 + 10 + 11')
 * @param {Array|string|number} grades
 * @returns {{ valid: boolean, message?: string, normalized?: string[] }}
 */
export function validateGradeLevels(grades) {
  if (grades === null || grades === undefined || grades === "") {
    return {
      valid: false,
      message: "At least one grade level must be selected (يجب اختيار مرحلة دراسية واحدة على الأقل)",
    };
  }

  // Support array, number, JSON string, or standard string
  let rawArray = [];
  if (Array.isArray(grades)) {
    rawArray = grades;
  } else if (typeof grades === "number") {
    rawArray = [String(grades)];
  } else if (typeof grades === "string") {
    const trimmed = grades.trim();
    if (trimmed.startsWith("[")) {
      try {
        rawArray = JSON.parse(trimmed);
      } catch {
        rawArray = [trimmed];
      }
    } else {
      rawArray = [trimmed];
    }
  }

  // Split composite tokens (e.g. "9+10", "9 + 10 + 11", "GRADE_9, GRADE_10")
  const splitTokens = [];
  for (const item of rawArray) {
    if (item === null || item === undefined) continue;
    const s = String(item).trim();
    if (s.includes("+")) {
      s.split("+").forEach((t) => splitTokens.push(t.trim()));
    } else if (s.includes(";")) {
      s.split(";").forEach((t) => splitTokens.push(t.trim()));
    } else if (s.includes(",")) {
      s.split(",").forEach((t) => splitTokens.push(t.trim()));
    } else {
      splitTokens.push(s);
    }
  }

  const filteredTokens = splitTokens.filter(Boolean);

  if (filteredTokens.length === 0) {
    return {
      valid: false,
      message: "At least one grade level must be selected (يجب اختيار مرحلة دراسية واحدة على الأقل)",
    };
  }

  const normalized = [];
  for (const item of filteredTokens) {
    const key = normalizeGradeKey(item);
    if (!key) {
      return {
        valid: false,
        message: `Invalid grade level option '${item}'. Allowed options: Grade 9 (الصف التاسع), Grade 10 (العاشر), Grade 11 Science (الحادي عشر علمي), Grade 11 Arts (الحادي عشر ادبي), Tawjihi (التوجيهي)`,
      };
    }
    if (!normalized.includes(key)) {
      normalized.push(key);
    }
  }

  return { valid: true, normalized };
}

/**
 * Parses any grade representation (array, JSON, composite string, numeric) into canonical keys
 */
export function parseGradeKeys(gradeInput) {
  if (!gradeInput) return [];
  const validation = validateGradeLevels(gradeInput);
  return validation.valid ? validation.normalized : [];
}

/**
 * Extracts integer start year from academic year string (e.g., '2019/2020' -> 2019)
 */
export function parseAcademicYearStart(yearStr) {
  if (!yearStr || typeof yearStr !== "string") return null;
  const match = yearStr.trim().match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Chronologically sorts an array of academic year strings (e.g. YYYY/YYYY) in descending order (newest first).
 */
export function sortAcademicYears(yearsArray) {
  if (!Array.isArray(yearsArray)) return [];
  const unique = Array.from(
    new Set(
      yearsArray
        .filter((y) => y !== null && y !== undefined)
        .map((y) => String(y).trim())
        .filter((y) => Boolean(y) && y !== "null" && y !== "undefined")
    )
  );
  return unique.sort((a, b) => {
    const startA = parseAcademicYearStart(a) || 0;
    const startB = parseAcademicYearStart(b) || 0;
    return startB - startA;
  });
}

/**
 * Extracts sorted unique numeric grades from array, JSON, or composite string
 * Returns array of numbers, e.g. [9, 10, 11]
 */
export function extractGradeNumbers(gradeInput) {
  if (!gradeInput) return [];

  let list = [];
  if (Array.isArray(gradeInput)) {
    list = gradeInput;
  } else if (typeof gradeInput === "number") {
    list = [String(gradeInput)];
  } else if (typeof gradeInput === "string") {
    const trimmed = gradeInput.trim();
    if (trimmed.startsWith("[")) {
      try {
        list = JSON.parse(trimmed);
      } catch {
        list = [trimmed];
      }
    } else {
      list = [trimmed];
    }
  }

  const tokens = [];
  for (const item of list) {
    if (item === null || item === undefined) continue;
    const s = String(item).trim();
    if (s.includes("+")) {
      s.split("+").forEach((t) => tokens.push(t.trim()));
    } else if (s.includes(";")) {
      s.split(";").forEach((t) => tokens.push(t.trim()));
    } else if (s.includes(",")) {
      s.split(",").forEach((t) => tokens.push(t.trim()));
    } else {
      tokens.push(s);
    }
  }

  const matched = new Set();
  for (const token of tokens) {
    const key = normalizeGradeKey(token);
    if (key === "GRADE_9") matched.add(9);
    else if (key === "GRADE_10") matched.add(10);
    else if (key === "GRADE_11_SCI" || key === "GRADE_11_LIT") matched.add(11);
    else if (key === "TAWJIHI") matched.add(12);
  }

  return Array.from(matched).sort((a, b) => a - b);
}

/**
 * Calculates all academic years (formatted as YYYY/YYYY) during which a student
 * was active or enrolled based on base academic_year and multi-grade progression.
 */
export function getRecordActiveYears(record) {
  if (!record || !record.academic_year) return [];
  const baseYear = parseAcademicYearStart(record.academic_year);
  if (!baseYear) return [record.academic_year];

  const grades = extractGradeNumbers(record.grade_level);
  const yearsSet = new Set();

  // Always include the recorded academic year
  yearsSet.add(`${baseYear}/${baseYear + 1}`);

  if (grades.length > 1) {
    const gMax = grades[grades.length - 1];

    // Completion-anchored progression (recorded year = year of gMax)
    for (const g of grades) {
      const y = baseYear - (gMax - g);
      yearsSet.add(`${y}/${y + 1}`);
    }
  }

  return Array.from(yearsSet);
}

/**
 * Calculates academic year (YYYY/YYYY) from birth year and selected grade levels.
 * Standard enrollment assumes a child enters Grade 1 at age 6.
 * Academic year start for grade g is: BirthYear + g + 5.
 * If multiple grades are selected (e.g., Grade 9 + 10 + 11), the earliest/oldest grade
 * (e.g., Grade 9) is identified and evaluated as the baseline for the student's entry timeline.
 *
 * Examples:
 *   Born 2004 + Grade 9 -> 2004 + 9 + 5 = 2018 -> '2018/2019'
 *   Born 2004 + Grade 10 -> 2004 + 10 + 5 = 2019 -> '2019/2020'
 *   Born 2004 + [9, 10, 11] -> earliest is Grade 9 -> 2004 + 9 + 5 = 2018 -> '2018/2019'
 *   Born 2004 + [10, 11] -> earliest is Grade 10 -> 2004 + 10 + 5 = 2019 -> '2019/2020'
 */
export function calculateAcademicYearFromBirthYear(birthYear, gradeLevels) {
  if (!birthYear) return null;
  const bYear = typeof birthYear === "number" ? birthYear : parseInt(String(birthYear).trim(), 10);
  if (isNaN(bYear) || bYear < 1950 || bYear > 2030) return null;

  const numbers = extractGradeNumbers(gradeLevels);
  if (numbers.length === 0) return null;

  // Earliest/oldest grade evaluated as baseline for entry timeline
  const earliestGrade = Math.min(...numbers);
  const startYear = bYear + earliestGrade + 5;
  const endYear = startYear + 1;
  return `${startYear}/${endYear}`;
}

/**
 * Sorts student records by request_date (descending newest-first, or ascending oldest-first)
 * @param {Array} records
 * @param {'desc'|'asc'} order
 * @returns {Array} sorted records
 */
export function sortRecordsByDate(records, order = "desc") {
  if (!Array.isArray(records)) return [];
  const isAsc = String(order).toLowerCase() === "asc";
  return [...records].sort((a, b) => {
    const timeA = a && a.request_date ? new Date(a.request_date).getTime() : 0;
    const timeB = b && b.request_date ? new Date(b.request_date).getTime() : 0;
    if (isNaN(timeA) || isNaN(timeB)) {
      const strA = String((a && a.request_date) || "");
      const strB = String((b && b.request_date) || "");
      return isAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    }
    if (timeA === timeB) {
      const idA = (a && a.id) || 0;
      const idB = (b && b.id) || 0;
      return isAsc ? idA - idB : idB - idA;
    }
    return isAsc ? timeA - timeB : timeB - timeA;
  });
}

/**
 * Checks if a student record was active during a specific target academic year
 */
export function isRecordActiveInAcademicYear(record, targetAcademicYear) {
  if (!targetAcademicYear || targetAcademicYear === "ALL" || targetAcademicYear === "جميع الأعوام الدراسية") {
    return true;
  }
  if (!record || !record.academic_year) return false;

  const targetTrimmed = targetAcademicYear.trim();
  const recTrimmed = String(record.academic_year).trim();

  // Exact or substring match
  if (recTrimmed === targetTrimmed || recTrimmed.includes(targetTrimmed) || targetTrimmed.includes(recTrimmed)) {
    return true;
  }

  const targetStart = parseAcademicYearStart(targetTrimmed);
  const recStart = parseAcademicYearStart(recTrimmed);
  if (!targetStart || !recStart) return false;
  if (targetStart === recStart) return true;

  const grades = extractGradeNumbers(record.grade_level);
  if (grades.length === 0) return false;

  const gMax = grades[grades.length - 1];

  // Completion-anchored timeline: recStart is year of gMax
  for (const g of grades) {
    const yearForGrade = recStart - (gMax - g);
    if (yearForGrade === targetStart) return true;
  }

  return false;
}

/**
 * Validates the entire certificate request payload
 */
export function validateCertificateRequest(data) {
  const errors = {};
  const sanitized = {};

  // 1. Student Name (Minimum 3 parts)
  const nameCheck = validateThreePartName(data.student_name);
  if (!nameCheck.valid) {
    errors.student_name = nameCheck.message;
  } else {
    sanitized.student_name = data.student_name.trim();
  }


  // 3. Multi-Select Grade Levels
  const gradeCheck = validateGradeLevels(data.grade_level);
  if (!gradeCheck.valid) {
    errors.grade_level = gradeCheck.message;
  } else {
    sanitized.grade_level = gradeCheck.normalized;
  }

  // 4. Security Number (Optional)
  const secCheck = validateSecurityNumber(data.security_number);
  if (!secCheck.valid) {
    errors.security_number = secCheck.message;
  } else {
    sanitized.security_number = secCheck.cleaned ? secCheck.cleaned.toUpperCase() : null;
  }

  // 5. Academic Year
  const yearCheck = validateAcademicYear(data.academic_year);
  if (!yearCheck.valid) {
    errors.academic_year = yearCheck.message;
  } else {
    sanitized.academic_year = data.academic_year.trim();
  }

  // 6. Request Date
  if (data.request_date) {
    const d = new Date(data.request_date);
    if (isNaN(d.getTime())) {
      errors.request_date = "Invalid date format. Expected YYYY-MM-DD";
    } else {
      sanitized.request_date = data.request_date;
    }
  } else {
    sanitized.request_date = new Date().toISOString().split("T")[0];
  }

  // 7. Status (Canonical Arabic statuses)
  sanitized.status = normalizeStatus(data.status);
  sanitized.notes = data.notes ? String(data.notes).trim() : null;

  // 8. Section (الشعبة) - Optional free text (e.g. "أ", "ب", "ج")
  sanitized.section = data.section && String(data.section).trim() ? String(data.section).trim().slice(0, 50) : null;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: sanitized,
  };
}

export const GRADE_EXPORT_NUMBERS = {
  GRADE_9: "9",
  GRADE_10: "10",
  GRADE_11_SCI: "11",
  GRADE_11_LIT: "11",
  TAWJIHI: "12",
};

/**
 * Transforms grade_level array or string into clean numbers joined with " + "
 * Example mappings:
 *   GRADE_9 or الصف التاسع -> 9
 *   GRADE_10 or العاشر -> 10
 *   GRADE_11_SCI, GRADE_11_LIT, الحادي عشر علمي, الحادي عشر ادبي -> 11
 *   TAWJIHI or التوجيهي -> 12
 * Example: ["GRADE_10", "GRADE_11_SCI"] -> "10 + 11"
 */
export function formatGradeForExport(gradeInput) {
  if (!gradeInput) return "";

  let list = [];
  if (Array.isArray(gradeInput)) {
    list = gradeInput;
  } else if (typeof gradeInput === "string") {
    const trimmed = gradeInput.trim();
    if (trimmed.startsWith("[")) {
      try {
        list = JSON.parse(trimmed);
      } catch {
        list = [trimmed];
      }
    } else if (trimmed.includes(";")) {
      list = trimmed.split(";");
    } else if (trimmed.includes(",")) {
      list = trimmed.split(",");
    } else {
      list = [trimmed];
    }
  }

  const numOrder = ["9", "10", "11", "12"];
  const matchedNumbers = new Set();

  for (const item of list) {
    if (!item) continue;
    const str = String(item).trim();
    const canonicalKey = normalizeGradeKey(str);
    if (canonicalKey && GRADE_EXPORT_NUMBERS[canonicalKey]) {
      matchedNumbers.add(GRADE_EXPORT_NUMBERS[canonicalKey]);
    } else {
      if (str === "9" || str.includes("تاسع")) matchedNumbers.add("9");
      else if (str === "10" || str.includes("عاشر")) matchedNumbers.add("10");
      else if (
        str === "11" ||
        str.includes("حادي عشر") ||
        str.includes("علمي") ||
        str.includes("ادبي") ||
        str.includes("أدبي")
      ) {
        matchedNumbers.add("11");
      } else if (str === "12" || str.includes("توجيهي")) {
        matchedNumbers.add("12");
      }
    }
  }

  // Preserve progression order: 9 -> 10 -> 11 -> 12
  const sorted = numOrder.filter((n) => matchedNumbers.has(n));
  return sorted.join(" + ");
}

/**
 * Formats request date cleanly as DD/MM/YYYY (e.g., 26/7/2026)
 */
export function formatDateForExport(dateStr) {
  if (!dateStr) return "";

  const trimmed = String(dateStr).trim().split("T")[0];
  // If already matching D/M/YYYY or DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Parse YYYY-MM-DD
  const parts = trimmed.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return `${day}/${month}/${year}`;
    }
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  return dateStr;
}

/**
 * Extracts strictly numerical YYYY-MM month key from request date string or Date object
 * @param {string|Date} dateStr
 * @returns {string|null} e.g. '2026-09' or null
 */
export function extractMonthKey(dateStr) {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  const str = String(dateStr).trim().split("T")[0];

  // Pattern: YYYY-MM or YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, "0");
    return `${y}-${m}`;
  }

  // Pattern: D/M/YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^\d{1,2}\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const m = dmyMatch[1].padStart(2, "0");
    const y = dmyMatch[2];
    return `${y}-${m}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  return null;
}

/**
 * Sorts unique array of numerical months (YYYY-MM) chronologically
 * @param {Array<string>} monthsArray
 * @param {'desc'|'asc'} order Default is 'desc' (newest first)
 * @returns {Array<string>} Sorted array of unique months
 */
export function sortMonthsChronologically(monthsArray, order = "desc") {
  if (!Array.isArray(monthsArray)) return [];
  const isAsc = String(order).toLowerCase() === "asc";

  const unique = Array.from(
    new Set(
      monthsArray
        .filter((m) => m !== null && m !== undefined)
        .map((m) => String(m).trim())
        .filter((m) => /^\d{4}-\d{2}$/.test(m))
    )
  );

  return unique.sort((a, b) => {
    return isAsc ? a.localeCompare(b) : b.localeCompare(a);
  });
}

/**
 * Groups records by numerical month (YYYY-MM) in chronological order
 * @param {Array} records
 * @param {'desc'|'asc'} order
 * @returns {Array<{month: string, count: number, records: Array}>}
 */
export function groupRecordsByMonth(records, order = "desc") {
  if (!Array.isArray(records) || records.length === 0) return [];
  const sorted = sortRecordsByDate(records, order);
  const groupsMap = new Map();

  for (const rec of sorted) {
    const monthKey = extractMonthKey(rec && rec.request_date) || "OTHER";
    if (!groupsMap.has(monthKey)) {
      groupsMap.set(monthKey, []);
    }
    groupsMap.get(monthKey).push(rec);
  }

  const result = [];
  for (const [month, groupRecs] of groupsMap.entries()) {
    result.push({
      month,
      count: groupRecs.length,
      records: groupRecs,
    });
  }

  return result;
}

/**
 * Filters records strictly by Month and Year (YYYY-MM) or numerical month number (MM)
 * @param {Array} records
 * @param {string} monthFilter e.g. '2026-09', '09', 'ALL'
 * @returns {Array} Filtered records
 */
export function filterRecordsByMonth(records, monthFilter) {
  if (!Array.isArray(records)) return [];
  if (
    !monthFilter ||
    monthFilter === "ALL" ||
    monthFilter === "جميع الأشهر" ||
    monthFilter === "All Months"
  ) {
    return records;
  }

  const filterTrimmed = String(monthFilter).trim();

  // Exact YYYY-MM match (e.g. 2026-09)
  if (/^\d{4}-\d{2}$/.test(filterTrimmed)) {
    return records.filter((r) => extractMonthKey(r && r.request_date) === filterTrimmed);
  }

  // Single or double digit month (e.g. '09' or '9')
  const numMonth = parseInt(filterTrimmed, 10);
  if (!isNaN(numMonth) && numMonth >= 1 && numMonth <= 12) {
    const padded = String(numMonth).padStart(2, "0");
    return records.filter((r) => {
      const k = extractMonthKey(r && r.request_date);
      return k && k.endsWith(`-${padded}`);
    });
  }

  return records;
}


