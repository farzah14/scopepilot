# ScopePilot Scope Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compare new client requests with the approved scope, show supporting evidence, and require a human classification decision.

**Architecture:** The classifier receives a compact approved-scope baseline and returns an evidence-linked assessment. The assessment is advisory; the persisted decision is a separate human-confirmed record.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `prisma/schema.prisma` — updated by this phase
- `src/scope/scope-assessment.ts` — created by this phase
- `src/scope/scope-assessment.test.ts` — verification for this phase
- `src/scope/load-scope-baseline.ts` — created by this phase
- `src/scope/load-scope-baseline.test.ts` — verification for this phase
- `src/scope/analyze-scope-request.ts` — created by this phase
- `src/scope/analyze-scope-request.test.ts` — verification for this phase
- `src/scope/confirm-scope-decision.ts` — created by this phase
- `src/scope/confirm-scope-decision.test.ts` — verification for this phase
- `src/app/(app)/scope-guard/page.tsx` — created by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Add scope request and assessment contracts

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/scope/scope-assessment.ts`
- Test: `src/scope/scope-assessment.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/scope/scope-assessment.test.ts
import { expect, it } from 'vitest';import { scopeAssessment } from './scope-assessment';it('requires at least one evidence reference',()=>expect(()=>scopeAssessment.parse({classification:'OUTSIDE_SCOPE',reason:'New feature',evidence:[]})).toThrow());
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/scope/scope-assessment.test.ts
```

Expected: FAIL because the assessment contract is absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
enum ScopeClassification { INCLUDED PROBABLY_INCLUDED AMBIGUOUS PROBABLY_OUTSIDE_SCOPE OUTSIDE_SCOPE }
model ScopeRequest { id String @id @default(cuid()) organizationId String projectId String requestText String sourceLabel String? aiClassification ScopeClassification? aiReason String? evidence Json? confirmedClassification ScopeClassification? confirmedById String? confirmedAt DateTime? createdAt DateTime @default(now()) @@index([organizationId, projectId, createdAt]) }
```
```ts
// src/scope/scope-assessment.ts
import { z } from 'zod';export const scopeAssessment=z.object({classification:z.enum(['INCLUDED','PROBABLY_INCLUDED','AMBIGUOUS','PROBABLY_OUTSIDE_SCOPE','OUTSIDE_SCOPE']),reason:z.string().min(10).max(2000),evidence:z.array(z.object({recordType:z.enum(['DELIVERABLE','EXCLUSION','REVISION_POLICY','ASSUMPTION','ACCEPTANCE_CRITERIA','APPROVED_CHANGE']),recordId:z.string().min(1),quote:z.string().min(3).max(1000)})).min(1).max(10)});
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/scope/scope-assessment.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/scope && git commit -m "feat: add scope guard contracts"
```

### Task 2: Build the approved scope baseline

**Files:**
- Create: `src/scope/load-scope-baseline.ts`
- Test: `src/scope/load-scope-baseline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/scope/load-scope-baseline.test.ts
import { expect, it, vi } from 'vitest';import { loadScopeBaseline } from './load-scope-baseline';it('loads only an approved proposal version',async()=>{const findFirst=vi.fn().mockResolvedValue({id:'v1',deliverables:[],sections:[]});await loadScopeBaseline({proposalVersion:{findFirst}} as never,'o1','p1');expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({status:'APPROVED'})}));});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/scope/load-scope-baseline.test.ts
```

