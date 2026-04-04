import { useState } from "react";
import { TimesheetUploadModal } from "@/components/TimesheetUploadModal";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  TrendingUp,
  FileDown,
  Users,
  Clock,
  DollarSign,
  AlarmClock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const ORANGE = "#FF6C0E";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-dialog rounded-xl p-3 shadow-2xl border border-white/10 text-sm">
      <p className="text-white/60 mb-1 text-xs">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.value.toFixed(1)}h
        </p>
      ))}
    </div>
  );
};

export default function TimesheetSummary() {
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [weekStart, setWeekStart] = useState<string>(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split("T")[0];
  });
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);


  const { data: employees } = trpc.employees.list.useQuery({ status: "active" });

  const { data: weeklySummary, isLoading: weeklyLoading } = trpc.timesheets.weeklySummary.useQuery(
    {
      employeeId: selectedEmployee !== "all" ? Number(selectedEmployee) : undefined,
      weekStart: new Date(weekStart),
    },
    { enabled: reportType === "weekly" }
  );

  const { data: monthlySummary, isLoading: monthlyLoading } = trpc.timesheets.monthlySummary.useQuery(
    {
      employeeId: selectedEmployee !== "all" ? Number(selectedEmployee) : undefined,
      year,
      month,
    },
    { enabled: reportType === "monthly" }
  );

  const isLoading = reportType === "weekly" ? weeklyLoading : monthlyLoading;
  const summaryData = reportType === "weekly" ? weeklySummary : monthlySummary;

  // Aggregate stats
  const totalHours = summaryData?.reduce((s, r) => s + (r.totalHours || 0), 0) ?? 0;
  const totalOvertime = summaryData?.reduce((s, r) => s + (r.overtimeHours || 0), 0) ?? 0;
  const totalDays = summaryData?.reduce((s, r) => s + (r.daysWorked || 0), 0) ?? 0;
  const totalPayroll = summaryData?.reduce((sum, row) => {
    const pay = reportType === "monthly" && "hourlyRate" in row && row.hourlyRate
      ? (row.regularHours || 0) * (row.hourlyRate as number) + (row.overtimeHours || 0) * (row.hourlyRate as number) * 1.5
      : 0;
    return sum + pay;
  }, 0) ?? 0;

  // Chart data
  const chartData = summaryData?.map((row) => ({
    name: row.employeeName?.split(" ").slice(-1)[0] || "?",
    Regular: row.regularHours || 0,
    Overtime: row.overtimeHours || 0,
    Weekend: row.weekendHours || 0,
    Holiday: row.holidayHours || 0,
  })) ?? [];

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to export PDF");
      return;
    }

    const title =
      reportType === "weekly"
        ? `Weekly Timesheet — Week of ${format(new Date(weekStart), "MMM dd, yyyy")}`
        : `Monthly Timesheet — ${format(new Date(year, month - 1), "MMMM yyyy")}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4 landscape; margin: 1cm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 18px; border-bottom: 3px solid #FF6C0E; }
            .logo { font-size: 22px; font-weight: 800; color: #111; }
            .logo-accent { color: #FF6C0E; }
            .badge { display: inline-block; background: #FFF0E8; color: #FF6C0E; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-top: 4px; }
            h1 { font-size: 18px; color: #111; font-weight: 700; margin-bottom: 3px; }
            .subtitle { color: #888; font-size: 12px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { padding: 14px 16px; background: #f7f7f7; border-radius: 10px; border-left: 3px solid #FF6C0E; }
            .stat-val { font-size: 20px; font-weight: 700; color: #111; }
            .stat-lbl { font-size: 10px; color: #888; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
            th { background: #FF6C0E; color: white; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; }
            th:first-child { border-radius: 6px 0 0 6px; }
            th:last-child { border-radius: 0 6px 6px 0; }
            td { padding: 9px 12px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) td { background: #fafafa; }
            .total-row td { background: #FFF0E8 !important; font-weight: 700; color: #FF6C0E; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #aaa; text-align: center; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo"><span class="logo-accent">AZ</span>VIRT</div>
              <div class="badge">Document Management System</div>
            </div>
            <div style="text-align:right">
              <h1>${title}</h1>
              <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-val">${summaryData?.length ?? 0}</div>
              <div class="stat-lbl">Employees</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">${totalDays}</div>
              <div class="stat-lbl">Total Days</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">${totalHours.toFixed(1)}h</div>
              <div class="stat-lbl">Total Hours</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">${totalOvertime.toFixed(1)}h</div>
              <div class="stat-lbl">Overtime Hours</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Emp #</th>
                ${reportType === "monthly" ? "<th>Department</th>" : ""}
                <th>Days Worked</th>
                <th>Regular Hrs</th>
                <th>Overtime Hrs</th>
                <th>Weekend Hrs</th>
                <th>Holiday Hrs</th>
                <th>Total Hrs</th>
                ${reportType === "monthly" ? "<th>Rate</th><th>Total Pay</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${summaryData?.map(row => {
                const pay = reportType === "monthly" && "hourlyRate" in row && row.hourlyRate
                  ? (row.regularHours || 0) * (row.hourlyRate as number) + (row.overtimeHours || 0) * (row.hourlyRate as number) * 1.5
                  : 0;
                return `
                  <tr>
                    <td><strong>${row.employeeName}</strong></td>
                    <td>${row.employeeNumber}</td>
                    ${reportType === "monthly" ? `<td>${"department" in row ? (row.department || "—") : "—"}</td>` : ""}
                    <td>${row.daysWorked || 0}</td>
                    <td>${(row.regularHours || 0).toFixed(1)}</td>
                    <td>${(row.overtimeHours || 0).toFixed(1)}</td>
                    <td>${(row.weekendHours || 0).toFixed(1)}</td>
                    <td>${(row.holidayHours || 0).toFixed(1)}</td>
                    <td><strong>${(row.totalHours || 0).toFixed(1)}</strong></td>
                    ${reportType === "monthly" ? `<td>${"hourlyRate" in row && row.hourlyRate ? `$${row.hourlyRate}` : "—"}</td><td><strong>$${pay.toFixed(2)}</strong></td>` : ""}
                  </tr>
                `;
              }).join("") || "<tr><td colspan='10' style='text-align:center;color:#aaa;padding:20px'>No data</td></tr>"}
              ${summaryData && summaryData.length > 1 ? `
                <tr class="total-row">
                  <td colspan="${reportType === "monthly" ? 3 : 2}">TOTALS</td>
                  <td>${totalDays}</td>
                  <td>${summaryData.reduce((s, r) => s + (r.regularHours || 0), 0).toFixed(1)}</td>
                  <td>${totalOvertime.toFixed(1)}</td>
                  <td>${summaryData.reduce((s, r) => s + (r.weekendHours || 0), 0).toFixed(1)}</td>
                  <td>${summaryData.reduce((s, r) => s + (r.holidayHours || 0), 0).toFixed(1)}</td>
                  <td>${totalHours.toFixed(1)}</td>
                  ${reportType === "monthly" ? `<td>—</td><td>$${totalPayroll.toFixed(2)}</td>` : ""}
                </tr>
              ` : ""}
            </tbody>
          </table>

          <div class="footer">
            <p>AzVirt Construction &amp; Concrete Management | Timesheet Report</p>
            <p>This document is automatically generated and shows approved hours only.</p>
          </div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 200); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Summary Reports</h1>
            <p className="text-sm text-white/50 mt-0.5">Aggregated timesheet analytics with payroll calculations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-white/15 text-white/70 hover:text-white hover:bg-white/5 gap-2"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="h-4 w-4 text-orange-400" />
            Upload
          </Button>
          <TimesheetUploadModal
            open={isUploadOpen}
            onOpenChange={setIsUploadOpen}
          />
          <Button
            onClick={exportToPDF}
            disabled={!summaryData || summaryData.length === 0}
            className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20 disabled:opacity-40"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </motion.div>

      {/* Filter Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-dark rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Report Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-sm">Report Type</Label>
            <Select value={reportType} onValueChange={(val) => setReportType(val as "weekly" | "monthly")}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-dialog">
                <SelectItem value="weekly">Weekly Summary</SelectItem>
                <SelectItem value="monthly">Monthly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-sm">Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-dialog">
                <SelectItem value="all">All Employees</SelectItem>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence mode="wait">
            {reportType === "weekly" ? (
              <motion.div
                key="weekly"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-1.5"
              >
                <Label className="text-white/60 text-sm">Week Starting</Label>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-primary/50 h-11"
                />
              </motion.div>
            ) : (
              <>
                <motion.div
                  key="year"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-1.5"
                >
                  <Label className="text-white/60 text-sm">Year</Label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min="2020"
                    max="2030"
                    className="bg-white/5 border-white/10 text-white focus:border-primary/50 h-11"
                  />
                </motion.div>
                <motion.div
                  key="month"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-1.5"
                >
                  <Label className="text-white/60 text-sm">Month</Label>
                  <Select value={month.toString()} onValueChange={(val) => setMonth(Number(val))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dialog">
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <AnimatePresence>
        {summaryData && summaryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              {
                label: "Employees",
                value: summaryData.length,
                icon: Users,
                color: "text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/20",
                suffix: "",
              },
              {
                label: "Days Worked",
                value: totalDays,
                icon: Calendar,
                color: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/20",
                suffix: "d",
              },
              {
                label: "Total Hours",
                value: totalHours.toFixed(1),
                icon: Clock,
                color: "text-primary",
                bg: "bg-primary/10 border-primary/20",
                suffix: "h",
              },
              {
                label: "Overtime",
                value: totalOvertime.toFixed(1),
                icon: AlarmClock,
                color: "text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
                suffix: "h",
              },
              ...(reportType === "monthly"
                ? [{
                    label: "Total Payroll",
                    value: `$${totalPayroll.toFixed(0)}`,
                    icon: DollarSign,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10 border-emerald-500/20",
                    suffix: "",
                  }]
                : []),
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`glass-dark rounded-xl p-5 border ${stat.bg} flex items-center gap-4`}
              >
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color} mt-0.5`}>
                    {stat.value}{stat.suffix}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart + Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-dark rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-base font-semibold text-white mb-1">Hours by Employee</h3>
            <p className="text-xs text-white/40 mb-5">Breakdown of regular vs. overtime</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Regular" fill={ORANGE} opacity={0.85} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Overtime" fill="#f59e0b" opacity={0.85} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Weekend" fill="#8b5cf6" opacity={0.75} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {[
                { label: "Regular", color: ORANGE },
                { label: "Overtime", color: "#f59e0b" },
                { label: "Weekend", color: "#8b5cf6" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-white/50">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`glass-dark rounded-2xl border border-white/10 overflow-hidden ${chartData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Detailed Summary</h3>
              <p className="text-xs text-white/40 mt-0.5">
                {reportType === "weekly"
                  ? `Week of ${format(new Date(weekStart), "MMM dd, yyyy")}`
                  : `${MONTHS[month - 1]} ${year}`}
              </p>
            </div>
            {summaryData && summaryData.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/25">
                {summaryData.length} Employee{summaryData.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/2">
                  {[
                    "Employee",
                    "Emp #",
                    ...(reportType === "monthly" ? ["Dept"] : []),
                    "Days",
                    "Regular",
                    "Overtime",
                    "Weekend",
                    "Holiday",
                    "Total",
                    ...(reportType === "monthly" ? ["Rate", "Pay"] : []),
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-t border-white/5">
                      {[...Array(reportType === "monthly" ? 11 : 9)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-3.5 bg-white/5 rounded-full shimmer" style={{ width: `${50 + Math.random() * 50}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !summaryData || summaryData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={reportType === "monthly" ? 11 : 9}
                      className="px-4 py-16 text-center"
                    >
                      <TrendingUp className="h-10 w-10 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">No approved entries found</p>
                      <p className="text-white/25 text-xs mt-1">
                        Try adjusting the filters or period
                      </p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {summaryData.map((row, idx) => {
                      const totalPay =
                        reportType === "monthly" && "hourlyRate" in row && row.hourlyRate
                          ? (row.regularHours || 0) * (row.hourlyRate as number) +
                            (row.overtimeHours || 0) * (row.hourlyRate as number) * 1.5
                          : 0;

                      const overtimePct = row.totalHours
                        ? Math.round(((row.overtimeHours || 0) / row.totalHours) * 100)
                        : 0;

                      return (
                        <motion.tr
                          key={row.employeeId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="border-t border-white/5 hover:bg-white/2 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                                {row.employeeName?.slice(0, 2).toUpperCase() || "?"}
                              </div>
                              <span className="text-white/90 font-medium text-sm leading-tight">
                                {row.employeeName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-white/50 text-xs font-mono">
                            {row.employeeNumber}
                          </td>
                          {reportType === "monthly" && (
                            <td className="px-4 py-3.5 text-white/60 text-sm">
                              {"department" in row ? (row.department as string || "—") : "—"}
                            </td>
                          )}
                          <td className="px-4 py-3.5 text-white/80 text-sm font-medium">
                            {row.daysWorked || 0}
                          </td>
                          <td className="px-4 py-3.5 text-white/70 text-sm">
                            {(row.regularHours || 0).toFixed(1)}
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            {row.overtimeHours ? (
                              <span className="text-amber-400 font-medium flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {(row.overtimeHours).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-white/60 text-sm">
                            {row.weekendHours ? (row.weekendHours).toFixed(1) : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-white/60 text-sm">
                            {row.holidayHours ? (row.holidayHours).toFixed(1) : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm">
                                {(row.totalHours || 0).toFixed(1)}h
                              </span>
                              {overtimePct > 0 && (
                                <span className="text-xs text-amber-400/70">
                                  +{overtimePct}%OT
                                </span>
                              )}
                            </div>
                          </td>
                          {reportType === "monthly" && (
                            <>
                              <td className="px-4 py-3.5 text-white/60 text-sm">
                                {"hourlyRate" in row && row.hourlyRate ? `$${row.hourlyRate}` : "—"}
                              </td>
                              <td className="px-4 py-3.5">
                                {totalPay > 0 ? (
                                  <span className="text-emerald-400 font-bold text-sm">
                                    ${totalPay.toFixed(0)}
                                  </span>
                                ) : (
                                  <span className="text-white/30 text-sm">—</span>
                                )}
                              </td>
                            </>
                          )}
                        </motion.tr>
                      );
                    })}

                    {/* Totals row */}
                    {summaryData.length > 1 && (
                      <tr className="border-t-2 border-primary/30 bg-primary/5">
                        <td
                          className="px-4 py-3.5 font-bold text-primary text-sm"
                          colSpan={reportType === "monthly" ? 3 : 2}
                        >
                          TOTALS
                        </td>
                        <td className="px-4 py-3.5 text-primary font-bold text-sm">{totalDays}</td>
                        <td className="px-4 py-3.5 text-primary font-bold text-sm">
                          {summaryData.reduce((s, r) => s + (r.regularHours || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-4 py-3.5 text-primary font-bold text-sm">
                          {totalOvertime.toFixed(1)}
                        </td>
                        <td className="px-4 py-3.5 text-primary font-bold text-sm">
                          {summaryData.reduce((s, r) => s + (r.weekendHours || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-4 py-3.5 text-primary font-bold text-sm">
                          {summaryData.reduce((s, r) => s + (r.holidayHours || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-4 py-3.5 text-primary font-bold text-sm">
                          {totalHours.toFixed(1)}h
                        </td>
                        {reportType === "monthly" && (
                          <>
                            <td className="px-4 py-3.5" />
                            <td className="px-4 py-3.5 text-primary font-bold text-sm">
                              ${totalPayroll.toFixed(0)}
                            </td>
                          </>
                        )}
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
