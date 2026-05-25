import { createHash } from 'node:crypto';

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

function canonicalJson(obj: Record<string, unknown>): string {
  const sortKeys = (o: unknown): unknown => {
    if (Array.isArray(o)) return o.map(sortKeys);
    if (o !== null && typeof o === 'object') {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(o as object).sort()) {
        sorted[key] = sortKeys((o as Record<string, unknown>)[key]);
      }
      return sorted;
    }
    return o;
  };
  return JSON.stringify(sortKeys(obj));
}

function computeRowHash(row: Omit<NewAuditLogRow, 'rowHash'>): string {
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.getTime()
      : typeof row.createdAt === 'number'
        ? row.createdAt
        : null;

  const payload: Record<string, unknown> = {
    id: row.id ?? '',
    audit_id: row.auditId,
    agent_id: row.agentId,
    owner_id: row.ownerId,
    company_id: row.companyId,
    action: row.action,
    decision: row.decision,
    reasons: row.reasons,
    policy_hit: row.policyHit ?? null,
    request_id: row.requestId ?? null,
    context: row.context ?? null,
    created_at: createdAt,
    previous_hash: row.previousHash ?? '',
  };
  return createHash('sha256').update(canonicalJson(payload)).digest('hex');
}

function findLatestForCompany(companyId: string): AuditLogRow | undefined {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.companyId, companyId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1)
    .get();
}

function insert(input: Omit<NewAuditLogRow, 'previousHash' | 'rowHash'>): AuditLogRow {
  return db.transaction((tx) => {
    const latest = tx
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.companyId, input.companyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1)
      .get();

    const previousHash = latest?.rowHash ?? '';
    const id = input.id ?? crypto.randomUUID();
    const createdAt = input.createdAt ?? new Date();

    const withId = { ...input, id, previousHash, createdAt };
    const rowHash = computeRowHash(withId);

    return tx
      .insert(auditLogs)
      .values({ ...withId, rowHash })
      .returning()
      .get()!;
  });
}

function insertMany(inputs: Omit<NewAuditLogRow, 'previousHash' | 'rowHash'>[]): void {
  if (inputs.length === 0) return;
  db.transaction((tx) => {
    for (const input of inputs) {
      const latest = tx
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.companyId, input.companyId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(1)
        .get();

      const previousHash = latest?.rowHash ?? '';
      const id = input.id ?? crypto.randomUUID();
      const createdAt = input.createdAt ?? new Date();
      const withId = { ...input, id, previousHash, createdAt };
      const rowHash = computeRowHash(withId);

      tx.insert(auditLogs)
        .values({ ...withId, rowHash })
        .run();
    }
  });
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

function streamForCompany(
  companyId: string,
  cursor?: { after: Date },
  limit = HARD_LIMIT
): AuditLogRow[] {
  const conditions = [eq(auditLogs.companyId, companyId)];
  if (cursor) conditions.push(gte(auditLogs.createdAt, cursor.after));

  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(asc(auditLogs.createdAt))
    .limit(limit)
    .all();
}

function verifyChain(companyId: string):
  | { valid: true; chain_length: number }
  | {
      valid: false;
      chain_length: number;
      broken_at: {
        id: string;
        created_at: number;
        expected_previous_hash: string;
        actual_previous_hash: string;
        reason: 'previous_hash_mismatch' | 'row_hash_mismatch';
      };
    } {
  const rows = db.select().from(auditLogs).where(eq(auditLogs.companyId, companyId)).all();

  const totalRows = rows.length;

  const byPreviousHash = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    byPreviousHash.set(row.previousHash, row);
  }

  let expectedPrev = '';
  let walked = 0;

  while (walked < totalRows) {
    const row = byPreviousHash.get(expectedPrev);
    if (!row) {
      return {
        valid: false,
        chain_length: totalRows,
        broken_at: {
          id: '',
          created_at: 0,
          expected_previous_hash: expectedPrev,
          actual_previous_hash: '',
          reason: 'previous_hash_mismatch',
        },
      };
    }

    const recomputed = computeRowHash({
      id: row.id,
      auditId: row.auditId,
      agentId: row.agentId,
      ownerId: row.ownerId,
      companyId: row.companyId,
      action: row.action,
      decision: row.decision,
      reasons: row.reasons,
      policyHit: row.policyHit,
      requestId: row.requestId,
      context: row.context,
      createdAt: row.createdAt,
      previousHash: row.previousHash,
    });

    if (recomputed !== row.rowHash) {
      return {
        valid: false,
        chain_length: totalRows,
        broken_at: {
          id: row.id,
          created_at: row.createdAt.getTime(),
          expected_previous_hash: row.previousHash,
          actual_previous_hash: row.previousHash,
          reason: 'row_hash_mismatch',
        },
      };
    }

    expectedPrev = row.rowHash;
    walked++;
  }

  return { valid: true, chain_length: totalRows };
}

export const auditLogRepository = {
  insert,
  insertMany,
  findByAuditId,
  findByAgentId,
  findByOwnerId,
  findByFilters,
  streamForCompany,
  verifyChain,
  findLatestForCompany,
  computeRowHash,
};
