import { agentsRepository } from '@api/modules/agents/agents.repository';
import { clawkeyClient } from '@api/modules/agents/clawkey.client';
import { auditLogService } from '@api/modules/audit-log/audit-log.service';
import { authRepository } from '@api/modules/auth/auth.repository';
import { pendingActionsService } from '@api/modules/pending-actions/pending-actions.service';
import { permissionsRepository } from '@api/modules/permissions/permissions.repository';
import { LOG_DOMAINS, logger } from '@core/logger';
import { getRequestContext } from '@core/request-context';

import { evaluatePolicy } from './lib/policy-evaluator';
import { verifyAgentSignature } from './lib/verify-signature';
import { PolicyLimitsSchema } from './types';
import type {
  GatewayDecideRequest,
  GatewayDecideResponse,
  GatewayDecision,
  PolicyLimits,
} from './types';

const gwLogger = logger.child({ domain: LOG_DOMAINS.GATEWAY });

const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const APPROVAL_EXPIRY_MS = 24 * 60 * 60 * 1000;

function denyResponse(reasons: string[], auditId: string): GatewayDecideResponse {
  return { decision: 'deny', reasons, audit_id: auditId };
}

async function writeAudit(
  auditId: string,
  agentId: string,
  ownerId: string,
  companyId: string,
  action: string,
  decision: GatewayDecision,
  reasons: string[],
  policyHit: string | null,
  context: Record<string, unknown>
) {
  await auditLogService.append({
    audit_id: auditId,
    agent_id: agentId,
    owner_id: ownerId,
    company_id: companyId,
    action,
    decision,
    reasons,
    policy_hit: policyHit,
    request_id: getRequestContext()?.request_id ?? null,
    context,
  });
}

async function decide(
  body: GatewayDecideRequest,
  signatureHeader: string | null
): Promise<GatewayDecideResponse> {
  const auditId = crypto.randomUUID();

  if (!signatureHeader) {
    gwLogger.warn('Gateway deny: missing signature', { agent_id: body.agent_id });
    return denyResponse(['missing signature'], auditId);
  }

  const agent = await agentsRepository.findById(body.agent_id);
  if (!agent) {
    gwLogger.warn('Gateway deny: agent not found', { agent_id: body.agent_id });
    return denyResponse(['agent not found'], auditId);
  }

  const signatureValid = verifyAgentSignature(body, signatureHeader, agent.ed25519PublicKey);
  if (!signatureValid) {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['invalid signature'],
      null,
      body.context
    );
    return denyResponse(['invalid signature'], auditId);
  }

  if (Math.abs(Date.now() - body.timestamp) > REPLAY_WINDOW_MS) {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['replay detected: timestamp outside 5-minute window'],
      null,
      body.context
    );
    return denyResponse(['replay detected: timestamp outside 5-minute window'], auditId);
  }

  if (agent.status !== 'active') {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['agent revoked'],
      null,
      body.context
    );
    return denyResponse(['agent revoked'], auditId);
  }

  if (!agent.clawkeySessionId) {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['no clawkey binding'],
      null,
      body.context
    );
    return denyResponse(['no clawkey binding'], auditId);
  }

  const clawkeyStatus = await clawkeyClient.getSessionStatus(agent.clawkeySessionId);
  if (clawkeyStatus.status !== 'completed') {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['clawkey binding not completed'],
      null,
      body.context
    );
    return denyResponse(['clawkey binding not completed'], auditId);
  }

  const owner = await authRepository.findUserById(agent.ownerId);
  if (!owner) {
    gwLogger.warn('Gateway deny: owner not found', { agent_id: agent.id, owner_id: agent.ownerId });
    return denyResponse(['owner not found'], auditId);
  }

  if (owner.veryAiStatus !== 'verified') {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['owner identity not verified'],
      null,
      body.context
    );
    return denyResponse(['owner identity not verified'], auditId);
  }

  if (owner.companyId !== agent.companyId) {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['owner no longer member of agent company'],
      null,
      body.context
    );
    return denyResponse(['owner no longer member of agent company'], auditId);
  }

  const permission = await permissionsRepository.findByAgentAndAction(agent.id, body.action);
  if (!permission) {
    await writeAudit(
      auditId,
      agent.id,
      agent.ownerId,
      agent.companyId,
      body.action,
      'deny',
      ['no permission for action'],
      null,
      body.context
    );
    return denyResponse(['no permission for action'], auditId);
  }

  let policyHit: string | null = null;

  if (permission.policyLimits) {
    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(permission.policyLimits);
    } catch {
      await writeAudit(
        auditId,
        agent.id,
        agent.ownerId,
        agent.companyId,
        body.action,
        'deny',
        ['malformed policy limits'],
        permission.policyLimits,
        body.context
      );
      return denyResponse(['malformed policy limits'], auditId);
    }
    const parsed = PolicyLimitsSchema.safeParse(rawParsed);
    if (!parsed.success) {
      await writeAudit(
        auditId,
        agent.id,
        agent.ownerId,
        agent.companyId,
        body.action,
        'deny',
        ['malformed policy limits'],
        permission.policyLimits,
        body.context
      );
      return denyResponse(['malformed policy limits'], auditId);
    }

    const policyLimits: PolicyLimits = parsed.data;
    const nowUtcHour = new Date().getUTCHours();
    const evaluation = evaluatePolicy(policyLimits, body.context, nowUtcHour);

    if (!evaluation.passed) {
      policyHit = permission.policyLimits;
      await writeAudit(
        auditId,
        agent.id,
        agent.ownerId,
        agent.companyId,
        body.action,
        'deny',
        evaluation.violations,
        policyHit,
        body.context
      );
      return denyResponse(evaluation.violations, auditId);
    }

    if (evaluation.requires_approval) {
      policyHit = permission.policyLimits;
      await writeAudit(
        auditId,
        agent.id,
        agent.ownerId,
        agent.companyId,
        body.action,
        'approval_required',
        ['requires approval per policy'],
        policyHit,
        body.context
      );

      const pendingAction = await pendingActionsService.create({
        agent_id: agent.id,
        action: body.action,
        context: body.context,
        policy_hit: permission.policyLimits,
        audit_id: auditId,
        expires_at: Date.now() + APPROVAL_EXPIRY_MS,
      });

      return {
        decision: 'approval_required',
        reasons: ['requires approval per policy'],
        audit_id: auditId,
        pending_action_id: pendingAction.id,
      };
    }
  }

  await writeAudit(
    auditId,
    agent.id,
    agent.ownerId,
    agent.companyId,
    body.action,
    'allow',
    [],
    policyHit,
    body.context
  );

  return { decision: 'allow', reasons: [], audit_id: auditId };
}

export const gatewayService = { decide };
