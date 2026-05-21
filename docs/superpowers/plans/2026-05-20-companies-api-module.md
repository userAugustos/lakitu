# Companies API Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `companies` domain module to the API so users can create or join a company during onboarding, satisfying the first onboarding condition (`company`).

**Architecture:** New `companies` table with a `company_id` FK on `users`. A `companies` module follows the existing routes/service/repository layering. The onboarding service reads `user.companyId` instead of hard-coding `false`. Three endpoints: create, search, and list members. All protected by `authMiddleware`. SDK export follows the 3-step recipe.

**Tech Stack:** Elysia, Drizzle ORM (bun:sqlite), TypeBox (`t` from Elysia), existing `AppError` helpers.

---

## File Map

| Action | File                                                         | Responsibility                                                   |
| ------ | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Create | `packages/api/src/db/migrations/0003_companies.sql`          | SQL migration: `companies` table + `company_id` FK on `users`    |
| Create | `packages/api/src/db/migrations/meta/_journal.json`          | Update journal with new entry (via `drizzle-kit generate`)       |
| Modify | `packages/api/src/db/schema.ts`                              | Add `companies` table definition + `companyId` column on `users` |
| Create | `packages/api/src/modules/companies/types.ts`                | Plain TS interfaces + Elysia schemas                             |
| Create | `packages/api/src/modules/companies/companies.repository.ts` | Drizzle queries                                                  |
| Create | `packages/api/src/modules/companies/companies.service.ts`    | Business logic                                                   |
| Create | `packages/api/src/modules/companies/companies.routes.ts`     | Elysia route plugin                                              |
| Modify | `packages/api/src/modules/onboarding/onboarding.service.ts`  | Replace `companySatisfied = false` with real check               |
| Modify | `packages/api/src/app.ts`                                    | Register `companiesRoutes`                                       |
| Create | `packages/api/src/sdk/companies.ts`                          | SDK re-export                                                    |
| Modify | `packages/api/tsup.config.ts`                                | Add `companies` entry                                            |
| Modify | `packages/api/package.json`                                  | Add `./companies` export                                         |
| Modify | `apps/web/src/__sdk-smoke.ts`                                | Import from `@lakitu/api/companies`                              |
| Create | `packages/api/src/test/e2e.companies.test.ts`                | E2E tests                                                        |

---

## Schema Design

### `companies` table

| Column       | SQLite type                                     | Drizzle definition                                                                                | Notes                                   |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `id`         | `TEXT PRIMARY KEY`                              | `text('id').primaryKey().$defaultFn(() => crypto.randomUUID())`                                   | UUID                                    |
| `name`       | `TEXT NOT NULL`                                 | `text('name').notNull()`                                                                          | Company display name; unique constraint |
| `created_at` | `INTEGER NOT NULL DEFAULT (unixepoch() * 1000)` | `integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql\`(unixepoch() \* 1000)\`)` | Epoch ms, matches existing convention   |

Index: `CREATE UNIQUE INDEX idx_companies_name ON companies(name)` -- prevents duplicate company names.

### `users` table addition

| Column       | SQLite type       | Drizzle definition                                  | Notes                                                 |
| ------------ | ----------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `company_id` | `TEXT` (nullable) | `text('company_id').references(() => companies.id)` | FK to companies; null until onboarding step completed |

Index: `CREATE INDEX idx_users_company ON users(company_id)` -- for member listing queries.

### Why `name` is unique

The PLAN.md spec says users "search-and-select an existing company OR create a new one." Without uniqueness, two users could create "Acme Corp" independently and end up in different companies, defeating the search-and-select model. Uniqueness also makes the search results unambiguous.

---

## API Contracts

All endpoints live under prefix `/companies` and require `authMiddleware`.

### 1. `POST /companies` -- Create a company and join it

**Request body:**

```ts
{
  name: string; // 1-100 chars, trimmed
}
```

**Elysia schema:**

```ts
const CreateCompanyBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});
```

**Success response (200):**

```ts
{
  id: string,
  name: string,
  created_at: number
}
```

**Error cases:**

