# AzVirt DMS — TODO Next: Production Hardening Plan

> **Generated from:** Full code review (2026-04-05)  
> **Priority:** Phase 1 → Phase 4 (strictly ordered)  
> **Convention:** `[ ]` todo · `[/]` in progress · `[x]` done

---

## Phase 1 — 🔴 Critical Security Fixes (Block Production)

> These items represent active security vulnerabilities. **Do not deploy to production** until every item in this phase is `[x]`.

---

### 1.1 Remove Hardcoded Admin Credentials

**File:** `create-admin.ts`  
**Severity:** 🔴 CRITICAL  
**Risk:** Anyone with repo access knows the admin password (`admin/admin123`).

- [x] Refactor `create-admin.ts` to accept `--username` and `--password` via CLI args (`process.argv`) or env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- [x] Add input validation: require password ≥ 12 chars, not in common-password lists
- [x] Add a `forcePasswordChange: boolean` column to `users` table schema
- [x] Set `forcePasswordChange: true` when creating admin via script
- [x] Add server-side middleware to check `forcePasswordChange` flag and return a specific error code to the client
- [x] Add client-side handling: redirect to a "Change Password" page when the flag is set
- [x] Add a prominent `console.warn` in the script: *"⚠️ Change this password immediately after first login"*
- [x] Update `PRODUCTION_SECRETS.md` to document the new admin creation workflow

---

### 1.2 Remove Dev Bypass Exposure from Client Bundle

**Files:** `server/routers/auth/index.ts`, `server/lib/env.ts`, `client/src/hooks/useAuth.ts`  
**Severity:** 🔴 CRITICAL  
**Risk:** `VITE_ENABLE_DEV_BYPASS` is a `VITE_`-prefixed variable and is included in the client JS bundle, revealing that a bypass mechanism exists.

- [x] Rename `VITE_ENABLE_DEV_BYPASS` → `SERVER_ENABLE_DEV_BYPASS` in:
  - [x] `server/routers/auth/index.ts` (line 64)
  - [x] `server/lib/env.ts` (lines 17, 29, 57)
  - [x] Any `.env` / `.env.example` files
- [x] Audit the client codebase for any references to `VITE_ENABLE_DEV_BYPASS` and remove them:
  - [x] `grep -r "VITE_ENABLE_DEV_BYPASS" client/`
- [x] Update `PRODUCTION_SECRETS.md` to reflect the new variable name
- [x] Add the renamed variable to the startup validator's production guard (env.ts Guard 2)

---

### 1.3 Add CORS Middleware

**File:** `server/lib/index.ts`  
**Severity:** 🟠 HIGH  
**Risk:** No CORS = any origin can make API calls. Combined with cookie auth → CSRF is possible.

- [x] Install `cors` package: `pnpm add cors && pnpm add -D @types/cors`
- [x] Create CORS config in `server/lib/cors.ts`:
  ```
  Allowed origins:
    - development: http://localhost:4000, http://localhost:3000
    - production: from ALLOWED_ORIGINS env var (comma-separated)
  Options:
    - credentials: true
    - methods: ['GET', 'POST', 'OPTIONS']
    - allowedHeaders: ['Content-Type', 'Authorization']
  ```
- [x] Mount `app.use(cors(corsConfig))` in `index.ts` before any routes
- [x] Add `ALLOWED_ORIGINS` to `PRODUCTION_SECRETS.md`
- [x] Add `ALLOWED_ORIGINS` to startup validator as a production warning if empty
- [x] Verify Vite dev proxy still works with CORS enabled (test login flow)
- [x] Write test: cross-origin request from disallowed origin returns 403

---

### 1.4 Protect `/metrics` Endpoint

**File:** `server/lib/index.ts`  
**Severity:** 🟠 HIGH  
**Risk:** Internal server metrics (memory, CPU, event loop, request counts) exposed publicly.

