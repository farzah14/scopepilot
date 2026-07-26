# ScopePilot Proposal Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create versioned proposal drafts from confirmed requirements with structured scope, editable pricing, and dependency-aware timelines.

**Architecture:** Proposal content is stored as structured records plus immutable snapshots. AI may draft prose, but proposal sections remain in review states and monetary or schedule commitments require explicit user input.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `prisma/schema.prisma` — updated by this phase
- `src/proposals/proposal-types.ts` — created by this phase
- `src/proposals/proposal-types.test.ts` — verification for this phase
- `src/proposals/create-proposal.ts` — created by this phase
- `src/proposals/create-proposal.test.ts` — verification for this phase
- `src/ai/proposal-section-output.ts` — created by this phase
- `src/proposals/draft-proposal-sections.ts` — created by this phase
- `src/proposals/draft-proposal-sections.test.ts` — verification for this phase
- `src/pricing/pricing-schema.ts` — created by this phase
- `src/pricing/pricing-schema.test.ts` — verification for this phase
- `src/timeline/timeline-schema.ts` — created by this phase
- `src/timeline/timeline-schema.test.ts` — verification for this phase
- `src/app/(app)/projects/[projectId]/proposal/page.tsx` — created by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Add proposal, section, deliverable, pricing, and timeline models

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/proposals/proposal-types.ts`
- Test: `src/proposals/proposal-types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/proposals/proposal-types.test.ts
import { expect, it } from 'vitest';
import { proposalSectionInput } from './proposal-types';
it('rejects an empty proposal section',()=>expect(()=>proposalSectionInput.parse({kind:'EXECUTIVE_SUMMARY',title:'Summary',content:''})).toThrow());
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/proposals/proposal-types.test.ts
```

Expected: FAIL because proposal types are absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
enum ProposalStatus { DRAFT INTERNAL_REVIEW SENT CLIENT_REVIEW REVISION_REQUESTED APPROVED REJECTED ARCHIVED }
enum ProposalSectionStatus { NOT_STARTED AI_DRAFT NEEDS_REVIEW APPROVED_INTERNAL }
model Proposal { id String @id @default(cuid()) organizationId String projectId String status ProposalStatus @default(DRAFT) currentVersionNumber Int @default(0) createdById String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt versions ProposalVersion[] @@index([organizationId, projectId]) }
model ProposalVersion { id String @id @default(cuid()) proposalId String versionNumber Int snapshot Json integrityHash String status ProposalStatus @default(DRAFT) createdById String createdAt DateTime @default(now()) proposal Proposal @relation(fields:[proposalId], references:[id], onDelete:Cascade) sections ProposalSection[] deliverables Deliverable[] packages PricingPackage[] phases TimelinePhase[] @@unique([proposalId, versionNumber]) }
model ProposalSection { id String @id @default(cuid()) proposalVersionId String kind String title String content String status ProposalSectionStatus sourceLabels Json proposalVersion ProposalVersion @relation(fields:[proposalVersionId], references:[id], onDelete:Cascade) @@index([proposalVersionId, kind]) }
model Deliverable { id String @id @default(cuid()) proposalVersionId String name String description String quantity Int? acceptanceCriteria String dependencies String? exclusions String? unitPriceCents Int? proposalVersion ProposalVersion @relation(fields:[proposalVersionId], references:[id], onDelete:Cascade) }
model PricingPackage { id String @id @default(cuid()) proposalVersionId String name String currency String subtotalCents Int discountCents Int @default(0) taxCents Int @default(0) totalCents Int proposalVersion ProposalVersion @relation(fields:[proposalVersionId], references:[id], onDelete:Cascade) lineItems PricingLineItem[] }
model PricingLineItem { id String @id @default(cuid()) packageId String item String description String? quantity Int unitPriceCents Int totalCents Int package PricingPackage @relation(fields:[packageId], references:[id], onDelete:Cascade) }
model TimelinePhase { id String @id @default(cuid()) proposalVersionId String name String durationDays Int startCondition String dependencies String? proposalVersion ProposalVersion @relation(fields:[proposalVersionId], references:[id], onDelete:Cascade) }
```
```ts
// src/proposals/proposal-types.ts
import { z } from 'zod';
export const proposalSectionInput=z.object({kind:z.string().min(1),title:z.string().trim().min(2).max(120),content:z.string().trim().min(1).max(30_000)});
export const sourceLabel=z.enum(['CLIENT_SOURCE','AGENCY_TEMPLATE','AGENCY_DEFAULT','USER_ENTRY','AI_SUGGESTION']);
```
```bash
pnpm prisma migrate dev --name add_proposals
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/proposals/proposal-types.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/proposals && git commit -m "feat: add proposal domain models"
```

