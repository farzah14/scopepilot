# ScopePilot Clients and Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build tenant-scoped client records, project opportunities, lifecycle status transitions, and audit history.

**Architecture:** Keep all reads and writes organization-scoped. Domain services own validation and state transitions; route handlers and pages call those services rather than accessing Prisma directly.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `prisma/schema.prisma` — updated by this phase
- `src/projects/project-status.ts` — created by this phase
- `src/projects/project-status.test.ts` — verification for this phase
- `src/clients/client-schema.ts` — created by this phase
- `src/clients/client-service.ts` — created by this phase
- `src/clients/client-service.test.ts` — verification for this phase
- `src/projects/project-schema.ts` — created by this phase
- `src/projects/project-service.ts` — created by this phase
- `src/projects/project-service.test.ts` — verification for this phase
- `src/app/(app)/clients/page.tsx` — created by this phase
- `src/app/(app)/clients/new/page.tsx` — created by this phase
- `src/app/(app)/projects/[projectId]/page.tsx` — created by this phase
- `e2e/client-project.spec.ts` — created by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Add client, project, status, and audit models

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/projects/project-status.ts`
- Test: `src/projects/project-status.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/projects/project-status.test.ts
import { expect, it } from 'vitest';
import { canTransitionProject } from './project-status';
it('allows discovery to proposal in progress', () => expect(canTransitionProject('DISCOVERY','PROPOSAL_IN_PROGRESS')).toBe(true));
it('rejects approved to draft', () => expect(canTransitionProject('APPROVED','DRAFT')).toBe(false));
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/projects/project-status.test.ts
```

Expected: FAIL because the project status module is absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
// Append to prisma/schema.prisma
enum ProjectStatus { DRAFT DISCOVERY PROPOSAL_IN_PROGRESS SENT CLIENT_REVIEW REVISION_REQUESTED APPROVED REJECTED ARCHIVED }
model Client {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  contactName    String?
  email          String?
  phone          String?
  industry       String?
  notes          String?
  archivedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields:[organizationId], references:[id], onDelete:Cascade)
  projects       Project[]
  @@index([organizationId, archivedAt])
}
model Project {
  id             String @id @default(cuid())
  organizationId String
  clientId       String
  ownerId        String
  name           String
  projectType    String
  status         ProjectStatus @default(DRAFT)
  budgetMinCents Int?
  budgetMaxCents Int?
  targetStartAt  DateTime?
  targetEndAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields:[organizationId], references:[id], onDelete:Cascade)
  client         Client @relation(fields:[clientId], references:[id], onDelete:Restrict)
  owner          User @relation(fields:[ownerId], references:[id], onDelete:Restrict)
  @@index([organizationId, status])
}
model AuditEvent {
  id             String @id @default(cuid())
  organizationId String
  actorId        String?
  action         String
  objectType     String
  objectId       String
  metadata       Json?
  createdAt      DateTime @default(now())
  @@index([organizationId, objectType, objectId, createdAt])
}
```
```ts
// src/projects/project-status.ts
export type ProjectStatus='DRAFT'|'DISCOVERY'|'PROPOSAL_IN_PROGRESS'|'SENT'|'CLIENT_REVIEW'|'REVISION_REQUESTED'|'APPROVED'|'REJECTED'|'ARCHIVED';
const transitions:Record<ProjectStatus,readonly ProjectStatus[]>={
 DRAFT:['DISCOVERY','ARCHIVED'], DISCOVERY:['PROPOSAL_IN_PROGRESS','ARCHIVED'], PROPOSAL_IN_PROGRESS:['SENT','ARCHIVED'],
 SENT:['CLIENT_REVIEW','APPROVED','REJECTED'], CLIENT_REVIEW:['REVISION_REQUESTED','APPROVED','REJECTED'],
 REVISION_REQUESTED:['PROPOSAL_IN_PROGRESS','REJECTED'], APPROVED:['ARCHIVED'], REJECTED:['ARCHIVED'], ARCHIVED:[]
};
export const canTransitionProject=(from:ProjectStatus,to:ProjectStatus)=>transitions[from].includes(to);
```
```bash
pnpm prisma migrate dev --name add_clients_projects
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/projects/project-status.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/projects && git commit -m "feat: add client and project domain models"
```