Expected: FAIL because baseline loading is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/scope/load-scope-baseline.ts
export async function loadScopeBaseline(db:any,organizationId:string,projectId:string){const version=await db.proposalVersion.findFirst({where:{status:'APPROVED',proposal:{organizationId,projectId}},include:{deliverables:true,sections:{where:{kind:{in:['EXCLUSIONS','REVISION_POLICY','ASSUMPTIONS','ACCEPTANCE_CRITERIA']}}}},orderBy:{versionNumber:'desc'}});if(!version)throw new Error('APPROVED_SCOPE_REQUIRED');return {proposalVersionId:version.id,deliverables:version.deliverables,sections:version.sections};}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/scope/load-scope-baseline.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/scope/load-scope-baseline.ts src/scope/load-scope-baseline.test.ts && git commit -m "feat: load approved scope baseline"
```

### Task 3: Run evidence-linked AI comparison

**Files:**
- Create: `src/scope/analyze-scope-request.ts`
- Test: `src/scope/analyze-scope-request.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/scope/analyze-scope-request.test.ts
import { expect, it, vi } from 'vitest';import { analyzeScopeRequest } from './analyze-scope-request';it('rejects invented evidence IDs',async()=>{const db={scopeRequest:{create:vi.fn()},proposalVersion:{findFirst:vi.fn().mockResolvedValue({id:'v1',deliverables:[{id:'d1',name:'Website'}],sections:[]})}};const ai={generate:vi.fn().mockResolvedValue({modelId:'m',value:{classification:'OUTSIDE_SCOPE',reason:'Not included in the approved website scope.',evidence:[{recordType:'DELIVERABLE',recordId:'invented',quote:'Website'}]}})};await expect(analyzeScopeRequest(db as never,ai as never,{organizationId:'o1',projectId:'p1',requestText:'Add payroll'})).rejects.toThrow('INVALID_SCOPE_EVIDENCE');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/scope/analyze-scope-request.test.ts
```

Expected: FAIL because analysis is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/scope/analyze-scope-request.ts
import type { StructuredAiClient } from '@/ai/structured-client';import { scopeAssessment } from './scope-assessment';import { loadScopeBaseline } from './load-scope-baseline';export async function analyzeScopeRequest(db:any,ai:StructuredAiClient,args:{organizationId:string;projectId:string;requestText:string;sourceLabel?:string}){if(args.requestText.trim().length<5)throw new Error('REQUEST_TOO_SHORT');const baseline=await loadScopeBaseline(db,args.organizationId,args.projectId);const generated=await ai.generate({system:'Classify the new request against the approved scope. Cite only record IDs supplied in the baseline. Choose AMBIGUOUS whenever the evidence does not support a confident decision.',prompt:JSON.stringify({request:args.requestText,baseline}),schema:scopeAssessment,schemaName:'scope_assessment'});const allowed=new Set([...baseline.deliverables.map((d:any)=>d.id),...baseline.sections.map((s:any)=>s.id)]);if(generated.value.evidence.some(item=>!allowed.has(item.recordId)))throw new Error('INVALID_SCOPE_EVIDENCE');return db.scopeRequest.create({data:{organizationId:args.organizationId,projectId:args.projectId,requestText:args.requestText,sourceLabel:args.sourceLabel,aiClassification:generated.value.classification,aiReason:generated.value.reason,evidence:generated.value.evidence}});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/scope/analyze-scope-request.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/scope/analyze-scope-request.ts src/scope/analyze-scope-request.test.ts && git commit -m "feat: analyze requests against approved scope"
```

### Task 4: Add human confirmation and Scope Guard screen

**Files:**
- Create: `src/scope/confirm-scope-decision.ts`
- Test: `src/scope/confirm-scope-decision.test.ts`
- Create: `src/app/(app)/scope-guard/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// src/scope/confirm-scope-decision.test.ts
import { expect, it, vi } from 'vitest';import { confirmScopeDecision } from './confirm-scope-decision';it('persists an override independently from the AI result',async()=>{const update=vi.fn().mockResolvedValue({confirmedClassification:'AMBIGUOUS'});await confirmScopeDecision({scopeRequest:{findFirst:vi.fn().mockResolvedValue({id:'s1'}),update}} as never,{organizationId:'o1',requestId:'s1',userId:'u1',classification:'AMBIGUOUS'});expect(update).toHaveBeenCalledWith({where:{id:'s1'},data:expect.objectContaining({confirmedClassification:'AMBIGUOUS',confirmedById:'u1'})});});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/scope/confirm-scope-decision.test.ts
```

Expected: FAIL because human confirmation is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/scope/confirm-scope-decision.ts
import { z } from 'zod';const classification=z.enum(['INCLUDED','PROBABLY_INCLUDED','AMBIGUOUS','PROBABLY_OUTSIDE_SCOPE','OUTSIDE_SCOPE']);export async function confirmScopeDecision(db:any,args:{organizationId:string;requestId:string;userId:string;classification:z.infer<typeof classification>}){const request=await db.scopeRequest.findFirst({where:{id:args.requestId,organizationId:args.organizationId}});if(!request)throw new Error('SCOPE_REQUEST_NOT_FOUND');return db.scopeRequest.update({where:{id:request.id},data:{confirmedClassification:classification.parse(args.classification),confirmedById:args.userId,confirmedAt:new Date()}});}
```
```tsx
// src/app/(app)/scope-guard/page.tsx
export default function ScopeGuardPage(){return <main><h1>Scope Guard</h1><form><label>New client request<textarea name="request" minLength={5}/></label><button>Compare with approved scope</button></form><p>The AI assessment is advisory. Confirm the final classification before creating a change request.</p></main>;}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/scope/confirm-scope-decision.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/scope/confirm-scope-decision.ts src/scope/confirm-scope-decision.test.ts src/app && git commit -m "feat: add human scope decisions"
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
