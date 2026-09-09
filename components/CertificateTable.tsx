import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Eye, 
  Pencil,
  CheckCircle, 
  XCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  FileCheck2
} from "lucide-react";

export type GradeLevelKey = 
  | "GRADE_9" 
  | "GRADE_10" 
  | "GRADE_11_SCI" 
  | "GRADE_11_LIT" 
  | "TAWJIHI";

export type AttestationStatus = "انتظار" | "تمت كتابة الشهادة" | "تم الرفع للتصديق";

export interface CertificateRecord {
  id: number;
  student_name: string;
  grade_level: GradeLevelKey[];
  security_number?: string | null;
  request_date: string;
  academic_year: string;
  status: AttestationStatus;
  notes?: string | null;
}

export interface CertificateTableProps {
  records: CertificateRecord[];
  lang?: "en" | "ar";
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onViewSlip: (record: CertificateRecord) => void;
  onEdit?: (record: CertificateRecord) => void;
  onUpdateStatus: (id: number, status: AttestationStatus) => void;
  onDelete: (id: number) => void;
}

// Predefined Grade Level Labels and Distinct Colors
const GRADE_CONFIG: Record<GradeLevelKey, { en: string; ar: string; badgeCls: string }> = {
  GRADE_9: {
    en: "Grade 9",
    ar: "الصف التاسع",
    badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
  },
  GRADE_10: {
    en: "Grade 10",
    ar: "العاشر",
    badgeCls: "bg-sky-50 text-sky-700 border-sky-200",
  },
  GRADE_11_SCI: {
    en: "Grade 11 Science",
    ar: "الحادي عشر علمي",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  GRADE_11_LIT: {
    en: "Grade 11 Arts",
    ar: "الحادي عشر ادبي",
    badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
  },
  TAWJIHI: {
    en: "Tawjihi",
    ar: "التوجيهي",
    badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

export const CertificateTable: React.FC<CertificateTableProps> = ({
  records,
  lang = "ar",
  currentPage,
  totalPages,
  totalRecords,
  itemsPerPage = 8,
  onPageChange,
  onViewSlip,
  onEdit,
  onUpdateStatus,
  onDelete,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isRtl = lang === "ar";

  const handleCopy = (secNum: string) => {
    navigator.clipboard.writeText(secNum);
    setCopiedId(secNum);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, totalRecords);

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* 
        CONTAINED HORIZONTAL SCROLL & RESPONSIVE LAYOUT:
        - overflow-x-auto on container so horizontal scrolling is strictly contained on mobile
        - table-fixed on md: screens to eliminate horizontal scrollbars on desktop & tablet
        - 7 proportional columns totaling exactly 100%
      */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[700px] md:min-w-full md:table-fixed border-collapse text-start text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {/* Security Number - Compact (14%) */}
              <th className="w-[14%] px-3 py-3 text-start">
                {isRtl ? "الرقم الأمني" : "Security #"}
              </th>

              {/* Student Full Name - Flexible with Text Wrapping (27%) */}
              <th className="w-[27%] px-3 py-3 text-start">
                {isRtl ? "اسم الطالب (الثلاثي)" : "Student Full Name"}
              </th>

              {/* Grade Levels - Multi-tag Wrap Column (18%) */}
              <th className="w-[18%] px-3 py-3 text-start">
                {isRtl ? "المراحل الدراسية" : "Grade Levels"}
              </th>

              {/* Academic Year - Compact (9%) */}
              <th className="w-[9%] px-2 py-3 text-center">
                {isRtl ? "العام الدراسي" : "Year"}
              </th>

              {/* Request Date - Compact (9%) */}
              <th className="w-[9%] px-2 py-3 text-center">
                {isRtl ? "تاريخ الطلب" : "Date"}
              </th>

              {/* Status - Compact (11%) */}
              <th className="w-[11%] px-2 py-3 text-center">
                {isRtl ? "الحالة" : "Status"}
              </th>

              {/* Actions - Sleek Button Group (12%) */}
              <th className="w-[12%] px-2 py-3 text-end">
                {isRtl ? "الإجراءات" : "Actions"}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {records.length > 0 ? (
              records.map((item) => (
                <tr 
                  key={item.id} 
                  className="transition-colors hover:bg-slate-50/60"
                >
                  {/* Security Number */}
                  <td className="px-3 py-2.5 align-middle">
                    {item.security_number ? (
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50/80 px-2 py-1 font-mono text-[11px] font-semibold text-indigo-700 border border-indigo-100 max-w-full">
                        <span className="truncate">{item.security_number}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.security_number!)}
                          className="shrink-0 text-indigo-400 hover:text-indigo-700 transition"
                          title={isRtl ? "نسخ الرقم الأمني" : "Copy Security #"}
                        >
                          {copiedId === item.security_number ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-xs">-</span>
                    )}
                  </td>

                  {/* Student Full Name - Elegant wrapping */}
                  <td className="px-3 py-2.5 align-middle">
                    <div className="whitespace-normal break-words font-semibold text-slate-900 leading-snug">
                      {item.student_name}
                    </div>
                  </td>

                  {/* Grade Level - Multi-Select Tags wrapping cleanly */}
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex flex-wrap gap-1 whitespace-normal max-w-full">
                      {item.grade_level && item.grade_level.length > 0 ? (
                        item.grade_level.map((gradeKey) => {
                          const config = GRADE_CONFIG[gradeKey] || {
                            en: gradeKey,
                            ar: gradeKey,
                            badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
                          };
                          const label = isRtl ? config.ar : config.en;

                          return (
                            <span
                              key={gradeKey}
                              className={`inline-block border px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight whitespace-normal break-words ${config.badgeCls}`}
                            >
                              {label}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </div>
                  </td>

                  {/* Academic Year - Compact */}
                  <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-600">
                      {item.academic_year}
                    </span>
                  </td>

                  {/* Request Date - Compact */}
                  <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap">
                    <span className="text-xs text-slate-500">
                      {item.request_date}
                    </span>
                  </td>

                  {/* Status Badge - Compact */}
                  <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === "تم الرفع للتصديق"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.status === "تمت كتابة الشهادة"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                      <span>
                        {item.status === "تم الرفع للتصديق"
                          ? (isRtl ? "تم الرفع للتصديق" : "Submitted")
                          : item.status === "تمت كتابة الشهادة"
                          ? (isRtl ? "تمت كتابة الشهادة" : "Written")
                          : (isRtl ? "انتظار" : "Waiting")}
                      </span>
                    </span>
                  </td>

                  {/* Actions - Compact */}
                  <td className="px-2 py-2.5 text-end align-middle whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {/* View Attestation Slip Preview */}
                      <button
                        type="button"
                        onClick={() => onViewSlip(item)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition"
                        title={isRtl ? "معاينة كشف التصديق" : "View Slip"}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Edit Button */}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="rounded p-1 text-sky-600 hover:bg-sky-50 hover:text-sky-800 transition"
                          title={isRtl ? "تعديل بيانات الطلب" : "Edit Record"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Quick Status: Mark Written Button */}
                      {item.status !== "تمت كتابة الشهادة" && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(item.id, "تمت كتابة الشهادة")}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition"
                          title={isRtl ? "تحديد: تمت كتابة الشهادة" : "Mark as Written"}
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Quick Status: Mark Submitted Button */}
                      {item.status !== "تم الرفع للتصديق" && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(item.id, "تم الرفع للتصديق")}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition"
                          title={isRtl ? "تحديد: تم الرفع للتصديق" : "Submit for Attestation"}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Delete Button with confirmation safeguard */}
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = isRtl
                            ? `هل أنت متأكد من رغبتك في حذف سجل الطالب '${item.student_name}'؟ لا يمكن التراجع عن هذا الإجراء.`
                            : `Are you sure you want to permanently delete the attestation record for '${item.student_name}'?`;
                          if (window.confirm(confirmMsg)) {
                            onDelete(item.id);
                          }
                        }}
                        className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                        title={isRtl ? "حذف السجل" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <FileCheck2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">
                    {isRtl ? "لم يتم العثور على أي سجلات تصديق" : "No attestation records found"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isRtl ? "يرجى تعديل معايير البحث أو خيارات التصفية" : "Try modifying your search or filters"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 gap-2">
        <div>
          {isRtl ? (
            <>
              عرض <span className="font-bold text-slate-800">{startRecord}</span> إلى{" "}
              <span className="font-bold text-slate-800">{endRecord}</span> من أصل{" "}
              <span className="font-bold text-slate-800">{totalRecords}</span> سجل
            </>
          ) : (
            <>
              Showing <span className="font-bold text-slate-800">{startRecord}</span> to{" "}
              <span className="font-bold text-slate-800">{endRecord}</span> of{" "}
              <span className="font-bold text-slate-800">{totalRecords}</span> records
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            {isRtl ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            <span>{isRtl ? "السابق" : "Previous"}</span>
          </button>

          <span className="px-2 font-medium text-slate-600">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <span>{isRtl ? "التالي" : "Next"}</span>
            {isRtl ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateTable;
