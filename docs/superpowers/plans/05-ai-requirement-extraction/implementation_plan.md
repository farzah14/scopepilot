# ScopePilot AI Requirement Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert preserved brief sources into reviewable, source-grounded requirements and prioritized discovery questions.

**Architecture:** The AI boundary returns schema-validated objects only. A domain service attaches provenance, persists draft requirements, and requires explicit human confirmation before downstream proposal generation.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `prisma/schema.prisma` — updated by this phase
- `src/ai/requirement-output.ts` — created by this phase
- `src/ai/requirement-output.test.ts` — verification for this phase
- `src/ai/structured-client.ts` — created by this phase
- `src/ai/vercel-ai-client.ts` — created by this phase
- `src/ai/structured-client.test.ts` — verification for this phase
- `src/requirements/extract-requirements.ts` — created by this phase
- `src/requirements/extract-requirements.test.ts` — verification for this phase
- `src/requirements/confirm-requirement.ts` — created by this phase
- `src/discovery/prioritize-questions.ts` — created by this phase
- `src/discovery/prioritize-questions.test.ts` — verification for this phase
- `tests/fixtures/briefs/company-website.json` — created by this phase
- `src/app/(app)/projects/[projectId]/requirements/page.tsx` — created by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Add AI run and requirement models

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/ai/requirement-output.ts`
- Test: `src/ai/requirement-output.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/ai/requirement-output.test.ts
import { expect, it } from 'vitest';
import { requirementExtractionOutput } from './requirement-output';
it('requires a source excerpt for every extracted requirement',()=>{expect(()=>requirementExtractionOutput.parse({requirements:[{category:'BUSINESS_OBJECTIVE',description:'Launch a site',confidence:'HIGH'}],missingInformation:[],conflicts:[]})).toThrow();});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/ai/requirement-output.test.ts
```

Expected: FAIL because the structured output schema is absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
enum AiRunStatus { STARTED SUCCEEDED FAILED }
enum RequirementConfidence { HIGH MEDIUM LOW }
enum RequirementStatus { UNCONFIRMED CONFIRMED REJECTED }
model AiRun {
 id String @id @default(cuid())
 organizationId String
 projectId String
 task String
 promptVersion String
 modelId String
 status AiRunStatus @default(STARTED)
 inputHash String
 output Json?
 errorCode String?
 createdAt DateTime @default(now())
 completedAt DateTime?
 @@index([organizationId, projectId, task, createdAt])
}
model Requirement {
 id String @id @default(cuid())
 organizationId String
 projectId String
 briefSourceId String
 aiRunId String?
 category String
 description String
 sourceExcerpt String
 confidence RequirementConfidence
 status RequirementStatus @default(UNCONFIRMED)
 confirmedById String?
 confirmedAt DateTime?
 createdAt DateTime @default(now())
 @@index([organizationId, projectId, status])
}
```
```ts
// src/ai/requirement-output.ts
import { z } from 'zod';
export const requirementExtractionOutput=z.object({requirements:z.array(z.object({category:z.enum(['BUSINESS_OBJECTIVE','TARGET_AUDIENCE','DELIVERABLE','FUNCTIONAL','NON_FUNCTIONAL','INTEGRATION','CONTENT','DATA','DESIGN','HOSTING','SUPPORT','TIMELINE','BUDGET','STAKEHOLDER','ASSUMPTION','CONSTRAINT','RISK','CLIENT_RESPONSIBILITY']),description:z.string().min(3).max(1000),sourceExcerpt:z.string().min(3).max(1000),confidence:z.enum(['HIGH','MEDIUM','LOW'])})).max(200),missingInformation:z.array(z.object({category:z.string().min(1),question:z.string().min(5),importance:z.enum(['CRITICAL_BEFORE_PRICING','IMPORTANT_BEFORE_START','OPTIONAL'])})).max(100),conflicts:z.array(z.object({description:z.string().min(5),sourceExcerpts:z.array(z.string().min(3)).min(2)})).max(50)});
export type RequirementExtractionOutput=z.infer<typeof requirementExtractionOutput>;
```
```bash
pnpm prisma migrate dev --name add_ai_requirements
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/ai/requirement-output.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/ai && git commit -m "feat: add AI requirement data contracts"
```

