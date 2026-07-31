# ScopePilot

ScopePilot is a multi-tenant proposal and scope-management platform for digital agencies.

The product vision is to convert fragmented client information into structured requirements, proposals, approvals, and controlled scope changes. The current codebase implements the application foundation, authentication and workspaces, plus tenant-scoped client and project management.

## Current implementation status

### Implemented

- Next.js App Router application with TypeScript
- PostgreSQL persistence through Prisma ORM
- Credentials authentication with password hashing
- Organizations, memberships, and role-based permissions
- Tenant-scoped client creation, editing, listing, and archiving
- Tenant-scoped project creation, editing, ownership, and lifecycle transitions
- Audit events for client and project mutations
- Database constraints that prevent cross-tenant client and project relationships
- Unit, integration, and Playwright end-to-end test suites
- GitHub Actions verification pipeline

### Planned

The following capabilities are defined in the product requirements and phase plans but are not yet implemented:

- Brief intake and document uploads
- AI-assisted requirement extraction
- Proposal construction and pricing packages
- Client review, revision, and approval
- Approved-scope preservation and comparison
- Change-request generation
- Billing and launch operations

Do not describe planned capabilities as available product features.

## Technology stack

- Node.js 22+
- pnpm 10
- Next.js 16.2 and React 19
- TypeScript
- PostgreSQL 17
- Prisma ORM 7
- NextAuth.js with the Prisma adapter
- Zod
- Vitest
- Playwright
- GitHub Actions

## Run locally

### Prerequisites

Install:

- Node.js 22.12 or later
- pnpm 10
- Docker Desktop or another PostgreSQL 17 installation

### 1. Clone and install

```bash
git clone https://github.com/farzah14/scopepilot.git
cd scopepilot
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

The example configuration expects PostgreSQL on `localhost:5432` and uses separate development and test databases.

Generate secure authentication secrets before using the application outside local development.

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
```

Create the test database if it does not already exist:

```bash
docker compose exec postgres createdb -U scopepilot scopepilot_test
```

### 4. Prepare the database

```bash
pnpm prisma generate
pnpm prisma migrate deploy
```

### 5. Start the application

```bash
pnpm dev
```

Open `http://localhost:3000`.

For a detailed setup walkthrough, see [`docs/tutorials/local-development.md`](docs/tutorials/local-development.md).

## Verification commands

Run the same major checks used by continuous integration:

```bash
pnpm prisma validate
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Integration and end-to-end tests must target a database whose name clearly indicates that it is a test database. The E2E seed helper rejects unsafe database targets.

## Architecture and security

See [`docs/reference/architecture.md`](docs/reference/architecture.md) for:

- tenancy boundaries
- authentication and workspace resolution
- roles and permissions
- client and project domain services
- project status transitions
- audit logging
- test layers and CI behavior

## Product and implementation documents

- Product requirements: [`docs/specs/scopepilot-product-requirements.md`](docs/specs/scopepilot-product-requirements.md)
- Phase plans: [`docs/superpowers/plans/`](docs/superpowers/plans/)

The phase plans describe intended implementation work. The source code and current-state documentation are authoritative for what exists today.
