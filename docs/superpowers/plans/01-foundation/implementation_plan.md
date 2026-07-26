# ScopePilot Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a deterministic, tested Next.js application with validated configuration, PostgreSQL persistence, health checks, and continuous integration.

**Architecture:** Use one Next.js App Router repository. Server-only modules own environment parsing and database access; route handlers expose narrow HTTP boundaries. PostgreSQL runs in Docker locally and as a CI service.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** Approved PRD and an empty Git repository.

---

## File map

- `package.json` — runtime and verification scripts
- `src/config/env.ts` — environment validation
- `prisma/schema.prisma` — initial persistence model
- `src/db/client.ts` — Prisma lifecycle
- `src/app/api/health/route.ts` — readiness endpoint
- `.github/workflows/ci.yml` — pull-request verification

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Scaffold the application and verification scripts

**Files:**
- Create: `package.json`
- Create: `.nvmrc`
- Create: `pnpm-workspace.yaml`
- Create: `src/app/page.tsx`
- Create: `vitest.config.ts`
- Test: `src/app/page.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/page.test.ts
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
it('contains the product name', async () => {
  expect(await readFile('src/app/page.tsx', 'utf8')).toContain('ScopePilot');
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/app/page.test.ts
```

Expected: FAIL because the project and test runner do not exist.

- [ ] **Step 3: Write the minimal implementation**

```json
// package.json
{
  "name": "scopepilot",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.13.1",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": { "next": "16.2.11", "react": "latest", "react-dom": "latest", "zod": "latest" },
  "devDependencies": { "@playwright/test": "latest", "@types/node": "latest", "@types/react": "latest", "@types/react-dom": "latest", "@vitest/coverage-v8": "latest", "typescript": "latest", "vite": "latest", "vitest": "latest" }
}
```
```text
# .nvmrc
22
```
```yaml
# pnpm-workspace.yaml
packages:
  - .
```
```tsx
// src/app/page.tsx
export default function HomePage() {
  return <main><h1>ScopePilot</h1><p>Proposal and scope control for digital agencies.</p></main>;
}
```
```ts
// vitest.config.ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'] }, resolve: { alias: { '@': path.resolve(__dirname, 'src') } } });
```
```ts
// src/app/page.test.ts
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
it('contains the product name', async () => {
  expect(await readFile('src/app/page.tsx', 'utf8')).toContain('ScopePilot');
});
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm install && pnpm vitest run src/app/page.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add package.json pnpm-lock.yaml .nvmrc pnpm-workspace.yaml vitest.config.ts src/app && git commit -m "chore: scaffold ScopePilot"
```

### Task 2: Validate server environment variables

**Files:**
- Create: `src/config/env.ts`
- Create: `.env.example`
- Test: `src/config/env.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/config/env.test.ts
import { expect, it } from 'vitest';
import { parseEnv } from './env';
it('rejects malformed configuration', () => {
  expect(() => parseEnv({ DATABASE_URL: 'x', AUTH_SECRET: 'short' })).toThrow();
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/config/env.test.ts
```

Expected: FAIL because `src/config/env.ts` does not exist.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/config/env.ts
import { z } from 'zod';
const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development','test','production']).default('development'),
});
export function parseEnv(input: Record<string, string | undefined>) { return schema.parse(input); }
export const env = parseEnv(process.env);
```
```dotenv
# .env.example
DATABASE_URL=postgresql://scopepilot:scopepilot@localhost:5432/scopepilot
AUTH_SECRET=01234567890123456789012345678901
APP_URL=http://localhost:3000
NODE_ENV=development
```
```ts
// src/config/env.test.ts
import { expect, it } from 'vitest';
import { parseEnv } from './env';
it('rejects malformed configuration', () => {
  expect(() => parseEnv({ DATABASE_URL: 'x', AUTH_SECRET: 'short' })).toThrow();
});
it('accepts complete local configuration', () => {
  expect(parseEnv({ DATABASE_URL: 'postgresql://scopepilot:scopepilot@localhost:5432/scopepilot', AUTH_SECRET: '01234567890123456789012345678901', NODE_ENV: 'test' }).NODE_ENV).toBe('test');
});
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/config/env.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/config .env.example && git commit -m "feat: validate environment"
```

### Task 3: Add PostgreSQL and Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma.config.ts`
- Create: `src/db/client.ts`
- Create: `docker-compose.yml`
- Test: `src/health/database-health.test.ts`
- Create: `src/health/database-health.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/health/database-health.test.ts
import { expect, it, vi } from 'vitest';
import { checkDatabaseHealth } from './database-health';
it('returns healthy after a successful query', async () => {
  await expect(checkDatabaseHealth({ $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) })).resolves.toEqual({ ok: true });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/health/database-health.test.ts
```

