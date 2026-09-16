/**
 * Student Gateway - Certificate Attestations Frontend Controller
 * Dedicated exclusively to: مدرسة مخيم الزعتري الأساسية الثانية للبنين
 * Single-School Architecture (School Name removed from Table, Form & Metrics)
 */

const HARDCODED_SCHOOL_NAME = "مدرسة مخيم الزعتري الأساسية الثانية للبنين";

// ==========================================
// Translation Dictionary (i18n)
// ==========================================
const i18n = {
  en: {
    appTitle: "Student Gateway",
    appTag: "تصاديق الشهادات",
    appSubtitle: "Zaatari Camp Second Basic School for Boys",
    langToggleText: "عربي",
    btnExportCsv: "Export CSV",
    exportCsv: "Export to Excel CSV",
    btnNewRequest: "New Attestation Request",

    // Stats (3 cards + 2 chips)
    statTotalLabel: "Total Attestations",
    statTotalFootnote: "Registered requests",
    statWaitingLabel: "Waiting",
    statWaitingFootnote: "Awaiting certificate writing",
    statWrittenLabel: "Certificate Written",
    statWrittenFootnote: "Certificate prepared",
    statSubmittedLabel: "Submitted for Attestation",
    statSubmittedFootnote: "Submitted for approval",
    metricsArchivedTitle: "Final Attestation & Completion:",
    statCertifiedLabel: "Certified",
    statSelfCertifiedLabel: "Personal Attestation",

    // Search & Filters
    searchPlaceholder: "Instant search by Security # or Student Name...",
    clearSearch: "Clear search",
    filterAllStatus: "All Statuses",
    filterAllYears: "All Academic Years",
    filterAllGrades: "All Grade Levels",

    // Grade Level Options
    grade9: "Grade 9",
    grade10: "Grade 10",
    grade11Sci: "Grade 11 Science",
    grade11Lit: "Grade 11 Arts",
    tawjihi: "Tawjihi",
    multiSelectNote: "(Select one or more)",
    gradesSelectedCount: "{count} selected",

    // Table Headers (7 columns - School Name removed)
    thSecNum: "Security Number",
    thStudentName: "Student Full Name (الاسم الثلاثي)",
    thGradeLevel: "Grade Levels",
    thAcademicYear: "Academic Year",
    thRequestDate: "Request Date",
    thStatus: "Status",
    thActions: "Actions",
    tableScrollHint: "⟷ Swipe horizontally to view full details",

    // Status Options & Badges
    optWaiting: "Waiting (انتظار)",
    optWritten: "Certificate Written (تمت كتابة الشهادة)",
    optSubmitted: "Submitted for Attestation (تم الرفع للتصديق)",
    optSelfCertified: "Personal Attestation (تصديق شخصي)",
    optCertified: "Attestation Completed (تم التصديق)",
    statusWaiting: "Waiting",
    statusWritten: "Certificate Written",
    statusSubmitted: "Submitted for Attestation",
    statusSelfCertified: "Personal Attestation",
    statusCertified: "Attestation Completed",

    // Table Empty State
    emptyTitle: "No attestation records found",
    emptySubtitle: "Try modifying your search or filters.",

    // Action Tooltips
    tooltipView: "View Attestation Slip",
    tooltipEdit: "Edit Attestation Record",
    tooltipMarkWaiting: "Set Status: Waiting (انتظار)",
    tooltipMarkWritten: "Set Status: Certificate Written (تمت كتابة الشهادة)",
    tooltipMarkSubmitted: "Set Status: Submitted for Attestation (تم الرفع للتصديق)",
    tooltipDelete: "Delete Record",
    tooltipCopy: "Copy Security Number",
    copied: "Copied to clipboard!",

    // Pagination
    showingInfo: "Showing {start} to {end} of {total} records",
    showingAllInfo: "Showing all {total} records",
    btnPrev: "Previous",
    btnNext: "Next",
    lblPageSize: "Rows per page:",
    optAllRows: "All",

    // Form Modal (No School Name)
    modalTitle: "New Certificate Attestation Request",
    modalTitleEdit: "Edit Certificate Attestation Request",
    modalSubtitle: "Zaatari Camp Second Basic School for Boys",
    lblStudentName: "Student Full Name (3-part name)",
    placeholderStudentName: "e.g. أحمد محمد عبد الله",
    hintStudentName: "Must contain at least 3 parts: First, Father, Family name (يجب أن يتضمن الاسم 3 مقاطع على الأقل)",
    wordCountText: "Words: {count}/3",
    lblGradeLevel: "Grade Levels",
    lblSection: "Section (Optional)",
    placeholderSection: "e.g. A, B, or C",
    hintSection: "Classroom section (e.g. A, B, C)",
    lblBirthYear: "Birth Year (Optional)",
    placeholderBirthYear: "e.g. 2004",
    hintBirthYear: "Auto-calculates academic year based on grade level",
    lblSecNum: "Security Number (Optional)",
    placeholderSecNum: "e.g. SEC-2025-00107 (Optional)",
    btnGenerate: "Generate",
    hintSecNum: "Unique barcode or security serial code (optional)",
    lblAcademicYear: "Academic Year",
    hintAcademicYear: "Format: YYYY/YYYY (e.g. 2025/2026)",
    lblRequestDate: "Request Date",
    lblStatus: "Initial Status",
    lblNotes: "Administrative Notes",
    placeholderNotes: "Optional internal attestation notes or document references...",
    btnCancel: "Cancel",
    btnSaveRecord: "Save Attestation Record",
    btnUpdateRecord: "Update Attestation Record",
    saving: "Saving...",

    // Slip Modal
    slipTitle: "Certificate Attestation Slip",
    slipSubtitle: "Zaatari Camp Second Basic School for Boys",
    slipDocHeader: "Official Certificate Attestation Document",
    slipDocSub: "Zaatari Camp Second Basic School for Boys",
    slipStudentName: "Student Full Name (الاسم الثلاثي)",
    slipSecNum: "Security Attestation # (الرقم الأمني)",
    slipSchool: "School Name (المدرسة)",
    slipGrade: "Grade Levels (المراحل الدراسية)",
    slipSection: "Class Section (الشعبة)",
    slipYear: "Academic Year (العام الدراسي)",
    slipStatus: "Attestation Status (حالة التصديق)",
    slipRemarks: "Remarks:",
    btnClose: "Close",
    btnPrintSlip: "Print Attestation Slip",

    // Notifications & Messages
    errName3Parts: "Student name must contain at least 3 parts (الاسم الثلاثي). Currently entered: {count} word(s).",
    errGradeReq: "At least one grade level must be selected (يجب اختيار مرحلة دراسية واحدة على الأقل)",
    errYearFormat: "Academic year must be formatted as YYYY/YYYY (e.g. 2025/2026)",
    msgCreated: "Certificate attestation request recorded successfully!",
    msgUpdated: "Certificate attestation request updated successfully!",
    msgStatusUpdated: "Attestation status updated to {status}",
    msgDeleted: "Attestation record deleted successfully",
    confirmDelete: "Are you sure you want to delete this attestation record?",
    confirmDeleteNamed: "Are you sure you want to permanently delete the attestation record for '{name}'? This action cannot be undone.",
    exportDownloading: "Downloading CSV export...",
  },

  ar: {
    appTitle: "بوابة تصاديق الطلاب",
    appTag: "تصاديق الشهادات",
    appSubtitle: "مدرسة مخيم الزعتري الأساسية الثانية للبنين",
    langToggleText: "English",
    btnExportCsv: "تصدير كشف إكسل",
    exportCsv: "تصدير كشف إكسل (CSV)",
    btnNewRequest: "إدخال طلب تصديق جديد",

    // Stats (3 cards + 2 chips)
    statTotalLabel: "إجمالي التصاديق",
    statTotalFootnote: "طلبات مسجلة بالنظام",
    statWaitingLabel: "انتظار",
    statWaitingFootnote: "قيد الانتظار والمعالجة",
    statWrittenLabel: "تمت كتابة الشهادة",
    statWrittenFootnote: "جاهزة ومكتوبة بالكامل",
    statSubmittedLabel: "تم الرفع للتصديق",
    statSubmittedFootnote: "مرفوعة للاعتماد والتصديق",
    metricsArchivedTitle: "مؤشرات الإنجاز والتصديق النهائي:",
    statCertifiedLabel: "تم التصديق",
    statSelfCertifiedLabel: "تصديق شخصي",

    // Search & Filters
    searchPlaceholder: "بحث فوري بالرقم الأمني أو اسم الطالب...",
    clearSearch: "مسح البحث",
    filterAllStatus: "جميع الحالات",
    filterAllYears: "جميع الأعوام الدراسية",
    filterAllGrades: "جميع المراحل الدراسية",

    // Grade Level Options
    grade9: "الصف التاسع",
    grade10: "العاشر",
    grade11Sci: "الحادي عشر علمي",
    grade11Lit: "الحادي عشر ادبي",
    tawjihi: "التوجيهي",
    multiSelectNote: "(اختر مرحلة واحدة أو أكثر)",
    gradesSelectedCount: "تم اختيار {count}",

    // Table Headers (7 columns - School Name removed)
    thSecNum: "الرقم الأمني",
    thStudentName: "الاسم الثلاثي الكامل للطالب",
    thGradeLevel: "المراحل الدراسية",
    thAcademicYear: "العام الدراسي",
    thRequestDate: "تاريخ الطلب",
    thStatus: "الحالة",
    thActions: "الإجراءات",
    tableScrollHint: "⟷ مرر أفقياً لعرض باقي الأعمدة والتفاصيل",

    // Status Options & Badges
    optWaiting: "انتظار",
    optWritten: "تمت كتابة الشهادة",
    optSubmitted: "تم الرفع للتصديق",
    optSelfCertified: "تصديق شخصي",
    optCertified: "تم التصديق",
    statusWaiting: "انتظار",
    statusWritten: "تمت كتابة الشهادة",
    statusSubmitted: "تم الرفع للتصديق",
    statusSelfCertified: "تصديق شخصي",
    statusCertified: "تم التصديق",

    // Table Empty State
    emptyTitle: "لم يتم العثور على أي سجلات تصديق",
    emptySubtitle: "يرجى تعديل معايير البحث أو خيارات التصفية.",

    // Action Tooltips
    tooltipView: "عرض وثيقة التصديق",
    tooltipEdit: "تعديل بيانات طلب التصديق",
    tooltipMarkWaiting: "تحديد الحالة: انتظار",
    tooltipMarkWritten: "تحديد الحالة: تمت كتابة الشهادة",
    tooltipMarkSubmitted: "تحديد الحالة: تم الرفع للتصديق",
    tooltipDelete: "حذف السجل",
    tooltipCopy: "نسخ الرقم الأمني",
    copied: "تم نسخ الرقم الأمني إلى الحافظة!",

    // Pagination
    showingInfo: "عرض {start} إلى {end} من أصل {total} سجل",
    showingAllInfo: "عرض جميع السجلات ({total} سجل)",
    btnPrev: "السابق",
    btnNext: "التالي",
    lblPageSize: "عدد الصفوف:",
    optAllRows: "الكل",

    // Form Modal (No School Name)
    modalTitle: "إدخال طلب تصديق شهادة دراسية جديد",
    modalTitleEdit: "تعديل طلب تصديق شهادة دراسية",
    modalSubtitle: "مدرسة مخيم الزعتري الأساسية الثانية للبنين",
    lblStudentName: "اسم الطالب (ثلاثي على الأقل)",
    placeholderStudentName: "مثال: أحمد محمد عبد الله",
    hintStudentName: "يجب أن يتضمن الاسم 3 مقاطع على الأقل: الاسم الأول، اسم الأب، اسم العائلة",
    wordCountText: "الكلمات: {count}/3",
    lblGradeLevel: "المراحل الدراسية",
    lblSection: "الشعبة (اختياري)",
    placeholderSection: "مثال: أ أو ب أو ج",
    hintSection: "الشعبة الصفية (مثال: أ، ب، ج)",
    lblBirthYear: "سنة المواليد (اختياري)",
    placeholderBirthYear: "مثال: 2004",
    hintBirthYear: "حساب تلقائي للعام الدراسي بحسب المرحلة الدراسية",
    lblSecNum: "الرقم الأمني (اختياري)",
    placeholderSecNum: "مثال: SEC-2025-00107 (اختياري)",
    btnGenerate: "توليد تلقائي",
    hintSecNum: "رمز باركود أو رقم تسلسلي أمني فريد (اختياري)",
    lblAcademicYear: "العام الدراسي",
    hintAcademicYear: "الصيغة: YYYY/YYYY (مثال: 2025/2026)",
    lblRequestDate: "تاريخ الطلب",
    lblStatus: "حالة الطلب",
    lblNotes: "ملاحظات إدارية",
    placeholderNotes: "ملاحظات تدقيق داخلية أو أرقام الصادر والوارد...",
    btnCancel: "إلغاء",
    btnSaveRecord: "حفظ طلب التصديق",
    btnUpdateRecord: "حفظ التعديلات",
    saving: "جاري الحفظ...",

    // Slip Modal
    slipTitle: "كشف تصديق شهادة دراسية",
    slipSubtitle: "مدرسة مخيم الزعتري الأساسية الثانية للبنين",
    slipDocHeader: "وثيقة تصديق ومصادقة شهادة رسمية",
    slipDocSub: "مدرسة مخيم الزعتري الأساسية الثانية للبنين",
    slipStudentName: "الاسم الثلاثي الكامل للطالب",
    slipSecNum: "الرقم الأمني المعتمد",
    slipSchool: "المدرسة (معتمد تلقائياً)",
    slipGrade: "المراحل الدراسية المعتمدة",
    slipSection: "الشعبة الصفية",
    slipYear: "العام الدراسي",
    slipStatus: "حالة التصديق",
    slipRemarks: "ملاحظات إدارية:",
    btnClose: "إغلاق",
    btnPrintSlip: "طباعة كشف التصديق",

    // Notifications & Messages
    errName3Parts: "يجب أن يتضمن اسم الطالب 3 مقاطع على الأقل (الاسم الثلاثي). تم إدخال: {count} كلمة.",
    errGradeReq: "يجب اختيار مرحلة دراسية واحدة على الأقل",
    errYearFormat: "العام الدراسي يجب أن يكون بصيغة YYYY/YYYY (مثال: 2025/2026)",
    msgCreated: "تم تسجيل طلب تصديق الشهادة بنجاح!",
    msgUpdated: "تم تحديث بيانات طلب التصديق بنجاح!",
    msgStatusUpdated: "تم تحديث حالة التصديق إلى {status}",
    msgDeleted: "تم حذف سجل التصديق بنجاح",
    confirmDelete: "هل أنت متأكد من رغبتك في حذف هذا السجل؟",
    confirmDeleteNamed: "هل أنت متأكد من رغبتك في حذف سجل الطالب '{name}'؟ لا يمكن التراجع عن هذا الإجراء.",
    exportDownloading: "جاري تنزيل ملف الإكسل (CSV)...",
  },
};

