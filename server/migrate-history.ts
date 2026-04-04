import postgres from "postgres";

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found");
    process.exit(1);
  }

  const sql = postgres(connectionString);
  console.log("Connected to database, running migration...");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "timesheetUploadHistory" (
        "id" serial PRIMARY KEY NOT NULL,
        "uploadedBy" integer NOT NULL,
        "fileName" varchar(512) NOT NULL,
        "fileType" varchar(32) NOT NULL,
        "totalRows" integer DEFAULT 0 NOT NULL,
        "insertedRows" integer DEFAULT 0 NOT NULL,
        "failedRows" integer DEFAULT 0 NOT NULL,
        "errors" jsonb DEFAULT '[]'::jsonb,
        "status" varchar(32) DEFAULT 'completed' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("Successfully created timesheetUploadHistory table.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
