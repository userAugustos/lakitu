import { and, count, desc, eq, lt } from 'drizzle-orm';

import { db } from '@api/db/client';
import { pendingActions } from '@api/db/schema';
import type { NewPendingActionRow, PendingActionRow, PendingActionStatus } from '@api/db/schema';

async function create(input: NewPendingActionRow): Promise<PendingActionRow> {
  const inserted = await db.insert(pendingActions).values(input).returning();
  return inserted[0]!;
}

async function findById(id: string): Promise<PendingActionRow | undefined> {
  const rows = await db.select().from(pendingActions).where(eq(pendingActions.id, id)).limit(1);
  return rows[0];
}

async function findByOwnerId(
  ownerId: string,
  statusFilter?: PendingActionStatus
): Promise<PendingActionRow[]> {
  const conditions = [eq(pendingActions.ownerId, ownerId)];
  if (statusFilter) {
    conditions.push(eq(pendingActions.status, statusFilter));
  }
  return db
    .select()
    .from(pendingActions)
    .where(and(...conditions))
    .orderBy(desc(pendingActions.createdAt));
}

function updateStatus(
  id: string,
  update: {
    status: PendingActionStatus;
    resolutionNote?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | null;
  }
): void {
  db.update(pendingActions)
    .set({
      status: update.status,
      resolutionNote: update.resolutionNote ?? null,
      resolvedBy: update.resolvedBy ?? null,
      resolvedAt: update.resolvedAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(pendingActions.id, id))
    .run();
}

function findExpired(now: Date): PendingActionRow[] {
  return db
    .select()
    .from(pendingActions)
    .where(and(eq(pendingActions.status, 'pending'), lt(pendingActions.expiresAt, now)))
    .all();
}

function countPendingByOwnerId(ownerId: string): number {
  const result = db
    .select({ count: count() })
    .from(pendingActions)
    .where(and(eq(pendingActions.ownerId, ownerId), eq(pendingActions.status, 'pending')))
    .get();
  return result?.count ?? 0;
}

export const pendingActionsRepository = {
  create,
  findById,
  findByOwnerId,
  countPendingByOwnerId,
  updateStatus,
  findExpired,
};