// Load persisted page size preference (defaults to "10")
const savedPageSize =
  sessionStorage.getItem("student_gateway_page_size") ||
  localStorage.getItem("student_gateway_page_size") ||
  "10";

// ==========================================
// Application State
// ==========================================
const state = {
  lang: localStorage.getItem("student_gateway_lang") || "ar",
  search: "",
  status: "ALL",
  academic_year: "ALL",
  grade: "ALL",
  page: 1,
  pageSize: savedPageSize,
  limit: savedPageSize === "ALL" ? 50000 : (parseInt(savedPageSize, 10) || 10),
  totalPages: 1,
  totalRecords: 0,
  records: [],
  debounceTimer: null,
  selectedGrades: new Set(),
  editingId: null,
};

// Grade Definitions & Mapping
const GRADE_MAP = {
  GRADE_9: { en: "Grade 9", ar: "الصف التاسع", cls: "grade-tag-9" },
  GRADE_10: { en: "Grade 10", ar: "العاشر", cls: "grade-tag-10" },
  GRADE_11_SCI: { en: "Grade 11 Science", ar: "الحادي عشر علمي", cls: "grade-tag-sci" },
  GRADE_11_LIT: { en: "Grade 11 Arts", ar: "الحادي عشر ادبي", cls: "grade-tag-lit" },
  TAWJIHI: { en: "Tawjihi", ar: "التوجيهي", cls: "grade-tag-tawjihi" },
};

