# Authentication and Workspaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement registration, secure credential login, organizations, membership roles, and tenant authorization.

**Architecture:** Auth.js owns sessions while application services own password hashing and registration. Every business action checks organization membership and permission before touching tenant data. Organization creation and owner membership are transactional.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** 01-foundation.

---

## File map

- `prisma/schema.prisma` — identity and tenancy models
- `src/auth.ts` — Auth.js configuration
- `src/auth/password.ts` — Argon2id password handling
- `src/auth/roles.ts` — permission map
- `src/auth/require-membership.ts` — authorization boundary
- `src/organizations/create-organization.ts` — onboarding transaction

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Model identity, organizations, and roles

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/auth/roles.ts`
- Test: `src/auth/roles.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/auth/roles.test.ts
import { expect, it } from 'vitest';
import { can } from './roles';
it('blocks viewers from member management', () => {
  expect(can('OWNER','members:manage')).toBe(true);
  expect(can('VIEWER','members:manage')).toBe(false);
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/auth/roles.test.ts
```

Expected: FAIL because the role module does not exist.

- [ ] **Step 3: Write the minimal implementation**

```prisma
// Append to prisma/schema.prisma
enum MembershipRole { OWNER ADMIN SALES PROJECT_MANAGER CONTRIBUTOR VIEWER }
model User { id String @id @default(cuid()) name String email String @unique emailVerified DateTime? passwordHash String? image String? accounts Account[] sessions Session[] memberships Membership[] createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model Account { id String @id @default(cuid()) userId String type String provider String providerAccountId String refreshToken String? accessToken String? expiresAt Int? tokenType String? scope String? idToken String? sessionState String? user User @relation(fields:[userId],references:[id],onDelete:Cascade) @@unique([provider,providerAccountId]) }
model Session { sessionToken String @unique userId String expires DateTime user User @relation(fields:[userId],references:[id],onDelete:Cascade) }
model VerificationToken { identifier String token String @unique expires DateTime @@unique([identifier,token]) }
model Organization { id String @id @default(cuid()) name String slug String @unique country String @default("ID") timeZone String @default("Asia/Jakarta") defaultCurrency String @default("IDR") memberships Membership[] createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model Membership { id String @id @default(cuid()) userId String organizationId String role MembershipRole @default(CONTRIBUTOR) user User @relation(fields:[userId],references:[id],onDelete:Cascade) organization Organization @relation(fields:[organizationId],references:[id],onDelete:Cascade) createdAt DateTime @default(now()) @@unique([userId,organizationId]) }
```
```ts
// src/auth/roles.ts
export type Role = 'OWNER'|'ADMIN'|'SALES'|'PROJECT_MANAGER'|'CONTRIBUTOR'|'VIEWER';
export type Permission = 'members:manage'|'clients:write'|'pricing:write'|'proposals:send'|'records:view';
const grants: Record<Role, ReadonlySet<Permission>> = {
  OWNER:new Set(['members:manage','clients:write','pricing:write','proposals:send','records:view']), ADMIN:new Set(['members:manage','clients:write','pricing:write','proposals:send','records:view']), SALES:new Set(['clients:write','pricing:write','proposals:send','records:view']), PROJECT_MANAGER:new Set(['clients:write','records:view']), CONTRIBUTOR:new Set(['clients:write','records:view']), VIEWER:new Set(['records:view'])
};
export const can = (role: Role, permission: Permission) => grants[role].has(permission);
```
```ts
// src/auth/roles.test.ts
import { expect, it } from 'vitest';
import { can } from './roles';
it('blocks viewers from member management', () => { expect(can('OWNER','members:manage')).toBe(true); expect(can('VIEWER','members:manage')).toBe(false); });
```
```bash
pnpm prisma migrate dev --name auth_organizations
pnpm prisma generate
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/auth/roles.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/auth src/generated && git commit -m "feat: model users and workspaces"
```

### Task 2: Hash and verify passwords

**Files:**
- Create: `src/auth/password.ts`
- Test: `src/auth/password.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/auth/password.test.ts
import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';
it('accepts the correct password only', async () => {
  const hash = await hashPassword('correct horse battery staple');
  await expect(verifyPassword(hash,'correct horse battery staple')).resolves.toBe(true);
  await expect(verifyPassword(hash,'wrong password')).resolves.toBe(false);
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/auth/password.test.ts
```

Expected: FAIL because the password module does not exist.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/auth/password.ts
import argon2 from 'argon2';
export async function hashPassword(password: string) {
  if (password.length < 12) throw new Error('PASSWORD_TOO_SHORT');
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}
export async function verifyPassword(hash: string, password: string) {
  try { return await argon2.verify(hash, password); } catch { return false; }
}
```
```ts
// src/auth/password.test.ts
import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';
it('accepts the correct password only', async () => { const hash = await hashPassword('correct horse battery staple'); await expect(verifyPassword(hash,'correct horse battery staple')).resolves.toBe(true); await expect(verifyPassword(hash,'wrong password')).resolves.toBe(false); });
```
```bash
pnpm add argon2
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/auth/password.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/auth/password.ts src/auth/password.test.ts package.json pnpm-lock.yaml && git commit -m "feat: add secure password handling"
```

### Task 3: Configure Auth.js and registration

**Files:**
- Create: `src/auth.ts`
- Create: `src/auth/register.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Test: `src/auth/register.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/auth/register.test.ts
import { expect, it, vi } from 'vitest';
import { registerUser } from './register';
it('normalizes email before create', async () => {
  const create = vi.fn().mockResolvedValue({ id:'u1' });
  await registerUser({ user:{ create } } as never,{ name:'Owner',email:' OWNER@EXAMPLE.COM ',password:'correct horse battery staple' });
  expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ email:'owner@example.com' }) });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/auth/register.test.ts
```

Expected: FAIL because registration is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/auth/register.ts
import { z } from 'zod';
import { hashPassword } from './password';
const schema = z.object({ name:z.string().trim().min(2), email:z.string().trim().toLowerCase().email(), password:z.string().min(12).max(128) });
export async function registerUser(db:any,input:unknown){ const data=schema.parse(input); return db.user.create({ data:{ name:data.name,email:data.email,passwordHash:await hashPassword(data.password) } }); }
```
```ts
// src/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { z } from 'zod';
import { db } from '@/db/client';
import { verifyPassword } from '@/auth/password';
export const { auth, handlers, signIn, signOut } = NextAuth({ adapter:PrismaAdapter(db), session:{ strategy:'database' }, providers:[Credentials({ credentials:{ email:{},password:{} }, async authorize(raw){ const parsed=z.object({email:z.string().email(),password:z.string()}).safeParse(raw); if(!parsed.success)return null; const user=await db.user.findUnique({where:{email:parsed.data.email.toLowerCase()}}); return user?.passwordHash && await verifyPassword(user.passwordHash,parsed.data.password) ? user : null; } })] });
```
```ts
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```
```ts
// src/auth/register.test.ts
import { expect, it, vi } from 'vitest';
import { registerUser } from './register';
it('normalizes email before create', async () => { const create=vi.fn().mockResolvedValue({id:'u1'}); await registerUser({user:{create}} as never,{name:'Owner',email:' OWNER@EXAMPLE.COM ',password:'correct horse battery staple'}); expect(create).toHaveBeenCalledWith({data:expect.objectContaining({email:'owner@example.com'})}); });
```
```bash
pnpm add next-auth @auth/prisma-adapter
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/auth/register.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/auth.ts src/auth/register.ts src/auth/register.test.ts src/app/api/auth package.json pnpm-lock.yaml && git commit -m "feat: configure authentication"
```

### Task 4: Create organization onboarding and permission guard

**Files:**
- Create: `src/organizations/create-organization.ts`
- Create: `src/auth/require-membership.ts`
- Test: `src/organizations/create-organization.test.ts`
- Test: `src/auth/require-membership.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/auth/require-membership.test.ts
import { expect, it, vi } from 'vitest';
import { requireMembership } from './require-membership';
it('rejects an unauthorized viewer', async () => {
  const db={ membership:{ findUnique:vi.fn().mockResolvedValue({role:'VIEWER'}) } };
  await expect(requireMembership(db as never,'u1','org1','members:manage')).rejects.toThrow('FORBIDDEN');
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/auth/require-membership.test.ts
```

Expected: FAIL because the guard does not exist.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/organizations/create-organization.ts
import { z } from 'zod';
const schema=z.object({name:z.string().trim().min(2).max(120)});
const slugify=(v:string)=>v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export async function createOrganization(db:any,userId:string,input:unknown){ const data=schema.parse(input); return db.$transaction(async(tx:any)=>{ const organization=await tx.organization.create({data:{name:data.name,slug:slugify(data.name)}}); await tx.membership.create({data:{userId,organizationId:organization.id,role:'OWNER'}}); return organization; }); }
```
```ts
// src/auth/require-membership.ts
import { can, type Permission, type Role } from './roles';
export async function requireMembership(db:any,userId:string,organizationId:string,permission:Permission){ const membership=await db.membership.findUnique({where:{userId_organizationId:{userId,organizationId}},select:{role:true}}); if(!membership||!can(membership.role as Role,permission)) throw new Error('FORBIDDEN'); return membership; }
```
```ts
// src/auth/require-membership.test.ts
import { expect, it, vi } from 'vitest';
import { requireMembership } from './require-membership';
it('rejects an unauthorized viewer', async () => { const db={membership:{findUnique:vi.fn().mockResolvedValue({role:'VIEWER'})}}; await expect(requireMembership(db as never,'u1','org1','members:manage')).rejects.toThrow('FORBIDDEN'); });
```
```ts
// src/organizations/create-organization.test.ts
import { expect, it, vi } from 'vitest';
import { createOrganization } from './create-organization';
it('creates owner membership atomically', async () => { const transaction=vi.fn(async(fn)=>fn({organization:{create:vi.fn().mockResolvedValue({id:'o1',slug:'acme'})},membership:{create:vi.fn()}})); await expect(createOrganization({$transaction:transaction} as never,'u1',{name:'Acme'})).resolves.toMatchObject({slug:'acme'}); });
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/auth/require-membership.test.ts src/organizations/create-organization.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/auth/require-membership.ts src/auth/require-membership.test.ts src/organizations && git commit -m "feat: add workspace onboarding and authorization"
```


## Plan self-review

- [ ] Confirm every PRD requirement assigned to this phase maps to a task.
- [ ] Confirm file paths, exported names, and model fields remain consistent across tasks.
- [ ] Confirm the plan contains no placeholder instructions and no unverified completion claim.

## Completion checklist

- [ ] Passwords are stored only as Argon2id hashes.
- [ ] Organization creation always creates one OWNER membership.
- [ ] Users without membership cannot access organization records.
- [ ] Role tests cover owner, admin, sales, project manager, contributor, and viewer.

## Execution handoff

Use subagent-driven development for one reviewed task at a time, or execute inline with checkpoints after each task.
