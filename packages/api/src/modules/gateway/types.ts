import { z } from 'zod';

export const GATEWAY_DECISIONS = ['allow', 'deny', 'approval_required'] as const;
export type GatewayDecision = (typeof GATEWAY_DECISIONS)[number];

export interface GatewayDecideRequest {
  agent_id: string;
  tool_key: string;
  context: Record<string, unknown>;
  nonce: string;
  timestamp: number;
}

export const GatewayDecideBodySchema = z.object({
  agent_id: z.string().min(1),
  tool_key: z.string().min(1).max(200),
  context: z.record(z.string(), z.unknown()),
  nonce: z.string().min(16).max(64),
  timestamp: z.number().int().positive(),
});

export interface GatewayDecideResponse {
  decision: GatewayDecision;
  reasons: string[];
  audit_id: string;
  pending_action_id?: string;
}

export const GatewayDecideResponseSchema = z.object({
  decision: z.enum(GATEWAY_DECISIONS),
  reasons: z.array(z.string()),
  audit_id: z.string(),
  pending_action_id: z.string().optional(),
});

export interface PolicyLimits {
  max_amount?: number;
  allowed_hours?: { start: number; end: number };
}

export const PolicyLimitsSchema = z.object({
  max_amount: z.number().optional(),
  allowed_hours: z
    .object({
      start: z.number().int().min(0).max(23),
      end: z.number().int().min(0).max(23),
    })
    .optional(),
});

export interface PolicyEvaluation {
  passed: boolean;
  violations: string[];
}