// DOM Elements
const DOM = {
  // Lang Toggle
  btnLangToggle: document.getElementById("btnLangToggle"),
  langToggleText: document.getElementById("langToggleText"),

  // Stats (3 primary cards + 2 secondary chips)
  statTotal: document.getElementById("statTotal"),
  statWaiting: document.getElementById("statWaiting"),
  statWritten: document.getElementById("statWritten"),
  statSubmitted: document.getElementById("statSubmitted"),
  statCertified: document.getElementById("statCertified"),
  statSelfCertified: document.getElementById("statSelfCertified"),

  // Search & Filters
  searchInput: document.getElementById("instantSearchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  statusFilter: document.getElementById("statusFilter"),
  gradeFilter: document.getElementById("gradeFilter"),
  yearFilter: document.getElementById("yearFilter"),

  // Table & Pagination
  tableBody: document.getElementById("tableBody"),
  paginationInfo: document.getElementById("paginationInfo"),
  pageNumbers: document.getElementById("pageNumbers"),
  btnPrevPage: document.getElementById("btnPrevPage"),
  btnNextPage: document.getElementById("btnNextPage"),
  pageSizeSelect: document.getElementById("pageSizeSelect"),
  paginationButtons: document.getElementById("paginationButtons"),

  // Modals
  requestModal: document.getElementById("requestModal"),
  btnOpenModal: document.getElementById("btnOpenModal"),
  btnCloseModal: document.getElementById("btnCloseModal"),
  btnCancelModal: document.getElementById("btnCancelModal"),
  certificateForm: document.getElementById("certificateForm"),

  // Form Fields (No School Name field)
  studentNameInput: document.getElementById("studentNameInput"),
  nameCountBadge: document.getElementById("nameCountBadge"),
  gradeMultiSelectContainer: document.getElementById("gradeMultiSelectContainer"),
  gradesSelectedBadge: document.getElementById("gradesSelectedBadge"),
  securityNumberInput: document.getElementById("securityNumberInput"),
  btnGenSecNum: document.getElementById("btnGenSecNum"),
  birthYearInput: document.getElementById("birthYearInput"),
  academicYearInput: document.getElementById("academicYearInput"),
  sectionInput: document.getElementById("sectionInput"),
  requestDateInput: document.getElementById("requestDateInput"),
  statusInput: document.getElementById("statusInput"),
  notesInput: document.getElementById("notesInput"),

  // Attestation Slip Modal
  slipModal: document.getElementById("slipModal"),
  slipContent: document.getElementById("slipContent"),
  btnCloseSlip: document.getElementById("btnCloseSlip"),
  btnCloseSlipBtn: document.getElementById("btnCloseSlipBtn"),

  // Export
  btnExportCsv: document.getElementById("btnExportCsv"),
  toastContainer: document.getElementById("toastContainer"),
};

// Translation Helper
function t(key, params = {}) {
  const langObj = i18n[state.lang] || i18n.ar;
  let text = langObj[key] || i18n.ar[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return text;
}

// Aggressive UI Optimization: Debounce Utility (default 300ms) with flush & cancel
function debounce(fn, delay = 300) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  const debounced = function (...args) {
    lastArgs = args;
    lastThis = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, delay);
  };

  debounced.flush = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      fn.apply(lastThis, lastArgs);
    }
  };

  debounced.cancel = function () {
    clearTimeout(timer);
    timer = null;
  };

  return debounced;
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  setLanguage(state.lang);
  DOM.requestDateInput.value = new Date().toISOString().split("T")[0];

  bindEventListeners();
  fetchDashboardMetrics();
  loadCertificates();
});

// ==========================================
// Language (i18n) & RTL Management
// ==========================================
function setLanguage(newLang) {
  state.lang = newLang;
  localStorage.setItem("student_gateway_lang", newLang);

  const isRtl = newLang === "ar";
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = newLang;

  // Toggle button text
  if (DOM.langToggleText) {
    DOM.langToggleText.textContent = t("langToggleText");
  }

  // Update all [data-i18n]
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  // Update all [data-i18n-placeholder]
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.placeholder = t(key);
    }
  });

  // Update all [data-i18n-title]
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) {
      el.title = t(key);
    }
  });

  // Update multi-select pill labels
  updateMultiSelectLabels();

  // Re-render table and pagination with localized text & grade badges
  if (state.records.length > 0) {
    renderTable(state.records);
    renderPagination({
      page: state.page,
      limit: state.limit,
      total: state.totalRecords,
      totalPages: state.totalPages,
    });
  }

  updateWordCounter();
  updateGradesSelectedBadge();
}

function toggleLanguage() {
  const nextLang = state.lang === "en" ? "ar" : "en";
  setLanguage(nextLang);
}

function updateMultiSelectLabels() {
  document.querySelectorAll(".grade-pill-item").forEach((item) => {
    const val = item.getAttribute("data-grade");
    const textEl = item.querySelector(".pill-text");
    if (textEl && GRADE_MAP[val]) {
      textEl.textContent = state.lang === "ar" ? GRADE_MAP[val].ar : GRADE_MAP[val].en;
    }
  });
}