| Condition                         | Error code                 | HTTP status | Message                                   |
| --------------------------------- | -------------------------- | ----------- | ----------------------------------------- |
| User already belongs to a company | `companies.already_member` | 409         | "You already belong to a company"         |
| Company name already taken        | `companies.name_taken`     | 409         | "A company with this name already exists" |
| Name is empty after trimming      | 422 validation             | 422         | (Elysia validation)                       |

**Side effect:** Sets `users.company_id` to the newly created company's `id`.

### 2. `POST /companies/:id/join` -- Join an existing company

**Request params:**

```ts
{
  id: string;
}
```

**Elysia schema:**

```ts
const CompanyIdParamSchema = t.Object({
  id: t.String(),
});
```

**Success response (200):**

```ts
{
  id: string,
  name: string,
  created_at: number
}
```

**Error cases:**

| Condition                         | Error code                 | HTTP status | Message                           |
| --------------------------------- | -------------------------- | ----------- | --------------------------------- |
| User already belongs to a company | `companies.already_member` | 409         | "You already belong to a company" |
| Company not found                 | `companies.not_found`      | 404         | "Company not found"               |

**Side effect:** Sets `users.company_id` to the target company's `id`.

### 3. `GET /companies?q=` -- Search companies

**Query params:**

```ts
{
  q: string; // min 1 char, search term
}
```

**Elysia schema:**

```ts
const SearchCompaniesQuerySchema = t.Object({
  q: t.String({ minLength: 1 }),
});
```

**Success response (200):**

```ts
{
  companies: Array<{
    id: string;
    name: string;
    created_at: number;
  }>;
}
```

Search is case-insensitive `LIKE '%term%'` on `name`. Results capped at 20.

### 4. `GET /companies/:id/members` -- List company members

**Request params:**

```ts
{
  id: string;
}
```

**Success response (200):**

```ts
{
  members: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
}
```

**Error cases:**

| Condition                            | Error code             | HTTP status | Message                                |
| ------------------------------------ | ---------------------- | ----------- | -------------------------------------- |
| Company not found                    | `companies.not_found`  | 404         | "Company not found"                    |
| User is not a member of this company | `companies.not_member` | 403         | "You are not a member of this company" |

**Access control:** Only members of the company can list its members (per PLAN.md: "Members can see each other in the company area").

---

## Tasks

### Task 1: Schema -- `companies` table and `company_id` FK on `users`

**Files:**

- Modify: `packages/api/src/db/schema.ts`

- [ ] **Step 1: Add the `companies` table definition to `schema.ts`**

Add this after the `VERY_AI_STATUSES` block and before the `users` table (because `users` will reference `companies`):

```ts
export const companies = sqliteTable(
  'companies',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    nameIdx: index('idx_companies_name').on(t.name),
  })
);
```

Note: The `.unique()` on `name` creates a unique constraint. The explicit `nameIdx` via `index()` is for Drizzle's migration generator -- SQLite creates an automatic index for `UNIQUE` constraints, so the named index gives us a predictable name for the migration SQL. If Drizzle generates a duplicate, keep only the `UNIQUE` constraint and remove the explicit index call.

- [ ] **Step 2: Add `companyId` column to the `users` table**

Inside the `users` table definition, add after the `status` column:

```ts
companyId: text('company_id').references(() => companies.id),
```

Also add an index. Modify the `users` table to use the callback form for indexes (it currently does not have one). If `sqliteTable` for `users` does not already have a third argument, add one:

```ts
export const users = sqliteTable(
  'users',
  {
    // ... existing columns ...
    companyId: text('company_id').references(() => companies.id),
    // ... rest of existing columns ...
  },
  (t) => ({
    companyIdx: index('idx_users_company').on(t.companyId),
  })
);
```

- [ ] **Step 3: Add row type exports at the bottom of `schema.ts`**

```ts
export type CompanyRow = typeof companies.$inferSelect;
export type NewCompanyRow = typeof companies.$inferInsert;
```

- [ ] **Step 4: Run `drizzle-kit generate` to produce the migration SQL**

```bash
bun --filter @lakitu/api db:generate
```

Expected: Creates `packages/api/src/db/migrations/0003_companies.sql` with:

- `CREATE TABLE companies ...`
- `ALTER TABLE users ADD COLUMN company_id TEXT REFERENCES companies(id)`
- `CREATE INDEX idx_users_company ...`

