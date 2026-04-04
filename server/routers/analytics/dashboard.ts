import { router, protectedProcedure } from "../../lib/trpc";
import * as db from "../../db";
import { cache } from "../../lib/redis";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async () => {
    return cache.getOrSet("analytics:dashboard:stats", async () => {
      const [allProjects, allDocuments, allMaterials, allDeliveries, allTests] = await Promise.all([
        db.getProjects(),
        db.getDocuments(),
        db.getMaterials(),
        db.getDeliveries(),
        db.getQualityTests(),
      ]);

      const activeProjects = allProjects.filter(p => p.status === 'active').length;
      const totalDocuments = allDocuments.length;
      const lowStockMaterials = allMaterials.filter(m => m.quantity <= m.minStock).length;
      const todayDeliveries = allDeliveries.filter(d => {
        const today = new Date();
        const schedDate = new Date(d.scheduledTime);
        return schedDate.toDateString() === today.toDateString();
      }).length;
      const pendingTests = allTests.filter(t => t.status === 'pending').length;

      return {
        activeProjects,
        totalDocuments,
        lowStockMaterials,
        todayDeliveries,
        pendingTests,
        totalProjects: allProjects.length,
        totalMaterials: allMaterials.length,
        totalDeliveries: allDeliveries.length,
      };
    }, 60);
  }),

  deliveryTrends: protectedProcedure.query(async () => {
    return cache.getOrSet("analytics:dashboard:deliveryTrends", async () => {
      const deliveries = await db.getDeliveries();
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      // Group deliveries by month
      const monthlyData: Record<string, { month: string; deliveries: number; volume: number }> = {};

      deliveries.forEach(delivery => {
        const deliveryDate = new Date(delivery.scheduledTime);
        if (deliveryDate >= sixMonthsAgo) {
          const monthKey = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}`;
          const monthName = deliveryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthName, deliveries: 0, volume: 0 };
          }

          monthlyData[monthKey].deliveries++;
          monthlyData[monthKey].volume += delivery.volume;
        }
      });

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    }, 300);
  }),

  materialConsumption: protectedProcedure.query(async () => {
    return cache.getOrSet("analytics:dashboard:materialConsumption", async () => {
      const materials = await db.getMaterials();

      // Get top 6 materials by quantity for the chart
      return materials
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 6)
        .map(m => ({
          name: m.name,
          quantity: m.quantity,
          unit: m.unit,
          minStock: m.minStock,
        }));
    }, 3600); // 1 hour for stock levels
  }),
});
