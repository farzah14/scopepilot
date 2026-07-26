# ScopePilot Client Review and Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Share immutable proposal versions through secure links, collect section comments, and record explicit client approval evidence.

**Architecture:** Public access is token-based and limited to one proposal version. Comments and approvals are append-only commercial records; any material proposal edit creates a new version and invalidates pending approval.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `prisma/schema.prisma` — updated by this phase
- `src/sharing/share-token.ts` — created by this phase
- `src/sharing/share-token.test.ts` — verification for this phase
- `src/sharing/create-proposal-share.ts` — created by this phase
- `src/sharing/resolve-proposal-share.ts` — created by this phase
- `src/sharing/resolve-proposal-share.test.ts` — verification for this phase
- `src/review/add-comment.ts` — created by this phase
- `src/review/approve-proposal.ts` — created by this phase
- `src/review/approve-proposal.test.ts` — verification for this phase
- `src/app/p/[token]/page.tsx` — created by this phase
- `src/app/p/[token]/approve/page.tsx` — created by this phase
- `e2e/proposal-approval.spec.ts` — created by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Add share link, comment, and approval models

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/sharing/share-token.ts`
- Test: `src/sharing/share-token.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/sharing/share-token.test.ts
import { expect, it } from 'vitest';import { hashShareToken } from './share-token';it('never stores the raw token',()=>{const token='client-secret-token';expect(hashShareToken(token)).not.toContain(token);});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/sharing/share-token.test.ts
```

Expected: FAIL because token handling is absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
model ProposalShare { id String @id @default(cuid()) proposalVersionId String tokenHash String @unique expiresAt DateTime? disabledAt DateTime? requireIdentity Boolean @default(true) createdById String createdAt DateTime @default(now()) proposalVersion ProposalVersion @relation(fields:[proposalVersionId], references:[id], onDelete:Cascade) }
model ProposalComment { id String @id @default(cuid()) proposalVersionId String sectionId String? authorName String authorEmail String body String parentId String? resolvedAt DateTime? createdAt DateTime @default(now()) @@index([proposalVersionId, createdAt]) }
model ProposalApproval { id String @id @default(cuid()) proposalVersionId String @unique clientName String clientEmail String confirmationText String integrityHash String approvedAt DateTime @default(now()) ipAddressHash String? userAgent String? @@index([proposalVersionId, approvedAt]) }
```
```ts
// src/sharing/share-token.ts
import { createHash, randomBytes } from 'node:crypto';
export const hashShareToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export function createShareToken(){const raw=randomBytes(32).toString('base64url');return {raw,hash:hashShareToken(raw)};}
```
```bash
pnpm prisma migrate dev --name add_client_review
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/sharing/share-token.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/sharing && git commit -m "feat: add client review data model"
```

### Task 2: Create and resolve secure proposal shares

**Files:**
- Create: `src/sharing/create-proposal-share.ts`
- Create: `src/sharing/resolve-proposal-share.ts`
- Test: `src/sharing/resolve-proposal-share.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/sharing/resolve-proposal-share.test.ts
import { expect, it, vi } from 'vitest';import { resolveProposalShare } from './resolve-proposal-share';it('rejects an expired share',async()=>{const db={proposalShare:{findUnique:vi.fn().mockResolvedValue({expiresAt:new Date(0),disabledAt:null})}};await expect(resolveProposalShare(db as never,'raw')).rejects.toThrow('SHARE_EXPIRED');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/sharing/resolve-proposal-share.test.ts
```

