# Run ScopePilot locally

This tutorial takes a new contributor from a clean checkout to a running ScopePilot development environment.

## What you will achieve

By the end, you will have:

- the application dependencies installed
- development and test PostgreSQL databases available
- Prisma Client generated and migrations applied
- the Next.js development server running
- the main verification commands available

## Prerequisites

Install the following software:

- Node.js 22.12 or later
- pnpm 10
- Git
- Docker Desktop, or PostgreSQL 17 installed directly

Confirm the main tools:

```bash
node --version
pnpm --version
docker --version
```

## 1. Clone the repository

```bash
git clone https://github.com/farzah14/scopepilot.git
cd scopepilot
```

## 2. Install dependencies

```bash
pnpm install
```

The `postinstall` script generates Prisma Client. You can regenerate it explicitly at any time with:

```bash
pnpm prisma generate
```

## 3. Configure the environment

Copy the example file:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

The default local values are:

```dotenv
DATABASE_URL=postgresql://scopepilot:scopepilot@localhost:5432/scopepilot
TEST_DATABASE_URL=postgresql://scopepilot:scopepilot@localhost:5432/scopepilot_test
AUTH_SECRET=01234567890123456789012345678901
NEXTAUTH_SECRET=01234567890123456789012345678901
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
NODE_ENV=development
```

The checked-in secrets are placeholders for local development. Replace them with generated secrets before deploying or sharing an environment.

## 4. Start PostgreSQL

The repository includes a Docker Compose service for PostgreSQL 17:

```bash
docker compose up -d postgres
```

Check that the service is healthy:

```bash
docker compose ps
```

The Compose configuration creates the development database named `scopepilot`.

Create the test database separately:

```bash
docker compose exec postgres createdb -U scopepilot scopepilot_test
```

If PostgreSQL reports that `scopepilot_test` already exists, no further action is required.

## 5. Apply the database migrations

Generate Prisma Client and apply committed migrations:

```bash
pnpm prisma generate
pnpm prisma migrate deploy
```

Validate the schema:

```bash
pnpm prisma validate
```

## 6. Start the application

```bash
pnpm dev
```

Open `http://localhost:3000`.

The home page identifies ScopePilot as a proposal and scope-control application. Authenticated application routes use the current user’s workspace membership to select tenant-scoped records.

## 7. Run fast verification

Run static type checking and unit tests:

```bash
pnpm typecheck
pnpm test
```

Build the production bundle:

```bash
pnpm build
```

## 8. Run database integration tests

Integration tests use `TEST_DATABASE_URL`:

```bash
pnpm test:integration
```

Keep development and test databases separate. Tests that create or remove records must never target a production database.

## 9. Run browser tests

Install Chromium for Playwright:

```bash
pnpm exec playwright install chromium
```

Then run the end-to-end suite:

```bash
pnpm test:e2e
```

The E2E helpers validate the database name before seeding or cleanup. The target database name must indicate a test environment, such as `scopepilot_test`.

## 10. Stop local services

Stop the PostgreSQL container without deleting its volume:

```bash
docker compose down
```

To delete the stored local database data as well:

```bash
docker compose down --volumes
```

## Common problems

### Port 5432 is already in use

Another PostgreSQL instance is probably running. Stop that instance or change the host port in `docker-compose.yml` and update both database URLs.

### Prisma cannot connect

Check that PostgreSQL is healthy and that `.env` points to the same host, port, username, password, and database name.

```bash
docker compose ps
```

### Authentication redirects back to sign-in

Confirm that `NEXTAUTH_URL` matches the URL used in the browser and that `NEXTAUTH_SECRET` is set.

### E2E tests refuse to run

This is an intentional safety mechanism. Set `DATABASE_URL` to a dedicated test database whose name contains `test` or `integration`.

## Next steps

Read [`../reference/architecture.md`](../reference/architecture.md) before modifying authentication, tenancy, clients, projects, or database relationships.
