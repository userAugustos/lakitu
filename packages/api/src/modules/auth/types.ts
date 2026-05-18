import { t } from 'elysia';
import type { Static } from 'elysia';

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'LOCKED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const UserSchema = t.Object({
  id: t.String(),
  email: t.String({ format: 'email' }),
  name: t.Union([t.String(), t.Null()]),
  status: t.Union([t.Literal('PENDING'), t.Literal('ACTIVE'), t.Literal('LOCKED')]),
  activated_at: t.Union([t.Number(), t.Null()]),
  locked_at: t.Union([t.Number(), t.Null()]),
  created_at: t.Number(),
});
export type User = Static<typeof UserSchema>;

export const ChallengeRequestSchema = t.Object({ email: t.String({ format: 'email' }) });
export type ChallengeRequest = Static<typeof ChallengeRequestSchema>;

export const ChallengeVerifySchema = t.Object({
  email: t.String({ format: 'email' }),
  code: t.String(),
});
export type ChallengeVerify = Static<typeof ChallengeVerifySchema>;

export const ChallengeResponseSchema = t.Object({
  ok: t.Boolean(),
  challenge_id: t.String(),
});
export type ChallengeResponse = Static<typeof ChallengeResponseSchema>;

export const VerifyResponseSchema = t.Object({
  token: t.String(),
  user: UserSchema,
});
export type VerifyResponse = Static<typeof VerifyResponseSchema>;
