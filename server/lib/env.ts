import "dotenv/config";

// =============================================================================
// HARDENED STARTUP VALIDATOR
// All critical misconfigurations throw immediately — fail fast, fail loud.
// =============================================================================

function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeEnv   = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const useMocks  = process.env.DMS_USE_MOCKS === "true";
  const jwtSecret = process.env.JWT_SECRET;
  const dbUrl     = process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL ?? "";
  const bypassOn  = process.env.VITE_ENABLE_DEV_BYPASS === "true";

  // ── Guard 1: JWT_SECRET must always be set ──────────────────────────────────
  if (!jwtSecret || jwtSecret.trim() === "") {
    errors.push(
      "JWT_SECRET is not set. Session tokens would be signed with an empty string, " +
      "making all sessions trivially forgeable. " +
      "Set a strong random secret: export JWT_SECRET=$(openssl rand -hex 32)"
    );
  }

  // ── Guard 2: Dev bypass must never reach production ─────────────────────────
  if (bypassOn && isProduction) {
    errors.push(
      "VITE_ENABLE_DEV_BYPASS is 'true' in a production environment. " +
      "This flag disables real authentication and grants admin access using environment-provided credentials. " +
      "Set VITE_ENABLE_DEV_BYPASS=false in your production environment immediately."
    );
  }

  // ── Guard 3: Placeholder DATABASE_URL must never reach production ────────────
  if (isProduction && dbUrl.includes("user:password")) {
    errors.push(
      "DATABASE_URL appears to contain placeholder credentials ('user:password'). " +
      "Replace it with a real production connection string before deploying."
    );
  }

  // ── Guard 4 (warning): Mock mode in production loses all data ───────────────
  if (useMocks && isProduction) {
    errors.push(
      "DMS_USE_MOCKS is 'true' in a production environment. " +
      "All database operations will use fake in-memory data and all data will be " +
      "lost on server restart. Set DMS_USE_MOCKS=false in production."
    );
  } else if (useMocks) {
    warnings.push("Mock mode is enabled (DMS_USE_MOCKS=true). Fine for development, NOT for production.");
  }

  // ── Guard 5 (warning): Dev bypass outside dev should at least log ───────────
  if (bypassOn && !isProduction) {
    warnings.push(
      "VITE_ENABLE_DEV_BYPASS=true — environment-based dev credentials are active. " +
      "Do NOT enable this flag in staging or shared environments."
    );
  }

  // ── Emit warnings ────────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    console.warn("\n⚠️  AzVirt DMS — Environment Warnings:");
    warnings.forEach(w => console.warn(`   • ${w}`));
    console.warn("");
  }

  // ── Throw on any hard error ──────────────────────────────────────────────────
  if (errors.length > 0) {
    const divider = "═".repeat(68);
    console.error(`\n╔${divider}╗`);
    console.error(`║  🚨  FATAL: AzVirt DMS CANNOT START — Environment misconfigured  ║`);
    console.error(`╚${divider}╝\n`);
    errors.forEach((e, i) => console.error(`  [${i + 1}] ${e}\n`));
    throw new Error(
      `Server startup aborted due to ${errors.length} critical environment error(s). See output above.`
    );
  }
}

// Run at module load — before any routes or DB connections are established.
validateEnvironment();

export const ENV = {
  appId:         process.env.VITE_APP_ID ?? "",
  cookieSecret:  process.env.JWT_SECRET ?? "",
  databaseUrl:   process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL ?? "",
  databaseReplicaUrls: process.env.DATABASE_REPLICA_URLS ? process.env.DATABASE_REPLICA_URLS.split(',').map(url => url.trim()).filter(Boolean) : [],
  oAuthServerUrl:process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId:   process.env.OWNER_OPEN_ID ?? "",
  isProduction:  process.env.NODE_ENV === "production",
  useMocks:      process.env.DMS_USE_MOCKS === "true",
  forgeApiUrl:   process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey:   process.env.BUILT_IN_FORGE_API_KEY ?? "",
  auth0Issuer:   process.env.AUTH0_ISSUER ?? "",
  auth0Audience: process.env.AUTH0_AUDIENCE ?? "",
  auth0Domain:   process.env.AUTH0_DOMAIN ?? "",
  auth0ClientId: process.env.AUTH0_CLIENT_ID ?? "",
};
