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
import DashboardCustomizer from "@/components/DashboardCustomizer";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import {
  FileText, Package, Truck, FlaskConical, Folder, TrendingUp,
  AlertCircle, CheckCircle, Clock, Search, Filter, Download, Activity,
  Settings
} from "lucide-react";
import { Link } from "wouter";

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  width: "full" | "half" | "third" | "quarter";
}

function Widget({ title, children, width }: WidgetProps) {
  const widthClass = {
    full: "md:col-span-4",
    half: "md:col-span-2",
    third: "md:col-span-1 lg:col-span-1",
    quarter: "md:col-span-1",
  }[width];

  return (
    <GlassCard variant="card" className={`hover:border-primary/40 transition-all ${widthClass}`}>
      <GlassCardHeader className="pb-3">
        <GlassCardTitle className="text-base">{title}</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>{children}</GlassCardContent>
    </GlassCard>
  );
}

export default function CustomizableDashboard() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [filters, setFilters] = useState({});

  const { visibleWidgets, isLoading: widgetsLoading } = useDashboardWidgets();

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
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Kontrolna tabla</h1>
            <p className="text-white/70">Prilagođena kontrolna tabla za vašu radnu toku</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowCustomizer(true)}
            >
              <Settings className="h-4 w-4" />
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

        {/* Dynamic Widget Grid */}
        {!widgetsLoading && (
          <div className="grid gap-4 grid-cols-4 auto-rows-max">
            {visibleWidgets.map((widget) => {
              switch (widget.id) {
                case "projects":
                  return (
                    <Link key={widget.id} href="/projects">
                      <Widget id={widget.id} title={widget.title} width={widget.width}>
                        <div className="text-2xl font-bold">{stats?.activeProjects ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats?.totalProjects ?? 0} ukupno projekata
                        </p>
                      </Widget>
                    </Link>
                  );

                case "documents":
                  return (
                    <Link key={widget.id} href="/documents">
                      <Widget id={widget.id} title={widget.title} width={widget.width}>
                        <div className="text-2xl font-bold">{stats?.totalDocuments ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Ukupno sačuvanih fajlova</p>
                      </Widget>
                    </Link>
                  );

                case "deliveries":
                  return (
                    <Link key={widget.id} href="/deliveries">
                      <Widget id={widget.id} title={widget.title} width={widget.width}>
                        <div className="text-2xl font-bold">{stats?.todayDeliveries ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Zakazano za danas</p>
                      </Widget>
                    </Link>
                  );

                case "materials":
                  return (
                    <Link key={widget.id} href="/materials">
                      <Widget id={widget.id} title={widget.title} width={widget.width}>
                        <div className="text-2xl font-bold">{stats?.lowStockMaterials ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Potrebna dopuna</p>
                      </Widget>
                    </Link>
                  );

                case "stats-materials":
                  return (
                    <Widget key={widget.id} id={widget.id} title={widget.title} width={widget.width}>
                      <div className="text-2xl font-bold">{stats?.totalMaterials ?? 0}</div>
                      <p className="text-xs text-muted-foreground">U skladištu</p>
                    </Widget>
                  );

                case "stats-tests":
                  return (
                    <Widget key={widget.id} id={widget.id} title={widget.title} width={widget.width}>
                      <div className="text-2xl font-bold text-yellow-500">{stats?.pendingTests ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Čeka se obrada</p>
                    </Widget>
                  );

                case "stats-deliveries":
                  return (
                    <Widget key={widget.id} id={widget.id} title={widget.title} width={widget.width}>
                      <div className="text-2xl font-bold">{stats?.totalDeliveries ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Sve isporuke</p>
                    </Widget>
                  );

                case "quick-actions":
                  return (
                    <GlassCard key={widget.id} variant="card" className="md:col-span-2">
                      <GlassCardHeader className="pb-2">
                        <GlassCardTitle className="text-base">Brze akcije</GlassCardTitle>
                      </GlassCardHeader>
                      <GlassCardContent className="grid gap-4">
                        <Link href="/documents">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Otpremi dokument
                          </Button>
                        </Link>
                        <Link href="/deliveries">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Truck className="mr-2 h-4 w-4" />
                            Zakaži isporuku
                          </Button>
                        </Link>
                        <Link href="/quality">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Zabilježi test
                          </Button>
                        </Link>
                        <Link href="/materials">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Package className="mr-2 h-4 w-4" />
                            Upravljaj zalihama
                          </Button>
                        </Link>
                      </GlassCardContent>
                    </GlassCard>
                  );

                case "system-overview":
                  return (
                    <GlassCard key={widget.id} variant="card" className="md:col-span-2">
                      <GlassCardHeader className="pb-2">
                        <GlassCardTitle className="text-base">Pregled sistema</GlassCardTitle>
                      </GlassCardHeader>
                      <GlassCardContent className="space-y-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Ukupno materijala</span>
                          <span className="font-medium">{stats?.totalMaterials ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Ukupno isporuka</span>
                          <span className="font-medium">{stats?.totalDeliveries ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Testovi na čekanju</span>
                          <span className="font-medium">{stats?.pendingTests ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Aktivni projekti</span>
                          <span className="font-medium">{stats?.activeProjects ?? 0}</span>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  );

                case "delivery-trends":
                  return (
                    <div key={widget.id} className="md:col-span-2">
                      <DeliveryTrendsChart />
                    </div>
                  );

                case "material-consumption":
                  return (
                    <div key={widget.id} className="md:col-span-2">
                      <MaterialConsumptionChart />
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        )}

        {widgetsLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Učitavanje vidžeta...
          </div>
        )}
      </div>

      {/* Customizer Modal */}
      {showCustomizer && (
        <DashboardCustomizer onClose={() => setShowCustomizer(false)} />
      )}
    </DashboardLayout>
  );
}
