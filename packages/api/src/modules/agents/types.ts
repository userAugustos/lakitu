import { z } from 'zod';

export const CLAWKEY_STATUS_VALUES = ['pending', 'completed', 'expired', 'failed'] as const;
export type ClawKeyStatusValue = (typeof CLAWKEY_STATUS_VALUES)[number];

export const AGENT_STATUS_VALUES = ['active', 'revoked'] as const;
export type AgentStatusValue = (typeof AGENT_STATUS_VALUES)[number];

export interface AgentPermissionSummary {
  action: string;
  policy_limits: Record<string, unknown> | null;
}

export interface Agent {
  id: string;
  name: string;
  owner_id: string;
  company_id: string;
  ed25519_public_key: string;
  clawkey_session_id: string | null;
  clawkey_status: ClawKeyStatusValue;
  clawkey_registered_at: number | null;
  status: AgentStatusValue;
  permissions: AgentPermissionSummary[];
  created_at: number;
  updated_at: number;
}

export interface CreateAgentRequest {
  name: string;
}

export interface CreateAgentResponse {
  agent: Agent;
  registration_url: string;
}

export interface ListAgentsResponse {
  agents: Agent[];
}

export interface AgentClawKeyStatusResponse {
  clawkey_status: ClawKeyStatusValue;
  clawkey_registered_at: number | null;
}

export interface RotateKeyResponse {
  agent: Agent;
  registration_url: string;
}

export const AgentPermissionSummarySchema = z.object({
  action: z.string(),
  policy_limits: z.record(z.unknown()).nullable(),
});

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.string(),
  company_id: z.string(),
  ed25519_public_key: z.string(),
  clawkey_session_id: z.string().nullable(),
  clawkey_status: z.enum(['pending', 'completed', 'expired', 'failed']),
  clawkey_registered_at: z.number().nullable(),
  status: z.enum(['active', 'revoked']),
  permissions: z.array(AgentPermissionSummarySchema),
  created_at: z.number(),
  updated_at: z.number(),
});

export const CreateAgentBodySchema = z.object({
  name: z.string().min(1).max(100),
});

export const AgentIdParamSchema = z.object({
  id: z.string(),
});

export const CreateAgentResponseSchema = z.object({
  agent: AgentSchema,
  registration_url: z.string(),
});

export const ListAgentsResponseSchema = z.object({
  agents: z.array(AgentSchema),
});

export const AgentClawKeyStatusResponseSchema = z.object({
  clawkey_status: z.enum(['pending', 'completed', 'expired', 'failed']),
  clawkey_registered_at: z.number().nullable(),
});

export const RotateKeyResponseSchema = z.object({
  agent: AgentSchema,
  registration_url: z.string(),
});
