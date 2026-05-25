import { z } from 'zod';

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface ToolPolicyField {
  key: string;
  label: string;
  type: 'number' | 'string';
  placeholder?: string;
}

export interface Tool {
  key: string;
  provider: string;
  resource: string;
  verb: string;
  label: string;
  description: string;
  risk_level: RiskLevel;
  policy_fields: ToolPolicyField[];
}

export interface ListToolsResponse {
  tools: Tool[];
}

export interface GetToolResponse {
  tool: Tool;
}

export const ToolPolicyFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['number', 'string']),
  placeholder: z.string().optional(),
});

export const ToolSchema = z.object({
  key: z.string(),
  provider: z.string(),
  resource: z.string(),
  verb: z.string(),
  label: z.string(),
  description: z.string(),
  risk_level: z.enum(RISK_LEVELS),
  policy_fields: z.array(ToolPolicyFieldSchema),
});

export const ListToolsResponseSchema = z.object({
  tools: z.array(ToolSchema),
});

export const GetToolResponseSchema = z.object({
  tool: ToolSchema,
});

export const ToolKeyParamSchema = z.object({
  key: z.string(),
});
