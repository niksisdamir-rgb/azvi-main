ALTER TABLE "deliveries" ALTER COLUMN "deliveryPhotos" SET DATA TYPE jsonb USING "deliveryPhotos"::jsonb;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "etaUpdatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "delivery_status_history" ADD COLUMN "userId" integer;--> statement-breakpoint
ALTER TABLE "delivery_status_history" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "delivery_status_history" ADD COLUMN "longitude" double precision;--> statement-breakpoint
CREATE INDEX "delivery_status_scheduled_time_idx" ON "deliveries" USING btree ("status","scheduledTime");