### Task 2: Create a schema-validated AI client

**Files:**
- Create: `src/ai/structured-client.ts`
- Create: `src/ai/vercel-ai-client.ts`
- Test: `src/ai/structured-client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/ai/structured-client.test.ts
import { expect, it } from 'vitest';
import { requirementExtractionOutput } from './requirement-output';
it('accepts a valid empty extraction result',()=>expect(requirementExtractionOutput.parse({requirements:[],missingInformation:[],conflicts:[]})).toEqual({requirements:[],missingInformation:[],conflicts:[]}));
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/ai/structured-client.test.ts
```

Expected: FAIL because the client modules are absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/ai/structured-client.ts
import type { z } from 'zod';
export interface StructuredAiClient { generate<T>(args:{system:string;prompt:string;schema:z.ZodType<T>;schemaName:string}):Promise<{value:T;modelId:string}>; }
```
```ts
// src/ai/vercel-ai-client.ts
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { StructuredAiClient } from './structured-client';
export class VercelAiStructuredClient implements StructuredAiClient {
 constructor(private readonly modelName='gpt-5-mini'){}
 async generate<T>({system,prompt,schema,schemaName}:Parameters<StructuredAiClient['generate']>[0]){const result=await generateText({model:openai(this.modelName),system,prompt,output:Output.object({schema,name:schemaName})});return {value:result.output as T,modelId:this.modelName};}
}
```
```bash
pnpm add ai @ai-sdk/openai
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/ai/structured-client.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/ai package.json pnpm-lock.yaml && git commit -m "feat: add structured AI client"
```

### Task 3: Extract and persist source-grounded requirements

**Files:**
- Create: `src/requirements/extract-requirements.ts`
- Test: `src/requirements/extract-requirements.test.ts`
- Create: `src/requirements/confirm-requirement.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/requirements/extract-requirements.test.ts
import { expect, it, vi } from 'vitest';
import { extractRequirements } from './extract-requirements';
it('persists every item with its brief source and AI run',async()=>{const createMany=vi.fn();const db={briefSource:{findMany:vi.fn().mockResolvedValue([{id:'b1',extractedText:'Client needs a five-page company website.'}])},aiRun:{create:vi.fn().mockResolvedValue({id:'r1'}),update:vi.fn()},requirement:{createMany}};const ai={generate:vi.fn().mockResolvedValue({modelId:'test-model',value:{requirements:[{category:'DELIVERABLE',description:'Five-page company website',sourceExcerpt:'five-page company website',confidence:'HIGH'}],missingInformation:[],conflicts:[]}})};await extractRequirements(db as never,ai as never,{organizationId:'o1',projectId:'p1'});expect(createMany).toHaveBeenCalledWith({data:[expect.objectContaining({briefSourceId:'b1',aiRunId:'r1',status:'UNCONFIRMED'})]});});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/requirements/extract-requirements.test.ts
```

Expected: FAIL because the extraction service is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/requirements/extract-requirements.ts
import { createHash } from 'node:crypto';
import { requirementExtractionOutput } from '@/ai/requirement-output';
import type { StructuredAiClient } from '@/ai/structured-client';
const PROMPT_VERSION='requirements-v1';
export async function extractRequirements(db:any,ai:StructuredAiClient,args:{organizationId:string;projectId:string}){const sources=await db.briefSource.findMany({where:{organizationId:args.organizationId,projectId:args.projectId,processingStatus:'READY'},select:{id:true,extractedText:true}});if(!sources.length)throw new Error('NO_READY_BRIEF_SOURCES');const prompt=sources.map((s:any)=>`SOURCE ${s.id}
${s.extractedText}`).join('

');const run=await db.aiRun.create({data:{...args,task:'REQUIREMENT_EXTRACTION',promptVersion:PROMPT_VERSION,modelId:'pending',inputHash:createHash('sha256').update(prompt).digest('hex')}});try{const generated=await ai.generate({system:'Extract only information explicitly supported by the supplied sources. Copy a concise supporting excerpt for every requirement. Treat absent information as missing, never as fact.',prompt,schema:requirementExtractionOutput,schemaName:'requirement_extraction'});const byExcerpt=(excerpt:string)=>sources.find((s:any)=>s.extractedText?.includes(excerpt));const data=generated.value.requirements.map(item=>{const source=byExcerpt(item.sourceExcerpt);if(!source)throw new Error('UNSUPPORTED_SOURCE_EXCERPT');return {...item,organizationId:args.organizationId,projectId:args.projectId,briefSourceId:source.id,aiRunId:run.id,status:'UNCONFIRMED'};});await db.requirement.createMany({data});await db.aiRun.update({where:{id:run.id},data:{status:'SUCCEEDED',modelId:generated.modelId,output:generated.value,completedAt:new Date()}});return generated.value;}catch(error){await db.aiRun.update({where:{id:run.id},data:{status:'FAILED',errorCode:error instanceof Error?error.message:'UNKNOWN',completedAt:new Date()}});throw error;}}
```
```ts
// src/requirements/confirm-requirement.ts
export async function confirmRequirement(db:any,args:{organizationId:string;projectId:string;requirementId:string;userId:string;description?:string}){const requirement=await db.requirement.findFirst({where:{id:args.requirementId,organizationId:args.organizationId,projectId:args.projectId}});if(!requirement)throw new Error('REQUIREMENT_NOT_FOUND');return db.requirement.update({where:{id:requirement.id},data:{description:args.description?.trim()||requirement.description,status:'CONFIRMED',confirmedById:args.userId,confirmedAt:new Date()}});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/requirements/extract-requirements.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/requirements && git commit -m "feat: extract and confirm grounded requirements"
```

