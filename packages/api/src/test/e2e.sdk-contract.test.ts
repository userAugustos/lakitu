import { treaty } from '@elysiajs/eden';
import { describe, expect, test } from 'bun:test';

import { lakituApi } from '@api/app';
import type { LakituApi } from '@api/app';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

describe('SDK contract', () => {
  test('healthz JSON shape over Request/Response matches the type contract', async () => {
    const { data, error } = await testClient.get<{
      status: string;
      version: string;
      timestamp: string;
    }>('/healthz');
    expect(error).toBeNull();
    if (!data) throw new Error('healthz returned no data');
    data satisfies { status: string; version: string; timestamp: string };
    expect(data.status).toBe('ok');
    expect(typeof data.timestamp).toBe('string');
  });

  test('eden treaty resolves the LakituApi type at compile time', () => {
    const _client = treaty<LakituApi>(lakituApi);
    type _HealthzReturn = Awaited<ReturnType<typeof _client.healthz.get>>;
    const _proof: _HealthzReturn['data'] | null = null;
    void _proof;
    expect(true).toBe(true);
  });
});
