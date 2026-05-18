import { describe, expect, test } from 'bun:test';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

describe('healthz', () => {
  test('returns ok', async () => {
    const { data, error } = await testClient.get<{ status: string; timestamp: string }>('/healthz');
    expect(error).toBeNull();
    expect(data?.status).toBe('ok');
    expect(typeof data?.timestamp).toBe('string');
  });
});