- [x] Add `METRICS_AUTH_TOKEN` env var
- [x] Create middleware that checks `Authorization: Bearer <METRICS_AUTH_TOKEN>` header
- [x] Apply middleware to `/metrics` route only
- [x] In development: allow unauthenticated access if `METRICS_AUTH_TOKEN` is not set
- [x] Add `METRICS_AUTH_TOKEN` to `PRODUCTION_SECRETS.md`
- [x] Update Prometheus scrape config documentation to include the auth token
- [x] Write test: unauthenticated request to `/metrics` returns 401 in production mode

---

### 1.5 Fix Session Cookie Lifetime Mismatch

**Files:** `server/lib/cookies.ts`, `server/lib/sdk.ts`  
**Severity:** 🟠 HIGH  
**Risk:** JWT is valid 30 days, but cookie is session-scoped (lost on browser close). Or worse: JWT extracted from DevTools remains usable for 30 days after logout.

- [x] Add `maxAge: 30 * 24 * 60 * 60 * 1000` (30 days) to cookie options in `cookies.ts`
- [x] OR: Reduce JWT expiration from `30d` to `24h` in `sdk.ts` and add refresh token rotation
- [x] Decision: document chosen approach in `PRODUCTION_SECRETS.md`
- [x] Consider adding JWT rotation / sliding window expiry
- [x] Verify logout clears cookie properly (existing test: `auth.logout.test.ts`)
- [x] Write test: cookie has correct `maxAge` set

---

## Phase 2 — 🟠 Type Safety & Data Integrity (This Sprint)

> Fix the structural issues that create silent bugs and data corruption risks.

---

### 2.1 Add Foreign Key Constraints to Schema

**File:** `drizzle/schema.ts`  
**Severity:** 🟠 HIGH  
**Impact:** Without FK constraints, the database allows orphaned records (e.g., deliveries referencing deleted projects).

- [x] Add `.references(() => projects.id)` to:
  - [x] `deliveries.projectId`
  - [x] `qualityTests.projectId`
  - [x] `workHours.projectId`
  - [x] `machineWorkHours.projectId`
  - [x] `documents.projectId`
- [x] Add `.references(() => users.id)` to:
  - [x] `deliveries.createdBy`
  - [x] `projects.createdBy`
  - [x] `documents.uploadedBy`
  - [x] `dailyTasks.userId`
  - [x] `dailyTasks.assignedTo`
  - [x] `workHours.approvedBy`
  - [x] `aiConversations.userId`
  - [x] `notificationPreferences.userId`
  - [x] `taskAssignments.assignedTo`
  - [x] `taskAssignments.assignedBy`
  - [x] `taskStatusHistory.changedBy`
  - [x] `taskNotifications.userId`
  - [x] `notificationHistory.userId`
  - [x] `reportSettings.userId`
  - [x] `notificationTemplates.createdBy`
  - [x] `notificationTriggers.createdBy`
  - [x] `timesheetUploadHistory.uploadedBy`
- [x] Add `.references(() => employees.id)` to:
  - [x] `workHours.employeeId`
  - [x] `machineWorkHours.operatorId`
- [x] Add `.references(() => machines.id)` to:
  - [x] `machineMaintenance.machineId`
  - [x] `machineWorkHours.machineId`
- [x] Add `.references(() => concreteBases.id)` to:
  - [x] `machines.concreteBaseId`
  - [x] `aggregateInputs.concreteBaseId`
- [x] Add `.references(() => deliveries.id)` to:
  - [x] `qualityTests.deliveryId`
  - [x] `deliveryStatusHistory.deliveryId`
- [x] Add `.references(() => dailyTasks.id)` to:
  - [x] `taskAssignments.taskId`
  - [x] `taskStatusHistory.taskId`
  - [x] `taskNotifications.taskId`
- [x] Add `.references(() => aiConversations.id)` to:
  - [x] `aiMessages.conversationId`
- [x] Add `.references(() => taskNotifications.id)` to:
  - [x] `notificationHistory.notificationId`
- [x] Add `.references(() => notificationTemplates.id)` to:
  - [x] `notificationTriggers.templateId`
- [x] Add `.references(() => notificationTriggers.id)` to:
  - [x] `triggerExecutionLog.triggerId`
- [ ] Generate migration: `pnpm db:push`
- [ ] Test migration against a copy of production data (check for constraint violations)
- [ ] Fix any existing orphaned data before applying migration

