# ScopePilot Implementation Plans

This archive contains ten phase-specific implementation plans derived from the ScopePilot PRD. Execute them in numeric order. Each phase is intended to produce working, testable software and uses test-driven development with focused commits.

## Assumed stack

- Node.js 22 LTS and pnpm 10
- Next.js 16.2 LTS App Router and TypeScript
- PostgreSQL 17 and Prisma ORM 7
- Auth.js
- Zod, Vitest, Testing Library, and Playwright
- Private object storage for commercial files
- Vercel AI SDK structured outputs
- Stripe in test mode until launch approval
- GitHub Actions and Vercel

## Execution order

1. `01-foundation/implementation_plan.md`
2. `02-auth-workspaces/implementation_plan.md`
3. `03-client-projects/implementation_plan.md`
4. `04-brief-intake/implementation_plan.md`
5. `05-ai-requirement-extraction/implementation_plan.md`
6. `06-proposal-builder/implementation_plan.md`
7. `07-client-review-approval/implementation_plan.md`
8. `08-scope-guard/implementation_plan.md`
9. `09-change-requests/implementation_plan.md`
10. `10-billing-launch/implementation_plan.md`

Before executing a phase, create an isolated worktree and use either subagent-driven development or the executing-plans workflow. Do not execute later phases before the required earlier data models and domain services exist.
