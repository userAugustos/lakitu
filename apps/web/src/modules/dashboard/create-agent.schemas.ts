import { z } from 'zod';

export const agentNameSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Agent name is too long'),
});
export type AgentNameFormValues = z.infer<typeof agentNameSchema>;
