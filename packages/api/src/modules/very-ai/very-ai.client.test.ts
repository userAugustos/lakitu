import { describe, expect, test } from 'bun:test';

import { veryAiClient } from './very-ai.client';

describe('veryAiClient.buildAuthorizeUrl', () => {
  test('includes required OAuth2 parameters', () => {
    const url = new URL(veryAiClient.buildAuthorizeUrl({ state: 'st' }));
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('openid');
    expect(url.searchParams.get('state')).toBe('st');
    expect(url.searchParams.get('client_id')).not.toBeNull();
    expect(url.searchParams.get('redirect_uri')).not.toBeNull();
  });

  test('does not request offline_access', () => {
    const url = new URL(veryAiClient.buildAuthorizeUrl({ state: 'st' }));
    expect(url.searchParams.get('scope')).not.toContain('offline_access');
  });
});
