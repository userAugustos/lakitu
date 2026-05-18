import { t } from 'elysia';

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'LOCKED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  activated_at: number | null;
  locked_at: number | null;
  created_at: number;
}

export interface ChallengeRequest {
  email: string;
}

export interface ChallengeVerify {
  email: string;
  code: string;
}

export interface ChallengeResponse {
  ok: boolean;
  challenge_id: string;
}

export interface VerifyResponse {
  token: string;
  user: User;
}

export const UserSchema = t.Object({
  id: t.String(),
  email: t.String({ format: 'email' }),
  name: t.Union([t.String(), t.Null()]),
  status: t.Union([t.Literal('PENDING'), t.Literal('ACTIVE'), t.Literal('LOCKED')]),
  activated_at: t.Union([t.Number(), t.Null()]),
  locked_at: t.Union([t.Number(), t.Null()]),
  created_at: t.Number(),
});

export const ChallengeRequestSchema = t.Object({ email: t.String({ format: 'email' }) });

export const ChallengeVerifySchema = t.Object({
  email: t.String({ format: 'email' }),
  code: t.String(),
});

export const ChallengeResponseSchema = t.Object({
  ok: t.Boolean(),
  challenge_id: t.String(),
});

export const VerifyResponseSchema = t.Object({
  token: t.String(),
  user: UserSchema,
});
