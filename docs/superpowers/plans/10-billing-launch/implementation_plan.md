# ScopePilot Billing and Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce plan entitlements, usage metering, safe subscription synchronization, product analytics, and an evidence-based launch gate.

**Architecture:** Central entitlement checks protect expensive or paid capabilities. Stripe events update local subscription state idempotently; analytics records event names and non-sensitive identifiers rather than proposal content.

**Tech Stack:** Node.js 22 LTS; pnpm 10; Next.js 16.2 LTS App Router; TypeScript; PostgreSQL 17; Prisma ORM 7; Auth.js; Zod; Vitest; Playwright; Vercel Blob private storage; Vercel AI SDK; Stripe test mode; GitHub Actions; Vercel.

**Depends on:** The preceding numbered ScopePilot phase.

---

## File map

- `src/billing/plans.ts` — created by this phase
- `src/billing/entitlements.ts` — created by this phase
- `src/billing/entitlements.test.ts` — verification for this phase
- `prisma/schema.prisma` — updated by this phase
- `src/billing/consume-usage.ts` — created by this phase
- `src/billing/consume-usage.test.ts` — verification for this phase
- `src/billing/process-stripe-event.ts` — created by this phase
- `src/billing/process-stripe-event.test.ts` — verification for this phase
- `src/app/api/webhooks/stripe/route.ts` — created by this phase
- `src/analytics/track-event.ts` — created by this phase
- `src/analytics/track-event.test.ts` — verification for this phase
- `scripts/launch-check.mjs` — created by this phase
- `docs/launch/beta-checklist.md` — created by this phase
- `package.json` — updated by this phase

## Execution rules

1. Create an isolated Git worktree before executing this plan.
2. Execute tasks in order and keep each commit focused.
3. Use red-green-refactor: failing test, minimal code, passing test, commit.
4. Scope every organization-owned query with `organizationId`.
5. Never log secrets, uploaded briefs, proposal text, comments, or client contact details.

### Task 1: Define plans and entitlement checks

**Files:**
- Create: `src/billing/plans.ts`
- Create: `src/billing/entitlements.ts`
- Test: `src/billing/entitlements.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/billing/entitlements.test.ts
import { expect, it } from 'vitest';import { canUse } from './entitlements';it('blocks advanced analytics on Solo',()=>expect(canUse('SOLO','advanced_analytics')).toBe(false));it('allows scope guard on Team',()=>expect(canUse('TEAM','scope_guard')).toBe(true));
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/billing/entitlements.test.ts
```

Expected: FAIL because plan entitlements are absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/billing/plans.ts
export type Plan='FREE_BETA'|'SOLO'|'TEAM'|'AGENCY';export const planLimits={FREE_BETA:{users:1,activeProposals:2,aiRuns:20},SOLO:{users:1,activeProposals:5,aiRuns:100},TEAM:{users:5,activeProposals:100,aiRuns:750},AGENCY:{users:15,activeProposals:500,aiRuns:3000}} as const;
```
```ts
// src/billing/entitlements.ts
import type { Plan } from './plans';export type Feature='proposal_builder'|'scope_guard'|'change_requests'|'custom_branding'|'advanced_analytics';const features:Record<Plan,readonly Feature[]>={FREE_BETA:['proposal_builder'],SOLO:['proposal_builder','scope_guard'],TEAM:['proposal_builder','scope_guard','change_requests'],AGENCY:['proposal_builder','scope_guard','change_requests','custom_branding','advanced_analytics']};export const canUse=(plan:Plan,feature:Feature)=>features[plan].includes(feature);
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/billing/entitlements.test.ts
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/billing && git commit -m "feat: define subscription entitlements"
```

### Task 2: Persist subscriptions and meter AI usage

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/billing/consume-usage.ts`
- Test: `src/billing/consume-usage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/billing/consume-usage.test.ts
import { expect, it, vi } from 'vitest';import { consumeAiUsage } from './consume-usage';it('rejects usage beyond the plan limit',async()=>{const db={organization:{findUnique:vi.fn().mockResolvedValue({plan:'SOLO'})},usageCounter:{upsert:vi.fn().mockResolvedValue({count:101})}};await expect(consumeAiUsage(db as never,'o1',1,new Date('2026-07-01'))).rejects.toThrow('AI_USAGE_LIMIT_REACHED');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/billing/consume-usage.test.ts
```

Expected: FAIL because usage metering is absent.

- [ ] **Step 3: Write the minimal implementation**

```prisma
enum BillingPlan { FREE_BETA SOLO TEAM AGENCY }
model Subscription { id String @id @default(cuid()) organizationId String @unique providerCustomerId String? providerSubscriptionId String? plan BillingPlan @default(FREE_BETA) status String @default("inactive") periodEnd DateTime? updatedAt DateTime @updatedAt }
model UsageCounter { id String @id @default(cuid()) organizationId String metric String periodStart DateTime count Int @default(0) @@unique([organizationId, metric, periodStart]) }
model BillingEvent { id String @id providerEventId String @unique eventType String receivedAt DateTime @default(now()) processedAt DateTime? }
```
```ts
// src/billing/consume-usage.ts
import { planLimits, type Plan } from './plans';export async function consumeAiUsage(db:any,organizationId:string,amount:number,periodStart:Date){const organization=await db.organization.findUnique({where:{id:organizationId},select:{plan:true}});if(!organization)throw new Error('ORGANIZATION_NOT_FOUND');const counter=await db.usageCounter.upsert({where:{organizationId_metric_periodStart:{organizationId,metric:'ai_runs',periodStart}},create:{organizationId,metric:'ai_runs',periodStart,count:amount},update:{count:{increment:amount}}});if(counter.count>planLimits[organization.plan as Plan].aiRuns)throw new Error('AI_USAGE_LIMIT_REACHED');return counter;}
```
```bash
pnpm prisma migrate dev --name add_billing
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/billing/consume-usage.test.ts && pnpm prisma validate
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add prisma src/billing && git commit -m "feat: meter plan usage"
```