Also updates `meta/_journal.json` with entry `idx: 3, tag: "0003_companies"`.

- [ ] **Step 5: Verify the migration file**

Read the generated SQL file. It should contain:

1. `CREATE TABLE IF NOT EXISTS companies` with columns `id TEXT PRIMARY KEY NOT NULL`, `name TEXT NOT NULL UNIQUE`, `created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)`
2. `ALTER TABLE users ADD COLUMN company_id TEXT REFERENCES companies(id)`
3. `CREATE INDEX IF NOT EXISTS idx_users_company ON users (company_id)`

If the generated SQL differs from what is expected (Drizzle sometimes orders things differently or names things differently), that is fine as long as the semantics are correct. Do not manually edit the generated file unless it is wrong.

- [ ] **Step 6: Run the migration to apply to the local dev DB**

```bash
bun --filter @lakitu/api db:migrate
```

Expected: Clean migration, no errors.

- [ ] **Step 7: Run typecheck to confirm schema changes compile**

```bash
bun typecheck
```

Expected: Pass (there may be errors in `onboarding.service.ts` because `companySatisfied` is still `false` -- that is fine, we fix it in Task 5).

- [ ] **Step 8: Commit**

```bash
git add packages/api/src/db/schema.ts packages/api/src/db/migrations/
git commit -m "feat(api): add companies table and company_id FK on users"
```

---

### Task 2: Types -- `packages/api/src/modules/companies/types.ts`

**Files:**

- Create: `packages/api/src/modules/companies/types.ts`

- [ ] **Step 1: Create the types file**

Create `packages/api/src/modules/companies/types.ts`:

```ts
import { t } from 'elysia';

export interface Company {
  id: string;
  name: string;
  created_at: number;
}

export interface CompanyMember {
  id: string;
  name: string | null;
  email: string;
}

export interface CreateCompanyRequest {
  name: string;
}

export interface SearchCompaniesQuery {
  q: string;
}

export interface SearchCompaniesResponse {
  companies: Company[];
}

export interface ListMembersResponse {
  members: CompanyMember[];
}

export const CompanySchema = t.Object({
  id: t.String(),
  name: t.String(),
  created_at: t.Number(),
});

export const CompanyMemberSchema = t.Object({
  id: t.String(),
  name: t.Union([t.String(), t.Null()]),
  email: t.String({ format: 'email' }),
});

export const CreateCompanyBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});

export const CompanyIdParamSchema = t.Object({
  id: t.String(),
});

export const SearchCompaniesQuerySchema = t.Object({
  q: t.String({ minLength: 1 }),
});

export const SearchCompaniesResponseSchema = t.Object({
  companies: t.Array(CompanySchema),
});

export const ListMembersResponseSchema = t.Object({
  members: t.Array(CompanyMemberSchema),
});
```

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: Pass.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/modules/companies/types.ts
git commit -m "feat(api): add companies types and Elysia schemas"
```

---

### Task 3: Repository -- `packages/api/src/modules/companies/companies.repository.ts`

**Files:**

- Create: `packages/api/src/modules/companies/companies.repository.ts`

- [ ] **Step 1: Create the repository file**

Create `packages/api/src/modules/companies/companies.repository.ts`:

```ts
import { eq, like } from 'drizzle-orm';

import { db } from '@api/db/client';
import { companies, users } from '@api/db/schema';
import type { CompanyRow, NewCompanyRow, UserRow } from '@api/db/schema';

async function createCompany(input: NewCompanyRow): Promise<CompanyRow> {
  const inserted = await db.insert(companies).values(input).returning();
  return inserted[0]!;
}

async function findById(companyId: string): Promise<CompanyRow | undefined> {
  const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  return rows[0];
}

async function findByName(name: string): Promise<CompanyRow | undefined> {
  const rows = await db.select().from(companies).where(eq(companies.name, name)).limit(1);
  return rows[0];
}

async function searchByName(query: string, limit = 20): Promise<CompanyRow[]> {
  return db
    .select()
    .from(companies)
    .where(like(companies.name, `%${query}%`))
    .limit(limit);
}

async function findMembers(companyId: string): Promise<Pick<UserRow, 'id' | 'name' | 'email'>[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.companyId, companyId));
}

