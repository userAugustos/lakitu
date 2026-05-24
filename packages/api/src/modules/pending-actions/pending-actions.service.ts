import { buildEmail } from '@api/emails';
import { agentsRepository } from '@api/modules/agents/agents.repository';
import { auditLogService } from '@api/modules/audit-log/audit-log.service';
import { authRepository } from '@api/modules/auth/auth.repository';
import type { PendingActionRow, PendingActionStatus } from '@api/db/schema';
import { config } from '@core/env';
import { badRequest, forbidden, notFound, unauthorized } from '@core/errors';
import { LOG_DOMAINS, logger } from '@core/logger';
import { sendEmail } from '@core/mailer';

import { pendingActionsRepository } from './pending-actions.repository';
import type {
  CreatePendingActionInput,
  PendingAction,
  SimulatePendingActionRequest,
} from './types';

const paLogger = logger.child({ domain: LOG_DOMAINS.PENDING_ACTIONS });

function parseContext(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toPendingActionDto(row: PendingActionRow, agentName: string): PendingAction {
  return {
    id: row.id,
    agent_id: row.agentId,
    agent_name: agentName,
    owner_id: row.ownerId,
    company_id: row.companyId,
    tool_key: row.toolKey,
    context: parseContext(row.context),
    policy_hit: row.policyHit,
    audit_id: row.auditId,
    status: row.status,
    resolution_note: row.resolutionNote,
    resolved_by: row.resolvedBy,
    resolved_at: row.resolvedAt?.getTime() ?? null,
    expires_at: row.expiresAt.getTime(),
    created_at: row.createdAt.getTime(),
    updated_at: row.updatedAt.getTime(),
  };
}

async function create(input: CreatePendingActionInput): Promise<PendingAction> {
  const agent = await agentsRepository.findById(input.agent_id);
  if (!agent) throw notFound('pending_actions.agent_not_found', 'Agent not found');

  const row = await pendingActionsRepository.create({
    agentId: agent.id,
    ownerId: agent.ownerId,
    companyId: agent.companyId,
    toolKey: input.tool_key,
    context: JSON.stringify(input.context),
    policyHit: input.policy_hit,
    auditId: input.audit_id ?? null,
    status: 'pending',
    expiresAt: new Date(input.expires_at),
  });

  await sendNotificationEmail(agent.ownerId, agent.name, input.tool_key, input.policy_hit, row.id);

  return toPendingActionDto(row, agent.name);
}

async function sendNotificationEmail(
  ownerId: string,
  agentName: string,
  action: string,
  policyHit: string,
  pendingActionId: string
): Promise<void> {
  const owner = await authRepository.findUserById(ownerId);
  if (!owner) {
    paLogger.warn('Owner not found for notification', { ownerId, pendingActionId });
    return;
  }

  const approvalUrl = `${config.web.publicUrl}/pending-actions/${pendingActionId}`;
  const { subject, html } = await buildEmail('PendingActionNotification', {
    agentName,
    action,
    policyHit,
    approvalUrl,
  });
  await sendEmail({ from: config.auth.emailFrom, to: owner.email, subject, html });

  paLogger.info('Pending action notification sent', { ownerId, pendingActionId });
}

async function listForOwner(
  userId: string,
  statusFilter?: PendingActionStatus
): Promise<{ pending_actions: PendingAction[] }> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  if (!user.companyId)
    throw badRequest('pending_actions.no_company', 'User must belong to a company');

  const rows = await pendingActionsRepository.findByOwnerId(userId, statusFilter);
  const agentIds = [...new Set(rows.map((r) => r.agentId))];
  const agentRows = await agentsRepository.findByIds(agentIds);
  const agentNameMap = new Map(agentRows.map((a) => [a.id, a.name]));

  return {
    pending_actions: rows.map((row) =>
      toPendingActionDto(row, agentNameMap.get(row.agentId) ?? 'Unknown Agent')
    ),
  };
}

async function getById(userId: string, pendingActionId: string): Promise<PendingAction> {
  const row = await pendingActionsRepository.findById(pendingActionId);
  if (!row) throw notFound('pending_actions.not_found', 'Pending action not found');
  if (row.ownerId !== userId) {
    throw forbidden('pending_actions.not_owner', 'You do not own this pending action');
  }

  const agent = await agentsRepository.findById(row.agentId);
  return toPendingActionDto(row, agent?.name ?? 'Unknown Agent');
}

