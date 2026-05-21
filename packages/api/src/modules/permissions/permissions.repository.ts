import { and, asc, eq } from 'drizzle-orm';

import { db } from '@api/db/client';
import { agentPermissions, permissionAuditLog } from '@api/db/schema';
import type {
  AgentPermissionRow,
  NewAgentPermissionRow,
  NewPermissionAuditLogRow,
  PermissionAuditLogRow,
} from '@api/db/schema';

async function findByAgentId(agentId: string): Promise<AgentPermissionRow[]> {
  return db.select().from(agentPermissions).where(eq(agentPermissions.agentId, agentId));
}

async function findByAgentAndAction(
  agentId: string,
  action: string
): Promise<AgentPermissionRow | undefined> {
  const rows = await db
    .select()
    .from(agentPermissions)
    .where(and(eq(agentPermissions.agentId, agentId), eq(agentPermissions.action, action)))
    .limit(1);
  return rows[0];
}

async function create(input: NewAgentPermissionRow): Promise<AgentPermissionRow> {
  const inserted = await db.insert(agentPermissions).values(input).returning();
  return inserted[0]!;
}

function updatePolicyLimits(id: string, policyLimits: string | null): void {
  db.update(agentPermissions)
    .set({ policyLimits, updatedAt: new Date() })
    .where(eq(agentPermissions.id, id))
    .run();
}

function deleteById(id: string): void {
  db.delete(agentPermissions).where(eq(agentPermissions.id, id)).run();
}

async function createAuditEntry(input: NewPermissionAuditLogRow): Promise<PermissionAuditLogRow> {
  const inserted = await db.insert(permissionAuditLog).values(input).returning();
  return inserted[0]!;
}

async function findAuditByAgentId(agentId: string): Promise<PermissionAuditLogRow[]> {
  return db
    .select()
    .from(permissionAuditLog)
    .where(eq(permissionAuditLog.agentId, agentId))
    .orderBy(asc(permissionAuditLog.createdAt));
}

export const permissionsRepository = {
  findByAgentId,
  findByAgentAndAction,
  create,
  updatePolicyLimits,
  deleteById,
  createAuditEntry,
  findAuditByAgentId,
};
