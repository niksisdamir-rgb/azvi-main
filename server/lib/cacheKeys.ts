import { cache } from "./redis";

/**
 * Centralized cache key constants.
 * Every key used across the app lives here so invalidation is never guesswork.
 */
export const CACHE_KEYS = {
  userSession: (id: number) => `user_session:${id}`,
  dashboardStats: "analytics:dashboard:stats",
  dashboardTrends: "analytics:dashboard:deliveryTrends",
  dashboardMaterials: "analytics:dashboard:materialConsumption",
  inventoryCost: "analytics:inventory:costAnalysis",
  inventoryTurnover: "analytics:inventory:turnoverRate",
  inventoryAbc: "analytics:inventory:abcAnalysis",
  predictiveQC: (hash: string) => `qc:predict:${hash}`,
} as const;

/**
 * Bulk-invalidate all material-related caches.
 * Called after any material mutation (update, delete, consumption, PO receive).
 */
export async function invalidateMaterialCaches(): Promise<void> {
  await Promise.all([
    cache.del(CACHE_KEYS.dashboardStats),
    cache.del(CACHE_KEYS.dashboardTrends),
    cache.del(CACHE_KEYS.dashboardMaterials),
    cache.del(CACHE_KEYS.inventoryCost),
    cache.del(CACHE_KEYS.inventoryTurnover),
    cache.del(CACHE_KEYS.inventoryAbc),
  ]);
}

/**
 * Invalidate a specific user's session cache.
 * Called after role changes, profile updates, or SMS-settings changes.
 */
export async function invalidateUserCaches(userId: number): Promise<void> {
  await cache.del(CACHE_KEYS.userSession(userId));
}

/**
 * Invalidate dashboard-level caches (stats + delivery trends).
 * Called after delivery or quality-test mutations.
 */
export async function invalidateDashboardCaches(): Promise<void> {
  await Promise.all([
    cache.del(CACHE_KEYS.dashboardStats),
    cache.del(CACHE_KEYS.dashboardTrends),
  ]);
}
