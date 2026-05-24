import { z } from 'zod';

export const toolAccessFormSchema = z.object({
  toolKey: z.string().min(1, 'Tool is required'),
});

export type ToolAccessFormValues = z.infer<typeof toolAccessFormSchema>;