---

### 2.2 Eliminate Critical `as any` Casts (Top 20)

**Files:** Various (see list below)  
**Severity:** 🟠 HIGH

- [x] **Auth router** — `auth/index.ts:44, 79`: Fix `.returning()` result type
  - Use `const [result] = await db.createUser(...);` with proper `InsertUser` return type
- [x] **SDK** — `sdk.ts:132`: Fix user creation return type
  - Type the `db.createUser()` return properly
- [x] **Notification jobs** — `notificationJobs.ts:100, 240`: Fix `createNotification()` return type
  - Add explicit return type to `createNotification()` function
- [x] **Notification jobs** — `notificationJobs.ts:352, 406`: Fix `pushSubscription` cast
  - Use `import('web-push').PushSubscription` type in notification jobs
- [x] **Notification jobs** — `notificationJobs.ts:361`: Fix Drizzle `.set()` cast
  - `delayNotificationSent: true` is now a typed partial update (schema already has this column)
- [x] **DB setup** — `setup.ts:132`: Fix `withReplicas` return type
  - Use tuple spread `[first, ...rest]` to satisfy Drizzle's tuple constraint without `as any`
- [x] **DB setup** — `setup.ts:64`: Fix implicit any in mockDb transaction callback
  - Typed the `cb` parameter as `(tx: typeof mockDb) => unknown`
- [x] **DB users** — `users.ts:87, 105`: Fix mock user return types
  - Return `satisfies schema.User` objects with all required fields
- [x] **Enum filters** — Use Drizzle's `$inferSelect` type indexing (`schema.Table["column"]`) to type filter params:
  - [x] `db/deliveries.ts:31` — `status?: schema.Delivery["status"]`
  - [x] `db/qualityTests.ts:29, 33` — `testType` and `status` typed from `schema.QualityTest`
  - [x] `db/employees.ts:20, 23` — `department` and `status` typed from `schema.Employee`
  - [x] `db/machines.ts:23, 26` — `type` and `status` typed from `schema.Machine`
  - [x] `db/documents.ts:25` — `category` typed from `schema.Document`
  - [x] `db/workHours.ts:26` — `status` typed from `schema.WorkHour`
  - [x] `db/aggregateInputs.ts:23` — `materialType` typed from `schema.AggregateInput`; `purchaseOrders` status typed
  - [x] `db/dailyTasks.ts:50, 59` — `status` and `priority` typed from `schema.DailyTask`
  - [x] `db/machineMaintenance.ts:23` — `maintenanceType` typed from `schema.MachineMaintenance`
  - [x] `db/taskNotifications.ts:51` — `status` param in `updateNotificationStatus` typed from `schema.TaskNotification`

---

### 2.3 Complete Drizzle Relations

**File:** `drizzle/relations.ts`  
**Severity:** 🟠 HIGH

- [x] Add `usersRelations` (projects, deliveries, tasks, notifications, conversations, documents)
- [x] Add `projectsRelations` (deliveries, qualityTests, documents, workHours)
- [x] Add `deliveriesRelations` (qualityTests, statusHistory, project, creator)
- [x] Add `employeesRelations` (workHours, machineWorkHours)
- [x] Add `machinesRelations` (maintenance, workHours, concreteBase)
- [x] Add `concreteBasesRelations` (machines, aggregateInputs)
- [x] Add `dailyTasksRelations` (assignments, statusHistory, notifications, user)
- [x] Add `aiConversationsRelations` (messages, user)
- [x] Add `notificationTriggersRelations` (template, executionLog)
- [x] Verify new relations work with `db.query.*.findMany({ with: { ... } })`

---

### 2.4 Standardize Schema Naming Convention

**File:** `drizzle/schema.ts`  
**Severity:** 🟡 MEDIUM

- [x] Decide on convention: **camelCase** (matches majority of existing columns)
- [x] Rename snake_case columns in `materialConsumptionHistory`:
  - `material_id` → `materialId`
  - `quantity_used` → `quantityUsed`
  - `delivery_id` → `deliveryId`