function guardAndExpireIfStale(row: PendingActionRow): void {
  if (row.status !== 'pending') {
    throw badRequest('pending_actions.already_resolved', `Pending action is already ${row.status}`);
  }
  if (row.expiresAt.getTime() < Date.now()) {
    pendingActionsRepository.updateStatus(row.id, {
      status: 'expired',
      resolvedAt: new Date(),
    });
    throw badRequest('pending_actions.expired', 'Pending action has expired');
  }
}

async function approve(
  userId: string,
  pendingActionId: string,
  note?: string
): Promise<PendingAction> {
  const row = await pendingActionsRepository.findById(pendingActionId);
  if (!row) throw notFound('pending_actions.not_found', 'Pending action not found');
  if (row.ownerId !== userId) {
    throw forbidden('pending_actions.not_owner', 'You do not own this pending action');
  }

  guardAndExpireIfStale(row);

  pendingActionsRepository.updateStatus(row.id, {
    status: 'approved',
    resolutionNote: note ?? null,
    resolvedBy: userId,
    resolvedAt: new Date(),
  });

  const updated = await pendingActionsRepository.findById(pendingActionId);
  const agent = await agentsRepository.findById(row.agentId);

  auditLogService.append({
    audit_id: row.auditId ?? undefined,
    agent_id: row.agentId,
    owner_id: row.ownerId,
    company_id: row.companyId,
    action: 'pending_action.approved',
    decision: 'approved',
    reasons: ['owner approved'],
    context: {
      pending_action_id: row.id,
      tool_key: row.toolKey,
      resolution_note: note ?? null,
    },
  });

  return toPendingActionDto(updated!, agent?.name ?? 'Unknown Agent');
}

async function deny(
  userId: string,
  pendingActionId: string,
  note?: string
): Promise<PendingAction> {
  const row = await pendingActionsRepository.findById(pendingActionId);
  if (!row) throw notFound('pending_actions.not_found', 'Pending action not found');
  if (row.ownerId !== userId) {
    throw forbidden('pending_actions.not_owner', 'You do not own this pending action');
  }

  guardAndExpireIfStale(row);

  pendingActionsRepository.updateStatus(row.id, {
    status: 'denied',
    resolutionNote: note ?? null,
    resolvedBy: userId,
    resolvedAt: new Date(),
  });

  const updated = await pendingActionsRepository.findById(pendingActionId);
  const agent = await agentsRepository.findById(row.agentId);

  auditLogService.append({
    audit_id: row.auditId ?? undefined,
    agent_id: row.agentId,
    owner_id: row.ownerId,
    company_id: row.companyId,
    action: 'pending_action.denied',
    decision: 'denied',
    reasons: ['owner denied'],
    context: {
      pending_action_id: row.id,
      tool_key: row.toolKey,
      resolution_note: note ?? null,
    },
  });

  return toPendingActionDto(updated!, agent?.name ?? 'Unknown Agent');
}

function expireStale(): number {
  const expired = pendingActionsRepository.findExpired(new Date());
  for (const row of expired) {
    pendingActionsRepository.updateStatus(row.id, {
      status: 'expired',
      resolvedAt: new Date(),
    });
  }
  if (expired.length > 0) {
    paLogger.info('Auto-expired pending actions', { count: expired.length });
  }
  return expired.length;
}

async function simulate(
  userId: string,
  body: SimulatePendingActionRequest
): Promise<PendingAction> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');

  const agent = await agentsRepository.findById(body.agent_id);
  if (!agent) throw notFound('pending_actions.agent_not_found', 'Agent not found');

  if (agent.companyId !== user.companyId) {
    throw forbidden('pending_actions.company_mismatch', 'Agent does not belong to your company');
  }

  return create({
    agent_id: body.agent_id,
    tool_key: body.tool_key,
    context: body.context ?? {},
    policy_hit: 'manual_simulation',
    expires_at: Date.now() + 24 * 60 * 60 * 1000,
  });
}

async function countPendingForOwner(userId: string): Promise<{ count: number }> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');

  return { count: pendingActionsRepository.countPendingByOwnerId(userId) };
}

export const pendingActionsService = {
  create,
  simulate,
  listForOwner,
  countPendingForOwner,
  getById,
  approve,
  deny,
  expireStale,
};
