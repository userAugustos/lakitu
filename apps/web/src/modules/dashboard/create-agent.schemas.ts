import { z } from 'zod';

export const agentNameSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Agent name is too long'),
});
export type AgentNameFormValues = z.infer<typeof agentNameSchema>;

export const permissionActionSchema = z.object({
  action: z.string().min(1, 'Permission action is required').max(200, 'Action name is too long'),
});
export type PermissionActionFormValues = z.infer<typeof permissionActionSchema>;
