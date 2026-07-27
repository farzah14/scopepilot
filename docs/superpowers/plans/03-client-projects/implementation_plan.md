# ScopePilot Clients and Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build tenant-scoped client records, project opportunities, lifecycle status transitions, and atomic audit history with strict server-side session-based authorization and cross-tenant isolation.

**Architecture:** All operations are strictly organization-scoped and authorized server-side using Auth.js session user IDs and membership permissions via `requireMembership`. Domain services (`client-service.ts`, `project-service.ts`) own validation, cross-tenant check, state transitions, and atomic audit logging inside Prisma transactions.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Stripe test mode; GitHub Actions.

**Depends on:** Phase 2 (Authentication & Workspaces).

---

## File map

- `prisma/schema.prisma` — updated with Client, Project, AuditEvent models, reciprocal relations, and indexes
- `prisma/migrations/20260727160000_add_clients_projects/migration.sql` — committed Phase 3 database migration
- `src/projects/project-status.ts` — created by this phase
- `src/projects/project-status.test.ts` — status transition logic tests
- `src/clients/client-schema.ts` — Zod schemas for client operations
- `src/clients/client-service.ts` — tenant-scoped client domain service
- `src/clients/client-service.test.ts` — unit and security tests for client service
- `src/projects/project-schema.ts` — Zod schemas for project operations
- `src/projects/project-service.ts` — tenant-scoped project lifecycle service
- `src/projects/project-service.test.ts` — unit and security tests for project service
- `src/security/tenant-isolation.test.ts` — dedicated cross-tenant security test suite
- `src/app/(app)/clients/page.tsx` — client listing screen
- `src/app/(app)/clients/new/page.tsx` — client creation screen
- `src/app/(app)/clients/[clientId]/page.tsx` — client detail & associated project listing screen
- `src/app/(app)/projects/[projectId]/page.tsx` — project detail & lifecycle management screen
- `e2e/client-project.spec.ts` — end-to-end user flow verification

---

## Execution rules

1. Work only inside the `03-clients-projects` worktree branch.
2. Execute tasks in order and keep each commit focused.
3. Apply Red-Green-Refactor TDD cycle.
4. Derive authenticated user ID strictly from trusted Auth.js server session.
5. Scope every database query with `organizationId`.
6. Raise `FORBIDDEN` for missing membership or insufficient permission (`clients:write` / `records:view`).
7. Raise `CLIENT_NOT_FOUND` or `PROJECT_NOT_FOUND` for null tenant-scoped query results.
8. Perform database mutations and audit event logs atomically inside `$transaction`.

---

### Task 1: Add Client, Project, ProjectStatus, AuditEvent models and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260727160000_add_clients_projects/migration.sql`
- Create: `src/projects/project-status.ts`
- Test: `src/projects/project-status.test.ts`

- [ ] **Step 1: Write project status transition unit test**
- [ ] **Step 2: Implement `src/projects/project-status.ts`**
- [ ] **Step 3: Update `prisma/schema.prisma` with models, reciprocal relations on User & Organization, and indexes**
- [ ] **Step 4: Generate migration SQL & run `pnpm prisma generate` + `pnpm prisma validate`**
- [ ] **Step 5: Verify tests and commit**

### Task 2: Implement tenant-scoped client service with atomic audit logging

**Files:**
- Create: `src/clients/client-schema.ts`
- Create: `src/clients/client-service.ts`
- Test: `src/clients/client-service.test.ts`

- [ ] **Step 1: Write failing client service unit tests (create, list, detail, update, archive)**
- [ ] **Step 2: Implement Zod input schemas in `src/clients/client-schema.ts`**
- [ ] **Step 3: Implement client service methods in `src/clients/client-service.ts` with `requireMembership` auth and atomic `AuditEvent` creation**
- [ ] **Step 4: Verify tests pass (`pnpm vitest run src/clients/client-service.test.ts`)**
- [ ] **Step 5: Commit**

### Task 3: Implement project service with cross-tenant validation and atomic audit logging

**Files:**
- Create: `src/projects/project-schema.ts`
- Create: `src/projects/project-service.ts`
- Test: `src/projects/project-service.test.ts`

- [ ] **Step 1: Write failing project service unit tests (create, list, detail, update, transition, archive)**
- [ ] **Step 2: Implement Zod input schemas in `src/projects/project-schema.ts` (validate budget range, date range)**
- [ ] **Step 3: Implement project service methods in `src/projects/project-service.ts` (verify clientId & ownerId belong to organizationId, atomic `AuditEvent` logging)**
- [ ] **Step 4: Verify tests pass (`pnpm vitest run src/projects/project-service.test.ts`)**
- [ ] **Step 5: Commit**

### Task 4: Add explicit cross-tenant security test suite

**Files:**
- Create: `src/security/tenant-isolation.test.ts`

- [ ] **Step 1: Write security tests asserting `CLIENT_NOT_FOUND` / `PROJECT_NOT_FOUND` / `FORBIDDEN` for all unauthorized cross-tenant operations**
- [ ] **Step 2: Verify all security tests pass (`pnpm vitest run src/security/tenant-isolation.test.ts`)**
- [ ] **Step 3: Commit**

### Task 5: Implement UI pages for Clients and Projects

**Files:**
- Create: `src/app/(app)/clients/page.tsx`
- Create: `src/app/(app)/clients/new/page.tsx`
- Create: `src/app/(app)/clients/[clientId]/page.tsx`
- Create: `src/app/(app)/projects/[projectId]/page.tsx`
- Create: `e2e/client-project.spec.ts`

- [ ] **Step 1: Implement Client list, creation, detail (with associated projects), and Project detail UI pages**
- [ ] **Step 2: Create E2E specification**
- [ ] **Step 3: Verify typecheck, schema, and tests**
- [ ] **Step 4: Commit**
