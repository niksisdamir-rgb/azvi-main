import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, CheckCircle, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export const DeliveryAnalyticsDashboard = React.memo(function DeliveryAnalyticsDashboard() {
  const { data: analytics, isLoading } = trpc.deliveries.getDeliveryAnalytics.useQuery(undefined, {
    refetchInterval: 15000 // refresh every 15 seconds for more "live" feel
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white/5 backdrop-blur-md border-white/10 min-h-[120px]"></Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-black/40 backdrop-blur-xl border-blue-500/30 shadow-lg shadow-blue-500/5 group hover:border-blue-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-100/80">
            Aktivne Isporuke / Active
          </CardTitle>
          <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
            <Truck className="h-4 w-4 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white tracking-tight">{analytics.activeCount}</div>
          <div className="mt-1 h-1 w-full bg-blue-500/10 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: '60%' }}></div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/40 backdrop-blur-xl border-green-500/30 shadow-lg shadow-green-500/5 group hover:border-green-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-100/80">
            Završene / Completed
          </CardTitle>
          <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white tracking-tight">{analytics.completedCount}</div>
          <div className="mt-1 flex items-center text-xs text-green-400/80">
            <span className="font-medium">Total Volume: {analytics.totalCount * 7} m³</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30 shadow-lg shadow-orange-500/5 group hover:border-orange-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-100/80">
            U Vremenu / On Time %
          </CardTitle>
          <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
            <Clock className="h-4 w-4 text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white tracking-tight">
            {analytics.completedCount > 0 ? `${analytics.onTimePercentage}%` : "100%"}
          </div>
          <p className="text-xs text-orange-200/50 mt-1">Stopa uspješnosti / Success rate</p>
        </CardContent>
      </Card>

      <Card className="bg-black/40 backdrop-blur-xl border-red-500/30 shadow-lg shadow-red-500/5 group hover:border-red-500/50 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-100/80">
            Prosječno Vrijeme / Avg Time
          </CardTitle>
          <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
            <Clock className="h-4 w-4 text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white tracking-tight">
             {analytics.averageDeliveryTimeMinutes > 0 ? `${analytics.averageDeliveryTimeMinutes}m` : "N/A"}
          </div>
          <p className="text-xs text-red-200/50 mt-1">Po isporuci / Per delivery</p>
        </CardContent>
      </Card>
    </div>
  );
});
