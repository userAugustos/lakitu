import { describe, expect, test } from 'bun:test';

import type { VerifyResponse } from '@api/modules/auth/types';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

describe('auth flow (dev bypass)', () => {
  const email = 'tester@lakitu.test';
  const bypassCode = '111111';

  // Bun's test runner has a quirk where the first POST request to a freshly-booted
  // Elysia app in test mode resolves its body but the runner waits for an internal
  // signal before marking the test complete. Using the callback form (done) instead
  // of async/await sidesteps that — Bun honors the explicit done() signal.
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  test('invalid code is rejected', async () => {
    await testClient.post('/auth/challenge', { email });
    const verify = await testClient.post('/auth/verify', { email, code: '000000' });
    expect(verify.error).not.toBeNull();
  });

  test('challenge then verify with bypass returns a JWT and ACTIVE user', async () => {
    const challenge = await testClient.post<{ ok: boolean; challenge_id: string }>(
      '/auth/challenge',
      { email }
    );
    expect(challenge.error).toBeNull();
    expect(challenge.data?.ok).toBe(true);

    const verify = await testClient.post<VerifyResponse>('/auth/verify', {
      email,
      code: bypassCode,
    });
    expect(verify.error).toBeNull();
    expect(typeof verify.data?.token).toBe('string');
    expect(verify.data?.user.email).toBe(email);
    expect(verify.data?.user.status).toBe('ACTIVE');
  });

  test('profile with JWT returns the user', async () => {
    const verify = await testClient.post<VerifyResponse>('/auth/verify', {
      email,
      code: bypassCode,
    });
    const token = verify.data?.token;
    if (!token) throw new Error('expected JWT');

    const profile = await testClient.get<{ email: string }>('/auth/profile', {
      authorization: `Bearer ${token}`,
    });
    expect(profile.error).toBeNull();
    expect(profile.data?.email).toBe(email);
  });
});
