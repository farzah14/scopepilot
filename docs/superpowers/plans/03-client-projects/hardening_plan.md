# ScopePilot Phase 3 Security and Correctness Hardening Plan

> **Goal:** Address all post-merge Phase 3 defects across authentication, tenant-context, error handling, partial-update validation, database-level tenant integrity, E2E testing, CI pipeline, and currency formatting.

---

## Defect Matrix & Mapping

### Defect 1: Invalid Credentials Session Configuration
- **Affected Files:**
  - `src/auth.ts`
  - `src/types/next-auth.d.ts` (created)
  - `src/auth/auth-session.test.ts` (created)
  - `.env.example`
  - `.github/workflows/ci.yml`
- **Test Coverage:** `src/auth/auth-session.test.ts` (credentials auth, JWT user ID propagation, session user ID propagation, normalized email, password verification, `passwordHash` exclusion).
- **Migration Impact:** None.
- **Acceptance Criteria:** `session.user.id` is typed as `string` without `as any`, strategy is `jwt`, `NEXTAUTH_SECRET` / `NEXTAUTH_URL` environment variables documented, tests pass.

### Defect 2: Remove Demo User and Organization Fallbacks
- **Affected Files:**
  - `src/auth/session-helper.ts` (created)
  - `src/auth/session-helper.test.ts` (created)
  - `src/app/(app)/clients/page.tsx`
  - `src/app/(app)/clients/new/page.tsx`
  - `src/app/(app)/clients/[clientId]/page.tsx`
  - `src/app/(app)/projects/[projectId]/page.tsx`
- **Test Coverage:** `src/auth/session-helper.test.ts` (unauthenticated rejection, missing membership rejection, multi-workspace selection, zero demo user/org fallback).
- **Migration Impact:** None.
- **Acceptance Criteria:** `requireAuthenticatedUser()` and `getWorkspaceContext()` enforce session and membership server-side. Zero `demo-user` or `demo-org` occurrences remain in codebase.

### Defect 3: Improper Error Handling
- **Affected Files:**
  - `src/errors/domain-errors.ts` (created)
  - `src/errors/error-handler.ts` (created)
  - `src/errors/error-handler.test.ts` (created)
  - `src/auth/require-membership.ts`
  - `src/clients/client-service.ts`
  - `src/projects/project-service.ts`
  - `src/app/(app)/clients/page.tsx`
  - `src/app/(app)/clients/[clientId]/page.tsx`
  - `src/app/(app)/projects/[projectId]/page.tsx`
- **Test Coverage:** `src/errors/error-handler.test.ts` (mapping `UNAUTHENTICATED` to redirect, `FORBIDDEN` to 403, `NOT_FOUND` to Next.js `notFound()`, rethrowing 500s).
- **Migration Impact:** None.
- **Acceptance Criteria:** No empty catch blocks in pages/services. Explicit typed error responses and 404/403/redirect handling.

### Defect 4: Invalid Partial Project Update Validation
- **Affected Files:**
  - `src/projects/project-service.ts`
  - `src/projects/project-service.test.ts`
- **Test Coverage:** `src/projects/project-service.test.ts` (validating merged partial updates for budget min/max and start/end dates).
- **Migration Impact:** None.
- **Acceptance Criteria:** `updateProject` merges existing project values with patch data before running budget and date invariant validations.

### Defect 5: Database-Level Tenant Consistency
- **Affected Files:**
  - `prisma/schema.prisma`
  - `prisma/migrations/20260727170000_enforce_tenant_consistency/migration.sql` (created)
  - `src/security/tenant-db-integrity.test.ts` (created)
- **Test Coverage:** `src/security/tenant-db-integrity.test.ts` (verifying foreign key constraints block direct cross-tenant client or non-member owner inserts).
- **Migration Impact:** New committed migration `20260727170000_enforce_tenant_consistency`.
- **Acceptance Criteria:** `Client` has `@@unique([id, organizationId])`, `Project` has composite FK `[clientId, organizationId] -> Client[id, organizationId]` and composite FK `[ownerId, organizationId] -> Membership[userId, organizationId]`.

### Defect 6: Inadequate E2E Tests
- **Affected Files:**
  - `e2e/helpers/auth.ts` (created)
  - `e2e/client-project.spec.ts`
  - `e2e/tenant-isolation.spec.ts` (created)
  - `playwright.config.ts`
- **Test Coverage:** `e2e/client-project.spec.ts`, `e2e/tenant-isolation.spec.ts`.
- **Migration Impact:** None.
- **Acceptance Criteria:** Authenticated E2E user flows perform real credentials sign-in, client/project creation, status transitions, and cross-tenant access denial checks.

