import { z } from 'zod';

import type { AuditDecision } from '@api/db/schema';

export { AUDIT_DECISIONS } from '@api/db/schema';
export type { AuditDecision } from '@api/db/schema';

export interface AuditLogEntry {
  id: string;
  audit_id: string;
  agent_id: string;
  owner_id: string;
  company_id: string;
  action: string;
  decision: AuditDecision;
  reasons: string[];
  policy_hit: string | null;
  request_id: string | null;
  context: Record<string, unknown> | null;
  created_at: number;
}

export interface AppendAuditLogInput {
  audit_id?: string;
  agent_id: string;
  owner_id: string;
  company_id: string;
  action: string;
  decision: AuditDecision;
  reasons: string[];
  policy_hit?: string | null;
  request_id?: string | null;
  context?: Record<string, unknown> | null;
}

export interface SearchAuditLogParams {
  agent_id?: string;
  owner_id?: string;
  company_id?: string;
  action?: string;
  decision?: AuditDecision;
  from?: number;
  to?: number;
}

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  audit_id: z.string(),
  agent_id: z.string(),
  owner_id: z.string(),
  company_id: z.string(),
  action: z.string(),
  decision: z.enum(['allow', 'deny', 'approval_required', 'approved', 'denied', 'expired']),
  reasons: z.array(z.string()),
  policy_hit: z.string().nullable(),
  request_id: z.string().nullable(),
  context: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.number(),
});

export const AppendAuditLogInputSchema = z.object({
  audit_id: z.string().optional(),
  agent_id: z.string(),
  owner_id: z.string(),
  company_id: z.string(),
  action: z.string(),
  decision: z.enum(['allow', 'deny', 'approval_required', 'approved', 'denied', 'expired']),
  reasons: z.array(z.string()),
  policy_hit: z.string().nullable().optional(),
  request_id: z.string().nullable().optional(),
  context: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const SearchAuditLogParamsSchema = z.object({
  agent_id: z.string().optional(),
  owner_id: z.string().optional(),
  company_id: z.string().optional(),
  action: z.string().optional(),
  decision: z
    .enum(['allow', 'deny', 'approval_required', 'approved', 'denied', 'expired'])
    .optional(),
  from: z.number().optional(),
  to: z.number().optional(),
});

export interface AuditLogListEntry extends AuditLogEntry {
  agent_name: string;
}

export interface AuditLogListResponse {
  entries: AuditLogListEntry[];
}

export const ListAuditLogsQuerySchema = z.object({
  decision: z
    .enum(['allow', 'deny', 'approval_required', 'approved', 'denied', 'expired'])
    .optional(),
});

export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>;

export const AuditLogListEntrySchema = AuditLogEntrySchema.extend({
  agent_name: z.string(),
});

export const AuditLogListResponseSchema = z.object({
  entries: z.array(AuditLogListEntrySchema),
});
