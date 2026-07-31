# ScopePilot architecture reference

This document describes the architecture currently implemented in the repository. It does not describe roadmap capabilities as if they already exist.

## System boundary

ScopePilot is currently a server-rendered Next.js application backed by PostgreSQL.

Implemented product domains:

- authentication
- organizations and memberships
- role-based authorization
- clients
- projects
- audit events

Planned domains such as brief intake, AI extraction, proposals, approvals, scope comparison, change requests, and billing are outside the current runtime boundary.

## Runtime stack

| Layer | Technology |
|---|---|
| Application framework | Next.js App Router |
| Language | TypeScript |
| UI runtime | React |
| Authentication | NextAuth.js credentials provider |
| Password hashing | Argon2 |
| Database | PostgreSQL 17 |
| Data access | Prisma ORM 7 |
| Input validation | Zod |
| Unit and integration tests | Vitest |
| Browser tests | Playwright |
| Continuous integration | GitHub Actions |

## Application structure

The important source areas are:

```text
src/
├── app/                 Next.js routes and server-rendered pages
├── auth/                session, membership, password, and role logic
├── clients/             client validation and domain services
├── projects/            project validation, status rules, and services
├── errors/              typed domain errors and page error mapping
├── db/                  Prisma database client
├── security/            database-level tenant integrity tests
├── utils/               shared utilities such as currency formatting
└── generated/prisma/    generated Prisma Client output
```

The Prisma schema and migrations live under `prisma/`. Browser tests live under `e2e/`.

## Tenancy model

`Organization` is the tenant boundary.

Tenant-owned records include:

- memberships
- clients
- projects
- audit events

Every query or mutation in the client and project services receives an explicit `organizationId`. Domain queries include that value in their filters.

The application must not infer tenant access from a record ID alone.

## Authentication and workspace resolution

### Authentication

`requireAuthenticatedUser()` reads the server session and requires a stable user ID. An absent or incomplete session produces an unauthenticated domain error.

### Workspace selection

`getWorkspaceContext()` resolves the organization used by a request.

Its behavior is:

1. When a preferred organization ID is supplied, verify membership and the required permission.
2. Without a preferred organization ID, load the user’s memberships.
3. Reject users with no memberships.
4. Reject implicit selection when the user has multiple memberships.
5. Verify the requested permission before returning the context.

This design avoids silently selecting the wrong tenant for a multi-workspace user.

## Roles and permissions

The application defines these roles:

- `OWNER`
- `ADMIN`
- `SALES`
- `PROJECT_MANAGER`
- `CONTRIBUTOR`
- `VIEWER`

Permissions are capability-oriented rather than route-oriented:

- `members:manage`
- `clients:write`
- `projects:write`
- `pricing:write`
- `proposals:send`
- `records:view`

Current grants:

| Role | Main capabilities |
|---|---|
| OWNER | All defined permissions |
| ADMIN | All defined permissions |
| SALES | Client, project, pricing, proposal, and record access |
| PROJECT_MANAGER | Client, project, and record access |
| CONTRIBUTOR | Client, project, and record access |
| VIEWER | Read-only record access |

Some permissions represent future domains. Their presence in the role model does not mean the related product feature is implemented.

## Domain service pattern

Pages call domain services rather than issuing unrestricted database operations directly.

A typical mutation follows this sequence:

1. Require the relevant permission.
2. Parse untrusted input with a Zod schema.
3. Load tenant-scoped dependent records.
4. enforce domain invariants.
5. Run the state change and audit event in one database transaction.
6. Return the updated record.

This pattern keeps authorization, validation, persistence, and auditing close to the business operation.

## Client domain

Client records belong to one organization.

Supported operations:

- list active clients
- get an active client and its projects
- create a client
- update a client
- archive a client

Archiving is soft deletion through `archivedAt`. Normal list and detail queries exclude archived clients.

Client mutations write audit events such as:

- `client.created`
- `client.updated`
- `client.archived`

## Project domain

A project belongs to an organization and references:

- one client in the same organization
- one owner who is a member of the same organization

Supported operations:

- list projects
- get project details
- create a project
- update project fields
- transition project status
- archive a project through the status machine

Project mutations validate:

- the client exists in the tenant
- the owner is a tenant member
- minimum budget does not exceed maximum budget
- target start date does not follow target end date
- status transitions are allowed

For partial updates, the service merges patch values with existing persisted values before checking cross-field invariants.

## Project status machine

Allowed transitions are intentionally explicit:

```text
DRAFT
├── DISCOVERY
└── ARCHIVED

DISCOVERY
├── PROPOSAL_IN_PROGRESS
└── ARCHIVED

PROPOSAL_IN_PROGRESS
├── SENT
└── ARCHIVED

SENT
├── CLIENT_REVIEW
├── APPROVED
├── REJECTED
└── ARCHIVED

CLIENT_REVIEW
├── REVISION_REQUESTED
├── APPROVED
├── REJECTED
└── ARCHIVED

REVISION_REQUESTED
├── PROPOSAL_IN_PROGRESS
├── REJECTED
└── ARCHIVED

APPROVED ──> ARCHIVED
REJECTED ──> ARCHIVED
ARCHIVED ──> no transitions
```

The service rejects any transition absent from this map.

## Database-level tenant integrity

Application filters are not the only tenant defense.

The Prisma model also defines composite relationships:

- `Client` is unique by `(id, organizationId)`.
- `Project(clientId, organizationId)` references `Client(id, organizationId)`.
- `Project(ownerId, organizationId)` references `Membership(userId, organizationId)`.

These constraints prevent direct database writes from linking a project to a client or owner in another organization.

## Error model

Domain services throw typed errors for conditions such as:

- unauthenticated access
- forbidden access
- missing clients or projects
- invalid owners
- invalid input
- invalid status transitions

Page-level error handling maps known errors to the appropriate Next.js behavior, including redirects, forbidden responses, and not-found responses. Unexpected failures are rethrown rather than hidden.

## Audit logging

Material client and project mutations write `AuditEvent` records in the same transaction as the state change.

An audit event records:

- organization
- optional actor
- action name
- object type
- object ID
- optional JSON metadata
- creation time

The current audit table provides mutation history. It is not yet the immutable proposal-approval evidence system described in the product roadmap.

## Testing architecture

### Unit tests

Unit tests cover isolated validation, roles, authentication helpers, domain errors, currency formatting, and service behavior.

### Integration tests

Integration tests run against PostgreSQL and verify behavior that depends on real database constraints, including tenant integrity.

### End-to-end tests

Playwright tests exercise authenticated browser workflows, client and project creation, status changes, persistence, and cross-tenant denial.

E2E seed and cleanup logic refuses to target a database unless its name clearly represents a test environment.

## Continuous integration

The GitHub Actions workflow starts PostgreSQL 17 and runs:

1. dependency installation
2. Prisma generation
3. Prisma schema validation
4. committed migrations
5. TypeScript checking
6. unit tests
7. integration tests
8. production build
9. Playwright browser installation
10. E2E tests

Playwright reports and test results are uploaded when the workflow fails.

## Change rules

When extending the current architecture:

- keep organization ID explicit at every tenant boundary
- authorize before accessing tenant-owned data
- validate all untrusted input
- preserve domain invariants during partial updates
- use transactions for state changes and audit events
- add database constraints for relationships that must never cross tenants
- add tests at the lowest useful layer and use integration tests for database guarantees
- distinguish implemented behavior from roadmap intent in documentation
