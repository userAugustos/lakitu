import { z } from 'zod';

export const simulateFormSchema = z.object({
  agent_id: z.string().min(1, 'Agent is required'),
  action: z.string().min(1, 'Action is required').max(200, 'Action is too long'),
  context: z.string().optional(),
});

export type SimulateFormValues = z.infer<typeof simulateFormSchema>;
