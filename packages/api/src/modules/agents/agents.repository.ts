import { eq, inArray } from 'drizzle-orm';

import { db } from '@api/db/client';
import { agents } from '@api/db/schema';
import type { AgentRow, ClawKeyStatus, NewAgentRow } from '@api/db/schema';

async function create(input: NewAgentRow): Promise<AgentRow> {
  const inserted = await db.insert(agents).values(input).returning();
  return inserted[0]!;
}

async function findById(id: string): Promise<AgentRow | undefined> {
  const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return rows[0];
}

async function findByIds(ids: string[]): Promise<AgentRow[]> {
  if (ids.length === 0) return [];
  return db.select().from(agents).where(inArray(agents.id, ids));
}

async function findByCompanyId(companyId: string): Promise<AgentRow[]> {
  return db.select().from(agents).where(eq(agents.companyId, companyId));
}

function updateStatus(id: string, status: 'active' | 'revoked'): void {
  db.update(agents).set({ status, updatedAt: new Date() }).where(eq(agents.id, id)).run();
}

function updateClawKeyStatus(
  id: string,
  clawkeyStatus: ClawKeyStatus,
  clawkeyRegisteredAt: Date | null
): void {
  db.update(agents)
    .set({ clawkeyStatus, clawkeyRegisteredAt, updatedAt: new Date() })
    .where(eq(agents.id, id))
    .run();
}

function updateKeysAndSession(
  id: string,
  update: {
    ed25519PublicKey: string;
    ed25519PrivateKey: string;
    clawkeySessionId: string;
    clawkeyStatus: ClawKeyStatus;
  }
): void {
  db.update(agents)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(agents.id, id))
    .run();
}

export const agentsRepository = {
  create,
  findById,
  findByIds,
  findByCompanyId,
  updateStatus,
  updateClawKeyStatus,
  updateKeysAndSession,
};