// ==========================================
// Event Listeners
// ==========================================
function bindEventListeners() {
  // Language Toggle
  DOM.btnLangToggle.addEventListener("click", toggleLanguage);

  // Instant Search with 300ms Debounce
  DOM.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    DOM.clearSearchBtn.style.display = state.search ? "block" : "none";
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      state.page = 1;
      loadCertificates();
    }, 300);
  });

  // Clear search button
  DOM.clearSearchBtn.addEventListener("click", () => {
    DOM.searchInput.value = "";
    state.search = "";
    DOM.clearSearchBtn.style.display = "none";
    state.page = 1;
    loadCertificates();
  });

  // Status Filter
  DOM.statusFilter.addEventListener("change", (e) => {
    state.status = e.target.value;
    state.page = 1;
    loadCertificates();
  });

  // Grade Filter
  DOM.gradeFilter.addEventListener("change", (e) => {
    state.grade = e.target.value;
    state.page = 1;
    loadCertificates();
  });

  // Academic Year Filter
  DOM.yearFilter.addEventListener("change", (e) => {
    state.academic_year = e.target.value;
    state.page = 1;
    loadCertificates();
  });

  // Pagination navigation
  DOM.btnPrevPage.addEventListener("click", () => {
    if (state.page > 1) {
      state.page--;
      loadCertificates();
    }
  });

  DOM.btnNextPage.addEventListener("click", () => {
    if (state.page < state.totalPages) {
      state.page++;
      loadCertificates();
    }
  });

  // Page Size Selector with session persistence
  if (DOM.pageSizeSelect) {
    DOM.pageSizeSelect.value = state.pageSize;
    DOM.pageSizeSelect.addEventListener("change", (e) => {
      const selectedSize = e.target.value;
      state.pageSize = selectedSize;
      state.limit = selectedSize === "ALL" ? 50000 : (parseInt(selectedSize, 10) || 10);
      sessionStorage.setItem("student_gateway_page_size", selectedSize);
      localStorage.setItem("student_gateway_page_size", selectedSize);
      state.page = 1;
      loadCertificates();
    });
  }

  // Open & Close Form Modal
  DOM.btnOpenModal.addEventListener("click", openRequestModal);
  DOM.btnCloseModal.addEventListener("click", closeRequestModal);
  DOM.btnCancelModal.addEventListener("click", closeRequestModal);

  // Close slip modal
  DOM.btnCloseSlip.addEventListener("click", () => {
    DOM.slipModal.style.display = "none";
  });
  DOM.btnCloseSlipBtn.addEventListener("click", () => {
    DOM.slipModal.style.display = "none";
  });

  // Auto-generate Security Number
  DOM.btnGenSecNum.addEventListener("click", () => {
    const randomSerial = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear();
    DOM.securityNumberInput.value = `SEC-${year}-${randomSerial}`;
    formState.security_number = DOM.securityNumberInput.value;
    clearFieldError("security_number");
  });

  // Aggressive UI Optimization: 300ms Debounced Listeners on ALL Form Text Inputs
  // 1. Student Name Input (300ms debounce)
  DOM.studentNameInput.addEventListener("input", debouncedNameInput);
  DOM.studentNameInput.addEventListener("blur", () => debouncedNameInput.flush());

  // 2. Security Number Input (300ms debounce)
  DOM.securityNumberInput.addEventListener("input", debouncedSecNumInput);
  DOM.securityNumberInput.addEventListener("blur", () => debouncedSecNumInput.flush());

  // 3. Birth Year Input (Numeric filtering + auto-calculates Academic Year)
  if (DOM.birthYearInput) {
    DOM.birthYearInput.addEventListener("input", (e) => {
      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (e.target.value !== val) {
        e.target.value = val;
      }
      formState.birth_year = val;
      if (val.length === 4) {
        triggerAutoAcademicYearCalc();
      }
    });
  }

  // 4. Academic Year Input (Instant Auto-Masking YYYY/YYYY + 300ms debounced validation)
  DOM.academicYearInput.addEventListener("input", (e) => {
    handleAcademicYearMask(e);
    debouncedAcademicYearInput();
  });
  DOM.academicYearInput.addEventListener("blur", () => debouncedAcademicYearInput.flush());

  // 5. Section Input (300ms debounce)
  if (DOM.sectionInput) {
    DOM.sectionInput.addEventListener("input", debouncedSectionInput);
    DOM.sectionInput.addEventListener("blur", () => debouncedSectionInput.flush());
  }

  // 6. Notes Textarea (300ms debounce)
  if (DOM.notesInput) {
    DOM.notesInput.addEventListener("input", debouncedNotesInput);
    DOM.notesInput.addEventListener("blur", () => debouncedNotesInput.flush());
  }

  // Multi-Select Grade Levels Interactive Checkboxes (Event Delegation for peak UI performance)
  if (DOM.gradeMultiSelectContainer) {
    DOM.gradeMultiSelectContainer.addEventListener("click", (e) => {
      const pill = e.target.closest(".grade-pill-item");
      if (!pill) return;
      e.preventDefault();

      const grade = pill.getAttribute("data-grade");
      if (!grade) return;
      const checkbox = pill.querySelector('input[type="checkbox"]');

      if (state.selectedGrades.has(grade)) {
        state.selectedGrades.delete(grade);
        pill.classList.remove("active");
        if (checkbox) checkbox.checked = false;
      } else {
        state.selectedGrades.add(grade);
        pill.classList.add("active");
        if (checkbox) checkbox.checked = true;
      }

      updateGradesSelectedBadge();
      clearFieldError("grade_level");
      triggerAutoAcademicYearCalc();
    });
  }

  // Form Submission
  DOM.certificateForm.addEventListener("submit", handleFormSubmit);

  // Dynamic Export CSV based on currently selected Status filter
  if (DOM.btnExportCsv) {
    DOM.btnExportCsv.addEventListener("click", triggerDynamicCsvExport);
  }
}

/**
 * Dynamic CSV Export handler - strictly reads current value from status filter dropdown
 */
function triggerDynamicCsvExport() {
  const filterDropdown = DOM.statusFilter || document.getElementById("statusFilter");
  const selectedStatus = filterDropdown && filterDropdown.value ? filterDropdown.value.trim() : "ALL";

  let exportUrl = "/api/certificates/export";
  if (
    selectedStatus &&
    selectedStatus !== "ALL" &&
    selectedStatus !== "جميع الحالات"
  ) {
    exportUrl += `?status=${encodeURIComponent(selectedStatus)}`;
  }

  console.log(`[Export CSV] Selected Status: "${selectedStatus}" -> Download URL: ${exportUrl}`);
  window.location.href = exportUrl;
  if (typeof showToast === "function") {
    showToast(t("exportDownloading"), "success");
  }
}
window.triggerDynamicCsvExport = triggerDynamicCsvExport;

// ==========================================
// Form State & Aggressive Input Debouncing (300ms)
// ==========================================
const formState = {
  student_name: "",
  security_number: "",
  birth_year: "",
  academic_year: "",
  section: "",
  request_date: "",
  status: "انتظار",
  notes: "",
};

let lastRenderedWordCount = -1;

function updateWordCounter() {
  const text = DOM.studentNameInput.value.trim();
  formState.student_name = text;
  const parts = text.split(/\s+/).filter(Boolean);
  const count = parts.length;

  // Avoid DOM thrashing if word count hasn't changed
  if (count === lastRenderedWordCount) {
    return;
  }
  lastRenderedWordCount = count;

  if (count >= 3) {
    DOM.nameCountBadge.textContent = `✓ ${t("wordCountText", { count })}`;
    DOM.nameCountBadge.className = "word-counter-badge count-success";
    clearFieldError("student_name");
  } else {
    DOM.nameCountBadge.textContent = t("wordCountText", { count });
    DOM.nameCountBadge.className = "word-counter-badge count-warn";
  }
}

// 300ms Debounced Input Handlers for all Form Inputs
const debouncedNameInput = debounce(() => {
  updateWordCounter();
}, 300);

const debouncedSecNumInput = debounce(() => {
  formState.security_number = DOM.securityNumberInput.value.trim();
  clearFieldError("security_number");
}, 300);

/**
 * Auto-Formatting / Input Masking for Academic Year:
 * Automatically inserts a slash '/' after the first 4 consecutive digits (e.g. "2025" -> "2025/"),
 * restricts input to digits and a single slash, max 9 characters (YYYY/YYYY),
 * and handles backspaces without re-insert loops.
 */