### Task 3: Process Stripe webhooks idempotently

**Files:**
- Create: `src/billing/process-stripe-event.ts`
- Test: `src/billing/process-stripe-event.test.ts`
- Create: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/billing/process-stripe-event.test.ts
import { expect, it, vi } from 'vitest';import { processStripeEvent } from './process-stripe-event';it('ignores an event already recorded',async()=>{const update=vi.fn();const db={billingEvent:{findUnique:vi.fn().mockResolvedValue({id:'evt'}),create:vi.fn(),update},subscription:{upsert:vi.fn()}};await expect(processStripeEvent(db as never,{id:'evt_1',type:'customer.subscription.updated',data:{object:{}}} as never)).resolves.toEqual({duplicate:true});expect(update).not.toHaveBeenCalled();});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/billing/process-stripe-event.test.ts
```

Expected: FAIL because webhook processing is absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/billing/process-stripe-event.ts
import type Stripe from 'stripe';export async function processStripeEvent(db:any,event:Stripe.Event){const existing=await db.billingEvent.findUnique({where:{providerEventId:event.id}});if(existing)return {duplicate:true};await db.$transaction(async(tx:any)=>{await tx.billingEvent.create({data:{providerEventId:event.id,eventType:event.type}});if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.created'){const subscription=event.data.object as Stripe.Subscription;const organizationId=subscription.metadata.organizationId;if(!organizationId)throw new Error('MISSING_ORGANIZATION_METADATA');await tx.subscription.upsert({where:{organizationId},create:{organizationId,providerCustomerId:String(subscription.customer),providerSubscriptionId:subscription.id,status:subscription.status,plan:(subscription.metadata.plan||'FREE_BETA')},update:{providerSubscriptionId:subscription.id,status:subscription.status,plan:(subscription.metadata.plan||'FREE_BETA')}});}await tx.billingEvent.update({where:{providerEventId:event.id},data:{processedAt:new Date()}});});return {duplicate:false};}
```
```ts
// src/app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';import { headers } from 'next/headers';import { db } from '@/db/client';import { processStripeEvent } from '@/billing/process-stripe-event';const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!);export async function POST(request:Request){const body=await request.text();const signature=(await headers()).get('stripe-signature');if(!signature)return new Response('Missing signature',{status:400});const event=stripe.webhooks.constructEvent(body,signature,process.env.STRIPE_WEBHOOK_SECRET!);await processStripeEvent(db,event);return Response.json({received:true});}
```
```bash
pnpm add stripe
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/billing/process-stripe-event.test.ts && pnpm typecheck
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/billing src/app/api/webhooks package.json pnpm-lock.yaml && git commit -m "feat: synchronize Stripe subscriptions"
```

### Task 4: Add privacy-safe analytics and launch gate

**Files:**
- Create: `src/analytics/track-event.ts`
- Test: `src/analytics/track-event.test.ts`
- Create: `scripts/launch-check.mjs`
- Create: `docs/launch/beta-checklist.md`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
// src/analytics/track-event.test.ts
import { expect, it, vi } from 'vitest';import { trackEvent } from './track-event';it('rejects proposal content in analytics properties',async()=>{await expect(trackEvent({capture:vi.fn()} as never,{name:'proposal.shared',organizationId:'o1',properties:{proposalText:'secret'}})).rejects.toThrow('SENSITIVE_ANALYTICS_PROPERTY');});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
    pnpm vitest run src/analytics/track-event.test.ts && pnpm launch:check
```

Expected: FAIL because analytics validation and launch check are absent.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/analytics/track-event.ts
const blocked=/text|content|body|brief|proposal/i;export async function trackEvent(client:{capture:(event:string,properties:Record<string,unknown>)=>unknown},input:{name:string;organizationId:string;properties?:Record<string,unknown>}){for(const key of Object.keys(input.properties||{}))if(blocked.test(key))throw new Error('SENSITIVE_ANALYTICS_PROPERTY');return client.capture(input.name,{organizationId:input.organizationId,...input.properties});}
```
```js
// scripts/launch-check.mjs
import { execFileSync } from 'node:child_process';const commands=[['pnpm',['lint']],['pnpm',['typecheck']],['pnpm',['test']],['pnpm',['build']],['pnpm',['playwright','test']]];for(const [command,args] of commands){console.log(`> ${command} ${args.join(' ')}`);execFileSync(command,args,{stdio:'inherit'});}console.log('Launch gate passed.');
```
```markdown
<!-- docs/launch/beta-checklist.md -->
# Private Beta Launch Checklist

- [ ] Tenant-isolation tests pass.
- [ ] Authentication, authorization, and secure share tests pass.
- [ ] AI fixtures meet extraction and evidence targets.
- [ ] Approved proposal versions cannot be edited in place.
- [ ] Database backup and restore procedure is rehearsed.
- [ ] Privacy notice, terms, AI-processing disclosure, and support contact are published.
- [ ] Billing is in test mode until founder approval.
- [ ] No critical or high-severity security defect is open.
- [ ] `pnpm launch:check` exits with code 0.
```
```json
// Add to package.json scripts
{"launch:check":"node scripts/launch-check.mjs"}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
    pnpm vitest run src/analytics/track-event.test.ts && pnpm launch:check
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
    git add src/analytics scripts docs/launch package.json && git commit -m "chore: add analytics safeguards and launch gate"
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
