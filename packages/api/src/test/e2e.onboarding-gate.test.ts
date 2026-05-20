import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';
import { onboardingGate } from '@api/modules/onboarding/onboarding.gate';
import type { VerifyResponse } from '@api/modules/auth/types';
import { errorPlugin } from '@core/errors';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

const gatedApp = new Elysia({ name: 'test.gated' })
  .use(errorPlugin)
  .use(authMiddleware)
  .use(onboardingGate)
  .get('/test-gated/resource', () => ({ ok: true }));

async function callGated<T>(
  method: string,
  path: string,
  headers?: Record<string, string>
): Promise<{ status: number; body: T }> {
  const res = await gatedApp.handle(new Request(`http://localhost${path}`, { method, headers }));
  const body = (await res.json()) as T;
  return { status: res.status, body };
}

describe('onboarding gate middleware', () => {
  const email = 'gate-test@lakitu.test';
  const bypassCode = '111111';

  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-gate@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  test('non-onboarded user receives 403 with next_step in meta', async () => {
    await testClient.post('/auth/challenge', { email });
    const verify = await testClient.post<VerifyResponse>('/auth/verify', {
      email,
      code: bypassCode,
    });
    const token = verify.data?.token;
    if (!token) throw new Error('expected JWT');

    const res = await callGated<{
      error: string;
      message: string;
      meta: { next_step: string };
    }>('GET', '/test-gated/resource', {
      authorization: `Bearer ${token}`,
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('onboarding_required');
    expect(res.body.meta.next_step).toBe('company');
  });

  test('unauthenticated request is rejected with 401', async () => {
    const res = await callGated<{ error: string }>('GET', '/test-gated/resource');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('auth.missing_token');
  });

  test('exempt routes still work for non-onboarded users', async () => {
    await testClient.post('/auth/challenge', { email: 'gate-exempt@lakitu.test' });
    const verify = await testClient.post<VerifyResponse>('/auth/verify', {
      email: 'gate-exempt@lakitu.test',
      code: bypassCode,
    });
    const token = verify.data?.token;
    if (!token) throw new Error('expected JWT');

    const profile = await testClient.get<{ email: string }>('/auth/profile', {
      authorization: `Bearer ${token}`,
    });
    expect(profile.error).toBeNull();
    expect(profile.data?.email).toBe('gate-exempt@lakitu.test');

    const status = await testClient.get<{ onboarded: boolean }>('/onboarding/status', {
      authorization: `Bearer ${token}`,
    });
    expect(status.error).toBeNull();
    expect(status.data?.onboarded).toBe(false);
  });
});
