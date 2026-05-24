import { z } from 'zod';

export const simulateFormSchema = z.object({
  agent_id: z.string().min(1, 'Agent is required'),
  tool_key: z.string().min(1, 'Tool is required').max(200, 'Tool key is too long'),
  context: z.string().optional(),
});

export type SimulateFormValues = z.infer<typeof simulateFormSchema>;