function handleAcademicYearMask(e) {
  const input = e.target;
  let val = input.value;

  // Extract up to 8 digits
  const digits = val.replace(/\D/g, "").slice(0, 8);

  let formatted = "";
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 4)}/${digits.slice(4, 8)}`;
  } else if (digits.length === 4) {
    // If the user just pressed backspace and deleted the slash, don't re-insert it immediately
    if (e.inputType === "deleteContentBackward" && !val.includes("/")) {
      formatted = digits;
    } else {
      formatted = `${digits}/`;
    }
  } else {
    formatted = digits;
  }

  if (input.value !== formatted) {
    input.value = formatted;
  }
  formState.academic_year = formatted;
}

const debouncedAcademicYearInput = debounce(() => {
  formState.academic_year = DOM.academicYearInput.value.trim();
  if (/^\d{4}\/\d{4}$/.test(formState.academic_year)) {
    clearFieldError("academic_year");
  }
}, 300);

const debouncedSectionInput = debounce(() => {
  if (DOM.sectionInput) {
    formState.section = DOM.sectionInput.value.trim();
  }
  clearFieldError("section");
}, 300);

const debouncedNotesInput = debounce(() => {
  if (DOM.notesInput) {
    formState.notes = DOM.notesInput.value.trim();
  }
}, 300);

function flushAllFormDebouncers() {
  debouncedNameInput.flush();
  debouncedSecNumInput.flush();
  debouncedAcademicYearInput.flush();
  debouncedSectionInput.flush();
  debouncedNotesInput.flush();
}

function cancelAllFormDebouncers() {
  debouncedNameInput.cancel();
  debouncedSecNumInput.cancel();
  debouncedAcademicYearInput.cancel();
  debouncedSectionInput.cancel();
  debouncedNotesInput.cancel();
}

function updateGradesSelectedBadge() {
  const count = state.selectedGrades.size;
  DOM.gradesSelectedBadge.textContent = t("gradesSelectedCount", { count });
  if (count > 0) {
    DOM.gradesSelectedBadge.classList.add("badge-active");
    DOM.gradesSelectedBadge.classList.remove("badge-empty");
  } else {
    DOM.gradesSelectedBadge.classList.remove("badge-active");
    DOM.gradesSelectedBadge.classList.add("badge-empty");
  }
}

// ==========================================
// Grade & Academic Year Helpers
// ==========================================

function normalizeGradeKeyClient(val) {
  if (!val) return null;
  const s = String(val).trim();
  const lower = s.toLowerCase();

  if (
    s === "GRADE_9" ||
    s === "9" ||
    lower === "grade 9" ||
    s === "الصف التاسع" ||
    s.includes("تاسع") ||
    lower.includes("grade 9")
  ) {
    return "GRADE_9";
  }
  if (
    s === "GRADE_10" ||
    s === "10" ||
    lower === "grade 10" ||
    s === "العاشر" ||
    s === "الصف العاشر" ||
    s.includes("عاشر") ||
    lower.includes("grade 10")
  ) {
    return "GRADE_10";
  }
  if (
    s === "GRADE_11_LIT" ||
    lower === "grade 11 lit" ||
    lower === "grade 11 arts" ||
    s.includes("ادبي") ||
    s.includes("أدبي")
  ) {
    return "GRADE_11_LIT";
  }
  if (
    s === "GRADE_11_SCI" ||
    s === "GRADE_11" ||
    s === "11" ||
    lower === "grade 11" ||
    lower.includes("grade 11 science") ||
    s.includes("علمي") ||
    s.includes("حادي عشر")
  ) {
    return "GRADE_11_SCI";
  }
  if (
    s === "TAWJIHI" ||
    s === "12" ||
    lower === "tawjihi" ||
    lower === "grade 12" ||
    s.includes("توجيهي") ||
    s.includes("ثانوية")
  ) {
    return "TAWJIHI";
  }
  return null;
}

/**
 * Parses any grade representation (array, JSON, composite string '9+10', numeric) into canonical keys
 */
function parseGradeKeys(gradeInput) {
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

  const result = new Set();
  for (const token of tokens) {
    const key = normalizeGradeKeyClient(token);
    if (key) result.add(key);
  }
  return Array.from(result);
}

function parseAcademicYearStart(yearStr) {
  if (!yearStr || typeof yearStr !== "string") return null;
  const match = yearStr.trim().match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

function extractGradeNumbers(gradeInput) {
  if (!gradeInput) return [];
  const keys = parseGradeKeys(gradeInput);
  const matched = new Set();
  for (const key of keys) {
    if (key === "GRADE_9") matched.add(9);
    else if (key === "GRADE_10") matched.add(10);
    else if (key === "GRADE_11_SCI" || key === "GRADE_11_LIT") matched.add(11);
    else if (key === "TAWJIHI") matched.add(12);
  }
  return Array.from(matched).sort((a, b) => a - b);
}

/**
 * Calculates academic year (YYYY/YYYY) from birth year and selected grade levels.
 * Standard enrollment assumes a child enters Grade 1 at age 6.
 * Academic year start for grade g is: BirthYear + g + 5.
 * If multiple grades are selected, the completion year of the highest grade is returned.
 *
 * Examples:
 *   Born 2004 + Grade 9  -> 2004 + 9 + 5  = 2018 -> '2018/2019'
 *   Born 2004 + Grade 10 -> 2004 + 10 + 5 = 2019 -> '2019/2020'
 *   Born 2004 + [9, 10]  -> 2004 + 10 + 5 = 2019 -> '2019/2020'
 */
function calculateAcademicYearFromBirthYear(birthYear, gradeLevels) {
  if (!birthYear) return null;
  const bYear = typeof birthYear === "number" ? birthYear : parseInt(String(birthYear).trim(), 10);
  if (isNaN(bYear) || bYear < 1950 || bYear > 2030) return null;

  const numbers = extractGradeNumbers(gradeLevels);
  if (numbers.length === 0) return null;

  const maxGrade = Math.max(...numbers);
  const startYear = bYear + maxGrade + 5;
  const endYear = startYear + 1;
  return `${startYear}/${endYear}`;
}

/**
 * Triggers auto-calculation of academic year from birth year & selected grades.
 * Populates academicYearInput and formState.academic_year if valid.
 */
function triggerAutoAcademicYearCalc() {
  if (!DOM.birthYearInput || !DOM.academicYearInput) return;
  const birthVal = DOM.birthYearInput.value.trim();
  if (/^\d{4}$/.test(birthVal) && state.selectedGrades.size > 0) {
    const calculated = calculateAcademicYearFromBirthYear(birthVal, Array.from(state.selectedGrades));
    if (calculated) {
      DOM.academicYearInput.value = calculated;
      formState.academic_year = calculated;
      clearFieldError("academic_year");
    }
  }
}

/**
 * Smart timeline progression matching for academic year
 */
function isRecordActiveInAcademicYear(record, targetAcademicYear) {
  if (!targetAcademicYear || targetAcademicYear === "ALL" || targetAcademicYear === "جميع الأعوام الدراسية") {
    return true;
  }
  if (!record || !record.academic_year) return false;

  const targetTrimmed = targetAcademicYear.trim();
  const recTrimmed = String(record.academic_year).trim();

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

  // Completion-anchored progression (recStart corresponds to gMax)
  for (const g of grades) {
    const y = recStart - (gMax - g);
    if (y === targetStart) return true;
  }

  return false;
}

function sortAcademicYears(yearsArray) {
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
 * Synchronizes and chronologically sorts Academic Year dropdown options in descending order (newest to oldest).
 * Prevents scrambled ordering, ensures clean layout, and preserves current user selection.
 */
function syncYearFilterOptions(records) {
  if (!DOM.yearFilter) return;

  const currentVal = DOM.yearFilter.value || state.academic_year || "ALL";

  // Standard baseline academic years (from upcoming 2026/2027 down to 2018/2019)
  const baselineYears = [
    "2026/2027",
    "2025/2026",
    "2024/2025",
    "2023/2024",
    "2022/2023",
    "2021/2022",
    "2020/2021",
    "2019/2020",
    "2018/2019",
  ];

  const yearsSet = new Set(baselineYears);

  // Collect from existing dropdown options (excluding "ALL")
  Array.from(DOM.yearFilter.options).forEach((opt) => {
    const val = opt.value?.trim();
    if (val && val !== "ALL" && /^\d{4}\/\d{4}$/.test(val)) {
      yearsSet.add(val);
    }
  });

  // Extract valid academic years from loaded student records
  if (Array.isArray(records)) {
    for (const r of records) {
      if (r && r.academic_year) {
        const val = String(r.academic_year).trim();
        if (/^\d{4}\/\d{4}$/.test(val)) {
          yearsSet.add(val);
        } else {
          const match = val.match(/^(\d{4})[/-](\d{4})$/);
          if (match) {
            yearsSet.add(`${match[1]}/${match[2]}`);
          }
        }
      }
    }
  }

  // Chronological sort: strictly descending order (newest first down to oldest)
  const sortedYears = sortAcademicYears(Array.from(yearsSet));

  // Rebuild dropdown cleanly
  DOM.yearFilter.innerHTML = "";

  // 1. "All Academic Years" default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "ALL";
  defaultOption.setAttribute("data-i18n", "filterAllYears");
  defaultOption.textContent = t("filterAllYears");
  DOM.yearFilter.appendChild(defaultOption);

  // 2. Sorted chronological options
  sortedYears.forEach((yr) => {
    const opt = document.createElement("option");
    opt.value = yr;
    opt.textContent = yr;
    DOM.yearFilter.appendChild(opt);
  });

  // 3. Restore previously selected value
  if (yearsSet.has(currentVal) || currentVal === "ALL") {
    DOM.yearFilter.value = currentVal;
  } else {
    DOM.yearFilter.value = "ALL";
  }
}

window.sortAcademicYears = sortAcademicYears;
window.syncYearFilterOptions = syncYearFilterOptions;
window.parseGradeKeys = parseGradeKeys;
window.isRecordActiveInAcademicYear = isRecordActiveInAcademicYear;
window.extractGradeNumbers = extractGradeNumbers;
window.calculateAcademicYearFromBirthYear = calculateAcademicYearFromBirthYear;
window.triggerAutoAcademicYearCalc = triggerAutoAcademicYearCalc;

// ==========================================
// API Operations
// ==========================================

/**
 * Fetch and display paginated certificate records
 */
async function loadCertificates() {
  try {
    const params = new URLSearchParams({
      page: state.page,
      limit: state.limit,
      search: state.search,
      status: state.status,
      academic_year: state.academic_year,
      grade: state.grade,
    });

    const res = await fetch(`/api/certificates?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      state.records = data.data;
      state.page = data.pagination.page;
      state.totalPages = data.pagination.totalPages;
      state.totalRecords = data.pagination.total;

      syncYearFilterOptions(data.data);
      renderTable(data.data);
      renderPagination(data.pagination);
    } else {
      showToast("Failed to fetch records", "error");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Network error while loading data", "error");
  }
}

