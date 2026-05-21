import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@api/db/client';
import { auditLogs } from '@api/db/schema';
import type { AuditDecision, AuditLogRow, NewAuditLogRow } from '@api/db/schema';

const HARD_LIMIT = 200;

interface TimeWindowOpts {
  from?: Date;
  to?: Date;
}

interface AuditLogFilters {
  agentId?: string;
  ownerId?: string;
  companyId?: string;
  action?: string;
  decision?: AuditDecision;
  from?: Date;
  to?: Date;
}

async function insert(input: NewAuditLogRow): Promise<AuditLogRow> {
  const inserted = await db.insert(auditLogs).values(input).returning();
  return inserted[0]!;
}

async function insertMany(inputs: NewAuditLogRow[]): Promise<void> {
  if (inputs.length === 0) return;
  await db.insert(auditLogs).values(inputs);
}

async function findByAuditId(auditId: string): Promise<AuditLogRow[]> {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.auditId, auditId))
    .orderBy(asc(auditLogs.createdAt));
}

async function findByAgentId(agentId: string, opts?: TimeWindowOpts): Promise<AuditLogRow[]> {
  const conditions = [eq(auditLogs.agentId, agentId)];
  if (opts?.from) conditions.push(gte(auditLogs.createdAt, opts.from));
  if (opts?.to) conditions.push(lte(auditLogs.createdAt, opts.to));

  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(HARD_LIMIT);
}

async function findByOwnerId(ownerId: string, opts?: TimeWindowOpts): Promise<AuditLogRow[]> {
  const conditions = [eq(auditLogs.ownerId, ownerId)];
  if (opts?.from) conditions.push(gte(auditLogs.createdAt, opts.from));
  if (opts?.to) conditions.push(lte(auditLogs.createdAt, opts.to));

  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(HARD_LIMIT);
}

async function findByFilters(filters: AuditLogFilters): Promise<AuditLogRow[]> {
  const conditions = [];
  if (filters.agentId) conditions.push(eq(auditLogs.agentId, filters.agentId));
  if (filters.ownerId) conditions.push(eq(auditLogs.ownerId, filters.ownerId));
  if (filters.companyId) conditions.push(eq(auditLogs.companyId, filters.companyId));
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.decision) conditions.push(eq(auditLogs.decision, filters.decision));
  if (filters.from) conditions.push(gte(auditLogs.createdAt, filters.from));
  if (filters.to) conditions.push(lte(auditLogs.createdAt, filters.to));

  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(HARD_LIMIT);
}

export const auditLogRepository = {
  insert,
  insertMany,
  findByAuditId,
  findByAgentId,
  findByOwnerId,
  findByFilters,
};
