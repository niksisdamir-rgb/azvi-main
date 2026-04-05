ALTER TABLE "material_consumption_history" RENAME COLUMN "material_id" TO "materialId";
ALTER TABLE "material_consumption_history" RENAME COLUMN "quantity_used" TO "quantityUsed";
ALTER TABLE "material_consumption_history" RENAME COLUMN "delivery_id" TO "deliveryId";

ALTER TABLE "purchase_orders" RENAME COLUMN "supplier_id" TO "supplierId";
ALTER TABLE "purchase_orders" RENAME COLUMN "order_date" TO "orderDate";
ALTER TABLE "purchase_orders" RENAME COLUMN "expected_delivery" TO "expectedDelivery";
ALTER TABLE "purchase_orders" RENAME COLUMN "total_cost" TO "totalCost";

ALTER TABLE "purchase_order_items" RENAME COLUMN "purchase_order_id" TO "purchaseOrderId";
ALTER TABLE "purchase_order_items" RENAME COLUMN "material_id" TO "materialId";
ALTER TABLE "purchase_order_items" RENAME COLUMN "unit_price" TO "unitPrice";

ALTER TABLE "materials" RENAME COLUMN "lead_time_days" TO "leadTimeDays";
ALTER TABLE "materials" RENAME COLUMN "reorder_point" TO "reorderPoint";
ALTER TABLE "materials" RENAME COLUMN "optimal_order_quantity" TO "optimalOrderQuantity";
ALTER TABLE "materials" RENAME COLUMN "supplier_id" TO "supplierId";
ALTER TABLE "materials" RENAME COLUMN "last_order_date" TO "lastOrderDate";

ALTER TABLE "suppliers" RENAME COLUMN "lead_time" TO "leadTimeDays";
