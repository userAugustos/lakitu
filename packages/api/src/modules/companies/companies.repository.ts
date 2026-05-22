import { count, eq, like } from 'drizzle-orm';

import { db } from '@api/db/client';
import { companies, users } from '@api/db/schema';
import type { CompanyRow, NewCompanyRow } from '@api/db/schema';

async function createCompany(input: NewCompanyRow): Promise<CompanyRow> {
  const inserted = await db.insert(companies).values(input).returning();
  return inserted[0]!;
}

async function findById(id: string): Promise<CompanyRow | undefined> {
  const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return rows[0];
}

async function findByName(name: string): Promise<CompanyRow | undefined> {
  const rows = await db.select().from(companies).where(eq(companies.name, name)).limit(1);
  return rows[0];
}

async function searchByName(query: string): Promise<CompanyRow[]> {
  return db
    .select()
    .from(companies)
    .where(like(companies.name, `%${query}%`))
    .limit(20);
}

async function findMembers(
  companyId: string
): Promise<{ id: string; name: string | null; email: string }[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.companyId, companyId));
}

async function countMembers(companyId: string): Promise<number> {
  const rows = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.companyId, companyId));
  return rows[0]?.count ?? 0;
}

function setUserCompany(userId: string, companyId: string): void {
  db.update(users).set({ companyId }).where(eq(users.id, userId)).run();
}

export const companiesRepository = {
  createCompany,
  findById,
  findByName,
  searchByName,
  findMembers,
  countMembers,
  setUserCompany,
};