async function setUserCompany(userId: string, companyId: string): Promise<void> {
  db.update(users).set({ companyId }).where(eq(users.id, userId)).run();
}

export const companiesRepository = {
  createCompany,
  findById,
  findByName,
  searchByName,
  findMembers,
  setUserCompany,
};
```

Note on `searchByName`: The `like()` from `drizzle-orm` maps to SQL `LIKE` which is case-insensitive for ASCII in SQLite by default. This is sufficient for company name search.

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: Pass.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/modules/companies/companies.repository.ts
git commit -m "feat(api): add companies repository with Drizzle queries"
```

---

### Task 4: Service -- `packages/api/src/modules/companies/companies.service.ts`

**Files:**

- Create: `packages/api/src/modules/companies/companies.service.ts`

- [ ] **Step 1: Create the service file**

Create `packages/api/src/modules/companies/companies.service.ts`:

```ts
import { authRepository } from '@api/modules/auth/auth.repository';
import { conflict, forbidden, notFound, unauthorized } from '@core/errors';

import { companiesRepository } from './companies.repository';
import type {
  Company,
  CreateCompanyRequest,
  ListMembersResponse,
  SearchCompaniesResponse,
} from './types';

function toCompanyDto(row: { id: string; name: string; createdAt: Date }): Company {
  return {
    id: row.id,
    name: row.name,
    created_at: row.createdAt.getTime(),
  };
}

async function ensureUserExists(userId: string) {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  return user;
}

async function create(userId: string, input: CreateCompanyRequest): Promise<Company> {
  const user = await ensureUserExists(userId);

  if (user.companyId) {
    throw conflict('companies.already_member', 'You already belong to a company');
  }

  const name = input.name.trim();
  const existing = await companiesRepository.findByName(name);
  if (existing) {
    throw conflict('companies.name_taken', 'A company with this name already exists');
  }

  const company = await companiesRepository.createCompany({ name });
  await companiesRepository.setUserCompany(userId, company.id);

  return toCompanyDto(company);
}

async function join(userId: string, companyId: string): Promise<Company> {
  const user = await ensureUserExists(userId);

  if (user.companyId) {
    throw conflict('companies.already_member', 'You already belong to a company');
  }

  const company = await companiesRepository.findById(companyId);
  if (!company) {
    throw notFound('companies.not_found', 'Company not found');
  }

  await companiesRepository.setUserCompany(userId, company.id);

  return toCompanyDto(company);
}

async function search(query: string): Promise<SearchCompaniesResponse> {
  const rows = await companiesRepository.searchByName(query.trim());
  return { companies: rows.map(toCompanyDto) };
}

async function listMembers(userId: string, companyId: string): Promise<ListMembersResponse> {
  const user = await ensureUserExists(userId);

  const company = await companiesRepository.findById(companyId);
  if (!company) {
    throw notFound('companies.not_found', 'Company not found');
  }

  if (user.companyId !== companyId) {
    throw forbidden('companies.not_member', 'You are not a member of this company');
  }

  const rows = await companiesRepository.findMembers(companyId);
  return {
    members: rows.map((r) => ({ id: r.id, name: r.name, email: r.email })),
  };
}

export const companiesService = { create, join, search, listMembers };
```

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: Pass.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/modules/companies/companies.service.ts
git commit -m "feat(api): add companies service with create, join, search, listMembers"
```

---

### Task 5: Routes -- `packages/api/src/modules/companies/companies.routes.ts`

**Files:**

- Create: `packages/api/src/modules/companies/companies.routes.ts`
- Modify: `packages/api/src/app.ts`

- [ ] **Step 1: Create the routes file**

Create `packages/api/src/modules/companies/companies.routes.ts`:

```ts
import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { companiesService } from './companies.service';
import {
  CompanyIdParamSchema,
  CompanySchema,
  CreateCompanyBodySchema,
  ListMembersResponseSchema,
  SearchCompaniesQuerySchema,
  SearchCompaniesResponseSchema,
} from './types';