- [x] Rename snake_case columns in `purchaseOrders`:
  - `supplier_id` → `supplierId`
  - `order_date` → `orderDate`
  - `expected_delivery` → `expectedDelivery`
  - `total_cost` → `totalCost`
- [x] Rename snake_case columns in `purchaseOrderItems`:
  - `purchase_order_id` → `purchaseOrderId`
  - `material_id` → `materialId`
  - `unit_price` → `unitPrice`
- [x] Rename snake_case columns in `materials`:
  - `lead_time_days` → `leadTimeDays`
  - `reorder_point` → `reorderPoint`
  - `optimal_order_quantity` → `optimalOrderQuantity`
  - `supplier_id` → `supplierId`
  - `last_order_date` → `lastOrderDate`
- [x] Rename snake_case columns in `suppliers`:
  - `lead_time` → `leadTimeDays` (also rename for clarity)
- [x] Generate and review migration
- [x] Update all server-side references to match new column names
- [x] Run full test suite to validate

---

## Phase 3 — 🟠 Quality & Observability (Next Sprint)

> Improve runtime reliability, debugging, and operational visibility.

---

### 3.1 Unify Logging: Replace `console.*` with Pino Logger

**Files:** All server files using `console.log/warn/error`  
**Severity:** 🟠 HIGH

- [x] Create child loggers for each module in `server/lib/logger.ts`:
  ```typescript
  export const dbLogger = logger.child({ module: "db" });
  export const authLogger = logger.child({ module: "auth" });
  export const redisLogger = logger.child({ module: "redis" });
  export const emailLogger = logger.child({ module: "email" });
  export const smsLogger = logger.child({ module: "sms" });
  export const jobsLogger = logger.child({ module: "jobs" });
  ```
- [x] Replace in `server/db/setup.ts` — all `console.log/warn` → `dbLogger.info/warn`
- [x] Replace in `server/lib/redis.ts` — `console.warn/log` → `redisLogger.warn/info`
- [x] Replace in `server/lib/email.ts` — `console.warn/log/error` → `emailLogger.*`
- [x] Replace in `server/lib/sms.ts` — `console.warn` → `smsLogger.warn`
- [x] Replace in `server/lib/sdk.ts` — `console.warn/info/error` → `authLogger.*`
- [x] Replace in `server/lib/password.ts` — `console.error` → `authLogger.error` (mask error details)
- [x] Replace in `server/lib/notificationJobs.ts` — all `console.*` → `jobsLogger.*`
- [x] Replace in `server/lib/env.ts` — `console.warn/error` → plain `logger.*`
- [x] Replace in `server/db/users.ts` — `console.warn/error` → `dbLogger.*`
- [x] Replace in `server/storage.ts` — any `console.*` → `logger.*`
- [x] Add ESLint rule `no-console: "error"` to prevent regression (server directory only)
- [x] Reduce context.ts logging from `info` to `debug` level

---

### 3.2 Fix N+1 Queries in Notification Jobs

**File:** `server/lib/notificationJobs.ts`  
**Severity:** 🟠 HIGH

- [x] Refactor `checkAndNotifyOverdueTasks()`:
  - [x] Collect unique `userId` values from `overdueTasks`
  - [x] Batch fetch all users: `WHERE id IN (...uniqueIds)`
  - [x] Batch fetch all notification preferences: `WHERE userId IN (...uniqueIds)`
  - [x] Build an in-memory `Map<userId, { user, prefs }>` lookup
  - [x] Loop tasks and use the map instead of per-task DB queries
- [x] Refactor `checkAndNotifyDelayedDeliveries()`:
  - [x] Fetch admins once before the delivery loop (already partially done, verify)
- [x] Refactor `checkAndNotifyForecasting()`:
  - [x] Same pattern — admins query is already outside loop ✅
- [ ] Write performance test: simulate 100 overdue tasks, assert ≤ 5 DB queries total

---

- [x] Migrate Background 
  - [x] Standardize job names in `queue.ts`
  - [x] Implement idempotent job registration in `notificationWorker.ts`
  - [x] Relocate user functions to `users.ts` (Task 4.5)

