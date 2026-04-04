import * as db from "./server/db";
import { hashPassword } from "./server/lib/password";

async function main() {
  const username = "admin";
  const password = "admin123";

  console.log(`Checking if user "${username}" exists...`);

  try {
    const existing = await db.getUserByUsername(username);
    if (existing) {
      console.log(
        `User "${username}" already exists with role: ${existing.role}`,
      );
      if (existing.role !== "admin") {
        console.log(`Updating user "${username}" to admin role...`);
        await db.updateUser(existing.id, { role: "admin" });
        console.log("Update successful.");
      }
      process.exit(0);
    }

    console.log(`Creating admin user: ${username}`);
    const passwordHash = hashPassword(password);

    await db.createUser({
      username,
      passwordHash,
      name: "System Administrator",
      role: "admin",
      openId: `local-${Date.now()}`, // Generating a mock openId for local bypass
    });

    console.log("Admin user created successfully!");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

main();
