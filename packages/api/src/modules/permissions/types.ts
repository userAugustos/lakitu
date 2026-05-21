import { z } from 'zod';

export const PERMISSION_AUDIT_ACTION_VALUES = ['grant', 'revoke', 'update_policy'] as const;
export type PermissionAuditActionValue = (typeof PERMISSION_AUDIT_ACTION_VALUES)[number];

export interface AgentPermission {
  id: string;
  agent_id: string;
  action: string;
  policy_limits: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

export interface PermissionAuditEntry {
  id: string;
  agent_id: string;
  user_id: string;
  action: string;
  audit_action: PermissionAuditActionValue;
  old_policy_limits: Record<string, unknown> | null;
  new_policy_limits: Record<string, unknown> | null;
  created_at: number;
}

export interface ListPermissionsResponse {
  permissions: AgentPermission[];
}

export interface GrantPermissionRequest {
  action: string;
  policy_limits?: Record<string, unknown> | null;
}

export interface GrantPermissionResponse {
  permission: AgentPermission;
}

export interface UpdatePolicyRequest {
  policy_limits: Record<string, unknown> | null;
}

export interface UpdatePolicyResponse {
  permission: AgentPermission;
}

export interface RevokePermissionResponse {
  revoked: true;
}

export interface ListPermissionAuditResponse {
  entries: PermissionAuditEntry[];
}

const PolicyLimitsSchema = z.record(z.string(), z.unknown()).nullable().optional();

export const AgentPermissionSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  action: z.string(),
  policy_limits: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.number(),
  updated_at: z.number(),
});

export const PermissionAuditEntrySchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  user_id: z.string(),
  action: z.string(),
  audit_action: z.enum(PERMISSION_AUDIT_ACTION_VALUES),
  old_policy_limits: z.record(z.string(), z.unknown()).nullable(),
  new_policy_limits: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.number(),
});

export const AgentIdParamSchema = z.object({
  id: z.string(),
});

export const PermissionActionParamSchema = z.object({
  id: z.string(),
  action: z.string(),
});

export const GrantPermissionBodySchema = z.object({
  action: z.string().min(1).max(200),
  policy_limits: PolicyLimitsSchema,
});

export const UpdatePolicyBodySchema = z.object({
  policy_limits: z.record(z.string(), z.unknown()).nullable(),
});

export const ListPermissionsResponseSchema = z.object({
  permissions: z.array(AgentPermissionSchema),
});

export const GrantPermissionResponseSchema = z.object({
  permission: AgentPermissionSchema,
});

export const UpdatePolicyResponseSchema = z.object({
  permission: AgentPermissionSchema,
});

export const RevokePermissionResponseSchema = z.object({
  revoked: z.literal(true),
});

export const ListPermissionAuditResponseSchema = z.object({
  entries: z.array(PermissionAuditEntrySchema),
});