**Files:** Various DB query functions  
**Severity:** 🟡 MEDIUM

- [ ] Create shared pagination helper in `packages/shared-core/types.ts`:
  ```typescript
  export type PaginationInput = { page?: number; pageSize?: number };
  export type PaginatedResult<T> = { data: T[]; total: number; page: number; pageSize: number };
  ```
- [ ] Add pagination to high-volume query functions:
  - [ ] `db/deliveries.ts` — `getDeliveries()`
  - [ ] `db/workHours.ts` — `getWorkHours()`
  - [ ] `db/aggregateInputs.ts` — `getAggregateInputs()`
  - [ ] `db/employees.ts` — `getEmployees()`
  - [ ] `db/machines.ts` — `getMachines()`
  - [ ] `db/documents.ts` — `getDocuments()`
  - [ ] `db/dailyTasks.ts` — `getDailyTasks()`
- [ ] Update corresponding tRPC router procedures to accept pagination input
- [ ] Update client-side hooks/pages to handle paginated responses
- [ ] Default `pageSize`: 50, max `pageSize`: 200
- [ ] Add `count()` queries for total result count

---

### 3.5 Sanitize Email Template Interpolation

**File:** `server/lib/email.ts`  
**Severity:** 🟡 MEDIUM

- [x] Create `escapeHtml()` utility function:
  ```typescript
  function escapeHtml(str: string): string {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  ```
- [x] Apply `escapeHtml()` to all user-supplied values in:
  - [x] `generateLowStockEmailHTML()` — material names
  - [x] `generatePurchaseOrderEmailHTML()` — supplier name, material name, notes
  - [x] `generateDailyProductionReportHTML()` — material names
- [x] Write test: verify HTML entities are properly escaped in output

---

### 3.6 Reduce Request Body Size Limit

**File:** `server/lib/index.ts`  
**Severity:** 🟡 MEDIUM

- [ ] Change global `express.json({ limit })` from `50mb` to `2mb`
- [ ] Add route-specific middleware for file upload endpoints:
  - [ ] Identify which tRPC procedures handle file uploads (bulk import, document upload, QC photo upload)
  - [ ] Add a pre-tRPC Express route that handles large payloads, or use `express.json({ limit: "50mb" })` only on `/api/trpc/bulkImport.*`, `/api/trpc/documents.*`
- [ ] Alternative: keep 50MB global but add request body size monitoring via prom-client histogram

---

## Phase 4 — 🟡 Cleanup & Polish

> Technical debt reduction, developer experience, and conventions.

---

### 4.1 Delete Stale Files

**Severity:** 🟠 HIGH (for .bak files)

- [x] Delete backup files:
  - [x] `server/lib/notificationJobs.ts.bak`
  - [x] `server/db/setup.ts.bak`
- [x] Delete development screenshots:
  - [x] `screenshot.png`
  - [x] `screenshot_fixed.png`
  - [x] `final_check.png`
  - [x] `screenshot.js`
- [x] Delete one-time scripts (or move to `archive/scripts/` with README):
  - [x] `refactor.js`
  - [x] `refactor_db.ts`
  - [x] `patch_deliveries.cjs`
- [ ] Delete stray SQLite database:
  - [ ] `db/custom.db`
- [ ] Delete empty placeholder:
  - [ ] `.gitkeep` (root level — check if directory needs it)
- [x] Add `*.bak` to `.gitignore`

---

### 4.2 Fix Package Manager & Dependency Issues

**Files:** `package.json`, `package-lock.json`  
**Severity:** 🟡 MEDIUM

- [ ] Delete `package-lock.json` (project uses pnpm)
- [ ] Add `package-lock.json` to `.gitignore`
- [ ] Remove accidental `"add": "^2.0.6"` from devDependencies
- [ ] Fix `wouter` patch version mismatch:
  - [ ] Check actual installed version: `pnpm why wouter`
  - [ ] Update `patchedDependencies` key to match installed version, or
  - [ ] Update `wouter` dependency to `^3.7.1` to match the patch
- [ ] Run `pnpm install` and verify clean install
- [ ] Run `pnpm audit` and address any vulnerability findings

