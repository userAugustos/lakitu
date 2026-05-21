import { z } from 'zod';

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'LOCKED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  activated_at: number | null;
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

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  status: z.enum(['PENDING', 'ACTIVE', 'LOCKED']),
  activated_at: z.number().nullable(),
  created_at: z.number(),
});

export const ChallengeRequestSchema = z.object({ email: z.string().email() });

export const ChallengeVerifySchema = z.object({
  email: z.string().email(),
  code: z.string(),
});

export const ChallengeResponseSchema = z.object({
  ok: z.boolean(),
  challenge_id: z.string(),
});

export const VerifyResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});
