# ScopePilot Change Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn confirmed outside-scope requests into reviewable, price-controlled change requests that can extend the active scope after approval.

**Architecture:** Change requests reference both the original ScopeRequest and current approved baseline. AI drafts descriptive impact only; users enter price and timeline impact, and approved records become append-only scope evidence.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `prisma/schema.prisma` — updated by this phase
- `src/changes/change-request-schema.ts` — created by this phase
- `src/changes/change-request-schema.test.ts` — verification for this phase
- `src/ai/change-draft-output.ts` — created by this phase
- `src/changes/draft-change-request.ts` — created by this phase
- `src/changes/draft-change-request.test.ts` — verification for this phase
- `src/changes/approve-change-request.ts` — created by this phase
- `src/changes/approve-change-request.test.ts` — verification for this phase
- `src/scope/load-scope-baseline.ts` — updated by this phase
- `src/scope/load-scope-baseline.test.ts` — updated by this phase
- `src/app/(app)/projects/[projectId]/changes/page.tsx` — created by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Add change request models and input contract

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/changes/change-request-schema.ts`
- Test: `src/changes/change-request-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/changes/change-request-schema.test.ts
import { expect, it } from 'vitest';import { changeRequestInput } from './change-request-schema';it('requires explicit currency and nonnegative price impact',()=>expect(()=>changeRequestInput.parse({title:'Payroll module',description:'Add payroll',currency:'USD',priceImpactCents:-1,timelineImpactDays:5})).toThrow());
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/changes/change-request-schema.test.ts
```

Expected: FAIL because the change request contract is absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
enum ChangeRequestStatus { DRAFT INTERNAL_REVIEW SENT APPROVED REJECTED WITHDRAWN }
model ChangeRequest { id String @id @default(cuid()) organizationId String projectId String scopeRequestId String versionNumber Int @default(1) title String description String affectedScope Json newDeliverables Json timelineImpactDays Int priceImpactCents Int currency String assumptions Json status ChangeRequestStatus @default(DRAFT) createdById String approvedAt DateTime? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt @@index([organizationId, projectId, status]) }
```
```ts
// src/changes/change-request-schema.ts
import { z } from 'zod';export const changeRequestInput=z.object({title:z.string().trim().min(3).max(160),description:z.string().trim().min(10).max(10_000),currency:z.enum(['USD','IDR']),priceImpactCents:z.number().int().nonnegative(),timelineImpactDays:z.number().int().min(0).max(365),affectedScope:z.array(z.string().min(1)).max(50).default([]),newDeliverables:z.array(z.object({name:z.string().min(2),description:z.string().min(5),acceptanceCriteria:z.string().min(5)})).min(1).max(30),assumptions:z.array(z.string().min(3)).max(30).default([])});
```
```bash
pnpm prisma migrate dev --name add_change_requests
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/changes/change-request-schema.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/changes && git commit -m "feat: add change request model"
```

### Task 2: Draft descriptive change impact from a confirmed scope decision

**Files:**
- Create: `src/ai/change-draft-output.ts`
- Create: `src/changes/draft-change-request.ts`
- Test: `src/changes/draft-change-request.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/changes/draft-change-request.test.ts
import { expect, it, vi } from 'vitest';import { draftChangeRequest } from './draft-change-request';it('refuses an included request',async()=>{const db={scopeRequest:{findFirst:vi.fn().mockResolvedValue({confirmedClassification:'INCLUDED'})}};await expect(draftChangeRequest(db as never,{} as never,{organizationId:'o1',projectId:'p1',scopeRequestId:'s1',userId:'u1'})).rejects.toThrow('CHANGE_REQUEST_NOT_ALLOWED');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/changes/draft-change-request.test.ts
```