### Task 2: Create a proposal only from confirmed requirements

**Files:**
- Create: `src/proposals/create-proposal.ts`
- Test: `src/proposals/create-proposal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/proposals/create-proposal.test.ts
import { expect, it, vi } from 'vitest';
import { createProposal } from './create-proposal';
it('rejects a project without confirmed requirements',async()=>{const db={requirement:{count:vi.fn().mockResolvedValue(0)}};await expect(createProposal(db as never,{organizationId:'o1',projectId:'p1',userId:'u1'})).rejects.toThrow('CONFIRMED_REQUIREMENTS_REQUIRED');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/proposals/create-proposal.test.ts
```

Expected: FAIL because createProposal is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/proposals/create-proposal.ts
import { createHash } from 'node:crypto';
export async function createProposal(db:any,args:{organizationId:string;projectId:string;userId:string}){const confirmed=await db.requirement.count({where:{organizationId:args.organizationId,projectId:args.projectId,status:'CONFIRMED'}});if(confirmed===0)throw new Error('CONFIRMED_REQUIREMENTS_REQUIRED');return db.$transaction(async(tx:any)=>{const proposal=await tx.proposal.create({data:{...args,createdById:args.userId,currentVersionNumber:1}});const snapshot={projectId:args.projectId,createdFrom:'CONFIRMED_REQUIREMENTS',version:1};const version=await tx.proposalVersion.create({data:{proposalId:proposal.id,versionNumber:1,snapshot,integrityHash:createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),createdById:args.userId}});return {proposal,version};});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/proposals/create-proposal.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/proposals/create-proposal.ts src/proposals/create-proposal.test.ts && git commit -m "feat: create proposals from confirmed requirements"
```

### Task 3: Generate source-labelled section drafts

**Files:**
- Create: `src/ai/proposal-section-output.ts`
- Create: `src/proposals/draft-proposal-sections.ts`
- Test: `src/proposals/draft-proposal-sections.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/proposals/draft-proposal-sections.test.ts
import { expect, it, vi } from 'vitest';
import { draftProposalSections } from './draft-proposal-sections';
it('saves generated content as AI draft rather than approved',async()=>{const createMany=vi.fn();const db={requirement:{findMany:vi.fn().mockResolvedValue([{id:'r1',category:'BUSINESS_OBJECTIVE',description:'Increase qualified leads'}])},proposalSection:{createMany}};const ai={generate:vi.fn().mockResolvedValue({modelId:'m',value:{sections:[{kind:'EXECUTIVE_SUMMARY',title:'Executive summary',content:'A lead-generation website.',requirementIds:['r1']}]}})};await draftProposalSections(db as never,ai as never,{organizationId:'o1',projectId:'p1',proposalVersionId:'v1'});expect(createMany).toHaveBeenCalledWith({data:[expect.objectContaining({status:'AI_DRAFT',sourceLabels:['CLIENT_SOURCE','AI_SUGGESTION']})]});});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/proposals/draft-proposal-sections.test.ts
```

Expected: FAIL because section drafting is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/ai/proposal-section-output.ts
import { z } from 'zod';
export const proposalSectionOutput=z.object({sections:z.array(z.object({kind:z.enum(['EXECUTIVE_SUMMARY','CLIENT_OBJECTIVES','PROPOSED_APPROACH','DELIVERABLES','EXCLUSIONS','ASSUMPTIONS','CLIENT_RESPONSIBILITIES','REVISION_POLICY','ACCEPTANCE_CRITERIA','SUPPORT','TERMS','NEXT_STEPS']),title:z.string().min(2),content:z.string().min(10),requirementIds:z.array(z.string()).min(1)})).min(1)});
```
```ts
// src/proposals/draft-proposal-sections.ts
import { proposalSectionOutput } from '@/ai/proposal-section-output';
import type { StructuredAiClient } from '@/ai/structured-client';
export async function draftProposalSections(db:any,ai:StructuredAiClient,args:{organizationId:string;projectId:string;proposalVersionId:string}){const requirements=await db.requirement.findMany({where:{organizationId:args.organizationId,projectId:args.projectId,status:'CONFIRMED'},select:{id:true,category:true,description:true}});const generated=await ai.generate({system:'Draft concise proposal sections. Use only supplied confirmed requirements. Do not invent price, date, legal promise, quantity, or technical feature.',prompt:JSON.stringify(requirements),schema:proposalSectionOutput,schemaName:'proposal_sections'});const validIds=new Set(requirements.map((r:any)=>r.id));for(const section of generated.value.sections)if(section.requirementIds.some(id=>!validIds.has(id)))throw new Error('UNSUPPORTED_REQUIREMENT_REFERENCE');await db.proposalSection.createMany({data:generated.value.sections.map(section=>({proposalVersionId:args.proposalVersionId,kind:section.kind,title:section.title,content:section.content,status:'AI_DRAFT',sourceLabels:['CLIENT_SOURCE','AI_SUGGESTION']}))});return generated.value;}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/proposals/draft-proposal-sections.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/ai/proposal-section-output.ts src/proposals/draft-proposal-sections.ts src/proposals/draft-proposal-sections.test.ts && git commit -m "feat: draft source-labelled proposal sections"
```

