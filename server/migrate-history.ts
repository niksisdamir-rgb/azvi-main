import { logger } from './lib/logger';
import { getDb } from "./db/setup";
import { timesheetUploadHistory } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    logger.error("No DATABASE_URL found");
    process.exit(1);
  }

  logger.info("Connected to database, running migration...");

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "timesheetUploadHistory" (
        "id" serial PRIMARY KEY NOT NULL,
        "filename" text NOT NULL,
        "uploadedAt" timestamp DEFAULT now() NOT NULL,
        "processedCount" integer DEFAULT 0 NOT NULL,
        "errorCount" integer DEFAULT 0 NOT NULL,
        "status" text DEFAULT 'processing' NOT NULL,
        "summary" text,
        "errorLog" jsonb,
        "uploadedBy" integer
      );
    `);
    
    logger.info("Successfully created timesheetUploadHistory table.");
  } catch (err) {
    logger.error({ err }, "Migration failed:");
    process.exit(1);
  }
}

main().catch(err => {
  logger.error({ err }, "Unexpected error:");
  process.exit(1);
});
