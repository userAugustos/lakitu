import { and, eq } from 'drizzle-orm';

import { db } from '@api/db/client';
import { agentPermissions } from '@api/db/schema';
import type { AgentPermissionRow, NewAgentPermissionRow } from '@api/db/schema';

function findByAgentId(agentId: string): AgentPermissionRow[] {
  return db.select().from(agentPermissions).where(eq(agentPermissions.agentId, agentId)).all();
}

function findByAgentAndToolKey(agentId: string, toolKey: string): AgentPermissionRow | undefined {
  return db
    .select()
    .from(agentPermissions)
    .where(and(eq(agentPermissions.agentId, agentId), eq(agentPermissions.toolKey, toolKey)))
    .limit(1)
    .get();
}

function create(input: NewAgentPermissionRow): AgentPermissionRow {
  return db.insert(agentPermissions).values(input).returning().get()!;
}

function update(id: string, fields: { policyLimits?: string | null; autoApprove?: boolean }): void {
  const setValues: Partial<typeof agentPermissions.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (fields.policyLimits !== undefined) setValues.policyLimits = fields.policyLimits;
  if (fields.autoApprove !== undefined) setValues.autoApprove = fields.autoApprove;
  db.update(agentPermissions).set(setValues).where(eq(agentPermissions.id, id)).run();
}

function deleteById(id: string): void {
  db.delete(agentPermissions).where(eq(agentPermissions.id, id)).run();
}

export const permissionsRepository = {
  findByAgentId,
  findByAgentAndToolKey,
  create,
  update,
  deleteById,
};
