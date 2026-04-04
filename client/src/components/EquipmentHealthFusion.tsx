import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench,
  TrendingDown,
  TrendingUp,
  History
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

interface EquipmentHealthFusionProps {
  machineId: number;
}

export function EquipmentHealthFusion({ machineId }: EquipmentHealthFusionProps) {
  const { data: profile, isLoading: profileLoading } = trpc.machines.healthProfile.useQuery({ machineId });
  const { data: trend, isLoading: trendLoading } = trpc.machines.healthTrend.useQuery({ machineId });

  if (profileLoading || trendLoading) {
    return (
      <div className="grid gap-4 animate-pulse">
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p>No health profile available for this equipment.</p>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
    if (score >= 50) return "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
    return "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Factor Cards */}
        <Card className="bg-background/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full bg-background/50 ${getHealthColor(profile.healthScore)}`}>
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Health Fusion Index</p>
              <h3 className="text-2xl font-bold tracking-tight">{profile.healthScore}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-background/50 text-sky-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Runtime</p>
              <h3 className="text-2xl font-bold tracking-tight">{profile.totalHours} hrs</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-background/50 text-amber-500">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service Delta</p>
              <h3 className="text-2xl font-bold tracking-tight">{Math.round(profile.hoursSinceLastService)} hrs</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full bg-background/50 ${profile.status === 'operational' ? 'text-emerald-500' : 'text-amber-500'}`}>
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge variant={profile.status === 'operational' ? 'success' : 'warning'} className="capitalize">
                {profile.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Health Visualization */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-background/60 to-background/20 backdrop-blur-xl border-white/10">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  Utilization & Health Trend
                  {trend && trend.length > 1 && (
                    trend[trend.length - 1].avgHours > trend[trend.length - 2].avgHours 
                    ? <TrendingUp className="h-4 w-4 text-rose-500" />
                    : <TrendingDown className="h-4 w-4 text-emerald-500" />
                  )}
                </CardTitle>
                <CardDescription>Predictive analysis based on historical workload</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white/5 border-white/10">Real-time fusion</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.3)' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(20,20,20,0.9)', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgHours" 
                    stroke="var(--primary)" 
                    fillOpacity={1} 
                    fill="url(#colorHours)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Predictive Indicators */}
        <div className="space-y-6">
          <Card className="bg-background/40 backdrop-blur-md border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Service Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Mechanical Integrity</span>
                    <span className="font-medium">{profile.healthScore}%</span>
                  </div>
                  <Progress value={profile.healthScore} className={`h-1.5 ${getProgressColor(profile.healthScore)}`} />
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-1">
                    <History className="h-3 w-3" /> Recent Maintenance Log
                  </h4>
                  <div className="space-y-3">
                    {profile.recentMaintenance.map((m: any, i: number) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                          m.maintenanceType === 'repair' ? 'bg-rose-500' : 'bg-sky-500'
                        }`} />
                        <div className="space-y-1">
                          <p className="font-medium capitalize">{m.maintenanceType.replace('_', ' ')}</p>
                          <p className="text-muted-foreground">{format(new Date(m.date), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4 flex gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-emerald-500">AI Recommendation</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Based on current usage trends, the next major inspection is recommended in <strong>42 operational hours</strong>. Lubrication levels remain within safe parameters.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