---

### 4.3 Add Client-Side Route Guards

**File:** `client/src/App.tsx`  
**Severity:** 🟡 MEDIUM

- [ ] Create `client/src/components/ProtectedRoute.tsx`:
  ```
  - Wraps children with auth check via useAuth()
  - Shows loading spinner while auth state resolves
  - Redirects to /login if unauthenticated
  - Optionally accepts requiredRole prop for admin-only routes
  ```
- [ ] Create `client/src/components/AdminRoute.tsx`:
  ```
  - Extends ProtectedRoute with role === "admin" check
  - Shows 403 page or redirects if not admin
  ```
- [ ] Wrap protected routes in `App.tsx`:
  - Public: `/login`, `/register`, `/driver-app`
  - Protected (any user): `/`, `/documents`, `/projects`, `/materials`, etc.
  - Admin only: `/settings`, `/notification-triggers`, `/notification-templates`, `/email-branding`, `/email-templates`, `/report-settings`
- [ ] Write test: unauthenticated user accessing `/materials` → redirect to `/login`
- [ ] Write test: non-admin user accessing `/settings` → redirect or 403

---

### 4.4 Remove Router Aliases & Dead Code

**Files:** `server/routers.ts`, `server/lib/index.ts`  
**Severity:** 🟡 MEDIUM

- [ ] Remove `tracking:` alias in `routers.ts` (keep `deliveries:` only)
  - [ ] Search client for `trpc.tracking.*` references and replace with `trpc.deliveries.*`
- [ ] Remove `machineMaintenance:` and `machineWorkHours:` sub-router aliases
  - [ ] Update client to use `trpc.machines.maintenance.*` and `trpc.machines.workHours.*`
- [ ] Delete dead function `findAvailablePort()` from `server/lib/index.ts`
- [ ] Delete dead statement `null;` from `server/lib/index.ts:91`
- [ ] Re-enable or permanently remove `scheduleForecastingJob()` call (currently commented out / replaced with `null;`)

---

### 4.5 Relocate Misplaced Functions

**Files:** `server/db/aggregateInputs.ts`, `server/db/users.ts`  
**Severity:** 🟡 MEDIUM

- [x] Move `updateUserSMSSettings()` from `aggregateInputs.ts` → `users.ts`
- [x] Update all imports referencing the old location
- [x] Move any other user-related helpers found in non-user files to `users.ts`
- [x] Verify `server/db/index.ts` barrel export still re-exports correctly

---

### 4.6 Standardize Import Aliases

**Files:** Various server files  
**Severity:** 🟡 MEDIUM

- [ ] Replace all direct `../../../packages/shared-core/...` imports with `@shared/...` alias:
  - [ ] `server/routers/auth/index.ts:3` — uses direct path
  - [ ] Search: `grep -r "packages/shared-core" server/`
  - [ ] Replace each with `@shared/...`
- [ ] Verify `tsconfig.json` paths are correctly configured for server-side resolution
- [ ] Verify `vite.config.ts` alias matches for client-side resolution

---

### 4.7 Improve Mock DB Implementation

**File:** `server/db/setup.ts`  
**Severity:** 🟡 MEDIUM

- [ ] Define `IDbOperations` interface with the methods actually used:
  ```typescript
  interface IDbOperations {
    select(): SelectBuilder;
    insert(table: any): InsertBuilder;
    update(table: any): UpdateBuilder;
    delete(table: any): DeleteBuilder;
    transaction<T>(cb: (tx: IDbOperations) => Promise<T>): Promise<T>;
  }
  ```
- [ ] Implement mock against the interface (not `as unknown as ...`)
- [ ] Use `nanoid` or atomic counter for ID generation (not `Math.random()`)
- [ ] Add schema constraint enforcement to mock `insert` (at minimum: unique, notNull)
- [ ] Consider using `better-sqlite3` in-memory DB for testing instead of hand-rolled mock

---

### 4.8 Remove Dead Code & Miscellaneous Cleanup

**Severity:** 🔵 LOW