Expected: FAIL because the health service does not exist.

- [ ] **Step 3: Write the minimal implementation**

```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client" output = "../src/generated/prisma" }
datasource db { provider = "postgresql" }
model SystemRecord { id String @id @default(cuid()) key String @unique value String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
```
```ts
// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
export default defineConfig({ schema: 'prisma/schema.prisma', migrations: { path: 'prisma/migrations' }, datasource: { url: env('DATABASE_URL') } });
```
```ts
// src/db/client.ts
import { PrismaClient } from '@/generated/prisma/client';
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```
```ts
// src/health/database-health.ts
export async function checkDatabaseHealth(database: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> }) {
  await database.$queryRaw`SELECT 1`;
  return { ok: true as const };
}
```
```ts
// src/health/database-health.test.ts
import { expect, it, vi } from 'vitest';
import { checkDatabaseHealth } from './database-health';
it('returns healthy after a successful query', async () => {
  await expect(checkDatabaseHealth({ $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) })).resolves.toEqual({ ok: true });
});
```
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    environment: { POSTGRES_USER: scopepilot, POSTGRES_PASSWORD: scopepilot, POSTGRES_DB: scopepilot }
    ports: ["5432:5432"]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U scopepilot"], interval: 5s, timeout: 5s, retries: 10 }
volumes: { scopepilot_postgres: {} }
```
```bash
pnpm add @prisma/client dotenv
pnpm add -D prisma
pnpm prisma generate
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/health/database-health.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma prisma.config.ts src/db src/health docker-compose.yml package.json pnpm-lock.yaml && git commit -m "feat: add PostgreSQL foundation"
```

### Task 4: Expose health route and CI

**Files:**
- Create: `src/app/api/health/route.ts`
- Test: `src/app/api/health/route.test.ts`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/health/route.test.ts
import { expect, it, vi } from 'vitest';
vi.mock('@/db/client', () => ({ db: { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) } }));
import { GET } from './route';
it('returns HTTP 200', async () => { expect((await GET()).status).toBe(200); });
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/app/api/health/route.test.ts
```

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { checkDatabaseHealth } from '@/health/database-health';
export async function GET() {
  try { await checkDatabaseHealth(db); return NextResponse.json({ status: 'ok', database: 'ok' }); }
  catch { return NextResponse.json({ status: 'degraded', database: 'unavailable' }, { status: 503 }); }
}
```
```ts
// src/app/api/health/route.test.ts
import { expect, it, vi } from 'vitest';
vi.mock('@/db/client', () => ({ db: { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) } }));
import { GET } from './route';
it('returns HTTP 200', async () => { expect((await GET()).status).toBe(200); });
```
```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env: { POSTGRES_USER: scopepilot, POSTGRES_PASSWORD: scopepilot, POSTGRES_DB: scopepilot_test }
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U scopepilot" --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://scopepilot:scopepilot@localhost:5432/scopepilot_test
      AUTH_SECRET: 01234567890123456789012345678901
      APP_URL: http://localhost:3000
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.13.1 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma generate
      - run: pnpm prisma migrate deploy
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/app/api/health/route.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/app/api/health .github/workflows/ci.yml && git commit -m "ci: add health and verification pipeline"
```


## Plan self-review

- [ ] Confirm every PRD requirement assigned to this phase maps to a task.
- [ ] Confirm file paths, exported names, and model fields remain consistent across tasks.
- [ ] Confirm the plan contains no placeholder instructions and no unverified completion claim.

## Completion checklist

- [ ] A clean checkout can install dependencies with pnpm.
- [ ] `pnpm prisma validate`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
- [ ] The health endpoint returns 200 with a working database and 503 when unavailable.
- [ ] No production secret exists in the repository.

## Execution handoff

Use subagent-driven development for one reviewed task at a time, or execute inline with checkpoints after each task.
