import { describe, expect, mock, test } from 'bun:test';

import type {
  Agent,
  AgentClawKeyStatusResponse,
  CreateAgentResponse,
  ListAgentsResponse,
  RotateKeyResponse,
} from '@api/modules/agents/types';
import type { VerifyResponse } from '@api/modules/auth/types';
import type { Company } from '@api/modules/companies/types';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

void mock.module('@api/modules/agents/clawkey.client', () => ({
  clawkeyClient: {
    registerInit: mock(async () => ({
      sessionId: 'mock-session-id',
      registrationUrl: 'https://clawkey.ai/register/mock-session-id',
      expiresAt: Date.now() + 600_000,
    })),
    getSessionStatus: mock(async () => ({
      status: 'completed' as const,
      deviceId: 'mock-device',
      registration: {
        publicKey: 'mock-public-key',
        registeredAt: Date.now(),
      },
    })),
  },
}));

setupE2ETests();

const bypassCode = '111111';

async function getToken(email: string): Promise<string> {
  await testClient.post('/auth/challenge', { email });
  const v = await testClient.post<VerifyResponse>('/auth/verify', { email, code: bypassCode });
  if (!v.data?.token) throw new Error('expected JWT');
  return v.data.token;
}

function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

async function createCompanyAndGetToken(
  emailPrefix: string
): Promise<{ token: string; companyId: string }> {
  const token = await getToken(`${emailPrefix}@lakitu.test`);
  const res = await testClient.post<Company>(
    '/companies',
    { name: `${emailPrefix}-co-${Date.now()}` },
    authHeaders(token)
  );
  return { token, companyId: res.data!.id };
}

