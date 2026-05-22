import { z } from 'zod';

export const agentNameSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Agent name is too long'),
});
export type AgentNameFormValues = z.infer<typeof agentNameSchema>;

export const permissionFormSchema = z.object({
  action: z
    .string()
    .min(1, 'Action is required')
    .max(200, 'Action is too long')
    .regex(/^[a-z0-9_:]+$/, 'Only lowercase letters, numbers, underscores, and colons'),
  policyLimits: z.string().optional(),
});
export type PermissionFormValues = z.infer<typeof permissionFormSchema>;
