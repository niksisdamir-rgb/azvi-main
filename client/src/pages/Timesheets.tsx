import { useState } from "react";
import { TimesheetUploadModal } from "@/components/TimesheetUploadModal";
import { UploadHistoryDrawer } from "@/components/UploadHistoryDrawer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Clock,
  Play,
  Square,
  Check,
  X,
  Plus,
  Filter,
  Users,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Timer,
  ChevronDown,
  Upload,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    className: "bg-red-500/15 text-red-400 border border-red-500/25",
  },
};

const WORK_TYPE_CONFIG = {
  regular: { label: "Regular", color: "bg-blue-500/15 text-blue-400" },
  overtime: { label: "Overtime", color: "bg-orange-500/15 text-orange-400" },
  weekend: { label: "Weekend", color: "bg-purple-500/15 text-purple-400" },
  holiday: { label: "Holiday", color: "bg-rose-500/15 text-rose-400" },
};

export default function Timesheets() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: timesheets, isLoading, refetch } = trpc.timesheets.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter as any } : undefined
  );

  const { data: employees } = trpc.employees.list.useQuery({ status: "active" });
  const { data: projects } = trpc.projects.list.useQuery();

  const clockInMutation = trpc.timesheets.clockIn.useMutation({
    onSuccess: () => {
      toast.success("Clocked in successfully");
      refetch();
    },
    onError: (error) => toast.error(`Failed to clock in: ${error.message}`),
  });

  const clockOutMutation = trpc.timesheets.clockOut.useMutation({
    onSuccess: () => {
      toast.success("Clocked out successfully");
      refetch();
    },
    onError: (error) => toast.error(`Failed to clock out: ${error.message}`),
  });

  const createMutation = trpc.timesheets.create.useMutation({
    onSuccess: () => {
      toast.success("Timesheet entry added successfully");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(`Failed to add entry: ${error.message}`),
  });

  const approveMutation = trpc.timesheets.approve.useMutation({
    onSuccess: () => { toast.success("Timesheet approved"); refetch(); },
    onError: (error) => toast.error(`Failed to approve: ${error.message}`),
  });

  const rejectMutation = trpc.timesheets.reject.useMutation({
    onSuccess: () => { toast.success("Timesheet rejected"); refetch(); },
    onError: (error) => toast.error(`Failed to reject: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get("date") as string;
    const startTimeStr = formData.get("startTime") as string;
    const endTimeStr = formData.get("endTime") as string;
    const startTime = new Date(`${dateStr}T${startTimeStr}`);
    const endTime = endTimeStr ? new Date(`${dateStr}T${endTimeStr}`) : undefined;
    let hoursWorked = 0;
    if (endTime) {
      hoursWorked = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10;
    }
    createMutation.mutate({
      employeeId: Number(formData.get("employeeId")),
      date: new Date(dateStr),
      startTime,
      endTime,
      hoursWorked,
      workType: (formData.get("workType") as any) || "regular",
      projectId: formData.get("projectId") ? Number(formData.get("projectId")) : undefined,
      notes: formData.get("notes") as string || undefined,
      status: "pending",
    });
  };

  const calculateHours = (startTime: Date, endTime: Date | null) => {
    if (!endTime) return null;
    return (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
  };

  const activeEntry = timesheets?.find(t => !t.endTime && t.employeeId === selectedEmployee);

  // Summary stats
  const stats = {
    total: timesheets?.length ?? 0,
    pending: timesheets?.filter(t => t.status === "pending").length ?? 0,
    approved: timesheets?.filter(t => t.status === "approved").length ?? 0,
    totalHours: timesheets?.reduce((sum, t) => {
      const h = calculateHours(t.startTime, t.endTime);
      return sum + (h ?? 0);
    }, 0) ?? 0,
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Timesheets</h1>
              <p className="text-sm text-white/50 mt-0.5">Track employee work hours and manage approvals</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-white/15 text-white/70 hover:text-white hover:bg-white/5 gap-2"
            onClick={() => setIsHistoryOpen(true)}
          >
            <History className="h-4 w-4 text-white/40" />
            History
          </Button>
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
          <UploadHistoryDrawer
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>

          <DialogContent className="glass-dialog max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">Add Timesheet Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Employee *</Label>
                <Select name="employeeId" required>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="glass-dialog">
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Date *</Label>
                  <Input name="date" type="date" required className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Work Type</Label>
                  <Select name="workType" defaultValue="regular">
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dialog">
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="overtime">Overtime</SelectItem>
                      <SelectItem value="weekend">Weekend</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Start Time *</Label>
                  <Input name="startTime" type="time" required className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">End Time</Label>
                  <Input name="endTime" type="time" className="bg-white/5 border-white/10 text-white focus:border-primary/50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Project</Label>
                <Select name="projectId">
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50">
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent className="glass-dialog">
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Notes</Label>
                <Input name="notes" placeholder="Optional notes..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1 border-white/10 text-white/70 hover:bg-white/5">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  {createMutation.isPending ? "Adding..." : "Add Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </motion.div>


      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Entries", value: stats.total, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Pending Review", value: stats.pending, icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Total Hours", value: `${stats.totalHours.toFixed(1)}h`, icon: Timer, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`glass-dark rounded-xl p-4 border ${stat.bg} flex items-center gap-3`}
          >
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-white/50">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Clock In/Out Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-dark rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-5">
          <Timer className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Quick Clock In / Out</h2>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <Label className="text-white/60 text-sm flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Select Employee
            </Label>
            <Select
              value={selectedEmployee?.toString() || ""}
              onValueChange={(val) => setSelectedEmployee(Number(val))}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50 h-11">
                <SelectValue placeholder="Choose an employee..." />
              </SelectTrigger>
              <SelectContent className="glass-dialog">
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.firstName} {emp.lastName} — {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence mode="wait">
            {activeEntry ? (
              <motion.div
                key="clock-out"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  onClick={() => clockOutMutation.mutate({ id: activeEntry.id })}
                  disabled={clockOutMutation.isPending}
                  className="h-11 px-6 bg-red-500/80 hover:bg-red-500 text-white border border-red-400/30 shadow-lg shadow-red-500/20 gap-2"
                >
                  <Square className="h-4 w-4" />
                  Clock Out
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="clock-in"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  onClick={() => selectedEmployee && clockInMutation.mutate({ employeeId: selectedEmployee })}
                  disabled={!selectedEmployee || clockInMutation.isPending}
                  className="h-11 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Clock In
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {activeEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm text-emerald-400 font-medium">
                  Currently clocked in since <span className="font-bold">{format(new Date(activeEntry.startTime), "HH:mm")}</span>
                </p>
                <span className="text-white/40 text-xs ml-auto">
                  {format(new Date(activeEntry.date), "MMM dd, yyyy")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              statusFilter === status
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-white/40 text-sm">
          {timesheets?.length ?? 0} entries
        </span>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-dark rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["Employee", "Date", "Schedule", "Hours", "Type", "Project", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-white/5 rounded-full shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !timesheets || timesheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Clock className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No timesheet entries found</p>
                    <p className="text-white/25 text-xs mt-1">
                      {statusFilter !== "all" ? `No ${statusFilter} entries` : "Add your first entry above"}
                    </p>
                  </td>
                </tr>
              ) : (
                timesheets.map((entry, idx) => {
                  const employee = employees?.find(e => e.id === entry.employeeId);
                  const project = projects?.find(p => p.id === entry.projectId);
                  const hours = calculateHours(entry.startTime, entry.endTime);
                  const statusCfg = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG];
                  const workTypeCfg = WORK_TYPE_CONFIG[entry.workType as keyof typeof WORK_TYPE_CONFIG];
                  const StatusIcon = statusCfg?.icon;

                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                            {employee
                              ? `${employee.firstName[0]}${employee.lastName[0]}`
                              : "?"}
                          </div>
                          <span className="text-white/90 font-medium text-sm">
                            {employee ? `${employee.firstName} ${employee.lastName}` : `#${entry.employeeId}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-white/70 text-sm">
                        {format(new Date(entry.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-white/70">
                          <span className="font-mono">{format(new Date(entry.startTime), "HH:mm")}</span>
                          <span className="text-white/30 mx-1.5">→</span>
                          <span className="font-mono">
                            {entry.endTime ? format(new Date(entry.endTime), "HH:mm") : (
                              <span className="text-emerald-400 animate-pulse">Live</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {hours !== null ? (
                          <span className="text-white font-semibold text-sm">
                            {hours.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-white/30 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${workTypeCfg?.color ?? "bg-white/10 text-white/60"}`}>
                          {workTypeCfg?.label ?? entry.workType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {project ? (
                          <div className="flex items-center gap-1.5 text-sm text-white/70">
                            <Briefcase className="h-3.5 w-3.5 text-white/30" />
                            {project.name}
                          </div>
                        ) : (
                          <span className="text-white/25 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusCfg?.className}`}>
                          {StatusIcon && <StatusIcon className="h-3 w-3" />}
                          {statusCfg?.label}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {user?.role === "admin" && entry.status === "pending" && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => approveMutation.mutate({ id: entry.id })}
                              disabled={approveMutation.isPending}
                              title="Approve"
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate({ id: entry.id })}
                              disabled={rejectMutation.isPending}
                              title="Reject"
                              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
