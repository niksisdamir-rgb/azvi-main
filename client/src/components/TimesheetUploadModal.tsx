import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";
import * as XLSX from "xlsx";

// ── Types ────────────────────────────────────────────────────────────────────

type WorkType = "regular" | "overtime" | "weekend" | "holiday";
type UploadStatus = "pending" | "approved";

interface ParsedRow {
  rowIndex: number;
  employeeId?: number;
  employeeName?: string;       // raw name from file — resolved to ID before upload
  date?: Date;
  hoursWorked?: number;
  overtimeHours?: number;
  workType: WorkType;
  projectId?: number;
  notes?: string;
  status: UploadStatus;
  errors: string[];
  warnings: string[];
}

interface TimesheetUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ── Column alias map ─────────────────────────────────────────────────────────

const COLUMN_ALIASES: Record<string, string> = {
  // employee
  "employee id": "employeeId",
  "emp id": "employeeId",
  "emp_id": "employeeId",
  "employee": "employeeName",
  "employee name": "employeeName",
  "name": "employeeName",
  "full name": "employeeName",
  // date
  "date": "date",
  "work date": "date",
  "day": "date",
  "worked date": "date",
  // hours
  "hours": "hoursWorked",
  "hours worked": "hoursWorked",
  "total hours": "hoursWorked",
  "hrs": "hoursWorked",
  "worked hours": "hoursWorked",
  // overtime
  "overtime": "overtimeHours",
  "overtime hours": "overtimeHours",
  "ot hours": "overtimeHours",
  "extra hours": "overtimeHours",
  "ot": "overtimeHours",
  // work type
  "type": "workType",
  "work type": "workType",
  "category": "workType",
  "shift type": "workType",
  // project
  "project": "projectId",
  "project id": "projectId",
  "site": "projectId",
  "project name": "projectId",
  // notes
  "notes": "notes",
  "comments": "notes",
  "remarks": "notes",
  "description": "notes",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-]/g, " ");
}

function resolveWorkType(raw: string | number | null | undefined): WorkType {
  if (!raw) return "regular";
  const s = String(raw).toLowerCase().trim();
  if (s === "overtime" || s === "ot") return "overtime";
  if (s === "weekend") return "weekend";
  if (s === "holiday") return "holiday";
  return "regular";
}

function parseExcelDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  // XLSX may return a number (serial date) or string
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const d = new Date(v as string);
  if (!isNaN(d.getTime())) return d;
  return undefined;
}

function validateAndParseRows(
  rawRows: Record<string, unknown>[],
  headerMap: Record<string, string>
): ParsedRow[] {
  return rawRows.map((raw, idx) => {
    const mapped: Record<string, unknown> = {};
    for (const [rawKey, rawVal] of Object.entries(raw)) {
      const canonical = headerMap[normalizeHeader(rawKey)];
      if (canonical) mapped[canonical] = rawVal;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // employeeId / employeeName
    let employeeId: number | undefined;
    let employeeName: string | undefined;
    if (mapped.employeeId) {
      const n = Number(mapped.employeeId);
      if (!isNaN(n)) employeeId = n;
      else errors.push("Invalid Employee ID");
    } else if (mapped.employeeName) {
      employeeName = String(mapped.employeeName).trim();
    } else {
      errors.push("Missing Employee (ID or Name)");
    }

    // date
    const date = parseExcelDate(mapped.date);
    if (!date) errors.push("Missing or invalid Date");

    // hoursWorked
    let hoursWorked: number | undefined;
    if (mapped.hoursWorked !== undefined && mapped.hoursWorked !== null) {
      const n = Number(mapped.hoursWorked);
      if (isNaN(n) || n < 0) errors.push("Invalid Hours Worked");
      else hoursWorked = n;
    } else {
      warnings.push("Hours Worked not specified (will be blank)");
    }

    // overtimeHours
    let overtimeHours: number | undefined;
    if (mapped.overtimeHours !== undefined && mapped.overtimeHours !== null && mapped.overtimeHours !== "") {
      const n = Number(mapped.overtimeHours);
      if (!isNaN(n) && n >= 0) overtimeHours = n;
    }

    const workType = resolveWorkType(mapped.workType as string);
    const projectId = mapped.projectId ? Number(mapped.projectId) || undefined : undefined;
    const notes = mapped.notes ? String(mapped.notes).trim() : undefined;

    return {
      rowIndex: idx + 1,
      employeeId,
      employeeName,
      date,
      hoursWorked,
      overtimeHours,
      workType,
      projectId,
      notes,
      status: "pending" as UploadStatus,
      errors,
      warnings,
    };
  });
}

function buildHeaderMap(columns: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const col of columns) {
    const norm = normalizeHeader(col);
    if (COLUMN_ALIASES[norm]) map[norm] = COLUMN_ALIASES[norm];
  }
  return map;
}

