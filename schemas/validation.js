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
 * Normalizes a grade input string or key into a canonical key
 */
export function normalizeGradeKey(val) {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();

  // Match canonical key
  if (VALID_GRADE_KEYS.includes(trimmed)) return trimmed;

  // Match Arabic or English names
  const lower = trimmed.toLowerCase();
  for (const grade of PREDEFINED_GRADES) {
    if (
      grade.key.toLowerCase() === lower ||
      grade.en.toLowerCase() === lower ||
      grade.ar === trimmed ||
      trimmed.includes(grade.ar) ||
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
];

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
 * Validates multi-select grade levels array
 * @param {Array|string} grades
 * @returns {{ valid: boolean, message?: string, normalized?: string[] }}
 */
export function validateGradeLevels(grades) {
  if (!grades) {
    return {
      valid: false,
      message: "At least one grade level must be selected (يجب اختيار مرحلة دراسية واحدة على الأقل)",
    };
  }

  // Support single string or array
  const rawArray = Array.isArray(grades)
    ? grades
    : typeof grades === "string"
    ? grades.startsWith("[")
      ? JSON.parse(grades)
      : [grades]
    : [];

  if (rawArray.length === 0) {
    return {
      valid: false,
      message: "At least one grade level must be selected (يجب اختيار مرحلة دراسية واحدة على الأقل)",
    };
  }

  const normalized = [];
  for (const item of rawArray) {
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

  // 7. Status (Strictly the 3 new Arabic statuses)
  sanitized.status = VALID_STATUSES.includes(data.status) ? data.status : "انتظار";
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