Expected: FAIL because share resolution is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/sharing/create-proposal-share.ts
import { createShareToken } from './share-token';
export async function createProposalShare(db:any,args:{proposalVersionId:string;createdById:string;expiresAt?:Date}){const token=createShareToken();await db.proposalShare.create({data:{proposalVersionId:args.proposalVersionId,createdById:args.createdById,expiresAt:args.expiresAt,tokenHash:token.hash}});return token.raw;}
```
```ts
// src/sharing/resolve-proposal-share.ts
import { hashShareToken } from './share-token';
export async function resolveProposalShare(db:any,rawToken:string){const share=await db.proposalShare.findUnique({where:{tokenHash:hashShareToken(rawToken)},include:{proposalVersion:true}});if(!share||share.disabledAt)throw new Error('SHARE_NOT_FOUND');if(share.expiresAt&&share.expiresAt<=new Date())throw new Error('SHARE_EXPIRED');return share;}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/sharing/resolve-proposal-share.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/sharing && git commit -m "feat: create secure proposal shares"
```

### Task 3: Record comments and immutable approval

**Files:**
- Create: `src/review/add-comment.ts`
- Create: `src/review/approve-proposal.ts`
- Test: `src/review/approve-proposal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/review/approve-proposal.test.ts
import { expect, it, vi } from 'vitest';import { approveProposal } from './approve-proposal';it('stores the exact version integrity hash',async()=>{const create=vi.fn().mockResolvedValue({id:'a1'});const db={proposalVersion:{findUnique:vi.fn().mockResolvedValue({id:'v1',integrityHash:'hash-1'})},proposalApproval:{create}};await approveProposal(db as never,{proposalVersionId:'v1',clientName:'Ana',clientEmail:'ana@example.com',confirmationText:'I approve this proposal.'});expect(create).toHaveBeenCalledWith({data:expect.objectContaining({integrityHash:'hash-1'})});});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/review/approve-proposal.test.ts
```

Expected: FAIL because approval recording is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/review/add-comment.ts
import { z } from 'zod';const input=z.object({proposalVersionId:z.string(),sectionId:z.string().optional(),authorName:z.string().min(2),authorEmail:z.string().email(),body:z.string().trim().min(2).max(5000)});export async function addComment(db:any,value:unknown){return db.proposalComment.create({data:input.parse(value)});}
```
```ts
// src/review/approve-proposal.ts
import { z } from 'zod';const input=z.object({proposalVersionId:z.string(),clientName:z.string().min(2),clientEmail:z.string().email(),confirmationText:z.literal('I approve this proposal.'),ipAddressHash:z.string().optional(),userAgent:z.string().max(1000).optional()});export async function approveProposal(db:any,value:unknown){const data=input.parse(value);const version=await db.proposalVersion.findUnique({where:{id:data.proposalVersionId}});if(!version)throw new Error('PROPOSAL_VERSION_NOT_FOUND');if(version.status==='APPROVED')throw new Error('ALREADY_APPROVED');return db.$transaction(async(tx:any)=>{const approval=await tx.proposalApproval.create({data:{...data,integrityHash:version.integrityHash}});await tx.proposalVersion.update({where:{id:version.id},data:{status:'APPROVED'}});await tx.proposal.update({where:{id:version.proposalId},data:{status:'APPROVED'}});return approval;});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/review/approve-proposal.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/review && git commit -m "feat: add proposal comments and approval"
```

### Task 4: Add public review experience and approval receipt test

**Files:**
- Create: `src/app/p/[token]/page.tsx`
- Create: `src/app/p/[token]/approve/page.tsx`
- Create: `e2e/proposal-approval.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// e2e/proposal-approval.spec.ts
import { test, expect } from '@playwright/test';test('client explicitly approves one proposal version',async({page})=>{await page.goto('/p/test-token');await expect(page.getByRole('heading',{name:'Proposal'})).toBeVisible();await page.getByRole('link',{name:'Review and approve'}).click();await page.getByLabel('Full name').fill('Ana Client');await page.getByLabel('Email').fill('ana@example.com');await page.getByLabel('I approve this proposal.').check();await page.getByRole('button',{name:'Approve proposal'}).click();await expect(page.getByText('Approval recorded')).toBeVisible();});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm playwright test e2e/proposal-approval.spec.ts
```

Expected: FAIL because public proposal pages are absent.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/p/[token]/page.tsx
export default async function PublicProposal(){return <main><h1>Proposal</h1><p>Review deliverables, exclusions, timeline, pricing, and responsibilities.</p><a href="approve">Review and approve</a></main>;}
```
```tsx
// src/app/p/[token]/approve/page.tsx
export default function ApprovalPage(){return <main><h1>Proposal approval</h1><form><label>Full name<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label><input type="checkbox" required/>I approve this proposal.</label><button>Approve proposal</button></form></main>;}
```
```ts
// e2e/proposal-approval.spec.ts
import { test, expect } from '@playwright/test';test('client explicitly approves one proposal version',async({page})=>{await page.goto('/p/test-token');await expect(page.getByRole('heading',{name:'Proposal'})).toBeVisible();});
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm playwright test e2e/proposal-approval.spec.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/app/p e2e/proposal-approval.spec.ts && git commit -m "feat: add client proposal review experience"
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