/**
 * Fetch dashboard statistics (total, waiting, written, submitted, certified, self_certified)
 */
async function fetchDashboardMetrics() {
  try {
    const res = await fetch("/api/certificates/stats");
    const data = await res.json();
    if (data.success) {
      if (DOM.statTotal) DOM.statTotal.textContent = data.data.total ?? 0;
      if (DOM.statWaiting) DOM.statWaiting.textContent = data.data.waiting ?? 0;
      if (DOM.statWritten) DOM.statWritten.textContent = data.data.written ?? 0;
      if (DOM.statSubmitted) DOM.statSubmitted.textContent = data.data.submitted ?? 0;
      if (DOM.statCertified) DOM.statCertified.textContent = data.data.certified ?? 0;
      if (DOM.statSelfCertified) DOM.statSelfCertified.textContent = data.data.self_certified ?? 0;
    }
  } catch (err) {
    console.error("Metrics error:", err);
  }
}

/**
 * Filter the certificates table by clicking a quick status chip
 */
function filterByQuickStatus(statusValue) {
  if (DOM.statusFilter) {
    DOM.statusFilter.value = statusValue;
    state.statusFilter = statusValue;
    state.currentPage = 1;
    fetchCertificates();
  }
}
window.filterByQuickStatus = filterByQuickStatus;

/**
 * Handle request form submission (Supports both CREATE via POST and EDIT via PUT)
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  flushAllFormDebouncers();
  clearAllErrors();

  let selectedGradesArray = Array.from(state.selectedGrades);

  // If in edit mode and no grades are selected in the UI, gracefully preserve existing record grades
  if (state.editingId && selectedGradesArray.length === 0) {
    const existing = state.records.find((r) => r.id === state.editingId);
    if (existing && existing.grade_level) {
      selectedGradesArray = parseGradeKeys(existing.grade_level);
    }
  }

  const secNum = DOM.securityNumberInput.value.trim().toUpperCase();

  const payload = {
    student_name: DOM.studentNameInput.value.trim(),
    grade_level: selectedGradesArray,
    section: DOM.sectionInput ? (DOM.sectionInput.value.trim() || null) : null,
    security_number: secNum || null,
    academic_year: DOM.academicYearInput.value.trim(),
    request_date: DOM.requestDateInput.value,
    status: DOM.statusInput.value || "انتظار",
    notes: DOM.notesInput.value.trim(),
  };

  // 3-part name check (minimum 3 words)
  const parts = payload.student_name.split(/\s+/).filter(Boolean);
  if (parts.length < 3) {
    showFieldError("student_name", t("errName3Parts", { count: parts.length }));
    return;
  }

  // Grade level check
  if (payload.grade_level.length === 0) {
    showFieldError("grade_level", t("errGradeReq"));
    return;
  }

  // Security number is COMPLETELY OPTIONAL. If entered, check minimum length
  if (payload.security_number && payload.security_number.length < 4) {
    showFieldError("security_number", "الرقم الأمني يجب أن يتكون من 4 خانات على الأقل إن وُجد");
    return;
  }

  // Academic year check
  if (!/^\d{4}\/\d{4}$/.test(payload.academic_year)) {
    showFieldError("academic_year", t("errYearFormat"));
    return;
  }

  const isEdit = Boolean(state.editingId);
  const endpoint = isEdit ? `/api/certificates/${state.editingId}` : "/api/certificates";
  const method = isEdit ? "PUT" : "POST";

  try {
    const submitBtn = document.getElementById("btnSubmitForm");
    submitBtn.disabled = true;
    document.getElementById("btnSubmitText").textContent = t("saving");

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    submitBtn.disabled = false;
    document.getElementById("btnSubmitText").textContent = isEdit ? t("btnUpdateRecord") : t("btnSaveRecord");

    if (res.status === 200 || res.status === 201) {
      showToast(isEdit ? t("msgUpdated") : t("msgCreated"), "success");
      closeRequestModal();
      Promise.all([loadCertificates(), fetchDashboardMetrics()]).catch(console.error);
    } else if (res.status === 409) {
      showFieldError("security_number", result.errors?.security_number || "Security number already exists");
    } else if (result.errors) {
      for (const [field, msg] of Object.entries(result.errors)) {
        showFieldError(field, Array.isArray(msg) ? msg[0] : msg);
      }
    } else {
      showToast(result.message || "Failed to save request", "error");
    }
  } catch (err) {
    console.error("Submission error:", err);
    showToast("Network error during submission", "error");
    document.getElementById("btnSubmitForm").disabled = false;
    document.getElementById("btnSubmitText").textContent = isEdit ? t("btnUpdateRecord") : t("btnSaveRecord");
  }
}

/**
 * Update record status (انتظار, تمت كتابة الشهادة, تم الرفع للتصديق)
 */
async function updateStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/certificates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const result = await res.json();
    if (result.success) {
      const localizedStatus =
        newStatus === "انتظار"
          ? t("statusWaiting")
          : newStatus === "تمت كتابة الشهادة"
          ? t("statusWritten")
          : newStatus === "تم الرفع للتصديق"
          ? t("statusSubmitted")
          : newStatus;

      showToast(t("msgStatusUpdated", { status: localizedStatus }), "success");
      loadCertificates();
      fetchDashboardMetrics();
    } else {
      showToast(result.message || "Failed to update status", "error");
    }
  } catch (err) {
    showToast("Network error", "error");
  }
}

/**
 * Delete certificate request with localized safety confirmation prompt
 */
