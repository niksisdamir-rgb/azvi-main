import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  FileText, Package, Truck, FlaskConical, Folder, TrendingUp, 
  AlertCircle, CheckCircle, Clock, ArrowRight, Search, Filter,
  Download, Calendar, BarChart3, Activity
} from "lucide-react";
import { Link } from "wouter";
import { generateDashboardPdfReport } from "@/lib/pdf-generator";
import { generateDashboardExcelReport } from "@/lib/excel-generator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  status?: "normal" | "warning" | "critical";
  onClick?: () => void;
  trend?: number;
}

const StatCard = React.memo(function StatCard({ title, value, subtitle, icon, status = "normal", onClick, trend }: StatCardProps) {
  const statusColors = {
    normal: "border-primary/20 hover:border-primary/40",
    warning: "border-yellow-500/20 hover:border-yellow-500/40",
    critical: "border-red-500/20 hover:border-red-500/40",
  };

  const statusBgColors = {
    normal: "bg-primary/10",
    warning: "bg-yellow-500/10",
    critical: "bg-red-500/10",
  };

  return (
    <GlassCard
      variant="card"
      className={`${statusColors[status]} transition-all cursor-pointer hover:shadow-lg`}
      onClick={onClick}
    >
      <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <GlassCardTitle className="text-sm font-medium">{title}</GlassCardTitle>
        <div className={`p-2 rounded-lg ${statusBgColors[status]}`}>
          {icon}
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend !== undefined && (
            <div className={`text-xs ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </GlassCardContent>
    </GlassCard>
  );
});

const AlertBanner = React.memo(function AlertBanner({ type, title, message }: { type: "warning" | "critical" | "info"; title: string; message: string }) {
  const colors = {
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700",
    critical: "bg-red-500/10 border-red-500/20 text-red-700",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-700",
  };

  const icons = {
    warning: <AlertCircle className="h-5 w-5" />,
    critical: <AlertCircle className="h-5 w-5" />,
    info: <Clock className="h-5 w-5" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${colors[type]}`}>
      {icons[type]}
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
});

const ActivityTimeline = React.memo(function ActivityTimeline({ activities }: { activities: any[] }) {
  return (
    <GlassCard variant="card">
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Nedavne aktivnosti
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nema nedavnih aktivnosti</p>
          ) : (
            activities.map((activity, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-border/50 last:border-0">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    {activity.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
});

const PerformanceMetrics = React.memo(function PerformanceMetrics({ stats }: { stats: any }) {
  return (
    <GlassCard variant="card">
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performanse posljednjih 30 dana
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Iskorišćenost skladišta</span>
            <span className="text-sm font-bold">72%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "72%" }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Stopa uspešnosti isporuke</span>
            <span className="text-sm font-bold">94%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Kvalitet testova</span>
            <span className="text-sm font-bold">89%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: "89%" }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Efikasnost rada</span>
            <span className="text-sm font-bold">85%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: "85%" }}></div>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
});

export default function EnhancedDashboard() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("week");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Učitavanje...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSelectProjects = useCallback(() => setSelectedCard("projects"), []);
  const handleSelectDocuments = useCallback(() => setSelectedCard("documents"), []);
  const handleSelectDeliveries = useCallback(() => setSelectedCard("deliveries"), []);
  const handleSelectMaterials = useCallback(() => setSelectedCard("materials"), []);

  // Mock activities data
  const activities = useMemo(() => [
    { icon: <FileText className="h-4 w-4" />, title: "Novi dokument", description: "Ugovor za projekt A", time: "Pre 2 sata" },
    { icon: <Truck className="h-4 w-4" />, title: "Isporuka završena", description: "Projekat B - 50m³", time: "Pre 5 sati" },
    { icon: <Package className="h-4 w-4" />, title: "Niska zaliha", description: "Cement - samo 15 tona", time: "Pre 1 dana" },
    { icon: <CheckCircle className="h-4 w-4" />, title: "Test prošao", description: "Slump test - 120mm", time: "Pre 1 dana" },
  ], []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Kontrolna tabla</h1>
            <p className="text-white/70">Dobrodošli u AzVirt sistem za upravljanje dokumentima</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-primary/20"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Filteri (uskoro)">
              <Filter className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Preuzmi izveštaj" disabled={statsLoading}>
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => stats && generateDashboardPdfReport(stats)}>
                  Preuzmi kao PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => stats && generateDashboardExcelReport(stats)}>
                  Preuzmi kao Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Alert Banners */}
        <div className="space-y-3">
          {(stats?.lowStockMaterials ?? 0) > 0 && (
            <AlertBanner
              type="warning"
              title="Niska zaliha"
              message={`${stats?.lowStockMaterials} artikala ima nisku zalihu. Preporučuje se dopuna.`}
            />
          )}
          {(stats?.todayDeliveries ?? 0) > 0 && (
            <AlertBanner
              type="info"
              title="Zakazane isporuke"
              message={`Danas je zakazano ${stats?.todayDeliveries} isporuke. Proverite status.`}
            />
          )}
        </div>

        {/* Main Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Aktivni projekti"
            value={stats?.activeProjects ?? 0}
            subtitle={`${stats?.totalProjects ?? 0} ukupno projekata`}
            icon={<Folder className="h-4 w-4 text-primary" />}
            status={stats?.activeProjects ? "normal" : "warning"}
            onClick={handleSelectProjects}
            trend={12}
          />

          <StatCard
            title="Dokumenti"
            value={stats?.totalDocuments ?? 0}
            subtitle="Ukupno sačuvanih fajlova"
            icon={<FileText className="h-4 w-4 text-primary" />}
            status="normal"
            onClick={handleSelectDocuments}
            trend={8}
          />

          <StatCard
            title="Današnje isporuke"
            value={stats?.todayDeliveries ?? 0}
            subtitle="Zakazano za danas"
            icon={<Truck className="h-4 w-4 text-primary" />}
            status={stats?.todayDeliveries ? "warning" : "normal"}
            onClick={handleSelectDeliveries}
          />

          <StatCard
            title="Artikli sa niskim zalihama"
            value={stats?.lowStockMaterials ?? 0}
            subtitle="Potrebna dopuna"
            icon={<Package className="h-4 w-4 text-primary" />}
            status={stats?.lowStockMaterials ? "critical" : "normal"}
            onClick={handleSelectMaterials}
            trend={-5}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard variant="card">
            <GlassCardHeader className="pb-2">
              <GlassCardTitle className="text-sm font-medium">Ukupno materijala</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-2xl font-bold">{stats?.totalMaterials ?? 0}</div>
              <p className="text-xs text-muted-foreground">U skladištu</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="card">
            <GlassCardHeader className="pb-2">
              <GlassCardTitle className="text-sm font-medium">Testovi na čekanju</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats?.pendingTests ?? 0}</div>
              <p className="text-xs text-muted-foreground">Čeka se obrada</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="card">
            <GlassCardHeader className="pb-2">
              <GlassCardTitle className="text-sm font-medium">Ukupno isporuka</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-2xl font-bold">{stats?.totalDeliveries ?? 0}</div>
              <p className="text-xs text-muted-foreground">Sve isporuke</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Quick Actions and Performance */}
        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard variant="card" className="md:col-span-1">
            <GlassCardHeader>
              <GlassCardTitle className="text-base">Brze akcije</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              <Link href="/documents">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Otpremi dokument
                </Button>
              </Link>
              <Link href="/deliveries">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  <Truck className="mr-2 h-4 w-4" />
                  Zakaži isporuku
                </Button>
              </Link>
              <Link href="/quality">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Test kvaliteta
                </Button>
              </Link>
              <Link href="/materials">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  <Package className="mr-2 h-4 w-4" />
                  Upravljaj zalihama
                </Button>
              </Link>
            </GlassCardContent>
          </GlassCard>

          <PerformanceMetrics stats={stats} />
        </div>

        {/* Activity Timeline */}
        <ActivityTimeline activities={activities} />
      </div>
    </DashboardLayout>
  );
}