export const companiesRoutes = new Elysia({
  name: 'companies.routes',
  prefix: '/companies',
})
  .use(authMiddleware)
  .post('/', async ({ auth, body }) => companiesService.create(auth.sub, body), {
    body: CreateCompanyBodySchema,
    response: CompanySchema,
    detail: { summary: 'Create a company and join it', tags: ['companies'] },
  })
  .get('/', async ({ query }) => companiesService.search(query.q), {
    query: SearchCompaniesQuerySchema,
    response: SearchCompaniesResponseSchema,
    detail: { summary: 'Search companies by name', tags: ['companies'] },
  })
  .post('/:id/join', async ({ auth, params }) => companiesService.join(auth.sub, params.id), {
    params: CompanyIdParamSchema,
    response: CompanySchema,
    detail: { summary: 'Join an existing company', tags: ['companies'] },
  })
  .get(
    '/:id/members',
    async ({ auth, params }) => companiesService.listMembers(auth.sub, params.id),
    {
      params: CompanyIdParamSchema,
      response: ListMembersResponseSchema,
      detail: { summary: 'List company members', tags: ['companies'] },
    }
  );
```

- [ ] **Step 2: Register routes in `app.ts`**

In `packages/api/src/app.ts`, add the import alongside the other route imports:

```ts
import { companiesRoutes } from '@api/modules/companies/companies.routes';
```

Add `.use(companiesRoutes)` after `.use(veryAiRoutes)`:

```ts
    .use(authRoutes)
    .use(onboardingRoutes)
    .use(veryAiRoutes)
    .use(companiesRoutes);
```

- [ ] **Step 3: Run typecheck**

```bash
bun typecheck
```

Expected: Pass.

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/modules/companies/companies.routes.ts packages/api/src/app.ts
git commit -m "feat(api): register companies routes in app"
```

---

### Task 6: Wire onboarding -- update `computeStatus()`

**Files:**

- Modify: `packages/api/src/modules/onboarding/onboarding.service.ts`

- [ ] **Step 1: Replace the hard-coded `false` with a real check**

In `packages/api/src/modules/onboarding/onboarding.service.ts`, replace:

```ts
const companySatisfied = false;
```

with:

```ts
const companySatisfied = user.companyId !== null;
```

This works because `findUserById` returns a full `UserRow` which now includes `companyId`.

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

Expected: Pass.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/modules/onboarding/onboarding.service.ts
git commit -m "feat(api): wire company membership into onboarding status"
```

---

### Task 7: SDK export -- follow the 3-step recipe

**Files:**

- Create: `packages/api/src/sdk/companies.ts`
- Modify: `packages/api/tsup.config.ts`
- Modify: `packages/api/package.json`
- Modify: `apps/web/src/__sdk-smoke.ts`

- [ ] **Step 1: Create the SDK re-export file**

Create `packages/api/src/sdk/companies.ts`:

```ts
export type {
  Company,
  CompanyMember,
  CreateCompanyRequest,
  SearchCompaniesQuery,
  SearchCompaniesResponse,
  ListMembersResponse,
} from '../modules/companies/types';
```

Note: Only export the plain TS interfaces via `export type`. Do NOT export the Elysia `t.Object` schemas (they pull in `@sinclair/typebox` internals that break consumers). This matches the pattern documented in CLAUDE.md under "Important type-shape rule."

- [ ] **Step 2: Add the entry to `tsup.config.ts`**

In `packages/api/tsup.config.ts`, add `companies` to the `entry` object:

```ts
  entry: {
    index: 'src/sdk/index.ts',
    client: 'src/sdk/client.ts',
    core: 'src/sdk/core.ts',
    auth: 'src/sdk/auth.ts',
    companies: 'src/sdk/companies.ts',
  },
```

- [ ] **Step 3: Add the export to `package.json`**

In `packages/api/package.json`, add to the `exports` field after `"./auth"`:

```json
    "./companies": {
      "types": "./dist/companies.d.ts",
      "import": "./dist/companies.js"
    }
```

- [ ] **Step 4: Build the SDK to verify it compiles**

```bash
bun build:sdk
```

Expected: Clean build, `dist/companies.js` and `dist/companies.d.ts` created.

- [ ] **Step 5: Update the SDK smoke test**

In `apps/web/src/__sdk-smoke.ts`, add an import from the new subpath:

```ts
import type { Company } from '@lakitu/api/companies';
```

And add a type assertion to force resolution:

```ts
export type _CompanyCheck = Company;
```

The full file should look like:

```ts
import { edenTreaty } from '@elysiajs/eden';

