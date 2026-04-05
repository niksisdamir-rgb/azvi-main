import { getDb } from "./setup";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No database!");
    return;
  }
  
  console.log("Checking users with projects...");
  await db.query.users.findMany({
    with: {
      projects: true,
      deliveries: true,
      tasks: true,
      notifications: true,
      conversations: true,
      documents: true,
    },
    limit: 1
  });

  console.log("Checking projects with relations...");
  await db.query.projects.findMany({
    with: {
      deliveries: true,
      qualityTests: true,
      documents: true,
      workHours: true,
    },
    limit: 1
  });
  
  console.log("Checking deliveries with relations...");
  await db.query.deliveries.findMany({
    with: {
      project: true,
      creator: true,
      qualityTests: true,
      statusHistory: true,
    },
    limit: 1
  });

  console.log("Checking employees with relations...");
  await db.query.employees.findMany({
    with: {
      workHours: true,
      machineWorkHours: true,
    },
    limit: 1
  });

  console.log("Checking machines with relations...");
  await db.query.machines.findMany({
    with: {
      concreteBase: true,
      maintenance: true,
      workHours: true,
    },
    limit: 1
  });

  console.log("Checking concreteBases with relations...");
  await db.query.concreteBases.findMany({
    with: {
      machines: true,
      aggregateInputs: true,
    },
    limit: 1
  });

  console.log("Checking dailyTasks with relations...");
  await db.query.dailyTasks.findMany({
    with: {
      user: true,
      assignee: true,
      assignments: true,
      statusHistory: true,
      notifications: true,
    },
    limit: 1
  });

  console.log("Checking aiConversations with relations...");
  await db.query.aiConversations.findMany({
    with: {
      user: true,
      messages: true,
    },
    limit: 1
  });

  console.log("Checking notificationTriggers with relations...");
  await db.query.notificationTriggers.findMany({
    with: {
      template: true,
      executionLog: true,
    },
    limit: 1
  });

  console.log("All relations verified successfully.");
}

main().catch(console.error);