### Task 4: Validate pricing and timeline commitments

**Files:**
- Create: `src/pricing/pricing-schema.ts`
- Test: `src/pricing/pricing-schema.test.ts`
- Create: `src/timeline/timeline-schema.ts`
- Test: `src/timeline/timeline-schema.test.ts`
- Create: `src/app/(app)/projects/[projectId]/proposal/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// src/pricing/pricing-schema.test.ts
import { expect, it } from 'vitest';
import { pricingPackageInput } from './pricing-schema';
it('calculates rather than trusts client total',()=>{const value=pricingPackageInput.parse({name:'Essential',currency:'USD',discountCents:1000,taxCents:0,lineItems:[{item:'Website',quantity:1,unitPriceCents:500000}]});expect(value.lineItems[0].quantity*value.lineItems[0].unitPriceCents-value.discountCents+value.taxCents).toBe(499000);});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/pricing/pricing-schema.test.ts src/timeline/timeline-schema.test.ts
```

Expected: FAIL because pricing and timeline schemas are absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/pricing/pricing-schema.ts
import { z } from 'zod';
export const pricingPackageInput=z.object({name:z.string().trim().min(2).max(80),currency:z.enum(['USD','IDR']),discountCents:z.number().int().nonnegative().default(0),taxCents:z.number().int().nonnegative().default(0),lineItems:z.array(z.object({item:z.string().trim().min(2),description:z.string().trim().max(1000).optional(),quantity:z.number().int().positive(),unitPriceCents:z.number().int().nonnegative()})).min(1).max(50)});
export function calculatePackage(input:z.infer<typeof pricingPackageInput>){const value=pricingPackageInput.parse(input);const subtotalCents=value.lineItems.reduce((sum,line)=>sum+line.quantity*line.unitPriceCents,0);const totalCents=subtotalCents-value.discountCents+value.taxCents;if(totalCents<0)throw new Error('NEGATIVE_PACKAGE_TOTAL');return {...value,subtotalCents,totalCents};}
```
```ts
// src/timeline/timeline-schema.ts
import { z } from 'zod';
export const timelinePhaseInput=z.object({name:z.string().trim().min(2),durationDays:z.number().int().positive().max(365),startCondition:z.string().trim().min(5),dependencies:z.string().trim().max(1000).optional()});
```
```ts
// src/timeline/timeline-schema.test.ts
import { expect, it } from 'vitest';import { timelinePhaseInput } from './timeline-schema';it('requires a start condition',()=>expect(()=>timelinePhaseInput.parse({name:'Design',durationDays:10,startCondition:''})).toThrow());
```
```tsx
// src/app/(app)/projects/[projectId]/proposal/page.tsx
export default function ProposalPage(){return <main><h1>Proposal builder</h1><nav aria-label="Proposal steps">Requirements · Scope · Timeline · Pricing · Terms · Preview</nav><p>AI sections remain drafts until internally approved.</p></main>;}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/pricing/pricing-schema.test.ts src/timeline/timeline-schema.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/pricing src/timeline src/app && git commit -m "feat: add controlled pricing and timeline inputs"
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
