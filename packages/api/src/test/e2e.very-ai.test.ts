import { describe, expect, mock, test } from 'bun:test';

import type { VerifyResponse } from '@api/modules/auth/types';
import type { OnboardingStatus } from '@api/modules/onboarding/types';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

void mock.module('@api/modules/very-ai/very-ai.client', () => ({
  veryAiClient: {
    buildAuthorizeUrl: ({ state, nonce }: { state: string; nonce: string }) =>
      `https://api.very.org/oauth2/authorize?state=${state}&nonce=${nonce}`,
    exchangeCode: () =>
      Promise.resolve({
        access_token: 'stub-access',
        id_token: 'stub-id',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid',
      }),
    getUserInfo: () => Promise.resolve({ sub: 'very-ai-subject-123' }),
  },
}));

const bypassCode = '111111';

async function getToken(email: string): Promise<string> {
  await testClient.post('/auth/challenge', { email });
  const v = await testClient.post<VerifyResponse>('/auth/verify', { email, code: bypassCode });
  if (!v.data?.token) throw new Error('expected JWT');
  return v.data.token;
}

describe('VeryAI OAuth2 link', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-very-ai@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  test('start returns authorize_url containing state and nonce', async () => {
    const token = await getToken('very-ai-start@lakitu.test');
    const res = await testClient.post<{ authorize_url: string }>(
      '/onboarding/very-ai/start',
      {},
      { authorization: `Bearer ${token}` }
    );
    expect(res.error).toBeNull();
    const url = new URL(res.data!.authorize_url);
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('nonce')).toBeTruthy();
  });

  test('callback with valid state completes link and flips status', async () => {
    const email = 'very-ai-callback@lakitu.test';
    const token = await getToken(email);
    const start = await testClient.post<{ authorize_url: string }>(
      '/onboarding/very-ai/start',
      {},
      { authorization: `Bearer ${token}` }
    );
    const state = new URL(start.data!.authorize_url).searchParams.get('state')!;

    const callback = await testClient.get<{
      ok: boolean;
      status: string;
      subject_id: string;
    }>(`/onboarding/very-ai/callback?code=any-code&state=${encodeURIComponent(state)}`);
    expect(callback.error).toBeNull();
    expect(callback.data?.ok).toBe(true);
    expect(callback.data?.status).toBe('verified');
    expect(callback.data?.subject_id).toBe('very-ai-subject-123');

    const status = await testClient.get<OnboardingStatus>('/onboarding/status', {
      authorization: `Bearer ${token}`,
    });
    expect(status.data?.conditions.very_ai_linked.satisfied).toBe(true);
    expect(status.data?.conditions.very_ai_verified.satisfied).toBe(true);
  });

  test('callback with unknown state is rejected', async () => {
    const res = await testClient.get(
      '/onboarding/very-ai/callback?code=x&state=does-not-exist'
    );
    expect(res.error).not.toBeNull();
  });
});
