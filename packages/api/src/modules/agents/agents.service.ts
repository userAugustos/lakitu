import { auditLogService } from '@api/modules/audit-log/audit-log.service';
import { authRepository } from '@api/modules/auth/auth.repository';
import { permissionsRepository } from '@api/modules/permissions/permissions.repository';
import type { AgentRow } from '@api/db/schema';
import { badRequest, forbidden, notFound, unauthorized } from '@core/errors';

import { agentsRepository } from './agents.repository';
import { clawkeyClient } from './clawkey.client';
import { generateEd25519KeyPair, signMessage } from './crypto';
import type {
  Agent,
  AgentClawKeyStatusResponse,
  AgentPermissionSummary,
  CreateAgentRequest,
  CreateAgentResponse,
  ListAgentsResponse,
  RotateKeyResponse,
} from './types';

function parsePolicy(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function getPermissionsForAgent(agentId: string): Promise<AgentPermissionSummary[]> {
  const rows = await permissionsRepository.findByAgentId(agentId);
  return rows.map((r) => ({ action: r.action, policy_limits: parsePolicy(r.policyLimits) }));
}

function toAgentDto(row: AgentRow, permissions: AgentPermissionSummary[]): Agent {
  return {
    id: row.id,
    name: row.name,
    owner_id: row.ownerId,
    company_id: row.companyId,
    ed25519_public_key: row.ed25519PublicKey,
    clawkey_session_id: row.clawkeySessionId,
    clawkey_status: row.clawkeyStatus,
    clawkey_registered_at: row.clawkeyRegisteredAt?.getTime() ?? null,
    status: row.status,
    permissions,
    created_at: row.createdAt.getTime(),
    updated_at: row.updatedAt.getTime(),
  };
}

async function appendAgentAudit(
  agent: AgentRow,
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

async function initiateClawKeyRegistration(
  deviceId: string,
  publicKeyBase64: string,
  privateKeyBase64: string
) {
  const timestamp = Date.now();
  const message = `clawkey-register-${timestamp}`;
  const signature = signMessage(privateKeyBase64, message);

  return clawkeyClient.registerInit({
    deviceId,
    publicKey: publicKeyBase64,
    message,
    signature,
    timestamp,
  });
}

async function create(userId: string, input: CreateAgentRequest): Promise<CreateAgentResponse> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  if (!user.companyId) throw badRequest('agents.no_company', 'User must belong to a company');

  const name = input.name.trim();
  if (!name) throw badRequest('agents.name_empty', 'Agent name cannot be blank');

  const keyPair = generateEd25519KeyPair();

  const agentId = crypto.randomUUID();

  const clawkeyResult = await initiateClawKeyRegistration(
    agentId,
    keyPair.publicKeyBase64,
    keyPair.privateKeyBase64
  );

  const row = await agentsRepository.create({
    id: agentId,
    name,
    ownerId: userId,
    companyId: user.companyId,
    ed25519PublicKey: keyPair.publicKeyBase64,
    ed25519PrivateKey: keyPair.privateKeyBase64,
    clawkeySessionId: clawkeyResult.sessionId,
    clawkeyStatus: 'pending',
    status: 'active',
  });

  await appendAgentAudit(row, 'agent.create', ['agent created'], {
    name: row.name,
    clawkey_status: row.clawkeyStatus,
  });

  return {
    agent: toAgentDto(row, []),
    ed25519_private_key: keyPair.privateKeyBase64,
    registration_url: clawkeyResult.registrationUrl,
  };
}

async function list(userId: string): Promise<ListAgentsResponse> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  if (!user.companyId) throw badRequest('agents.no_company', 'User must belong to a company');

  const rows = await agentsRepository.findByCompanyId(user.companyId);
  const agents = await Promise.all(
    rows.map(async (row) => toAgentDto(row, await getPermissionsForAgent(row.id)))
  );
  return { agents };
}

async function pollClawKeyStatus(
  userId: string,
  agentId: string
): Promise<AgentClawKeyStatusResponse> {
  const agent = await agentsRepository.findById(agentId);
  if (!agent) throw notFound('agents.not_found', 'Agent not found');

  const user = await authRepository.findUserById(userId);
  if (!user || user.companyId !== agent.companyId) {
    throw forbidden('agents.not_member', 'You do not have access to this agent');
  }

  if (agent.clawkeyStatus === 'completed' || agent.clawkeyStatus === 'failed') {
    return {
      clawkey_status: agent.clawkeyStatus,
      clawkey_registered_at: agent.clawkeyRegisteredAt?.getTime() ?? null,
    };
  }

  if (!agent.clawkeySessionId) {
    return {
      clawkey_status: agent.clawkeyStatus,
      clawkey_registered_at: null,
    };
  }

  const remote = await clawkeyClient.getSessionStatus(agent.clawkeySessionId);
  const registeredAt = remote.registration?.registeredAt
    ? new Date(remote.registration.registeredAt)
    : null;

  agentsRepository.updateClawKeyStatus(agentId, remote.status, registeredAt);
  const updated = await agentsRepository.findById(agentId);
  if (updated) {
    await appendAgentAudit(updated, 'agent.clawkey_status', [`clawkey status ${remote.status}`], {
      clawkey_status: remote.status,
      clawkey_registered_at: registeredAt?.getTime() ?? null,
    });
  }

  return {
    clawkey_status: remote.status,
    clawkey_registered_at: registeredAt?.getTime() ?? null,
  };
}

