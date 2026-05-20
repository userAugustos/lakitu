import { t } from 'elysia';

export interface StartLinkResponse {
  authorize_url: string;
}

export interface CallbackResponse {
  ok: boolean;
  status: 'verified';
  subject_id: string;
}

export const StartLinkResponseSchema = t.Object({
  authorize_url: t.String(),
});

export const CallbackQuerySchema = t.Object({
  code: t.String(),
  state: t.String(),
});

export const CallbackResponseSchema = t.Object({
  ok: t.Boolean(),
  status: t.Literal('verified'),
  subject_id: t.String(),
});