async function deleteRecord(id, studentName) {
  const confirmMsg = studentName
    ? t("confirmDeleteNamed", { name: studentName })
    : t("confirmDelete");

  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`/api/certificates/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      showToast(t("msgDeleted"), "success");
      loadCertificates();
      fetchDashboardMetrics();
    } else {
      showToast(result.message || "Delete failed", "error");
    }
  } catch (err) {
    showToast("Network error", "error");
  }
}

// ==========================================
// Rendering (7 columns - School Name removed)
// ==========================================

/**
 * Formats grade_level directly as a clean, unified single badge representation (e.g., 9, 10, or 9 + 10)
 * rather than splitting into multiple complex stacked text badges.
 */
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
      try {
        list = JSON.parse(trimmed);
      } catch {
        list = [trimmed];
      }
    } else if (trimmed.includes("+")) {
      return trimmed;
    } else if (trimmed.includes(";")) {
      list = trimmed.split(";");
    } else if (trimmed.includes(",")) {
      list = trimmed.split(",");
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
    if (GRADE_NUM_MAP[str]) {
      matched.add(GRADE_NUM_MAP[str]);
    } else if (str === "9" || str.includes("تاسع")) {
      matched.add("9");
    } else if (str === "10" || str.includes("عاشر")) {
      matched.add("10");
    } else if (
      str === "11" ||
      str.includes("حادي عشر") ||
      str.includes("علمي") ||
      str.includes("ادبي") ||
      str.includes("أدبي")
    ) {
      matched.add("11");
    } else if (str === "12" || str.includes("توجيهي")) {
      matched.add("12");
    } else {
      matched.add(str);
    }
  }

  const sorted = numOrder.filter((n) => matched.has(n));
  for (const val of matched) {
    if (!numOrder.includes(val) && !sorted.includes(val)) {
      sorted.push(val);
    }
  }

  return sorted.length > 0 ? sorted.join(" + ") : String(gradeInput);
}

/**
 * Render table rows with word wrapping, localized badges, and clean unified grade badges
 */
function renderTable(records) {
  if (!records || records.length === 0) {
    DOM.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p style="font-weight: 600; font-size: 0.92rem; color: #334155;">${t("emptyTitle")}</p>
          <p style="font-size: 0.78rem; margin-top: 4px;">${t("emptySubtitle")}</p>
        </td>
      </tr>
    `;
    return;
  }

  DOM.tableBody.innerHTML = records
    .map((item) => {
      let statusClass = "waiting";
      let statusLabel = t("statusWaiting");

      if (item.status === "تمت كتابة الشهادة") {
        statusClass = "written";
        statusLabel = t("statusWritten");
      } else if (item.status === "تم الرفع للتصديق") {
        statusClass = "submitted";
        statusLabel = t("statusSubmitted");
      } else if (item.status === "تصديق شخصي" || item.status === "تصديق ع حسابه الشخصي") {
        statusClass = "self-certified";
        statusLabel = t("statusSelfCertified");
      } else if (item.status === "تم التصديق") {
        statusClass = "certified";
        statusLabel = t("statusCertified");
      } else {
        statusClass = "waiting";
        statusLabel = t("statusWaiting");
      }

      // Render clean, unified single grade badge (e.g., 9, 10, or 9 + 10)
      const displayGrade = formatGradeLevelDisplay(item.grade_level);

      const sectionHtml = item.section
        ? `<span class="section-tag" title="${t("lblSection")}">${escapeHtml(item.section)}</span>`
        : "";

      // Security number pill or placeholder
      const secNumHtml = item.security_number
        ? `<div class="sec-code-pill font-mono">
             <span class="sec-code-text">${escapeHtml(item.security_number)}</span>
             <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(item.security_number)}')" title="${t("tooltipCopy")}">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                 <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
               </svg>
             </button>
           </div>`
        : `<span class="text-muted font-mono" style="color: #94a3b8; font-size: 0.85rem;">-</span>`;

      return `
        <tr>
          <td>${secNumHtml}</td>
          <td class="student-name-cell">${escapeHtml(item.student_name)}</td>
          <td style="text-align: center;">
            <div class="grade-cell-wrap">
              <span class="grade-badge-unified">${escapeHtml(displayGrade)}</span>
              ${sectionHtml}
            </div>
          </td>
          <td class="font-mono" style="font-size: 0.78rem; text-align: center;">${escapeHtml(item.academic_year)}</td>
          <td style="font-size: 0.78rem; color: #64748b; text-align: center;">${escapeHtml(item.request_date)}</td>
          <td style="text-align: center;">
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </td>
          <td>
            <div class="action-btns">
              <!-- View Attestation Slip Preview -->
              <button class="action-icon-btn btn-view" onclick="viewAttestationSlip(${item.id})" title="${t("tooltipView")}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>

              <!-- Edit Record -->
              <button class="action-icon-btn btn-edit" onclick="openEditModal(${item.id})" title="${t("tooltipEdit")}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>

              <!-- Quick Status Advance -->
              ${
                item.status !== "تمت كتابة الشهادة"
                  ? `<button class="action-icon-btn btn-write" onclick="updateStatus(${item.id}, 'تمت كتابة الشهادة')" title="${t("tooltipMarkWritten")}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>`
                  : `<button class="action-icon-btn btn-submit" onclick="updateStatus(${item.id}, 'تم الرفع للتصديق')" title="${t("tooltipMarkSubmitted")}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>`
              }

              <!-- Delete Record with safe confirmation dialog -->
              <button class="action-icon-btn btn-delete" onclick="deleteRecord(${item.id}, '${escapeHtml(item.student_name).replace(/'/g, "\\'")}')" title="${t("tooltipDelete")}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Render pagination numbers and localized summary
 */