// ── Template download ────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Date",
    "Hours Worked",
    "Overtime Hours",
    "Work Type",
    "Project ID",
    "Notes",
  ];
  const sampleRows = [
    [1, "Mohamed Ali", "2026-03-10", 8, 0, "regular", "", "Regular day"],
    [2, "Sara Yilmaz", "2026-03-10", 10, 2, "overtime", 3, "Project handover"],
    [3, "Kemal Demir", "2026-03-09", 8, 0, "weekend", "", "Weekend shift"],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  // Style header row width
  ws["!cols"] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheets");
  XLSX.writeFile(wb, "timesheet_template.xlsx");
}

// ── Main component ───────────────────────────────────────────────────────────

export function TimesheetUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: TimesheetUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"drop" | "preview" | "result">("drop");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: employees } = trpc.employees.list.useQuery(undefined, { enabled: open });
  const utils = trpc.useUtils();
  const bulkUpload = trpc.timesheets.bulkUpload.useMutation();

  // ── File parsing ──────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls", "csv", "pdf"].includes(ext ?? "")) {
      toast.error("Unsupported file type. Please use .xlsx, .xls, .csv, or .pdf");
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");

    try {
      let rawRows: Record<string, unknown>[] = [];

      if (ext === "pdf") {
        // Read PDF as text and try to parse lines
        const text = await file.text();
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        // Simple heuristic: look for lines with a date pattern and numbers
        const dateRegex = /\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4}/;
        rawRows = lines
          .filter((l) => dateRegex.test(l))
          .map((line) => {
            const parts = line.split(/\s{2,}|\t/);
            return {
              "Employee ID": parts[0],
              "Date": parts[1],
              "Hours Worked": parts[2],
              "Overtime Hours": parts[3],
              "Work Type": parts[4] ?? "regular",
              "Notes": parts.slice(5).join(" "),
            };
          });
        if (rawRows.length === 0) {
          toast.warning("Could not extract structured rows from the PDF. Please use the Excel template for best results.");
          return;
        }
      } else {
        // Excel/CSV
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: false });
      }

      if (rawRows.length === 0) {
        toast.error("The file appears to be empty.");
        return;
      }

      const columns = Object.keys(rawRows[0] || {});
      const headerMap = buildHeaderMap(columns);
      const rows = validateAndParseRows(rawRows, headerMap);
      setParsedRows(rows);
      setStep("preview");
    } catch (err) {
      toast.error("Failed to parse file: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }
    setIsUploading(true);

    // Resolve employee names → IDs
    const empMap = new Map<string, number>();
    if (employees) {
      for (const emp of employees) {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        empMap.set(fullName, emp.id);
        empMap.set(emp.firstName.toLowerCase(), emp.id);
      }
    }

    const rows = validRows
      .map((r) => {
        let eid = r.employeeId;
        if (!eid && r.employeeName) {
          eid = empMap.get(r.employeeName.toLowerCase());
        }
        if (!eid) return null;
        return {
          employeeId: eid,
          date: r.date!,
          hoursWorked: r.hoursWorked,
          overtimeHours: r.overtimeHours,
          workType: r.workType,
          projectId: r.projectId,
          notes: r.notes,
          status: r.status,
        };
      })
      .filter(Boolean) as Parameters<typeof bulkUpload.mutateAsync>[0]["rows"];

    try {
      const ext = (fileName ?? "upload").split(".").pop()?.toLowerCase() ?? "xlsx";
      const res = await bulkUpload.mutateAsync({
        fileName: fileName ?? "upload",
        fileType: ext,
        rows,
      });

      setUploadResult({ inserted: res.inserted, failed: res.failed });
      setStep("result");
      if (res.inserted > 0) {
        utils.timesheets.list.invalidate();
        onSuccess?.();
      }
    } catch (err) {
      toast.error("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep("drop");
    setFileName(null);
    setFileSize(null);
    setParsedRows([]);
    setUploadResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;
  const validCount = parsedRows.length - errorCount;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-[#0d1117] border border-white/10 text-white overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-5 h-5 text-orange-400" />
            Bulk Timesheet Upload
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Import timesheet records from Excel (.xlsx/.xls), CSV, or PDF files
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-white/40 shrink-0 px-0.5">
          {(["drop", "preview", "result"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs
                  ${step === s ? "bg-orange-500 text-white" : "bg-white/10 text-white/30"}`}
              >
                {i + 1}
              </span>
              <span className={step === s ? "text-orange-400" : ""}>
                {s === "drop" ? "Upload File" : s === "preview" ? "Preview & Validate" : "Results"}
              </span>
              {i < 2 && <span className="text-white/20">›</span>}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: DROP ── */}
            {step === "drop" && (
              <motion.div
                key="drop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 py-2"
              >
                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
                    ${isDragging
                      ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
                      : "border-white/15 hover:border-orange-500/50 hover:bg-white/2"
                    }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full transition-colors ${isDragging ? "bg-orange-500/20" : "bg-white/5"}`}>
                      <Upload className={`w-8 h-8 ${isDragging ? "text-orange-400" : "text-white/30"}`} />
                    </div>
                    <div>
                      <p className="text-white/70 font-medium">
                        {isDragging ? "Drop your file here" : "Drag & drop or click to upload"}
                      </p>
                      <p className="text-white/30 text-sm mt-1">Supports .xlsx, .xls, .csv and .pdf</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full">
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> CSV
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full">
                        <FileText className="w-3.5 h-3.5 text-red-400" /> PDF
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template download */}
                <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-xl p-4">
                  <div>
                    <p className="text-sm font-medium text-white/80">Need the template?</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Download a pre-formatted Excel template with sample data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="shrink-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download Template
                  </Button>
                </div>

                {/* Expected column reference */}
                <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <p className="text-xs font-medium text-white/60 mb-3">Supported Column Headers</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white/40">
                    {[
                      { field: "Employee ID / Name", example: "emp_id, Employee, Name" },
                      { field: "Date", example: "Date, Work Date, Day" },
                      { field: "Hours Worked", example: "Hours, Hrs, Total Hours" },
                      { field: "Overtime Hours", example: "Overtime, OT, OT Hours" },
                      { field: "Work Type", example: "regular / overtime / weekend / holiday" },
                      { field: "Project ID", example: "Project, Project ID, Site" },
                      { field: "Notes", example: "Notes, Comments, Remarks" },
                    ].map((c) => (
                      <div key={c.field} className="bg-white/3 rounded-lg p-2">
                        <p className="text-white/70 font-medium text-[11px]">{c.field}</p>
                        <p className="text-white/30 text-[10px] mt-0.5 leading-snug">{c.example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: PREVIEW ── */}
            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3 py-2"
              >
                {/* Summary bar */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/70">{fileName}</span>
                    <span className="text-white/30 text-xs">{fileSize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> {validCount} valid
                    </Badge>
                    {errorCount > 0 && (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" /> {errorCount} errors
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="text-white/40 hover:text-white h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Change file
                    </Button>
                  </div>
                </div>

                {/* Preview table */}
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#161b22]">
                        <tr>
                          {["#", "Employee", "Date", "Hours", "OT", "Work Type", "Status"].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left text-white/40 font-medium whitespace-nowrap border-b border-white/10">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 50).map((row) => {
                          const hasError = row.errors.length > 0;
                          const hasWarning = row.warnings.length > 0 && !hasError;
                          return (
                            <tr
                              key={row.rowIndex}
                              className={`border-b border-white/5 transition-colors
                                ${hasError ? "bg-red-500/5 hover:bg-red-500/8" : hasWarning ? "bg-yellow-500/5 hover:bg-yellow-500/8" : "hover:bg-white/2"}`}
                            >
                              <td className="px-3 py-2 text-white/30">{row.rowIndex}</td>
                              <td className="px-3 py-2">
                                <span className="text-white/70">
                                  {row.employeeId ? `#${row.employeeId}` : row.employeeName ?? <span className="text-red-400">—</span>}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-white/60 whitespace-nowrap">
                                {row.date ? row.date.toLocaleDateString("en-GB") : <span className="text-red-400">—</span>}
                              </td>
                              <td className="px-3 py-2 text-white/70">{row.hoursWorked ?? "—"}</td>
                              <td className="px-3 py-2 text-white/50">{row.overtimeHours ?? "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                                  ${row.workType === "overtime" ? "bg-orange-500/20 text-orange-300"
                                    : row.workType === "weekend" ? "bg-purple-500/20 text-purple-300"
                                    : row.workType === "holiday" ? "bg-red-500/20 text-red-300"
                                    : "bg-blue-500/20 text-blue-300"}`}
                                >
                                  {row.workType}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {hasError ? (
                                  <div className="flex items-center gap-1 text-red-400" title={row.errors.join("; ")}>
                                    <AlertCircle className="w-3 h-3" />
                                    <span className="truncate max-w-24">{row.errors[0]}</span>
                                  </div>
                                ) : hasWarning ? (
                                  <div className="flex items-center gap-1 text-yellow-400" title={row.warnings.join("; ")}>
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="truncate max-w-24">Warning</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-emerald-400">
                                    <CheckCircle className="w-3 h-3" /> OK
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {parsedRows.length > 50 && (
                      <div className="text-center text-white/30 text-xs py-2 bg-white/2">
                        <Eye className="w-3 h-3 inline mr-1" /> Showing first 50 of {parsedRows.length} rows
                      </div>
                    )}
                  </div>
                </div>

                {/* Error list */}
                {errorCount > 0 && (
                  <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 space-y-1 max-h-28 overflow-y-auto">
                    <p className="font-semibold text-red-400 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                      Rows with errors will be skipped ({errorCount} rows)
                    </p>
                    {parsedRows.filter(r => r.errors.length > 0).slice(0, 10).map(r => (
                      <p key={r.rowIndex} className="text-red-300/70">
                        Row {r.rowIndex}: {r.errors.join(", ")}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: RESULT ── */}
            {step === "result" && uploadResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 flex flex-col items-center justify-center gap-4 text-center"
              >
                {uploadResult.inserted > 0 ? (
                  <div className="p-5 rounded-full bg-emerald-500/15">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                ) : (
                  <div className="p-5 rounded-full bg-red-500/15">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold text-white">{uploadResult.inserted} rows imported</p>
                  {uploadResult.failed > 0 && (
                    <p className="text-red-400 text-sm mt-1">{uploadResult.failed} rows failed to insert</p>
                  )}
                  <p className="text-white/40 text-sm mt-2">
                    Imported entries are pending approval in the Timesheets list.
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-white/15 text-white/60 hover:text-white"
                  >
                    Upload Another
                  </Button>
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 flex items-center justify-between pt-3 border-t border-white/8 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-white/40 hover:text-white"
          >
            <X className="w-4 h-4 mr-1.5" /> Cancel
          </Button>
          {step === "preview" && (
            <Button
              onClick={handleImport}
              disabled={isUploading || validCount === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Import {validCount} Rows
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
