import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { LOGIN_PATH } from "@/const";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import DeliveryTrendsChart from "@/components/DeliveryTrendsChart";
import MaterialConsumptionChart from "@/components/MaterialConsumptionChart";
import DashboardFilters from "@/components/DashboardFilters";
import {
  FileText, Package, Truck, FlaskConical, Folder, TrendingUp,
  AlertCircle, CheckCircle, Clock, Search, Filter, Download, Activity
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
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
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/azvirt-35years-bg.webp)' }}
      >
        <div className="text-center max-w-2xl bg-black/40 backdrop-blur-sm p-12 rounded-2xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
            AzVirt DMS
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8 drop-shadow-lg">
            Sistem za upravljanje dokumentima za izvrsnost u građevinarstvu
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6 bg-orange-600 hover:bg-orange-700">
            <Link href={LOGIN_PATH}>Prijavite se za nastavak</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <main className="space-y-6">
        {/* Enhanced Header with Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Kontrolna tabla</h1>
            <p className="text-white/70">Dobrodošli u AzVirt sistem za upravljanje dokumentima</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Pretraži..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-primary/20"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <DashboardFilters
            onFilterChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Alert Banners */}
        <div className="space-y-3">
          {(stats?.lowStockMaterials ?? 0) > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Niska zaliha</h3>
                <p className="text-sm">{stats?.lowStockMaterials} artikala ima nisku zalihu. Preporučuje se dopuna.</p>
              </div>
            </div>
          )}
          {(stats?.todayDeliveries ?? 0) > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-700">
              <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Zakazane isporuke</h3>
                <p className="text-sm">Danas je zakazano {stats?.todayDeliveries} isporuke. Proverite status.</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/projects">
            <GlassCard variant="card" className="hover:border-primary/40 transition-all cursor-pointer hover:shadow-lg">
              <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <GlassCardTitle className="text-sm font-medium">Aktivni projekti</GlassCardTitle>
                <Folder className="h-4 w-4 text-primary" />
              </GlassCardHeader>
              <GlassCardContent>
                <div className="text-2xl font-bold">{stats?.activeProjects ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalProjects ?? 0} ukupno projekata
                </p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/documents">
            <GlassCard variant="card" className="hover:border-primary/40 transition-all cursor-pointer hover:shadow-lg">
              <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <GlassCardTitle className="text-sm font-medium">Dokumenti</GlassCardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </GlassCardHeader>
              <GlassCardContent>
                <div className="text-2xl font-bold">{stats?.totalDocuments ?? 0}</div>
                <p className="text-xs text-muted-foreground">Ukupno sačuvanih fajlova</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/deliveries">
            <GlassCard variant="card" className={`transition-all cursor-pointer hover:shadow-lg ${(stats?.todayDeliveries ?? 0) > 0
                ? "border-yellow-500/20 hover:border-yellow-500/40"
                : "hover:border-primary/40"
              }`}>
              <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <GlassCardTitle className="text-sm font-medium">Današnje isporuke</GlassCardTitle>
                <Truck className={`h-4 w-4 ${(stats?.todayDeliveries ?? 0) > 0 ? "text-yellow-500" : "text-primary"}`} />
              </GlassCardHeader>
              <GlassCardContent>
                <div className="text-2xl font-bold">{stats?.todayDeliveries ?? 0}</div>
                <p className="text-xs text-muted-foreground">Zakazano za danas</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/materials">
            <GlassCard variant="card" className={`transition-all cursor-pointer hover:shadow-lg ${(stats?.lowStockMaterials ?? 0) > 0
                ? "border-red-500/20 hover:border-red-500/40"
                : "hover:border-primary/40"
              }`}>
              <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <GlassCardTitle className="text-sm font-medium">Artikli sa niskim zalihama</GlassCardTitle>
                <Package className={`h-4 w-4 ${(stats?.lowStockMaterials ?? 0) > 0 ? "text-red-500" : "text-primary"}`} />
              </GlassCardHeader>
              <GlassCardContent>
                <div className="text-2xl font-bold">{stats?.lowStockMaterials ?? 0}</div>
                <p className="text-xs text-muted-foreground">Potrebna dopuna</p>
              </GlassCardContent>
            </GlassCard>
          </Link>
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

        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard variant="card" className="hover:border-primary/40 transition-colors">
            <GlassCardHeader>
              <GlassCardTitle>Brze akcije</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="grid gap-4">
              <Link href="/documents">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <FileText className="mr-2 h-5 w-5" />
                  Otpremi dokument
                </Button>
              </Link>
              <Link href="/deliveries">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Truck className="mr-2 h-5 w-5" />
                  Zakaži isporuku
                </Button>
              </Link>
              <Link href="/quality">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <FlaskConical className="mr-2 h-5 w-5" />
                  Zabilježi test kvaliteta
                </Button>
              </Link>
              <Link href="/materials">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Package className="mr-2 h-5 w-5" />
                  Upravljaj zalihama
                </Button>
              </Link>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="card" className="hover:border-primary/40 transition-colors">
            <GlassCardHeader>
              <GlassCardTitle>Pregled sistema</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ukupno materijala</span>
                <span className="font-medium">{stats?.totalMaterials ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ukupno isporuka</span>
                <span className="font-medium">{stats?.totalDeliveries ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Testovi na čekanju</span>
                <span className="font-medium">{stats?.pendingTests ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Aktivni projekti</span>
                <span className="font-medium">{stats?.activeProjects ?? 0}</span>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <DeliveryTrendsChart />
          <MaterialConsumptionChart />
        </div>
      </main>
    </DashboardLayout>
  );
}