function renderPagination(pagination) {
  const { page, limit, total, totalPages } = pagination;
  const isShowAll = state.pageSize === "ALL" || limit >= 50000;

  if (isShowAll) {
    // When "All" is selected, hide the page navigation buttons completely
    if (DOM.paginationButtons) {
      DOM.paginationButtons.style.display = "none";
    }
    DOM.paginationInfo.textContent = t("showingAllInfo", { total });
    return;
  }

  // Restore navigation buttons in standard pagination mode
  if (DOM.paginationButtons) {
    DOM.paginationButtons.style.display = "flex";
  }

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  DOM.paginationInfo.textContent = t("showingInfo", { start, end, total });
  DOM.btnPrevPage.disabled = page <= 1;
  DOM.btnNextPage.disabled = page >= totalPages;

  let pageBtnsHtml = "";
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageBtnsHtml += `
      <button class="page-num ${i === page ? "active" : ""}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }
  DOM.pageNumbers.innerHTML = pageBtnsHtml;
}

window.goToPage = function (pageNum) {
  state.page = pageNum;
  loadCertificates();
};

window.copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(t("copied"), "success");
  });
};

window.updateStatus = updateStatus;
window.deleteRecord = deleteRecord;

/**
 * View Certificate Attestation Slip Modal (HARDCODED SCHOOL NAME)
 */
window.viewAttestationSlip = function (id) {
  const item = state.records.find((r) => r.id === id);
  if (!item) return;

  let statusClass = "waiting";
  let statusLabel = t("statusWaiting");

  if (item.status === "تمت كتابة الشهادة") {
    statusClass = "written";
    statusLabel = t("statusWritten");
  } else if (item.status === "تم الرفع للتصديق") {
    statusClass = "submitted";
    statusLabel = t("statusSubmitted");
  } else if (item.status === "تصديق شخصي" || item.status === "تصديق ع حسابه الشخصي") {
    statusClass = "self-certified";
    statusLabel = t("statusSelfCertified");
  } else if (item.status === "تم التصديق") {
    statusClass = "certified";
    statusLabel = t("statusCertified");
  } else {
    statusClass = "waiting";
    statusLabel = t("statusWaiting");
  }

  const gradesArray = Array.isArray(item.grade_level)
    ? item.grade_level
    : [item.grade_level];

  const gradeBadgesHtml = gradesArray
    .map((g) => {
      const meta = GRADE_MAP[g] || { en: g, ar: g, cls: "grade-tag-9" };
      const label = state.lang === "ar" ? meta.ar : meta.en;
      return `<span class="grade-tag ${meta.cls}">${escapeHtml(label)}</span>`;
    })
    .join(" ");

  const secNumDisplay = item.security_number ? escapeHtml(item.security_number) : "-";
  const barcodeDisplay = item.security_number ? `* ${escapeHtml(item.security_number)} *` : `* ${state.lang === "ar" ? "بدون رقم أمني" : "NO SECURITY NUMBER"} *`;

  DOM.slipContent.innerHTML = `
    <div class="slip-card">
      <div class="slip-header">
        <div class="slip-emblem">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="m9 15 2 2 4-4"></path>
          </svg>
        </div>
        <h3>${t("slipDocHeader")}</h3>
        <p style="font-weight: 700; color: #4338ca; font-size: 0.95rem; margin-top: 2px;">${HARDCODED_SCHOOL_NAME}</p>
      </div>

      <div class="slip-grid">
        <div class="slip-item">
          <span class="slip-item-label">${t("slipStudentName")}</span>
          <span class="slip-item-value">${escapeHtml(item.student_name)}</span>
        </div>

        <div class="slip-item">
          <span class="slip-item-label">${t("slipSecNum")}</span>
          <span class="slip-item-value font-mono text-indigo">${secNumDisplay}</span>
        </div>

        <div class="slip-item" style="grid-column: span 2;">
          <span class="slip-item-label">${t("slipSchool")}</span>
          <span class="slip-item-value" style="color: #1e293b; font-weight: 700;">${HARDCODED_SCHOOL_NAME}</span>
        </div>

        <div class="slip-item">
          <span class="slip-item-label">${t("slipGrade")}</span>
          <div class="grade-tags-wrap" style="margin-top: 4px;">${gradeBadgesHtml}</div>
        </div>

        ${
          item.section
            ? `<div class="slip-item">
                <span class="slip-item-label">${t("slipSection")}</span>
                <span class="slip-item-value font-mono" style="font-weight: 700; color: #1e293b;">${escapeHtml(item.section)}</span>
              </div>`
            : ""
        }

        <div class="slip-item">
          <span class="slip-item-label">${t("slipYear")}</span>
          <span class="slip-item-value font-mono">${escapeHtml(item.academic_year)}</span>
        </div>

        <div class="slip-item">
          <span class="slip-item-label">${t("slipStatus")}</span>
          <span class="slip-item-value">
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </span>
        </div>
      </div>

      ${
        item.notes
          ? `<div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-size: 0.8rem; margin-bottom: 14px;">
              <strong>${t("slipRemarks")}</strong> ${escapeHtml(item.notes)}
            </div>`
          : ""
      }

      <div class="barcode-strip">
        ${barcodeDisplay}
      </div>
    </div>
  `;

  DOM.slipModal.style.display = "flex";
};

// ==========================================
// Modal Helpers & Field Validation UI
// ==========================================
function openRequestModal() {
  cancelAllFormDebouncers();
  lastRenderedWordCount = -1;
  clearAllErrors();
  state.editingId = null;
  DOM.certificateForm.reset();
  DOM.requestDateInput.value = new Date().toISOString().split("T")[0];
  DOM.academicYearInput.value = "";
  formState.academic_year = "";
  if (DOM.birthYearInput) {
    DOM.birthYearInput.value = "";
  }
  formState.birth_year = "";
  DOM.securityNumberInput.value = "";
  formState.security_number = "";
  if (DOM.sectionInput) {
    DOM.sectionInput.value = "";
    formState.section = "";
  }
  DOM.statusInput.value = "انتظار";
  formState.status = "انتظار";

  // Restore create titles & button text
  const titleEl = document.getElementById("modalTitle");
  if (titleEl) titleEl.textContent = t("modalTitle");
  const submitTextEl = document.getElementById("btnSubmitText");
  if (submitTextEl) submitTextEl.textContent = t("btnSaveRecord");

  updateWordCounter();

  // Reset selected grades in modal
  state.selectedGrades.clear();
  document.querySelectorAll(".grade-pill-item").forEach((pill) => {
    pill.classList.remove("active");
    const cb = pill.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = false;
  });
  updateGradesSelectedBadge();

  DOM.requestModal.style.display = "flex";
  DOM.studentNameInput.focus();
}

/**
 * Pre-fills and opens modal to edit an existing attestation request
 */
async function openEditModal(id) {
  cancelAllFormDebouncers();
  lastRenderedWordCount = -1;
  clearAllErrors();
  state.editingId = id;

  // Retrieve record from state or fetch from API
  let record = state.records.find((r) => r.id === id);
  if (!record) {
    try {
      const res = await fetch(`/api/certificates/${id}`);
      const data = await res.json();
      if (data.success) {
        record = data.data;
      }
    } catch (err) {
      console.error("Failed to fetch record details for edit:", err);
    }
  }

  if (!record) {
    showToast("Failed to load record details", "error");
    return;
  }

  // Pre-fill inputs
  DOM.studentNameInput.value = record.student_name || "";
  formState.student_name = DOM.studentNameInput.value;
  DOM.securityNumberInput.value = record.security_number || "";
  formState.security_number = DOM.securityNumberInput.value;
  if (DOM.sectionInput) {
    DOM.sectionInput.value = record.section || "";
    formState.section = DOM.sectionInput.value;
  }
  DOM.academicYearInput.value = record.academic_year || "";
  formState.academic_year = DOM.academicYearInput.value;

  // Pre-populate birth year if inferrable from academic year & grades
  if (DOM.birthYearInput) {
    const recYear = parseAcademicYearStart(record.academic_year);
    const grades = extractGradeNumbers(record.grade_level);
    if (recYear && grades.length > 0) {
      const gMax = Math.max(...grades);
      DOM.birthYearInput.value = String(recYear - gMax - 5);
      formState.birth_year = DOM.birthYearInput.value;
    } else {
      DOM.birthYearInput.value = "";
      formState.birth_year = "";
    }
  }
  // Pre-select status safely matching option values
  const rawStatus = (record.status || "انتظار").trim();
  let matchedOption = false;
  if (DOM.statusInput && DOM.statusInput.options) {
    for (let i = 0; i < DOM.statusInput.options.length; i++) {
      if (DOM.statusInput.options[i].value.trim() === rawStatus) {
        DOM.statusInput.selectedIndex = i;
        matchedOption = true;
        break;
      }
    }
  }
  if (!matchedOption && DOM.statusInput) {
    DOM.statusInput.value = rawStatus;
  }
  formState.status = DOM.statusInput ? DOM.statusInput.value : rawStatus;
  DOM.notesInput.value = record.notes || "";
  formState.notes = DOM.notesInput.value;

  // Set Edit title & button text
  const titleEl = document.getElementById("modalTitle");
  if (titleEl) titleEl.textContent = t("modalTitleEdit");
  const submitTextEl = document.getElementById("btnSubmitText");
  if (submitTextEl) submitTextEl.textContent = t("btnUpdateRecord");

  updateWordCounter();

  // Pre-fill grade pills (supports numeric like 9, 10, multi-grade like 9+10, 9 + 10, or canonical keys)
  state.selectedGrades.clear();
  const canonicalKeys = parseGradeKeys(record.grade_level);
  canonicalKeys.forEach((g) => state.selectedGrades.add(g));

  document.querySelectorAll(".grade-pill-item").forEach((pill) => {
    const grade = pill.getAttribute("data-grade");
    const cb = pill.querySelector('input[type="checkbox"]');
    if (state.selectedGrades.has(grade)) {
      pill.classList.add("active");
      if (cb) cb.checked = true;
    } else {
      pill.classList.remove("active");
      if (cb) cb.checked = false;
    }
  });
  updateGradesSelectedBadge();

  DOM.requestModal.style.display = "flex";
  DOM.studentNameInput.focus();
}

window.openEditModal = openEditModal;

function closeRequestModal() {
  cancelAllFormDebouncers();
  DOM.requestModal.style.display = "none";
  state.editingId = null;
}

function showFieldError(fieldName, message) {
  const errEl = document.getElementById(`err_${fieldName}`);
  if (errEl) {
    errEl.textContent = message;
  }
  if (fieldName === "grade_level") {
    if (DOM.gradeMultiSelectContainer) {
      DOM.gradeMultiSelectContainer.classList.add("error-border");
    }
    return;
  }

  const inputEl = document.getElementById(
    fieldName === "student_name"
      ? "studentNameInput"
      : fieldName === "security_number"
      ? "securityNumberInput"
      : fieldName === "academic_year"
      ? "academicYearInput"
      : `${fieldName}Input`
  );
  if (inputEl) {
    inputEl.classList.add("error-border");
  }
}

function clearFieldError(fieldName) {
  const errEl = document.getElementById(`err_${fieldName}`);
  if (errEl) errEl.textContent = "";
  if (fieldName === "grade_level") {
    if (DOM.gradeMultiSelectContainer) {
      DOM.gradeMultiSelectContainer.classList.remove("error-border");
    }
    return;
  }

  const inputEl = document.getElementById(
    fieldName === "student_name"
      ? "studentNameInput"
      : fieldName === "security_number"
      ? "securityNumberInput"
      : fieldName === "academic_year"
      ? "academicYearInput"
      : `${fieldName}Input`
  );
  if (inputEl) {
    inputEl.classList.remove("error-border");
  }
}

function clearAllErrors() {
  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".error-border").forEach((el) => el.classList.remove("error-border"));
  if (DOM.gradeMultiSelectContainer) {
    DOM.gradeMultiSelectContainer.classList.remove("error-border");
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
