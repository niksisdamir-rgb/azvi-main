import { relations } from "drizzle-orm";
import { materials, suppliers, materialConsumptionHistory, purchaseOrders, purchaseOrderItems, deliveries } from "./schema";

export const materialsRelations = relations(materials, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [materials.supplierId],
    references: [suppliers.id],
  }),
  consumptionHistory: many(materialConsumptionHistory),
  purchaseOrderItems: many(purchaseOrderItems),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
  purchaseOrders: many(purchaseOrders),
}));

export const materialConsumptionHistoryRelations = relations(materialConsumptionHistory, ({ one }) => ({
  material: one(materials, {
    fields: [materialConsumptionHistory.materialId],
    references: [materials.id],
  }),
  delivery: one(deliveries, {
    fields: [materialConsumptionHistory.deliveryId],
    references: [deliveries.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  material: one(materials, {
    fields: [purchaseOrderItems.materialId],
    references: [materials.id],
  }),
}));
