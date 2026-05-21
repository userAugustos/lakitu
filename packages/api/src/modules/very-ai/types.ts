import { z } from 'zod';

export interface StartLinkResponse {
  authorize_url: string;
}

export interface CallbackResponse {
  ok: boolean;
  status: 'verified';
  subject_id: string;
}

export const StartLinkResponseSchema = z.object({
  authorize_url: z.string(),
});

export const CallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});

export const CallbackResponseSchema = z.object({
  ok: z.boolean(),
  status: z.literal('verified'),
  subject_id: z.string(),
});
