import { describe, expect, test } from 'bun:test';

import type { VerifyResponse } from '@api/modules/auth/types';
import type { OnboardingStatus } from '@api/modules/onboarding/types';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

describe('onboarding status', () => {
  const email = 'onboarding-status@lakitu.test';
  const bypassCode = '111111';

  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-onboarding@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  test('unauthenticated request is rejected', async () => {
    const res = await testClient.get('/onboarding/status');
    expect(res.error).not.toBeNull();
  });

  test('returns initial onboarding state for a newly verified user', async () => {
    await testClient.post('/auth/challenge', { email });
    const verify = await testClient.post<VerifyResponse>('/auth/verify', {
      email,
      code: bypassCode,
    });
    const token = verify.data?.token;
    if (!token) throw new Error('expected JWT');

    const status = await testClient.get<OnboardingStatus>('/onboarding/status', {
      authorization: `Bearer ${token}`,
    });

    expect(status.error).toBeNull();
    expect(status.data?.onboarded).toBe(false);
    expect(status.data?.next_step).toBe('company');
    expect(status.data?.conditions.company.satisfied).toBe(false);
    expect(status.data?.conditions.very_ai_linked.satisfied).toBe(false);
    expect(status.data?.conditions.very_ai_verified.satisfied).toBe(false);
  });
});
