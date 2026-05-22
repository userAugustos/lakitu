import { z } from 'zod';

import { PLATFORM_AGENT_ACTION_VALUES } from '@/modules/core/lib/agent-actions';

export const agentNameSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Agent name is too long'),
});
export type AgentNameFormValues = z.infer<typeof agentNameSchema>;

export const permissionFormSchema = z.object({
  action: z.enum(PLATFORM_AGENT_ACTION_VALUES, {
    errorMap: () => ({ message: 'Action is required' }),
  }),
  policyMaxValue: z.string().optional(),
  policyMaxByDay: z.string().optional(),
});
export type PermissionFormValues = z.infer<typeof permissionFormSchema>;