describe('agents', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-agents@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  describe('create', () => {
    test('requires authentication', async () => {
      const res = await testClient.post('/agents', { name: 'My Agent' });
      expect(res.error).not.toBeNull();
    });

    test('requires user to belong to a company', async () => {
      const token = await getToken('agent-no-co@lakitu.test');
      const res = await testClient.post('/agents', { name: 'My Agent' }, authHeaders(token));
      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(400);
    });

    test('creates an agent and returns registration URL', async () => {
      const { token } = await createCompanyAndGetToken('agent-create');
      const res = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Test Agent' },
        authHeaders(token)
      );

      expect(res.error).toBeNull();
      expect(res.data?.agent.name).toBe('Test Agent');
      expect(res.data?.agent.status).toBe('active');
      expect(res.data?.agent.clawkey_status).toBe('pending');
      expect(res.data?.agent.ed25519_public_key).toBeTruthy();
      expect(res.data?.registration_url).toContain('clawkey.ai');
    });

    test('rejects blank name with 400', async () => {
      const { token } = await createCompanyAndGetToken('agent-blank');
      const res = await testClient.post('/agents', { name: '   ' }, authHeaders(token));
      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(400);
    });
  });

  describe('list', () => {
    test('lists agents for the authenticated users company', async () => {
      const { token } = await createCompanyAndGetToken('agent-list');
      await testClient.post('/agents', { name: 'List Agent 1' }, authHeaders(token));
      await testClient.post('/agents', { name: 'List Agent 2' }, authHeaders(token));

      const res = await testClient.get<ListAgentsResponse>('/agents', authHeaders(token));
      expect(res.error).toBeNull();
      expect(res.data?.agents.length).toBe(2);
    });

    test('returns empty list when no agents exist', async () => {
      const { token } = await createCompanyAndGetToken('agent-list-empty');
      const res = await testClient.get<ListAgentsResponse>('/agents', authHeaders(token));
      expect(res.error).toBeNull();
      expect(res.data?.agents).toEqual([]);
    });
  });

  describe('revoke', () => {
    test('revokes an active agent', async () => {
      const { token } = await createCompanyAndGetToken('agent-revoke');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Revoke Me' },
        authHeaders(token)
      );
      const agentId = created.data!.agent.id;

      const res = await testClient.patch<Agent>(
        `/agents/${agentId}/revoke`,
        {},
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.status).toBe('revoked');
    });

    test('rejects revoking an already-revoked agent with 400', async () => {
      const { token } = await createCompanyAndGetToken('agent-revoke-dup');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Revoke Twice' },
        authHeaders(token)
      );
      const agentId = created.data!.agent.id;

      await testClient.patch(`/agents/${agentId}/revoke`, {}, authHeaders(token));
      const res = await testClient.patch(`/agents/${agentId}/revoke`, {}, authHeaders(token));
      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(400);
    });

    test('rejects revoke for non-existent agent with 404', async () => {
      const { token } = await createCompanyAndGetToken('agent-revoke-404');
      const res = await testClient.patch(
        '/agents/00000000-0000-0000-0000-000000000000/revoke',
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(404);
    });
  });

  describe('restore', () => {
    test('restores a revoked agent', async () => {
      const { token } = await createCompanyAndGetToken('agent-restore');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Restore Me' },
        authHeaders(token)
      );
      const agentId = created.data!.agent.id;

      await testClient.patch(`/agents/${agentId}/revoke`, {}, authHeaders(token));
      const res = await testClient.patch<Agent>(
        `/agents/${agentId}/restore`,
        {},
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.status).toBe('active');
    });

    test('rejects restoring an active agent with 400', async () => {
      const { token } = await createCompanyAndGetToken('agent-restore-active');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Already Active' },
        authHeaders(token)
      );
      const agentId = created.data!.agent.id;

      const res = await testClient.patch(`/agents/${agentId}/restore`, {}, authHeaders(token));
      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(400);
    });
  });

  describe('rotate key', () => {
    test('rotates keys and returns a new registration URL', async () => {
      const { token } = await createCompanyAndGetToken('agent-rotate');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Rotate Me' },
        authHeaders(token)
      );
      const agentId = created.data!.agent.id;
      const originalKey = created.data!.agent.ed25519_public_key;

      const res = await testClient.post<RotateKeyResponse>(
        `/agents/${agentId}/rotate-key`,
        {},
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.agent.ed25519_public_key).not.toBe(originalKey);
      expect(res.data?.agent.clawkey_status).toBe('pending');
      expect(res.data?.registration_url).toBeTruthy();
    });

    test('rejects rotate on a revoked agent with 400', async () => {
      const { token } = await createCompanyAndGetToken('agent-rotate-revoked');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Rotate Revoked' },
        authHeaders(token)
      );
      const agentId = created.data!.agent.id;

      await testClient.patch(`/agents/${agentId}/revoke`, {}, authHeaders(token));
      const res = await testClient.post(`/agents/${agentId}/rotate-key`, {}, authHeaders(token));
      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(400);
    });
  });

  describe('clawkey status polling', () => {
    test('returns updated status from ClawKey', async () => {
      const { token } = await createCompanyAndGetToken('agent-status');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Status Agent' },
        authHeaders(token)
      );
      const agentId = created.data!.agent.id;

      const res = await testClient.get<AgentClawKeyStatusResponse>(
        `/agents/${agentId}/clawkey/status`,
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.clawkey_status).toBe('completed');
      expect(res.data?.clawkey_registered_at).toBeGreaterThan(0);
    });

    test('rejects status check for non-existent agent with 404', async () => {
      const { token } = await createCompanyAndGetToken('agent-status-404');
      const res = await testClient.get(
        '/agents/00000000-0000-0000-0000-000000000000/clawkey/status',
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(404);
    });

    test('rejects status check for agent from another company with 403', async () => {
      const { token: ownerToken } = await createCompanyAndGetToken('agent-status-owner');
      const created = await testClient.post<CreateAgentResponse>(
        '/agents',
        { name: 'Other Co Agent' },
        authHeaders(ownerToken)
      );
      const agentId = created.data!.agent.id;

      const { token: outsiderToken } = await createCompanyAndGetToken('agent-status-outsider');
      const res = await testClient.get(
        `/agents/${agentId}/clawkey/status`,
        authHeaders(outsiderToken)
      );
      expect((res.error as { status: number }).status).toBe(403);
    });
  });
});