import type { LakituApi } from '@lakitu/api/client';
import type { Company } from '@lakitu/api/companies';

const _client = edenTreaty<LakituApi>('http://localhost:3000');

export type _HealthzReturn = Awaited<ReturnType<typeof _client.healthz.get>>;
export type _CompanyCheck = Company;
```

- [ ] **Step 6: Run full check to verify the SDK bridge works**

```bash
bun check
```

Expected: Pass. This confirms the SDK type resolution works end-to-end.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/sdk/companies.ts packages/api/tsup.config.ts packages/api/package.json apps/web/src/__sdk-smoke.ts
git commit -m "feat(api): add companies SDK export and smoke test"
```

---

### Task 8: E2E Tests

**Files:**

- Create: `packages/api/src/test/e2e.companies.test.ts`

- [ ] **Step 1: Create the test file**

Create `packages/api/src/test/e2e.companies.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';

import type { VerifyResponse } from '@api/modules/auth/types';
import type {
  Company,
  ListMembersResponse,
  SearchCompaniesResponse,
} from '@api/modules/companies/types';
import type { OnboardingStatus } from '@api/modules/onboarding/types';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

async function authenticateUser(email: string): Promise<string> {
  await testClient.post('/auth/challenge', { email });
  const verify = await testClient.post<VerifyResponse>('/auth/verify', {
    email,
    code: '111111',
  });
  const token = verify.data?.token;
  if (!token) throw new Error('expected JWT');
  return token;
}

function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('companies', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-companies@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  describe('POST /companies (create)', () => {
    test('creates a company and assigns the user to it', async () => {
      const token = await authenticateUser('co-create@lakitu.test');
      const res = await testClient.post<Company>(
        '/companies',
        { name: 'Acme Corp' },
        authHeaders(token)
      );

      expect(res.error).toBeNull();
      expect(res.data?.name).toBe('Acme Corp');
      expect(res.data?.id).toBeDefined();
      expect(res.data?.created_at).toBeGreaterThan(0);
    });

    test('rejects unauthenticated requests', async () => {
      const res = await testClient.post('/companies', { name: 'No Auth Corp' });
      expect(res.error).not.toBeNull();
    });

    test('rejects duplicate company names', async () => {
      const token = await authenticateUser('co-dup@lakitu.test');
      await testClient.post('/companies', { name: 'Unique Corp' }, authHeaders(token));

      const token2 = await authenticateUser('co-dup2@lakitu.test');
      const res = await testClient.post('/companies', { name: 'Unique Corp' }, authHeaders(token2));

      expect(res.error).not.toBeNull();
      const err = res.error as { status: number; value: { error: string } };
      expect(err.status).toBe(409);
      expect(err.value.error).toBe('companies.name_taken');
    });

    test('rejects if user already belongs to a company', async () => {
      const token = await authenticateUser('co-double@lakitu.test');
      await testClient.post('/companies', { name: 'First Corp' }, authHeaders(token));

      const res = await testClient.post('/companies', { name: 'Second Corp' }, authHeaders(token));

      expect(res.error).not.toBeNull();
      const err = res.error as { status: number; value: { error: string } };
      expect(err.status).toBe(409);
      expect(err.value.error).toBe('companies.already_member');
    });

    test('rejects empty name', async () => {
      const token = await authenticateUser('co-empty@lakitu.test');
      const res = await testClient.post('/companies', { name: '' }, authHeaders(token));
      expect(res.error).not.toBeNull();
    });
  });

  describe('POST /companies/:id/join', () => {
    test('joins an existing company', async () => {
      const creator = await authenticateUser('co-join-creator@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Joinable Corp' },
        authHeaders(creator)
      );
      const companyId = created.data!.id;

      const joiner = await authenticateUser('co-joiner@lakitu.test');
      const res = await testClient.post<Company>(
        `/companies/${companyId}/join`,
        {},
        authHeaders(joiner)
      );

      expect(res.error).toBeNull();
      expect(res.data?.id).toBe(companyId);
      expect(res.data?.name).toBe('Joinable Corp');
    });

    test('rejects joining a non-existent company', async () => {
      const token = await authenticateUser('co-join-404@lakitu.test');
      const res = await testClient.post('/companies/non-existent-id/join', {}, authHeaders(token));

      expect(res.error).not.toBeNull();
      const err = res.error as { status: number; value: { error: string } };
      expect(err.status).toBe(404);
      expect(err.value.error).toBe('companies.not_found');
    });

    test('rejects if user already belongs to a company', async () => {
      const creator = await authenticateUser('co-join-dup-creator@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Already In Corp' },
        authHeaders(creator)
      );

      const res = await testClient.post(
        `/companies/${created.data!.id}/join`,
        {},
        authHeaders(creator)
      );

      expect(res.error).not.toBeNull();
      const err = res.error as { status: number; value: { error: string } };
      expect(err.status).toBe(409);
      expect(err.value.error).toBe('companies.already_member');
    });
  });

  describe('GET /companies?q= (search)', () => {
    test('finds companies by name substring', async () => {
      const token = await authenticateUser('co-search@lakitu.test');
      await testClient.post('/companies', { name: 'Searchable Inc' }, authHeaders(token));

      const token2 = await authenticateUser('co-search2@lakitu.test');
      const res = await testClient.get<SearchCompaniesResponse>(
        '/companies?q=Searchable',
        authHeaders(token2)
      );

      expect(res.error).toBeNull();
      expect(res.data?.companies.length).toBeGreaterThanOrEqual(1);
      expect(res.data?.companies.some((c) => c.name === 'Searchable Inc')).toBe(true);
    });

    test('returns empty array for no matches', async () => {
      const token = await authenticateUser('co-search-none@lakitu.test');
      const res = await testClient.get<SearchCompaniesResponse>(
        '/companies?q=zzz-no-match-zzz',
        authHeaders(token)
      );

      expect(res.error).toBeNull();
      expect(res.data?.companies).toEqual([]);
    });
  });

  describe('GET /companies/:id/members', () => {
    test('lists members of a company the user belongs to', async () => {
      const creator = await authenticateUser('co-members-creator@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Members Corp' },
        authHeaders(creator)
      );
      const companyId = created.data!.id;

      const joiner = await authenticateUser('co-members-joiner@lakitu.test');
      await testClient.post(`/companies/${companyId}/join`, {}, authHeaders(joiner));

      const res = await testClient.get<ListMembersResponse>(
        `/companies/${companyId}/members`,
        authHeaders(creator)
      );

      expect(res.error).toBeNull();
      expect(res.data?.members.length).toBe(2);
      const emails = res.data!.members.map((m) => m.email);
      expect(emails).toContain('co-members-creator@lakitu.test');
      expect(emails).toContain('co-members-joiner@lakitu.test');
    });

    test('rejects non-members from listing', async () => {
      const creator = await authenticateUser('co-members-priv-creator@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Private Corp' },
        authHeaders(creator)
      );

      const outsider = await authenticateUser('co-members-outsider@lakitu.test');
      const res = await testClient.get(
        `/companies/${created.data!.id}/members`,
        authHeaders(outsider)
      );

      expect(res.error).not.toBeNull();
      const err = res.error as { status: number; value: { error: string } };
      expect(err.status).toBe(403);
      expect(err.value.error).toBe('companies.not_member');
    });

    test('rejects for non-existent company', async () => {
      const token = await authenticateUser('co-members-404@lakitu.test');
      const res = await testClient.get('/companies/non-existent-id/members', authHeaders(token));

      expect(res.error).not.toBeNull();
      const err = res.error as { status: number; value: { error: string } };
      expect(err.status).toBe(404);
    });
  });

  describe('onboarding integration', () => {
    test('onboarding status reflects company membership after joining', async () => {
      const token = await authenticateUser('co-onboard@lakitu.test');

      const before = await testClient.get<OnboardingStatus>(
        '/onboarding/status',
        authHeaders(token)
      );
      expect(before.data?.conditions.company.satisfied).toBe(false);
      expect(before.data?.next_step).toBe('company');

      await testClient.post('/companies', { name: 'Onboard Corp' }, authHeaders(token));

      const after = await testClient.get<OnboardingStatus>(
        '/onboarding/status',
        authHeaders(token)
      );
      expect(after.data?.conditions.company.satisfied).toBe(true);
      expect(after.data?.next_step).not.toBe('company');
    });
  });
});
```

