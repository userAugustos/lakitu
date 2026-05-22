import { agentsRepository } from '@api/modules/agents/agents.repository';
import { auditLogService } from '@api/modules/audit-log/audit-log.service';
import type { AgentPermissionRow, PermissionAuditLogRow } from '@api/db/schema';
import { badRequest, forbidden, notFound } from '@core/errors';

import { permissionsRepository } from './permissions.repository';
import type {
  AgentPermission,
  GrantPermissionRequest,
  GrantPermissionResponse,
  ListPermissionAuditResponse,
  ListPermissionsResponse,
  PermissionAuditEntry,
  RevokePermissionResponse,
  UpdatePolicyRequest,
  UpdatePolicyResponse,
} from './types';

function parsePolicyLimits(raw: string | null): Record<string, unknown> | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function serializePolicyLimits(value: Record<string, unknown> | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

function toPermissionDto(row: AgentPermissionRow): AgentPermission {
  return {
    id: row.id,
    agent_id: row.agentId,
    action: row.action,
    policy_limits: parsePolicyLimits(row.policyLimits),
    created_at: row.createdAt.getTime(),
    updated_at: row.updatedAt.getTime(),
  };
}

function toAuditDto(row: PermissionAuditLogRow): PermissionAuditEntry {
  return {
    id: row.id,
    agent_id: row.agentId,
    user_id: row.userId,
    action: row.action,
    audit_action: row.auditAction,
    old_policy_limits: parsePolicyLimits(row.oldPolicyLimits),
    new_policy_limits: parsePolicyLimits(row.newPolicyLimits),
    created_at: row.createdAt.getTime(),
  };
}

async function ensureOwnership(userId: string, agentId: string) {
  const agent = await agentsRepository.findById(agentId);
  if (!agent) throw notFound('permissions.agent_not_found', 'Agent not found');
  if (agent.ownerId !== userId) {
    throw forbidden('permissions.not_owner', 'Only the agent owner can manage permissions');
  }
  return agent;
}

async function appendPermissionAuditLog(
  agent: Awaited<ReturnType<typeof ensureOwnership>>,
  action: string,
  reasons: string[],
  context?: Record<string, unknown>
): Promise<void> {
  await auditLogService.append({
    agent_id: agent.id,
    owner_id: agent.ownerId,
    company_id: agent.companyId,
    action,
    decision: 'allow',
    reasons,
    context,
  });
}

async function list(userId: string, agentId: string): Promise<ListPermissionsResponse> {
  await ensureOwnership(userId, agentId);
  const rows = await permissionsRepository.findByAgentId(agentId);
  return { permissions: rows.map(toPermissionDto) };
}

async function grant(
  userId: string,
  agentId: string,
  input: GrantPermissionRequest
): Promise<GrantPermissionResponse> {
  const agent = await ensureOwnership(userId, agentId);

  const action = input.action.trim();
  if (!action) throw badRequest('permissions.action_empty', 'Action cannot be blank');

  const existing = await permissionsRepository.findByAgentAndAction(agentId, action);
  if (existing) {
    throw badRequest(
      'permissions.already_granted',
      `Permission for action '${action}' is already granted`
    );
  }

  const policyLimitsJson = serializePolicyLimits(input.policy_limits ?? null);

  const row = await permissionsRepository.create({
    agentId,
    action,
    policyLimits: policyLimitsJson,
  });

  await permissionsRepository.createAuditEntry({
    agentId,
    userId,
    action,
    auditAction: 'grant',
    oldPolicyLimits: null,
    newPolicyLimits: policyLimitsJson,
  });

  await appendPermissionAuditLog(agent, 'permission.grant', ['permission granted'], {
    permission_action: action,
    policy_limits: input.policy_limits ?? null,
  });

  return { permission: toPermissionDto(row) };
}

async function updatePolicy(
  userId: string,
  agentId: string,
  action: string,
  input: UpdatePolicyRequest
): Promise<UpdatePolicyResponse> {
  const agent = await ensureOwnership(userId, agentId);

  const existing = await permissionsRepository.findByAgentAndAction(agentId, action);
  if (!existing) {
    throw notFound('permissions.not_found', `No permission found for action '${action}'`);
  }

  const oldPolicyLimitsJson = existing.policyLimits;
  const newPolicyLimitsJson = serializePolicyLimits(input.policy_limits);

  permissionsRepository.updatePolicyLimits(existing.id, newPolicyLimitsJson);

  await permissionsRepository.createAuditEntry({
    agentId,
    userId,
    action,
    auditAction: 'update_policy',
    oldPolicyLimits: oldPolicyLimitsJson,
    newPolicyLimits: newPolicyLimitsJson,
  });

  await appendPermissionAuditLog(agent, 'permission.update_policy', ['permission policy updated'], {
    permission_action: action,
    old_policy_limits: parsePolicyLimits(oldPolicyLimitsJson),
    new_policy_limits: input.policy_limits,
  });

  const updated = await permissionsRepository.findByAgentAndAction(agentId, action);
  return { permission: toPermissionDto(updated!) };
}

async function revoke(
  userId: string,
  agentId: string,
  action: string
): Promise<RevokePermissionResponse> {
  const agent = await ensureOwnership(userId, agentId);

  const existing = await permissionsRepository.findByAgentAndAction(agentId, action);
  if (!existing) {
    throw notFound('permissions.not_found', `No permission found for action '${action}'`);
  }

  permissionsRepository.deleteById(existing.id);

  await permissionsRepository.createAuditEntry({
    agentId,
    userId,
    action,
    auditAction: 'revoke',
    oldPolicyLimits: existing.policyLimits,
    newPolicyLimits: null,
  });

  await appendPermissionAuditLog(agent, 'permission.revoke', ['permission revoked'], {
    permission_action: action,
    old_policy_limits: parsePolicyLimits(existing.policyLimits),
  });

  return { revoked: true };
}

async function listAudit(userId: string, agentId: string): Promise<ListPermissionAuditResponse> {
  await ensureOwnership(userId, agentId);
  const rows = await permissionsRepository.findAuditByAgentId(agentId);
  return { entries: rows.map(toAuditDto) };
}

export const permissionsService = {
  list,
  grant,
  updatePolicy,
  revoke,
  listAudit,
};