Expected: FAIL because change drafting is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/ai/change-draft-output.ts
import { z } from 'zod';export const changeDraftOutput=z.object({title:z.string().min(3).max(160),description:z.string().min(10),affectedScope:z.array(z.string()).max(50),newDeliverables:z.array(z.object({name:z.string().min(2),description:z.string().min(5),acceptanceCriteria:z.string().min(5)})).min(1),assumptions:z.array(z.string().min(3)).max(30)});
```
```ts
// src/changes/draft-change-request.ts
import type { StructuredAiClient } from '@/ai/structured-client';import { changeDraftOutput } from '@/ai/change-draft-output';export async function draftChangeRequest(db:any,ai:StructuredAiClient,args:{organizationId:string;projectId:string;scopeRequestId:string;userId:string}){const request=await db.scopeRequest.findFirst({where:{id:args.scopeRequestId,organizationId:args.organizationId,projectId:args.projectId}});if(!request||!['AMBIGUOUS','PROBABLY_OUTSIDE_SCOPE','OUTSIDE_SCOPE'].includes(request.confirmedClassification))throw new Error('CHANGE_REQUEST_NOT_ALLOWED');const generated=await ai.generate({system:'Draft only the descriptive scope impact. Do not invent a price, payment term, legal clause, or delivery date.',prompt:JSON.stringify({request:request.requestText,reason:request.aiReason,evidence:request.evidence}),schema:changeDraftOutput,schemaName:'change_request_draft'});return db.changeRequest.create({data:{organizationId:args.organizationId,projectId:args.projectId,scopeRequestId:request.id,createdById:args.userId,...generated.value,timelineImpactDays:0,priceImpactCents:0,currency:'USD'}});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/changes/draft-change-request.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/ai/change-draft-output.ts src/changes/draft-change-request.ts src/changes/draft-change-request.test.ts && git commit -m "feat: draft controlled change requests"
```

### Task 3: Approve change requests with immutable audit evidence

**Files:**
- Create: `src/changes/approve-change-request.ts`
- Test: `src/changes/approve-change-request.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/changes/approve-change-request.test.ts
import { expect, it, vi } from 'vitest';import { approveChangeRequest } from './approve-change-request';it('records approval and audit event atomically',async()=>{const audit=vi.fn();const tx={changeRequest:{findFirst:vi.fn().mockResolvedValue({id:'c1',status:'SENT'}),update:vi.fn().mockResolvedValue({id:'c1'})},auditEvent:{create:audit}};await approveChangeRequest({$transaction:(fn:any)=>fn(tx)} as never,{organizationId:'o1',changeRequestId:'c1',actorId:'u1'});expect(audit).toHaveBeenCalledWith({data:expect.objectContaining({action:'change_request.approved'})});});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/changes/approve-change-request.test.ts
```

Expected: FAIL because change approval is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/changes/approve-change-request.ts
export async function approveChangeRequest(db:any,args:{organizationId:string;changeRequestId:string;actorId:string}){return db.$transaction(async(tx:any)=>{const request=await tx.changeRequest.findFirst({where:{id:args.changeRequestId,organizationId:args.organizationId}});if(!request)throw new Error('CHANGE_REQUEST_NOT_FOUND');if(request.status!=='SENT')throw new Error('CHANGE_REQUEST_NOT_SENT');const updated=await tx.changeRequest.update({where:{id:request.id},data:{status:'APPROVED',approvedAt:new Date()}});await tx.auditEvent.create({data:{organizationId:args.organizationId,actorId:args.actorId,action:'change_request.approved',objectType:'ChangeRequest',objectId:request.id,metadata:{priceImpactCents:request.priceImpactCents,timelineImpactDays:request.timelineImpactDays}}});return updated;});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/changes/approve-change-request.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/changes/approve-change-request.ts src/changes/approve-change-request.test.ts && git commit -m "feat: approve change requests with audit evidence"
```

### Task 4: Include approved changes in future scope checks

**Files:**
- Modify: `src/scope/load-scope-baseline.ts`
- Modify: `src/scope/load-scope-baseline.test.ts`
- Create: `src/app/(app)/projects/[projectId]/changes/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// Add to src/scope/load-scope-baseline.test.ts
it('includes approved change requests',async()=>{const db={proposalVersion:{findFirst:vi.fn().mockResolvedValue({id:'v1',deliverables:[],sections:[]})},changeRequest:{findMany:vi.fn().mockResolvedValue([{id:'c1',title:'Payroll module',newDeliverables:[]}])}};const baseline=await loadScopeBaseline(db as never,'o1','p1');expect(baseline.approvedChanges).toHaveLength(1);});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/scope/load-scope-baseline.test.ts
```

Expected: FAIL because the baseline omits approved changes.

- [ ] **Step 3: Write the minimal implementation**

```ts
// Replace src/scope/load-scope-baseline.ts
export async function loadScopeBaseline(db:any,organizationId:string,projectId:string){const version=await db.proposalVersion.findFirst({where:{status:'APPROVED',proposal:{organizationId,projectId}},include:{deliverables:true,sections:{where:{kind:{in:['EXCLUSIONS','REVISION_POLICY','ASSUMPTIONS','ACCEPTANCE_CRITERIA']}}}},orderBy:{versionNumber:'desc'}});if(!version)throw new Error('APPROVED_SCOPE_REQUIRED');const approvedChanges=await db.changeRequest.findMany({where:{organizationId,projectId,status:'APPROVED'},orderBy:{approvedAt:'asc'}});return {proposalVersionId:version.id,deliverables:version.deliverables,sections:version.sections,approvedChanges};}
```
```tsx
// src/app/(app)/projects/[projectId]/changes/page.tsx
export default function ChangesPage(){return <main><h1>Change requests</h1><p>Draft, review, send, and approve changes that extend the active project scope.</p></main>;}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/scope/load-scope-baseline.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/scope src/app && git commit -m "feat: extend scope baseline with approved changes"
```


## Plan self-review

- [ ] Confirm every PRD requirement assigned to this phase maps to a task.
- [ ] Confirm file paths, exported names, and model fields remain consistent across tasks.
- [ ] Confirm the plan contains no placeholder instructions and no unverified completion claim.

## Completion checklist

- [ ] Every task test passes with exit code 0.
- [ ] Prisma schema validates when this phase changes data models.
- [ ] Type checking and linting pass.
- [ ] No organization-owned query omits organizationId scoping.
- [ ] A focused commit exists for every task.

## Execution handoff

Use subagent-driven development for one reviewed task at a time, or execute inline with checkpoints after each task.
