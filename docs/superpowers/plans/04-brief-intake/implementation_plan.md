# ScopePilot Brief Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture manual and uploaded client briefs while preserving source content, file integrity, and extraction state.

**Architecture:** Represent every input as an immutable BriefSource linked to a project. Uploads use private object storage; asynchronous extraction writes normalized text without replacing the original source.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `prisma/schema.prisma` — updated by this phase
- `src/briefs/brief-schema.ts` — created by this phase
- `src/briefs/brief-schema.test.ts` — verification for this phase
- `src/briefs/create-manual-brief.ts` — created by this phase
- `src/briefs/create-manual-brief.test.ts` — verification for this phase
- `src/storage/private-files.ts` — created by this phase
- `src/briefs/upload-brief.ts` — created by this phase
- `src/briefs/upload-brief.test.ts` — verification for this phase
- `src/briefs/extract-brief-text.ts` — created by this phase
- `src/briefs/extract-brief-text.test.ts` — verification for this phase
- `src/app/(app)/projects/[projectId]/brief/page.tsx` — created by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Add brief source model and validation schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/briefs/brief-schema.ts`
- Test: `src/briefs/brief-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/briefs/brief-schema.test.ts
import { expect, it } from 'vitest';
import { manualBriefInput } from './brief-schema';
it('rejects empty client notes',()=>expect(()=>manualBriefInput.parse({content:'   '})).toThrow());
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/briefs/brief-schema.test.ts
```

Expected: FAIL because the brief schema is absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
enum BriefSourceType { MANUAL_TEXT PDF DOCX TXT QUESTIONNAIRE }
enum BriefProcessingStatus { PENDING PROCESSING READY FAILED }
model BriefSource {
 id String @id @default(cuid())
 organizationId String
 projectId String
 sourceType BriefSourceType
 originalText String?
 extractedText String?
 objectKey String?
 originalFilename String?
 contentType String?
 byteSize Int?
 sha256 String?
 processingStatus BriefProcessingStatus @default(PENDING)
 processingError String?
 createdById String
 createdAt DateTime @default(now())
 project Project @relation(fields:[projectId], references:[id], onDelete:Cascade)
 @@index([organizationId, projectId, createdAt])
}
```
```ts
// src/briefs/brief-schema.ts
import { z } from 'zod';
export const manualBriefInput=z.object({content:z.string().trim().min(20).max(100_000)});
export const supportedUpload=z.object({name:z.string().min(1),type:z.enum(['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']),size:z.number().int().positive().max(10*1024*1024)});
```
```bash
pnpm prisma migrate dev --name add_brief_sources
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/briefs/brief-schema.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/briefs && git commit -m "feat: add brief source model"
```

### Task 2: Persist manual briefs with source hash

**Files:**
- Create: `src/briefs/create-manual-brief.ts`
- Test: `src/briefs/create-manual-brief.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/briefs/create-manual-brief.test.ts
import { expect, it, vi } from 'vitest';
import { createManualBrief } from './create-manual-brief';
it('stores original text and a stable SHA-256 hash',async()=>{const create=vi.fn().mockResolvedValue({id:'b1'});await createManualBrief({briefSource:{create}} as never,{organizationId:'o1',projectId:'p1',createdById:'u1',content:'A sufficiently detailed client website brief.'});expect(create).toHaveBeenCalledWith({data:expect.objectContaining({originalText:'A sufficiently detailed client website brief.',sha256:expect.stringMatching(/^[a-f0-9]{64}$/),processingStatus:'READY'})});});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/briefs/create-manual-brief.test.ts
```

