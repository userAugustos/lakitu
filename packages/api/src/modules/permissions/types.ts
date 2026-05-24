import { z } from 'zod';

export interface AgentPermission {
  id: string;
  agent_id: string;
  tool_key: string;
  policy_limits: Record<string, unknown> | null;
  auto_approve: boolean;
  created_at: number;
  updated_at: number;
}

export interface ListPermissionsResponse {
  permissions: AgentPermission[];
}

export interface GrantPermissionRequest {
  tool_key: string;
  policy_limits?: Record<string, unknown> | null;
  auto_approve?: boolean;
}

export interface GrantPermissionResponse {
  permission: AgentPermission;
}

export interface UpdatePermissionRequest {
  policy_limits?: Record<string, unknown> | null;
  auto_approve?: boolean;
}

export interface UpdatePermissionResponse {
  permission: AgentPermission;
}

export interface RevokePermissionResponse {
  revoked: true;
}

const PolicyLimitsSchema = z.record(z.string(), z.unknown()).nullable().optional();

export const AgentPermissionSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  tool_key: z.string(),
  policy_limits: z.record(z.string(), z.unknown()).nullable(),
  auto_approve: z.boolean(),
  created_at: z.number(),
  updated_at: z.number(),
});

export const AgentIdParamSchema = z.object({
  id: z.string(),
});

export const PermissionToolKeyParamSchema = z.object({
  id: z.string(),
  tool_key: z.string(),
});

export const GrantPermissionBodySchema = z.object({
  tool_key: z.string().min(1).max(200),
  policy_limits: PolicyLimitsSchema,
  auto_approve: z.boolean().optional(),
});

export const UpdatePermissionBodySchema = z.object({
  policy_limits: PolicyLimitsSchema,
  auto_approve: z.boolean().optional(),
});

export const ListPermissionsResponseSchema = z.object({
  permissions: z.array(AgentPermissionSchema),
});

export const GrantPermissionResponseSchema = z.object({
  permission: AgentPermissionSchema,
});

export const UpdatePermissionResponseSchema = z.object({
  permission: AgentPermissionSchema,
});

export const RevokePermissionResponseSchema = z.object({
  revoked: z.literal(true),
});
