import * as db from "./server/db";
import { hashPassword } from "./server/lib/password";

async function main() {
  const args = process.argv.slice(2);
  let username = process.env.ADMIN_USERNAME;
  let password = process.env.ADMIN_PASSWORD;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--username' && args[i+1]) username = args[i+1];
    if (args[i] === '--password' && args[i+1]) password = args[i+1];
  }

  if (!username) username = "admin";
  if (!password) password = "admin123";

  console.log(`Checking if user "${username}" exists...`);

  // Basic validation if providing custom password or strictly enforcing? 
  // Let's enforce strictly to be safe.
  const commonPasswords = ["password123", "admin123", "qwertyuiop", "123456789012", "changeme123", "password!123"];
  if (password !== "admin123" && (password.length < 12 || commonPasswords.includes(password))) {
      console.error("Error: Password must be at least 12 characters long and not a common password.");
      process.exit(1);
  }

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
      forcePasswordChange: true,
      openId: `local-${Date.now()}`, // Generating a mock openId for local bypass
    });

    console.log("Admin user created successfully!");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.warn("⚠️ Change this password immediately after first login");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

main();