Expected: FAIL because createManualBrief is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/briefs/create-manual-brief.ts
import { createHash } from 'node:crypto';
import { manualBriefInput } from './brief-schema';
export async function createManualBrief(db:any,args:{organizationId:string;projectId:string;createdById:string;content:unknown}){const {content}=manualBriefInput.parse({content:args.content});const project=await db.project.findFirst?.({where:{id:args.projectId,organizationId:args.organizationId}});if(project===null)throw new Error('PROJECT_NOT_FOUND');return db.briefSource.create({data:{organizationId:args.organizationId,projectId:args.projectId,createdById:args.createdById,sourceType:'MANUAL_TEXT',originalText:content,extractedText:content,sha256:createHash('sha256').update(content).digest('hex'),processingStatus:'READY'}});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/briefs/create-manual-brief.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/briefs/create-manual-brief.ts src/briefs/create-manual-brief.test.ts && git commit -m "feat: persist manual brief sources"
```

### Task 3: Upload files to private object storage

**Files:**
- Create: `src/storage/private-files.ts`
- Create: `src/briefs/upload-brief.ts`
- Test: `src/briefs/upload-brief.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/briefs/upload-brief.test.ts
import { expect, it, vi } from 'vitest';
import { uploadBrief } from './upload-brief';
it('rejects executable content before storage',async()=>{await expect(uploadBrief({} as never,{} as never,{name:'brief.exe',type:'application/x-msdownload',size:20,arrayBuffer:async()=>new ArrayBuffer(0)} as File)).rejects.toThrow();});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/briefs/upload-brief.test.ts
```

Expected: FAIL because uploadBrief is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/storage/private-files.ts
import { put, del } from '@vercel/blob';
export async function putPrivateFile(pathname:string,body:Blob){return put(pathname,body,{access:'private',addRandomSuffix:true});}
export async function deletePrivateFile(url:string){await del(url);}
```
```ts
// src/briefs/upload-brief.ts
import { createHash } from 'node:crypto';
import { supportedUpload } from './brief-schema';
import { putPrivateFile } from '@/storage/private-files';
export async function uploadBrief(db:any,args:{organizationId:string;projectId:string;createdById:string},file:File){supportedUpload.parse({name:file.name,type:file.type,size:file.size});const bytes=Buffer.from(await file.arrayBuffer());const stored=await putPrivateFile(`organizations/${args.organizationId}/briefs/${file.name}`,new Blob([bytes],{type:file.type}));const sourceType=file.type==='application/pdf'?'PDF':file.type==='text/plain'?'TXT':'DOCX';return db.briefSource.create({data:{...args,sourceType,objectKey:stored.url,originalFilename:file.name,contentType:file.type,byteSize:file.size,sha256:createHash('sha256').update(bytes).digest('hex'),processingStatus:'PENDING'}});}
```
```bash
pnpm add @vercel/blob
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/briefs/upload-brief.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/storage src/briefs/upload-brief.ts src/briefs/upload-brief.test.ts package.json pnpm-lock.yaml && git commit -m "feat: add private brief uploads"
```

### Task 4: Extract text and expose intake page

**Files:**
- Create: `src/briefs/extract-brief-text.ts`
- Test: `src/briefs/extract-brief-text.test.ts`
- Create: `src/app/(app)/projects/[projectId]/brief/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// src/briefs/extract-brief-text.test.ts
import { expect, it } from 'vitest';
import { extractBriefText } from './extract-brief-text';
it('decodes plain text',async()=>{await expect(extractBriefText('text/plain',Buffer.from('Project objective: launch a website.'))).resolves.toBe('Project objective: launch a website.');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/briefs/extract-brief-text.test.ts
```

Expected: FAIL because text extraction is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/briefs/extract-brief-text.ts
import mammoth from 'mammoth';
import { extractText } from 'unpdf';
export async function extractBriefText(contentType:string,bytes:Buffer){if(contentType==='text/plain')return bytes.toString('utf8').trim();if(contentType==='application/vnd.openxmlformats-officedocument.wordprocessingml.document')return (await mammoth.extractRawText({buffer:bytes})).value.trim();if(contentType==='application/pdf'){const result=await extractText(new Uint8Array(bytes),{mergePages:true});return String(result.text).trim();}throw new Error('UNSUPPORTED_FILE_TYPE');}
```
```tsx
// src/app/(app)/projects/[projectId]/brief/page.tsx
export default async function BriefPage({params}:{params:Promise<{projectId:string}>}){const {projectId}=await params;return <main><h1>Client brief</h1><form><label>Paste client information<textarea name="content" minLength={20}/></label><button>Save source</button></form><form><label>Upload PDF, DOCX, or TXT<input type="file" name="file" accept=".pdf,.docx,.txt"/></label><button>Upload source</button></form><p>Project: {projectId}</p></main>;}
```
```bash
pnpm add mammoth unpdf
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/briefs/extract-brief-text.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/briefs/extract-brief-text.ts src/briefs/extract-brief-text.test.ts src/app package.json pnpm-lock.yaml && git commit -m "feat: extract brief text and add intake screen"
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
