import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "../lib/trpc";
import { format } from "date-fns";
import { useState } from "react";

interface UploadHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadError = { rowIndex: number; error: string };

function FileIcon({ type }: { type: string }) {
  const ext = type?.toLowerCase();
  if (ext === "csv") return <FileText className="w-4 h-4 text-blue-400" />;
  if (ext === "pdf") return <FileText className="w-4 h-4 text-red-400" />;
  return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        <CheckCircle className="w-3 h-3" /> Completed
      </span>
    );
  if (status === "partial")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
        <AlertTriangle className="w-3 h-3" /> Partial
      </span>
    );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
      <AlertCircle className="w-3 h-3" /> Failed
    </span>
  );
}

export function UploadHistoryDrawer({ open, onOpenChange }: UploadHistoryDrawerProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: history, isLoading } = trpc.timesheets.uploadHistory.useQuery(
    { limit: 100 },
    { enabled: open, refetchOnWindowFocus: false }
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col bg-[#0d1117] border-l border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/25">
                  <History className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Upload History</h2>
                  <p className="text-xs text-white/40 mt-0.5">Bulk timesheet import audit log</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-white/3 border border-white/8 shimmer"
                    />
                  ))}
                </div>
              ) : !history || history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="p-5 rounded-full bg-white/3 border border-white/8 mb-4">
                    <History className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm font-medium">No uploads yet</p>
                  <p className="text-white/25 text-xs mt-1">
                    Bulk imports will appear here with full audit details
                  </p>
                </div>
              ) : (
                history.map((record) => {
                  const errors = (record.errors as UploadError[]) ?? [];
                  const isExpanded = expandedId === record.id;
                  const successRate =
                    record.totalRows > 0
                      ? Math.round((record.insertedRows / record.totalRows) * 100)
                      : 0;

                  return (
                    <motion.div
                      key={record.id}
                      layout
                      className="rounded-xl border border-white/8 bg-white/2 overflow-hidden"
                    >
                      {/* Card header */}
                      <button
                        className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-white/3 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      >
                        <FileIcon type={record.fileType} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-white/90 truncate">
                              {record.fileName}
                            </p>
                            <StatusBadge status={record.status} />
                          </div>
                          <p className="text-xs text-white/40">
                            {format(new Date(record.createdAt), "MMM dd, yyyy · h:mm a")}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${successRate}%` }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className={`h-full rounded-full ${
                                  record.status === "completed"
                                    ? "bg-emerald-500"
                                    : record.status === "partial"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              />
                            </div>
                            <span className="text-xs text-white/40 shrink-0">
                              {record.insertedRows}/{record.totalRows} rows
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-white/30 mt-0.5">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Expanded: stats + errors */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="expanded"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3 border-t border-white/8 pt-3">
                              {/* Stats row */}
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: "Total", value: record.totalRows, color: "text-white/70" },
                                  { label: "Inserted", value: record.insertedRows, color: "text-emerald-400" },
                                  { label: "Failed", value: record.failedRows, color: "text-red-400" },
                                ].map((s) => (
                                  <div
                                    key={s.label}
                                    className="bg-white/3 rounded-lg p-2.5 text-center border border-white/6"
                                  >
                                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                    <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Errors */}
                              {errors.length > 0 && (
                                <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3 max-h-36 overflow-y-auto">
                                  <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Row errors
                                  </p>
                                  <div className="space-y-1">
                                    {errors.map((e, i) => (
                                      <p key={i} className="text-xs text-red-300/70">
                                        <span className="text-red-300/50">Row {e.rowIndex}:</span>{" "}
                                        {e.error}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <p className="text-xs text-white/25">
                                File type: .{record.fileType?.toUpperCase()}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {history && history.length > 0 && (
              <div className="shrink-0 px-5 py-3 border-t border-white/8">
                <p className="text-xs text-white/25 text-center">
                  Showing last {history.length} upload{history.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
