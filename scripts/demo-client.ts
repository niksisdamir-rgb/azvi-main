/**
 * AzVirt DMS — SDK Demo Script
 * =============================
 * This script demonstrates how to use the `@azvirt/api-client` in a 
 * non-browser environment (Node.js, CLI, etc.) using the vanilla client.
 */

import { createVanillaClient } from "../packages/api-client/dist/index.js";

// In a real environment, you would use environment variables or CLI flags
const baseUrl = "http://localhost:3000";
const bearerToken = process.env.DMS_API_KEY || "demo_token";

async function main() {
  console.log(`🚀 Connecting to AzVirt DMS API at ${baseUrl}...`);

  try {
    const api = createVanillaClient({
      baseUrl,
      bearerToken,
    });

    // 1. Check Auth (Identity)
    console.log("\n👤 Checking current identity...");
    const me = await api.auth.me.query();
    console.log(`Logged in as: ${me.username} (${me.role})`);

    // 2. List Materials
    console.log("\n📦 Fetching materials list...");
    const materials = await api.materials.list.query({ limit: 5 });
    console.log(`Found ${materials.length} materials:`);
    materials.forEach(m => {
      console.log(` - [${m.id}] ${m.name}: ${m.stock} ${m.unit}`);
    });

    // 3. Analytics Check (Forecasting)
    console.log("\n📈 Running demand forecast for next 30 days...");
    const forecast = await api.forecasting.predictDemand.query({
      materialId: materials[0]?.id || "default",
      days: 30
    });
    console.log(`Predicted demand for ${materials[0]?.name}: ${forecast.total} units`);

    // 4. Workforce Status
    console.log("\n👥 Checking workforce attendance...");
    const activeTimesheets = await api.timesheets.listRecent.query();
    console.log(`Currently ${activeTimesheets.length} active timesheets.`);

    console.log("\n✅ Demo completed successfully!");

  } catch (error: any) {
    console.error("\n❌ Error during demo:");
    if (error.shape) {
      // tRPC error
      console.error(`Status: ${error.shape.code}`);
      console.error(`Message: ${error.shape.message}`);
    } else {
      console.error(error.message || error);
    }
    process.exit(1);
  }
}

main();