- [ ] Remove `"add": "^2.0.6"` from `devDependencies`
- [ ] Remove commented-out domain logic in `server/lib/cookies.ts` (lines 27-40)
- [ ] Remove `ONE_YEAR_MS` from `packages/shared-core/const.ts` if unused
  - [ ] `grep -r "ONE_YEAR_MS" .` to check usage
- [ ] Clean up `server/lib/types/` directory — remove duplicate types
- [ ] Remove `mini-services/.gitkeep` if directory is empty and unused
- [ ] Remove `archive/` directory or document its purpose in README

---

## Phase 5 — 🟡 Testing & Quality Gates (Ongoing)

> These are not blockers but significantly improve long-term reliability.

---

### 5.1 Add Client-Side Test Coverage

**Severity:** 🟠 HIGH

- [ ] Set up Vitest + React Testing Library for client-side tests
- [ ] Add smoke tests (render without crash) for all 31 page components
- [ ] Add integration tests for:
  - [ ] Login flow (happy path + error states)
  - [ ] Logout flow (cookie cleared, redirect)
  - [ ] Auth redirect behavior (protected page → login → back)
- [ ] Add form validation tests for:
  - [ ] Delivery creation form
  - [ ] Purchase order form
  - [ ] Quality test submission form
  - [ ] Employee creation form
- [ ] Target: ≥ 60% client-side coverage

---

### 5.2 Expand E2E Test Coverage

**Severity:** 🟡 MEDIUM

- [ ] Add Playwright E2E tests for critical user journeys:
  - [ ] Admin login → Dashboard → View deliveries → Create delivery
  - [ ] Admin login → Materials → Low stock alert → Create purchase order
  - [ ] Admin login → Quality control → Submit test → View results
  - [ ] Driver app: update delivery status flow
  - [ ] Notification preferences: toggle channels, set quiet hours
- [ ] Add E2E tests for edge cases:
  - [ ] Session expiry → redirect to login
  - [ ] Network error handling (offline banner)
  - [ ] Role-based access (non-admin tries admin page)

---

### 5.3 Add CI Quality Gates

**Severity:** 🟡 MEDIUM

- [ ] Add GitHub Actions workflow (or update existing):
  - [ ] `pnpm check` (TypeScript type checking)
  - [ ] `pnpm test` (Vitest unit tests)
  - [ ] `npx playwright test` (E2E tests)
  - [ ] `pnpm build` (verify production build succeeds)
- [ ] Add pre-commit hook:
  - [ ] `pnpm check` on staged `.ts/.tsx` files
  - [ ] `pnpm format --check` for formatting
- [x] Add `no-console` ESLint rule for `server/` directory
- [x] Add `no-explicit-any` ESLint rule with `warn` level (track progress toward zero)

---

## Quick Reference: File Impact Map

| File | Tasks Touching It |
|------|-------------------|
| `drizzle/schema.ts` | 2.1, 2.4 |
| `drizzle/relations.ts` | 2.3 |
| `server/lib/index.ts` | 1.3, 1.4, 3.6, 4.4 |
| `server/lib/env.ts` | 1.2 |
| `server/lib/cookies.ts` | 1.5, 4.8 |
| `server/lib/sdk.ts` | 1.5, 2.2 |
| `server/lib/trpc.ts` | — (stable) |
| `server/lib/logger.ts` | 3.1 |
| `server/lib/email.ts` | 3.5 |
| `server/lib/notificationJobs.ts` | 3.2, 3.3 |
| `server/lib/queue.ts` | 3.3 |
| `server/routers/auth/index.ts` | 1.2, 2.2 |
| `server/routers.ts` | 4.4 |
| `server/db/setup.ts` | 2.2, 4.7 |
| `server/db/users.ts` | 2.2, 4.5 |
| `server/db/aggregateInputs.ts` | 4.5 |
| `client/src/App.tsx` | 4.3 |
| `create-admin.ts` | 1.1 |
| `package.json` | 4.2 |
| `PRODUCTION_SECRETS.md` | 1.1, 1.2, 1.3, 1.4 |

---

> **Estimated total effort:** ~8–12 developer-days across all 5 phases  
> **Phase 1 alone:** ~2 developer-days (critical path, do first)
