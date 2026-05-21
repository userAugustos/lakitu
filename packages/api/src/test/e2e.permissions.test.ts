import { describe, expect, mock, test } from 'bun:test';

import type { CreateAgentResponse } from '@api/modules/agents/types';
import type { VerifyResponse } from '@api/modules/auth/types';
import type { Company } from '@api/modules/companies/types';
import type {
  GrantPermissionResponse,
  ListPermissionAuditResponse,
  ListPermissionsResponse,
  RevokePermissionResponse,
  UpdatePolicyResponse,
} from '@api/modules/permissions/types';

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

async function createAgent(token: string, name: string): Promise<string> {
  const res = await testClient.post<CreateAgentResponse>('/agents', { name }, authHeaders(token));
  return res.data!.agent.id;
}

function permissionsPath(agentId: string): string {
  return `/agents/${agentId}/permissions`;
}

describe('permissions', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-perms@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  describe('grant', () => {
    test('requires authentication', async () => {
      const res = await testClient.post(permissionsPath('fake-id'), { action: 'read' });
      expect(res.error).not.toBeNull();
    });

    test('rejects when agent does not exist', async () => {
      const { token } = await createCompanyAndGetToken('perm-grant-404');
      const res = await testClient.post(
        permissionsPath('00000000-0000-0000-0000-000000000000'),
        { action: 'read' },
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(404);
    });

    test('rejects when user is not the agent owner', async () => {
      const { token: ownerToken } = await createCompanyAndGetToken('perm-grant-owner');
      const agentId = await createAgent(ownerToken, 'Owner Agent');

      const { token: otherToken } = await createCompanyAndGetToken('perm-grant-other');
      const res = await testClient.post(
        permissionsPath(agentId),
        { action: 'read' },
        authHeaders(otherToken)
      );
      expect((res.error as { status: number }).status).toBe(403);
    });

    test('grants a permission without policy limits', async () => {
      const { token } = await createCompanyAndGetToken('perm-grant-basic');
      const agentId = await createAgent(token, 'Grant Agent');

      const res = await testClient.post<GrantPermissionResponse>(
        permissionsPath(agentId),
        { action: 'read' },
        authHeaders(token)
      );

      expect(res.error).toBeNull();
      expect(res.data?.permission.action).toBe('read');
      expect(res.data?.permission.agent_id).toBe(agentId);
      expect(res.data?.permission.policy_limits).toBeNull();
    });

    test('grants a permission with policy limits', async () => {
      const { token } = await createCompanyAndGetToken('perm-grant-policy');
      const agentId = await createAgent(token, 'Policy Agent');

      const limits = { max_tokens: 1000, rate_limit: 60 };
      const res = await testClient.post<GrantPermissionResponse>(
        permissionsPath(agentId),
        { action: 'write', policy_limits: limits },
        authHeaders(token)
      );

      expect(res.error).toBeNull();
      expect(res.data?.permission.action).toBe('write');
      expect(res.data?.permission.policy_limits).toEqual(limits);
    });

    test('rejects duplicate action on same agent', async () => {
      const { token } = await createCompanyAndGetToken('perm-grant-dup');
      const agentId = await createAgent(token, 'Dup Agent');

      await testClient.post(permissionsPath(agentId), { action: 'read' }, authHeaders(token));
      const res = await testClient.post(
        permissionsPath(agentId),
        { action: 'read' },
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
    });

    test('rejects empty action with 422', async () => {
      const { token } = await createCompanyAndGetToken('perm-grant-empty');
      const agentId = await createAgent(token, 'Empty Action Agent');

      const res = await testClient.post(
        permissionsPath(agentId),
        { action: '' },
        authHeaders(token)
      );
      expect(res.error).not.toBeNull();
    });
  });

  describe('list', () => {
    test('lists permissions for an agent', async () => {
      const { token } = await createCompanyAndGetToken('perm-list');
      const agentId = await createAgent(token, 'List Agent');

      await testClient.post(permissionsPath(agentId), { action: 'read' }, authHeaders(token));
      await testClient.post(permissionsPath(agentId), { action: 'write' }, authHeaders(token));

      const res = await testClient.get<ListPermissionsResponse>(
        permissionsPath(agentId),
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permissions.length).toBe(2);
    });

    test('returns empty list when no permissions exist', async () => {
      const { token } = await createCompanyAndGetToken('perm-list-empty');
      const agentId = await createAgent(token, 'Empty List Agent');

      const res = await testClient.get<ListPermissionsResponse>(
        permissionsPath(agentId),
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permissions).toEqual([]);
    });
  });

  describe('update policy', () => {
    test('updates policy limits on an existing permission', async () => {
      const { token } = await createCompanyAndGetToken('perm-update');
      const agentId = await createAgent(token, 'Update Agent');

      await testClient.post(
        permissionsPath(agentId),
        { action: 'read', policy_limits: { max: 10 } },
        authHeaders(token)
      );

      const res = await testClient.patch<UpdatePolicyResponse>(
        `${permissionsPath(agentId)}/read/policy`,
        { policy_limits: { max: 50, burst: true } },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permission.policy_limits).toEqual({ max: 50, burst: true });
    });

    test('sets policy limits to null', async () => {
      const { token } = await createCompanyAndGetToken('perm-update-null');
      const agentId = await createAgent(token, 'Null Policy Agent');

      await testClient.post(
        permissionsPath(agentId),
        { action: 'write', policy_limits: { max: 10 } },
        authHeaders(token)
      );

      const res = await testClient.patch<UpdatePolicyResponse>(
        `${permissionsPath(agentId)}/write/policy`,
        { policy_limits: null },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permission.policy_limits).toBeNull();
    });

    test('rejects update on non-existent permission with 404', async () => {
      const { token } = await createCompanyAndGetToken('perm-update-404');
      const agentId = await createAgent(token, '404 Policy Agent');

      const res = await testClient.patch(
        `${permissionsPath(agentId)}/nonexistent/policy`,
        { policy_limits: { max: 10 } },
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(404);
    });
  });

  describe('revoke', () => {
    test('revokes an existing permission', async () => {
      const { token } = await createCompanyAndGetToken('perm-revoke');
      const agentId = await createAgent(token, 'Revoke Agent');

      await testClient.post(permissionsPath(agentId), { action: 'read' }, authHeaders(token));

      const res = await testClient.delete<RevokePermissionResponse>(
        `${permissionsPath(agentId)}/read`,
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.revoked).toBe(true);

      const listRes = await testClient.get<ListPermissionsResponse>(
        permissionsPath(agentId),
        authHeaders(token)
      );
      expect(listRes.data?.permissions.length).toBe(0);
    });

    test('rejects revoke on non-existent permission with 404', async () => {
      const { token } = await createCompanyAndGetToken('perm-revoke-404');
      const agentId = await createAgent(token, '404 Revoke Agent');

      const res = await testClient.delete(
        `${permissionsPath(agentId)}/nonexistent`,
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(404);
    });
  });

  describe('audit log', () => {
    test('records grant, update, and revoke actions', async () => {
      const { token } = await createCompanyAndGetToken('perm-audit');
      const agentId = await createAgent(token, 'Audit Agent');

      await testClient.post(
        permissionsPath(agentId),
        { action: 'read', policy_limits: { max: 5 } },
        authHeaders(token)
      );
      await testClient.patch(
        `${permissionsPath(agentId)}/read/policy`,
        { policy_limits: { max: 20 } },
        authHeaders(token)
      );
      await testClient.delete(`${permissionsPath(agentId)}/read`, authHeaders(token));

      const res = await testClient.get<ListPermissionAuditResponse>(
        `${permissionsPath(agentId)}/audit`,
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.entries.length).toBe(3);

      const actions = res.data!.entries.map((e) => e.audit_action);
      expect(actions).toContain('grant');
      expect(actions).toContain('update_policy');
      expect(actions).toContain('revoke');
    });

    test('returns empty audit log when no actions taken', async () => {
      const { token } = await createCompanyAndGetToken('perm-audit-empty');
      const agentId = await createAgent(token, 'Empty Audit Agent');

      const res = await testClient.get<ListPermissionAuditResponse>(
        `${permissionsPath(agentId)}/audit`,
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.entries).toEqual([]);
    });
  });

  describe('default deny', () => {
    test('agent with no permissions has empty list', async () => {
      const { token } = await createCompanyAndGetToken('perm-deny');
      const agentId = await createAgent(token, 'Deny Agent');

      const res = await testClient.get<ListPermissionsResponse>(
        permissionsPath(agentId),
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permissions).toEqual([]);
    });
  });
});