### Task 4: Prioritize discovery questions and add evaluation fixtures

**Files:**
- Create: `src/discovery/prioritize-questions.ts`
- Test: `src/discovery/prioritize-questions.test.ts`
- Create: `tests/fixtures/briefs/company-website.json`
- Create: `src/app/(app)/projects/[projectId]/requirements/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// src/discovery/prioritize-questions.test.ts
import { expect, it } from 'vitest';
import { prioritizeQuestions } from './prioritize-questions';
it('puts pricing blockers before optional questions',()=>{const result=prioritizeQuestions([{question:'Preferred font?',importance:'OPTIONAL'},{question:'What is the budget?',importance:'CRITICAL_BEFORE_PRICING'}]);expect(result[0]?.question).toBe('What is the budget?');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/discovery/prioritize-questions.test.ts
```

Expected: FAIL because prioritization is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/discovery/prioritize-questions.ts
type Importance='CRITICAL_BEFORE_PRICING'|'IMPORTANT_BEFORE_START'|'OPTIONAL';
const rank:Record<Importance,number>={CRITICAL_BEFORE_PRICING:0,IMPORTANT_BEFORE_START:1,OPTIONAL:2};
export function prioritizeQuestions<T extends {importance:Importance}>(questions:T[]){return [...questions].sort((a,b)=>rank[a.importance]-rank[b.importance]);}
```
```json
// tests/fixtures/briefs/company-website.json
{"source":"We need a five-page company website by 30 September. We will provide the logo. The agency must write the copy.","expectedRequirements":["five-page company website","30 September","client provides logo","agency writes copy"],"expectedMissingTopics":["budget","hosting","revision limit","approval process"]}
```
```tsx
// src/app/(app)/projects/[projectId]/requirements/page.tsx
export default async function RequirementsPage(){return <main><h1>Requirements review</h1><p>Confirm, edit, or reject every extracted item before creating a proposal.</p><section aria-label="Missing information"><h2>Discovery questions</h2></section></main>;}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/discovery/prioritize-questions.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/discovery tests/fixtures src/app && git commit -m "feat: add discovery prioritization and review screen"
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
