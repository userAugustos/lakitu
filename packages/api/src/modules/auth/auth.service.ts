import { randomUUID } from 'crypto';

import { buildEmail } from '@api/emails';
import { config } from '@core/env';
import { unauthorized } from '@core/errors';
import { LOG_DOMAINS, logger } from '@core/logger';
import { sendEmail } from '@core/mailer';

import { authRepository } from './auth.repository';
import { jwtManager } from './lib/jwt';
import { generateNumericCode, hashCode, isOtpBypassAllowed, isOtpBypassEligible } from './lib/otp';
import type {
  ChallengeRequest,
  ChallengeResponse,
  ChallengeVerify,
  User,
  UserStatus,
  VerifyResponse,
} from './types';

const authLogger = logger.child({ domain: LOG_DOMAINS.AUTH });

function toUserDto(row: {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  activatedAt: Date | null;
  createdAt: Date;
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    activated_at: row.activatedAt ? row.activatedAt.getTime() : null,
    created_at: row.createdAt.getTime(),
  };
}

async function requestChallenge(input: ChallengeRequest): Promise<ChallengeResponse> {
  const email = input.email.trim().toLowerCase();
  let user = await authRepository.findUserByEmail(email);
  if (!user) user = await authRepository.createUser({ email });
  if (user.status === 'LOCKED') {
    throw unauthorized('auth.user_locked', 'Account is locked');
  }

  if (isOtpBypassEligible(email)) {
    authLogger.debug('OTP challenge bypassed (tester email)', { email });
    return { ok: true, challenge_id: randomUUID() };
  }

  const code = generateNumericCode(config.auth.codeLength);
  const expiresAt = new Date(Date.now() + config.auth.challengeTtlSeconds * 1000);
  const challenge = await authRepository.createChallenge({
    userId: user.id,
    destination: email,
    purpose: 'login',
    codeHash: hashCode(code),
    expiresAt,
  });

  if (!config.isProduction) authLogger.debug('OTP issued', { email, code });

  const { subject, html } = await buildEmail('AuthOtp', {
    code,
    ttlMinutes: Math.round(config.auth.challengeTtlSeconds / 60),
  });
  await sendEmail({ from: config.auth.emailFrom, to: email, subject, html });

  return { ok: true, challenge_id: challenge.id };
}

async function verifyChallenge(input: ChallengeVerify): Promise<VerifyResponse> {
  const email = input.email.trim().toLowerCase();
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw unauthorized('auth.invalid_credentials', 'Invalid email or code');
  if (user.status === 'LOCKED') throw unauthorized('auth.user_locked', 'Account is locked');

  const bypass = isOtpBypassAllowed(email, input.code);
  if (!bypass) {
    const challenge = await authRepository.findValidChallengeByCode(
      user.id,
      hashCode(input.code.trim())
    );
    if (!challenge) {
      await authRepository.incrementFailedAttempts(user.id);
      throw unauthorized('auth.invalid_credentials', 'Invalid email or code');
    }
    await authRepository.consumeChallenge(challenge.id);
  }

  const becameActive = user.status !== 'ACTIVE';
  const token = await jwtManager.sign(user.id, { email: user.email });
  const activatedAt = becameActive ? new Date() : user.activatedAt;
  if (becameActive) {
    await authRepository.setUserStatus(user.id, 'ACTIVE', { activatedAt });
  }
  return {
    token,
    user: toUserDto({
      ...user,
      status: 'ACTIVE',
      activatedAt,
    }),
  };
}

async function profile(userId: string): Promise<User> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  return toUserDto(user);
}

export const authService = { requestChallenge, verifyChallenge, profile };