### Defect 7: GitHub Actions Does Not Run E2E Tests
- **Affected Files:**
  - `.github/workflows/ci.yml`
- **Test Coverage:** CI workflow.
- **Migration Impact:** None.
- **Acceptance Criteria:** CI runs `pnpm test:e2e` with Playwright Chromium against PostgreSQL service, uploading report artifacts on failure.

### Defect 8: Incorrect Currency Formatting
- **Affected Files:**
  - `src/utils/currency-formatter.ts` (created)
  - `src/utils/currency-formatter.test.ts` (created)
  - `src/app/(app)/projects/[projectId]/page.tsx`
- **Test Coverage:** `src/utils/currency-formatter.test.ts` (USD, IDR, EUR, zero, null/undefined).
- **Migration Impact:** None.
- **Acceptance Criteria:** Budgets formatted dynamically with `Intl.NumberFormat` using workspace's `defaultCurrency`. No hardcoded `$`/`USD`/`IDR` in UI components.

### Permission Review: `projects:write`
- **Affected Files:**
  - `src/auth/roles.ts`
  - `src/auth/roles.test.ts`
  - `src/projects/project-service.ts`
- **Test Coverage:** `src/auth/roles.test.ts` (testing `projects:write` permission for all roles).
- **Migration Impact:** None.
- **Acceptance Criteria:** Granular `projects:write` permission assigned to `OWNER`, `ADMIN`, `SALES`, `PROJECT_MANAGER`, `CONTRIBUTOR`.

---

## Execution Plan & Task Breakdown

### Task 1: Fix Credentials Session & Auth Types (Defect 1)
- Configure JWT strategy in `src/auth.ts`.
- Add `jwt` and `session` callbacks.
- Add NextAuth TS module augmentation in `src/types/next-auth.d.ts`.
- Add unit tests in `src/auth/auth-session.test.ts`.
- Audit `.env.example` & `.github/workflows/ci.yml` for `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.

### Task 2: Remove Demo Fallbacks & Add Trusted Workspace Helper (Defect 2)
- Implement `requireAuthenticatedUser()` and `getWorkspaceContext()` in `src/auth/session-helper.ts`.
- Remove all `demo-user` and `demo-org` strings from pages and server actions.
- Add unit tests in `src/auth/session-helper.test.ts`.

### Task 3: Typed Domain Errors & Centralized Error Handling (Defect 3)
- Define `DomainError` subclasses in `src/errors/domain-errors.ts`.
- Update `requireMembership`, `client-service`, `project-service` to throw typed errors.
- Implement error mapping helper in `src/errors/error-handler.ts`.
- Update Server Components and Actions to use error handler.
- Add unit tests in `src/errors/error-handler.test.ts`.

### Task 4: Fix Partial Project Update Validation (Defect 4)
- Update `updateProject` in `src/projects/project-service.ts` to merge existing project state before validating min/max budget and start/end dates.
- Add partial update unit tests in `src/projects/project-service.test.ts`.

### Task 5: Enforce Database-Level Tenant Consistency & Migration (Defect 5)
- Add composite keys and foreign keys to `prisma/schema.prisma`.
- Generate migration `prisma/migrations/20260727170000_enforce_tenant_consistency/migration.sql`.
- Add integration/unit tests in `src/security/tenant-db-integrity.test.ts`.

### Task 6: Granular `projects:write` Permission & Role Audit (Permission Review)
- Add `projects:write` to `src/auth/roles.ts`.
- Update `src/projects/project-service.ts` to require `projects:write`.
- Add permission tests in `src/auth/roles.test.ts`.

### Task 7: Dynamic Workspace Currency Formatting (Defect 8)
- Implement `formatCurrency` in `src/utils/currency-formatter.ts`.
- Update project pages to format monetary fields using `organization.defaultCurrency`.
- Add unit tests in `src/utils/currency-formatter.test.ts`.

### Task 8: Authenticated Playwright E2E Test Suite (Defect 6)
- Create deterministic seed/fixture helper in `e2e/helpers/seed.ts` and `e2e/helpers/auth.ts`.
- Update `e2e/client-project.spec.ts` and create `e2e/tenant-isolation.spec.ts`.

### Task 9: Update GitHub Actions CI Workflow (Defect 7)
- Update `.github/workflows/ci.yml` with Playwright browser installation, environment setup, E2E test execution, and artifact upload.

---

## Verification & Validation Commands

- `pnpm prisma validate`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm exec playwright test --list`
- `pnpm test:e2e`
- `git grep -n "demo-user"`
- `git grep -n "demo-org"`
