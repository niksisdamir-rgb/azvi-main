import { getDb } from "./server/db/setup";

async function verify() {
  console.log("🔍 Verifying Drizzle Relations...");
  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed.");
    process.exit(1);
  }

  try {
    // Try to fetch a project with its relations
    // This will fail at compile time if relations are NOT correctly defined
    const projectsWithRelations = await db.query.projects.findMany({
      limit: 1,
      with: {
        creator: true,
        documents: true,
        deliveries: true,
      },
    });

    console.log("✅ Success: Relational query for Projects executed.");
    console.log(`Found ${projectsWithRelations.length} projects.`);

    // Try a user relation
    const usersWithTasks = await db.query.users.findMany({
      limit: 1,
      with: {
        dailyTasks: true,
        assignedTasks: true,
      }
    });
    console.log("✅ Success: Relational query for Users executed.");
    console.log(`Found ${usersWithTasks.length} users.`);

  } catch (error) {
    console.error("❌ Error during relational query:", error);
  }
}

verify().then(() => console.log("🏁 Verification complete."));