async function revoke(userId: string, agentId: string): Promise<Agent> {
  const agent = await agentsRepository.findById(agentId);
  if (!agent) throw notFound('agents.not_found', 'Agent not found');

  const user = await authRepository.findUserById(userId);
  if (!user || user.companyId !== agent.companyId) {
    throw forbidden('agents.not_member', 'You do not have access to this agent');
  }

  if (agent.status === 'revoked') {
    throw badRequest('agents.already_revoked', 'Agent is already revoked');
  }

  agentsRepository.updateStatus(agentId, 'revoked');
  const updated = await agentsRepository.findById(agentId);
  await appendAgentAudit(updated!, 'agent.revoke', ['agent revoked']);
  return toAgentDto(updated!, await getPermissionsForAgent(agentId));
}

async function restore(userId: string, agentId: string): Promise<Agent> {
  const agent = await agentsRepository.findById(agentId);
  if (!agent) throw notFound('agents.not_found', 'Agent not found');

  const user = await authRepository.findUserById(userId);
  if (!user || user.companyId !== agent.companyId) {
    throw forbidden('agents.not_member', 'You do not have access to this agent');
  }

  if (agent.status !== 'revoked') {
    throw badRequest('agents.not_revoked', 'Agent is not revoked');
  }

  agentsRepository.updateStatus(agentId, 'active');
  const updated = await agentsRepository.findById(agentId);
  await appendAgentAudit(updated!, 'agent.restore', ['agent restored']);
  return toAgentDto(updated!, await getPermissionsForAgent(agentId));
}

async function rotateKey(userId: string, agentId: string): Promise<RotateKeyResponse> {
  const agent = await agentsRepository.findById(agentId);
  if (!agent) throw notFound('agents.not_found', 'Agent not found');

  const user = await authRepository.findUserById(userId);
  if (!user || user.companyId !== agent.companyId) {
    throw forbidden('agents.not_member', 'You do not have access to this agent');
  }

  if (agent.status === 'revoked') {
    throw badRequest('agents.revoked', 'Cannot rotate keys for a revoked agent');
  }

  const keyPair = generateEd25519KeyPair();

  const clawkeyResult = await initiateClawKeyRegistration(
    agentId,
    keyPair.publicKeyBase64,
    keyPair.privateKeyBase64
  );

  agentsRepository.updateKeysAndSession(agentId, {
    ed25519PublicKey: keyPair.publicKeyBase64,
    ed25519PrivateKey: keyPair.privateKeyBase64,
    clawkeySessionId: clawkeyResult.sessionId,
    clawkeyStatus: 'pending',
  });

  const updated = await agentsRepository.findById(agentId);
  await appendAgentAudit(updated!, 'agent.rotate_key', ['agent key rotated'], {
    clawkey_status: updated!.clawkeyStatus,
  });
  return {
    agent: toAgentDto(updated!, await getPermissionsForAgent(agentId)),
    ed25519_private_key: keyPair.privateKeyBase64,
    registration_url: clawkeyResult.registrationUrl,
  };
}

async function bypassClawKey(userId: string, agentId: string): Promise<Agent> {
  const agent = await agentsRepository.findById(agentId);
  if (!agent) throw notFound('agents.not_found', 'Agent not found');

  const user = await authRepository.findUserById(userId);
  if (!user || user.companyId !== agent.companyId) {
    throw forbidden('agents.not_member', 'You do not have access to this agent');
  }

  agentsRepository.updateClawKeyStatus(agentId, 'completed', new Date());
  const updated = await agentsRepository.findById(agentId);
  await appendAgentAudit(updated!, 'agent.clawkey_bypass', ['clawkey bypass completed']);
  return toAgentDto(updated!, await getPermissionsForAgent(agentId));
}

export const agentsService = {
  create,
  list,
  pollClawKeyStatus,
  revoke,
  restore,
  rotateKey,
  bypassClawKey,
};
