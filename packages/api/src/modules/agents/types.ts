import { t } from 'elysia';

export const CLAWKEY_STATUS_VALUES = ['pending', 'completed', 'expired', 'failed'] as const;
export type ClawKeyStatusValue = (typeof CLAWKEY_STATUS_VALUES)[number];

export const AGENT_STATUS_VALUES = ['active', 'revoked'] as const;
export type AgentStatusValue = (typeof AGENT_STATUS_VALUES)[number];

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

export const AgentSchema = t.Object({
  id: t.String(),
  name: t.String(),
  owner_id: t.String(),
  company_id: t.String(),
  ed25519_public_key: t.String(),
  clawkey_session_id: t.Union([t.String(), t.Null()]),
  clawkey_status: t.Union([
    t.Literal('pending'),
    t.Literal('completed'),
    t.Literal('expired'),
    t.Literal('failed'),
  ]),
  clawkey_registered_at: t.Union([t.Number(), t.Null()]),
  status: t.Union([t.Literal('active'), t.Literal('revoked')]),
  created_at: t.Number(),
  updated_at: t.Number(),
});

export const CreateAgentBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});

export const AgentIdParamSchema = t.Object({
  id: t.String(),
});

export const CreateAgentResponseSchema = t.Object({
  agent: AgentSchema,
  registration_url: t.String(),
});

export const ListAgentsResponseSchema = t.Object({
  agents: t.Array(AgentSchema),
});

export const AgentClawKeyStatusResponseSchema = t.Object({
  clawkey_status: t.Union([
    t.Literal('pending'),
    t.Literal('completed'),
    t.Literal('expired'),
    t.Literal('failed'),
  ]),
  clawkey_registered_at: t.Union([t.Number(), t.Null()]),
});

export const RotateKeyResponseSchema = t.Object({
  agent: AgentSchema,
  registration_url: t.String(),
});