- [ ] **Step 2: Run the E2E tests**

```bash
bun api:test:e2e
```

Expected: All tests pass (both new `e2e.companies.test.ts` and existing `e2e.onboarding.test.ts`).

- [ ] **Step 3: Run the full quality check**

```bash
bun check
```

Expected: Pass (format, lint, typecheck).

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/test/e2e.companies.test.ts
git commit -m "test(api): add companies E2E tests including onboarding integration"
```

---

## Edge Cases and Validation Rules

| Case                                                                            | Handled by                                                        | Behavior                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Company name with only whitespace                                               | `name.trim()` in service + `minLength: 1` on schema               | 422 validation error (after trim, empty string fails minLength)                                                                                                                                                                                                                                                                                                                                                       |
| Company name > 100 chars                                                        | `maxLength: 100` on schema                                        | 422 validation error                                                                                                                                                                                                                                                                                                                                                                                                  |
| SQL injection in search `q` param                                               | Drizzle parameterized queries                                     | Safe -- `like()` uses bound parameters                                                                                                                                                                                                                                                                                                                                                                                |
| `LIKE` wildcards in search (`%`, `_`)                                           | Not escaped                                                       | Acceptable for now -- users can use wildcards; this is not a security issue, just a UX quirk. Non-goal to fix.                                                                                                                                                                                                                                                                                                        |
| Race condition: two users create same company name simultaneously               | `UNIQUE` constraint on `companies.name`                           | Second insert throws SQLite UNIQUE constraint error. Drizzle will raise an error. The error plugin catches it as a 500. **Mitigation:** The service checks `findByName` first, so this is an extremely narrow race. If the team wants belt-and-suspenders, the service could catch the Drizzle/SQLite constraint error and re-throw as `conflict('companies.name_taken', ...)`, but this is a minor/deferred concern. |
| Race condition: user joins a company while another request creates one for them | `companyId` check in service is not transactional with the update | Same narrow window. Worst case: user ends up in one of the two companies. Acceptable for this scope.                                                                                                                                                                                                                                                                                                                  |
| User with no company tries to list members                                      | `user.companyId !== companyId` check                              | 403 `companies.not_member`                                                                                                                                                                                                                                                                                                                                                                                            |
| Company with zero members (all left)                                            | No leave endpoint exists                                          | Not possible in current scope; no leave/switch company feature                                                                                                                                                                                                                                                                                                                                                        |

## Risks and Open Questions

1. **Name trimming on create vs. search**: The service trims names on create (`input.name.trim()`). The schema enforces `minLength: 1` on the raw input. If a user submits `"  "` (all spaces), the schema may pass validation (length 2 >= 1) but the trimmed result is empty. **Resolution:** The service should check the trimmed length and throw `badRequest('companies.name_empty', 'Company name cannot be blank')` if the trimmed name is empty. Add this check in the service `create` function after trimming. The dev should add this guard.

2. **No company-switching**: The spec says nothing about leaving or switching companies. The `already_member` guard makes this intentionally one-way during onboarding. If the team needs to support company switching later, add a `DELETE /companies/membership` endpoint -- but that is out of scope.

3. **No pagination on member listing**: For MVP, member lists are unbounded. If a company could have thousands of members, pagination would matter. The spec says "Members can see each other in the company area. No company admin role" -- implying small companies. Non-goal for now.

4. **No pagination on search results**: Capped at 20 results. Sufficient for MVP.

5. **Migration is additive-only**: Adding a nullable column (`company_id`) and a new table requires no data backfill. Safe for existing data.

---

## Sequence of Work (API Dev)

1. **Task 1** -- Schema changes + migration generation + apply. Commit.
2. **Task 2** -- Types file. Commit.
3. **Task 3** -- Repository. Commit.
4. **Task 4** -- Service. Commit.
5. **Task 5** -- Routes + app registration. Commit.
6. **Task 6** -- Onboarding integration (one-line change). Commit.
7. **Task 7** -- SDK export + smoke test. Commit.
8. **Task 8** -- E2E tests + full quality check. Commit.

Every task ends with a typecheck (or full `bun check`). Every task produces a commit. The dev should run `bun api:test:e2e` after Task 8 to confirm everything passes end-to-end, including the existing onboarding tests.
