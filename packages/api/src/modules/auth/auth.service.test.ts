import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

import { authRepository } from './auth.repository';
import { authService } from './auth.service';

void mock.module('@core/mailer', () => ({
  sendEmail: () => Promise.resolve({ ok: true }),
}));

afterEach(() => {
  mock.restore();
});

const fakeUser = (email: string) => ({
  id: `user-${email}`,
  email,
  name: null,
  companyId: null,
  status: 'PENDING' as const,
  activatedAt: null,
  veryAiSubjectId: null,
  veryAiStatus: 'unlinked' as const,
  veryAiLastVerificationAt: null,
  createdAt: new Date(),
});

describe('authService.requestChallenge', () => {
  test('tester email skips real OTP — does not call createChallenge', async () => {
    const email = 'unit-bypass@lakitu.test';
    spyOn(authRepository, 'findUserByEmail').mockResolvedValue(undefined);
    spyOn(authRepository, 'createUser').mockResolvedValue(fakeUser(email));
    const createChallenge = spyOn(authRepository, 'createChallenge');

    const result = await authService.requestChallenge({ email });

    expect(result.ok).toBe(true);
    expect(typeof result.challenge_id).toBe('string');
    expect(createChallenge).not.toHaveBeenCalled();
  });

  test('non-tester email runs normal OTP flow — calls createChallenge once', async () => {
    const email = 'unit-real@example.com';
    spyOn(authRepository, 'findUserByEmail').mockResolvedValue(undefined);
    spyOn(authRepository, 'createUser').mockResolvedValue(fakeUser(email));
    const createChallenge = spyOn(authRepository, 'createChallenge').mockResolvedValue({
      id: 'challenge-id',
      userId: `user-${email}`,
      destination: email,
      purpose: 'login',
      codeHash: 'hashed',
      expiresAt: new Date(),
      consumedAt: null,
      failedAttempts: 0,
      createdAt: new Date(),
    });

    const result = await authService.requestChallenge({ email });

    expect(result.ok).toBe(true);
    expect(createChallenge).toHaveBeenCalledTimes(1);
  });
});
