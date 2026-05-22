import { z } from 'zod';

import { PENDING_ACTION_STATUSES } from '@api/db/schema';

export type PendingActionStatusValue = (typeof PENDING_ACTION_STATUSES)[number];

export interface PendingAction {
  id: string;
  agent_id: string;
  agent_name: string;
  owner_id: string;
  company_id: string;
  action: string;
  context: Record<string, unknown>;
  policy_hit: string;
  audit_id: string | null;
  status: PendingActionStatusValue;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: number | null;
  expires_at: number;
  created_at: number;
  updated_at: number;
}

export interface CreatePendingActionInput {
  agent_id: string;
  action: string;
  context: Record<string, unknown>;
  policy_hit: string;
  audit_id?: string;
  expires_at: number;
}

export interface ListPendingActionsResponse {
  pending_actions: PendingAction[];
}

export interface ResolvePendingActionRequest {
  note?: string;
}

export const PendingActionSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  agent_name: z.string(),
  owner_id: z.string(),
  company_id: z.string(),
  action: z.string(),
  context: z.record(z.string(), z.unknown()),
  policy_hit: z.string(),
  audit_id: z.string().nullable(),
  status: z.enum(PENDING_ACTION_STATUSES),
  resolution_note: z.string().nullable(),
  resolved_by: z.string().nullable(),
  resolved_at: z.number().nullable(),
  expires_at: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
});

export const ListPendingActionsResponseSchema = z.object({
  pending_actions: z.array(PendingActionSchema),
});

export const PendingActionIdParamSchema = z.object({
  id: z.string(),
});

export const ListPendingActionsQuerySchema = z.object({
  status: z.enum(PENDING_ACTION_STATUSES).optional(),
});

export const ResolvePendingActionBodySchema = z.object({
  note: z.string().max(1000).optional(),
});

export interface PendingActionsCountResponse {
  count: number;
}

export const PendingActionsCountResponseSchema = z.object({
  count: z.number().int().min(0),
});

export interface SimulatePendingActionRequest {
  agent_id: string;
  action: string;
  context: Record<string, unknown>;
}

export const SimulatePendingActionBodySchema = z.object({
  agent_id: z.string().min(1),
  action: z.string().min(1).max(200),
  context: z.record(z.string(), z.unknown()).optional().default({}),
});
