import { agentsRepository } from '@api/modules/agents/agents.repository';
import { auditLogService } from '@api/modules/audit-log/audit-log.service';
import { getToolByKey } from '@api/modules/tools/catalog';
import type { AgentPermissionRow } from '@api/db/schema';
import type { Tool } from '@api/modules/tools/types';
import { badRequest, conflict, forbidden, notFound } from '@core/errors';

import { permissionsRepository } from './permissions.repository';
import type {
  AgentPermission,
  GrantPermissionRequest,
  GrantPermissionResponse,
  ListPermissionsResponse,
  RevokePermissionResponse,
  UpdatePermissionRequest,
  UpdatePermissionResponse,
} from './types';

function requireTool(toolKey: string): Tool {
  const tool = getToolByKey(toolKey);
  if (!tool) throw badRequest('permissions.unknown_tool', `Unknown tool key: ${toolKey}`);
  return tool;
}

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
    tool_key: row.toolKey,
    policy_limits: parsePolicyLimits(row.policyLimits),
    auto_approve: row.autoApprove,
    created_at: row.createdAt.getTime(),
    updated_at: row.updatedAt.getTime(),
  };
}

function validatePolicyFields(
  toolKey: string,
  policyLimits: Record<string, unknown> | null | undefined
): void {
  if (!policyLimits) return;
  const tool = requireTool(toolKey);
  const fieldByKey = new Map(tool.policy_fields.map((f) => [f.key, f]));
  for (const [key, value] of Object.entries(policyLimits)) {
    const field = fieldByKey.get(key);
    if (!field) {
      throw badRequest(
        'permissions.unknown_policy_field',
        `Unknown policy field '${key}' for tool '${toolKey}'`
      );
    }
    if (
      field.type === 'number' &&
      (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
    ) {
      throw badRequest(
        'permissions.invalid_policy_value',
        `Policy field '${key}' for tool '${toolKey}' must be a positive number`
      );
    }
    if (field.type === 'string' && typeof value !== 'string') {
      throw badRequest(
        'permissions.invalid_policy_value',
        `Policy field '${key}' for tool '${toolKey}' must be a string`
      );
    }
  }
}

function resolveAutoApprove(riskLevel: string, requested: boolean | undefined): boolean {
  if (riskLevel === 'critical') return false;
  if (riskLevel === 'low' || riskLevel === 'medium') return false;
  return requested ?? false;
}

async function ensureOwnership(userId: string, agentId: string) {
  const agent = await agentsRepository.findById(agentId);
  if (!agent) throw notFound('permissions.agent_not_found', 'Agent not found');
  if (agent.ownerId !== userId) {
    throw forbidden('permissions.not_owner', 'Only the agent owner can manage permissions');
  }
  return agent;
}

async function list(userId: string, agentId: string): Promise<ListPermissionsResponse> {
  await ensureOwnership(userId, agentId);
  const rows = permissionsRepository.findByAgentId(agentId);
  return { permissions: rows.map(toPermissionDto) };
}

async function grant(
  userId: string,
  agentId: string,
  input: GrantPermissionRequest
): Promise<GrantPermissionResponse> {
  const agent = await ensureOwnership(userId, agentId);

  const tool = requireTool(input.tool_key);

  if (tool.risk_level === 'critical' && input.auto_approve === true) {
    throw badRequest('permissions.critical_auto_approve', 'Critical tools cannot be auto-approved');
  }

  validatePolicyFields(input.tool_key, input.policy_limits);

  const existing = permissionsRepository.findByAgentAndToolKey(agentId, input.tool_key);
  if (existing) {
    throw conflict(
      'permissions.already_granted',
      `Permission for tool '${input.tool_key}' is already granted`
    );
  }

  const autoApprove = resolveAutoApprove(tool.risk_level, input.auto_approve);
  const policyLimitsJson = serializePolicyLimits(input.policy_limits ?? null);

  const row = permissionsRepository.create({
    agentId,
    toolKey: input.tool_key,
    policyLimits: policyLimitsJson,
    autoApprove,
  });

  auditLogService.safeAppend({
    agent_id: agent.id,
    owner_id: agent.ownerId,
    company_id: agent.companyId,
    action: 'permission.granted',
    decision: 'allow',
    reasons: ['permission granted'],
    context: {
      tool_key: input.tool_key,
      policy_limits: input.policy_limits ?? null,
      auto_approve: autoApprove,
    },
  });

  return { permission: toPermissionDto(row) };
}

async function update(
  userId: string,
  agentId: string,
  toolKey: string,
  input: UpdatePermissionRequest
): Promise<UpdatePermissionResponse> {
  const agent = await ensureOwnership(userId, agentId);

  if (input.policy_limits === undefined && input.auto_approve === undefined) {
    throw badRequest('permissions.no_changes', 'At least one field must be provided');
  }

  const existing = permissionsRepository.findByAgentAndToolKey(agentId, toolKey);
  if (!existing) {
    throw notFound('permissions.not_found', `No permission found for tool '${toolKey}'`);
  }

  const tool = requireTool(toolKey);

  if (tool.risk_level === 'critical' && input.auto_approve === true) {
    throw badRequest('permissions.critical_auto_approve', 'Critical tools cannot be auto-approved');
  }

  if (input.policy_limits !== undefined) {
    validatePolicyFields(toolKey, input.policy_limits);
  }

  const newPolicyLimits =
    input.policy_limits !== undefined ? serializePolicyLimits(input.policy_limits) : undefined;

  const newAutoApprove =
    input.auto_approve !== undefined
      ? resolveAutoApprove(tool.risk_level, input.auto_approve)
      : undefined;

  permissionsRepository.update(existing.id, {
    policyLimits: newPolicyLimits,
    autoApprove: newAutoApprove,
  });

  const autoApproveChanged =
    newAutoApprove !== undefined && newAutoApprove !== existing.autoApprove;
  const policyChanged = newPolicyLimits !== undefined && newPolicyLimits !== existing.policyLimits;

  const eventType =
    policyChanged && autoApproveChanged
      ? 'permission.updated'
      : autoApproveChanged
        ? 'permission.auto_approve_changed'
        : 'permission.policy_updated';

  auditLogService.safeAppend({
    agent_id: agent.id,
    owner_id: agent.ownerId,
    company_id: agent.companyId,
    action: eventType,
    decision: 'allow',
    reasons: [eventType.replace('.', ' ')],
    context: {
      tool_key: toolKey,
      old_policy_limits: parsePolicyLimits(existing.policyLimits),
      new_policy_limits: input.policy_limits ?? parsePolicyLimits(existing.policyLimits),
      auto_approve_from: existing.autoApprove,
      auto_approve_to: newAutoApprove ?? existing.autoApprove,
    },
  });

  const updated = permissionsRepository.findByAgentAndToolKey(agentId, toolKey);
  return { permission: toPermissionDto(updated!) };
}

async function revoke(
  userId: string,
  agentId: string,
  toolKey: string
): Promise<RevokePermissionResponse> {
  const agent = await ensureOwnership(userId, agentId);

  const existing = permissionsRepository.findByAgentAndToolKey(agentId, toolKey);
  if (!existing) {
    throw notFound('permissions.not_found', `No permission found for tool '${toolKey}'`);
  }

  permissionsRepository.deleteById(existing.id);

  auditLogService.safeAppend({
    agent_id: agent.id,
    owner_id: agent.ownerId,
    company_id: agent.companyId,
    action: 'permission.revoked',
    decision: 'allow',
    reasons: ['permission revoked'],
    context: {
      tool_key: toolKey,
      previous_policy_limits: parsePolicyLimits(existing.policyLimits),
      previous_auto_approve: existing.autoApprove,
    },
  });

  return { revoked: true };
}

export const permissionsService = {
  list,
  grant,
  update,
  revoke,
};