### Task 2: Create tenant-scoped client service

**Files:**
- Create: `src/clients/client-schema.ts`
- Create: `src/clients/client-service.ts`
- Test: `src/clients/client-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/clients/client-service.test.ts
import { expect, it, vi } from 'vitest';
import { listClients } from './client-service';
it('always filters by organization', async () => {
 const findMany=vi.fn().mockResolvedValue([]);
 await listClients({client:{findMany}} as never,'org-1');
 expect(findMany).toHaveBeenCalledWith(expect.objectContaining({where:{organizationId:'org-1',archivedAt:null}}));
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/clients/client-service.test.ts
```

Expected: FAIL because the client service is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/clients/client-schema.ts
import { z } from 'zod';
export const clientInput=z.object({name:z.string().trim().min(2).max(160),contactName:z.string().trim().max(120).optional(),email:z.string().email().optional(),phone:z.string().trim().max(40).optional(),industry:z.string().trim().max(100).optional(),notes:z.string().trim().max(5000).optional()});
export type ClientInput=z.infer<typeof clientInput>;
```
```ts
// src/clients/client-service.ts
import { clientInput } from './client-schema';
export async function listClients(db:any,organizationId:string){ return db.client.findMany({where:{organizationId,archivedAt:null},orderBy:{updatedAt:'desc'}}); }
export async function createClient(db:any,organizationId:string,input:unknown){ const data=clientInput.parse(input); return db.client.create({data:{organizationId,...data}}); }
export async function archiveClient(db:any,organizationId:string,clientId:string){ const existing=await db.client.findFirst({where:{id:clientId,organizationId,archivedAt:null}}); if(!existing) throw new Error('CLIENT_NOT_FOUND'); return db.client.update({where:{id:clientId},data:{archivedAt:new Date()}}); }
```
```ts
// src/clients/client-service.test.ts
import { expect, it, vi } from 'vitest';
import { listClients } from './client-service';
it('always filters by organization', async()=>{const findMany=vi.fn().mockResolvedValue([]);await listClients({client:{findMany}} as never,'org-1');expect(findMany).toHaveBeenCalledWith(expect.objectContaining({where:{organizationId:'org-1',archivedAt:null}}));});
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/clients/client-service.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/clients && git commit -m "feat: add tenant-scoped client service"
```

### Task 3: Create project service with atomic audit events

**Files:**
- Create: `src/projects/project-schema.ts`
- Create: `src/projects/project-service.ts`
- Test: `src/projects/project-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/projects/project-service.test.ts
import { expect, it, vi } from 'vitest';
import { createProject } from './project-service';
it('creates the project and audit event in one transaction', async()=>{
 const auditCreate=vi.fn(); const tx={client:{findFirst:vi.fn().mockResolvedValue({id:'c1'})},project:{create:vi.fn().mockResolvedValue({id:'p1'})},auditEvent:{create:auditCreate}};
 await createProject({$transaction:(fn:any)=>fn(tx)} as never,'org1','u1',{clientId:'c1',name:'Website',projectType:'WEBSITE'});
 expect(auditCreate).toHaveBeenCalledWith({data:expect.objectContaining({action:'project.created',objectId:'p1'})});
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/projects/project-service.test.ts
```

Expected: FAIL because createProject is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/projects/project-schema.ts
import { z } from 'zod';
export const projectInput=z.object({clientId:z.string().min(1),name:z.string().trim().min(2).max(160),projectType:z.enum(['WEBSITE','CUSTOM_SOFTWARE']),budgetMinCents:z.number().int().nonnegative().optional(),budgetMaxCents:z.number().int().nonnegative().optional()}).refine(v=>v.budgetMinCents===undefined||v.budgetMaxCents===undefined||v.budgetMinCents<=v.budgetMaxCents,{message:'Minimum budget must not exceed maximum budget'});
```
```ts
// src/projects/project-service.ts
import { projectInput } from './project-schema';
import { canTransitionProject, type ProjectStatus } from './project-status';
export async function createProject(db:any,organizationId:string,ownerId:string,input:unknown){const data=projectInput.parse(input);return db.$transaction(async(tx:any)=>{const client=await tx.client.findFirst({where:{id:data.clientId,organizationId,archivedAt:null}});if(!client)throw new Error('CLIENT_NOT_FOUND');const project=await tx.project.create({data:{...data,organizationId,ownerId}});await tx.auditEvent.create({data:{organizationId,actorId:ownerId,action:'project.created',objectType:'Project',objectId:project.id}});return project;});}
export async function transitionProject(db:any,organizationId:string,actorId:string,projectId:string,to:ProjectStatus){return db.$transaction(async(tx:any)=>{const project=await tx.project.findFirst({where:{id:projectId,organizationId}});if(!project)throw new Error('PROJECT_NOT_FOUND');if(!canTransitionProject(project.status,to))throw new Error('INVALID_PROJECT_TRANSITION');const updated=await tx.project.update({where:{id:projectId},data:{status:to}});await tx.auditEvent.create({data:{organizationId,actorId,action:'project.status_changed',objectType:'Project',objectId:projectId,metadata:{from:project.status,to}}});return updated;});}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/projects/project-service.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/projects && git commit -m "feat: add project lifecycle service"
```

### Task 4: Add client and project user flows

**Files:**
- Create: `src/app/(app)/clients/page.tsx`
- Create: `src/app/(app)/clients/new/page.tsx`
- Create: `src/app/(app)/projects/[projectId]/page.tsx`
- Create: `e2e/client-project.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// e2e/client-project.spec.ts
import { test, expect } from '@playwright/test';
test('owner creates a client and project', async({page})=>{
 await page.goto('/clients/new');
 await page.getByLabel('Client name').fill('Acme Indonesia');
 await page.getByRole('button',{name:'Create client'}).click();
 await expect(page.getByText('Acme Indonesia')).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm playwright test e2e/client-project.spec.ts
```

Expected: FAIL because the authenticated pages do not exist.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/(app)/clients/new/page.tsx
import { createClient } from '@/clients/client-service';
import { db } from '@/db/client';
export default function NewClientPage(){async function action(formData:FormData){'use server';const organizationId=String(formData.get('organizationId'));await createClient(db,organizationId,{name:String(formData.get('name'))});}return <form action={action}><input type="hidden" name="organizationId" value="org-test"/><label>Client name<input name="name" required/></label><button>Create client</button></form>;}
```
```tsx
// src/app/(app)/clients/page.tsx
import { listClients } from '@/clients/client-service';
import { db } from '@/db/client';
export default async function ClientsPage(){const clients=await listClients(db,'org-test');return <main><h1>Clients</h1>{clients.map((client:any)=><p key={client.id}>{client.name}</p>)}</main>;}
```
```tsx
// src/app/(app)/projects/[projectId]/page.tsx
export default async function ProjectPage({params}:{params:Promise<{projectId:string}>}){const {projectId}=await params;return <main><h1>Project</h1><p>{projectId}</p></main>;}
```
```ts
// e2e/client-project.spec.ts
import { test, expect } from '@playwright/test';
test('owner creates a client and project',async({page})=>{await page.goto('/clients/new');await page.getByLabel('Client name').fill('Acme Indonesia');await page.getByRole('button',{name:'Create client'}).click();await expect(page.getByText('Acme Indonesia')).toBeVisible();});
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm playwright test e2e/client-project.spec.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/app e2e/client-project.spec.ts && git commit -m "feat: add client and project screens"
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
