import { describe, expect, test } from 'bun:test';

import type { ListToolsResponse, Tool } from '@api/modules/tools/types';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

setupE2ETests();

describe('tools', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-tools@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  test('GET /tools returns 12 entries', async () => {
    const res = await testClient.get<ListToolsResponse>('/tools');
    expect(res.error).toBeNull();
    expect(res.data?.tools).toHaveLength(12);
  });

  test('GET /tools entries have required shape', async () => {
    const res = await testClient.get<ListToolsResponse>('/tools');
    expect(res.error).toBeNull();
    for (const tool of res.data!.tools) {
      expect(typeof tool.key).toBe('string');
      expect(typeof tool.provider).toBe('string');
      expect(typeof tool.resource).toBe('string');
      expect(typeof tool.verb).toBe('string');
      expect(typeof tool.label).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(['low', 'medium', 'high', 'critical']).toContain(tool.risk_level);
      expect(Array.isArray(tool.policy_fields)).toBe(true);
    }
  });

  test('GET /tools includes at least one of each risk level', async () => {
    const res = await testClient.get<ListToolsResponse>('/tools');
    const riskLevels = new Set(res.data!.tools.map((t) => t.risk_level));
    expect(riskLevels.has('low')).toBe(true);
    expect(riskLevels.has('medium')).toBe(true);
    expect(riskLevels.has('high')).toBe(true);
    expect(riskLevels.has('critical')).toBe(true);
  });

  test('GET /tools/stripe.refunds.create returns critical tool', async () => {
    const res = await testClient.get<{ tool: Tool }>('/tools/stripe.refunds.create');
    expect(res.error).toBeNull();
    expect(res.data?.tool.key).toBe('stripe.refunds.create');
    expect(res.data?.tool.risk_level).toBe('critical');
  });

  test('GET /tools/:key with unknown key returns 404 with tools.unknown_key', async () => {
    const res = await testClient.get('/tools/does.not.exist');
    expect((res.error as { status: number }).status).toBe(404);
    const body = (res.error as { value: { error: string } }).value;
    expect(body.error).toBe('tools.unknown_key');
  });
});
