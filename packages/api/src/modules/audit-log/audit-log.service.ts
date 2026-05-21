import type { AuditLogRow, NewAuditLogRow } from '@api/db/schema';
import { badRequest } from '@core/errors';

import { auditLogRepository } from './audit-log.repository';
import type { AppendAuditLogInput, AuditLogEntry, SearchAuditLogParams } from './types';

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    audit_id: row.auditId,
    agent_id: row.agentId,
    owner_id: row.ownerId,
    company_id: row.companyId,
    action: row.action,
    decision: row.decision,
    reasons: JSON.parse(row.reasons) as string[],
    policy_hit: row.policyHit,
    request_id: row.requestId,
    context: row.context ? (JSON.parse(row.context) as Record<string, unknown>) : null,
    created_at: row.createdAt.getTime(),
  };
}

function serializeInput(input: AppendAuditLogInput): NewAuditLogRow {
  return {
    auditId: input.audit_id ?? crypto.randomUUID(),
    agentId: input.agent_id,
    ownerId: input.owner_id,
    companyId: input.company_id,
    action: input.action,
    decision: input.decision,
    reasons: JSON.stringify(input.reasons),
    policyHit: input.policy_hit ?? null,
    requestId: input.request_id ?? null,
    context: input.context ? JSON.stringify(input.context) : null,
  };
}

async function append(input: AppendAuditLogInput): Promise<AuditLogEntry> {
  const row = await auditLogRepository.insert(serializeInput(input));
  return toAuditLogEntry(row);
}

async function appendMany(inputs: AppendAuditLogInput[]): Promise<void> {
  await auditLogRepository.insertMany(inputs.map(serializeInput));
}

async function findRelated(auditId: string): Promise<AuditLogEntry[]> {
  const rows = await auditLogRepository.findByAuditId(auditId);
  return rows.map(toAuditLogEntry);
}

async function search(params: SearchAuditLogParams): Promise<AuditLogEntry[]> {
  if (!params.agent_id && !params.owner_id && !params.company_id) {
    throw badRequest(
      'audit_log.missing_scope',
      'At least one of agent_id, owner_id, or company_id is required'
    );
  }

  const rows = await auditLogRepository.findByFilters({
    agentId: params.agent_id,
    ownerId: params.owner_id,
    companyId: params.company_id,
    action: params.action,
    decision: params.decision,
    from: params.from ? new Date(params.from) : undefined,
    to: params.to ? new Date(params.to) : undefined,
  });

  return rows.map(toAuditLogEntry);
}

export const auditLogService = {
  append,
  appendMany,
  findRelated,
  search,
};
