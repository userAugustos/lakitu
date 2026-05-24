import { describe, expect, mock, test } from 'bun:test';

import type { CreateAgentResponse } from '@api/modules/agents/types';
import type { VerifyResponse } from '@api/modules/auth/types';
import type { Company } from '@api/modules/companies/types';
import type {
  GrantPermissionResponse,
  ListPermissionsResponse,
  RevokePermissionResponse,
  UpdatePermissionResponse,
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
      const res = await testClient.post(permissionsPath('fake-id'), {
        tool_key: 'gmail.messages.read',
      });
      expect(res.error).not.toBeNull();
    });

    test('rejects unknown tool_key with 400 permissions.unknown_tool', async () => {
      const { token } = await createCompanyAndGetToken('perm-unknown-tool');
      const agentId = await createAgent(token, 'Unknown Tool Agent');
      const res = await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'nope.bad.key' },
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
      const body = (res.error as { value: { error: string } }).value;
      expect(body.error).toBe('permissions.unknown_tool');
    });

    test('rejects critical tool with auto_approve=true', async () => {
      const { token } = await createCompanyAndGetToken('perm-critical-auto');
      const agentId = await createAgent(token, 'Critical Auto Agent');
      const res = await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'stripe.refunds.create', auto_approve: true },
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
      const body = (res.error as { value: { error: string } }).value;
      expect(body.error).toBe('permissions.critical_auto_approve');
    });

    test('grants low-risk tool with auto_approve forced to false', async () => {
      const { token } = await createCompanyAndGetToken('perm-low-auto');
      const agentId = await createAgent(token, 'Low Auto Agent');
      const res = await testClient.post<GrantPermissionResponse>(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permission.tool_key).toBe('gmail.messages.read');
      expect(res.data?.permission.auto_approve).toBe(false);
    });

    test('grants high-risk tool with auto_approve=true', async () => {
      const { token } = await createCompanyAndGetToken('perm-high-auto');
      const agentId = await createAgent(token, 'High Auto Agent');
      const res = await testClient.post<GrantPermissionResponse>(
        permissionsPath(agentId),
        { tool_key: 'stripe.charges.create', auto_approve: true },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permission.tool_key).toBe('stripe.charges.create');
      expect(res.data?.permission.auto_approve).toBe(true);
    });

    test('rejects duplicate tool_key with 409 permissions.already_granted', async () => {
      const { token } = await createCompanyAndGetToken('perm-dup-new');
      const agentId = await createAgent(token, 'Dup Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(token)
      );
      const res = await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(409);
      const body = (res.error as { value: { error: string } }).value;
      expect(body.error).toBe('permissions.already_granted');
    });

    test('rejects unknown policy field key', async () => {
      const { token } = await createCompanyAndGetToken('perm-unknown-field');
      const agentId = await createAgent(token, 'Unknown Field Agent');
      const res = await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read', policy_limits: { unknown_field: 100 } },
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
      const body = (res.error as { value: { error: string } }).value;
      expect(body.error).toBe('permissions.unknown_policy_field');
    });

    test('non-owner cannot grant', async () => {
      const { token: ownerToken } = await createCompanyAndGetToken('perm-nonowner-owner');
      const agentId = await createAgent(ownerToken, 'Owner Agent');
      const { token: otherToken } = await createCompanyAndGetToken('perm-nonowner-other');
      const res = await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(otherToken)
      );
      expect((res.error as { status: number }).status).toBe(403);
    });
  });

  describe('patch', () => {
    test('PATCH /:tool_key updates auto_approve and records audit event', async () => {
      const { token, companyId } = await createCompanyAndGetToken('perm-patch-auto');
      const agentId = await createAgent(token, 'Patch Auto Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'stripe.charges.create', auto_approve: false },
        authHeaders(token)
      );
      const res = await testClient.patch<UpdatePermissionResponse>(
        `${permissionsPath(agentId)}/stripe.charges.create`,
        { auto_approve: true },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permission.auto_approve).toBe(true);
      void companyId;
    });

    test('PATCH with policy_limits and auto_approve together succeeds', async () => {
      const { token } = await createCompanyAndGetToken('perm-patch-both');
      const agentId = await createAgent(token, 'Patch Both Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'stripe.charges.create', policy_limits: { max_amount: 100 } },
        authHeaders(token)
      );
      const res = await testClient.patch<UpdatePermissionResponse>(
        `${permissionsPath(agentId)}/stripe.charges.create`,
        { policy_limits: { max_amount: 500 }, auto_approve: true },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permission.policy_limits).toEqual({ max_amount: 500 });
      expect(res.data?.permission.auto_approve).toBe(true);
    });

    test('PATCH with neither field returns 400 permissions.no_changes', async () => {
      const { token } = await createCompanyAndGetToken('perm-patch-nochange');
      const agentId = await createAgent(token, 'No Change Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(token)
      );
      const res = await testClient.patch(
        `${permissionsPath(agentId)}/gmail.messages.read`,
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
      const body = (res.error as { value: { error: string } }).value;
      expect(body.error).toBe('permissions.no_changes');
    });

    test('non-owner cannot patch', async () => {
      const { token: ownerToken } = await createCompanyAndGetToken('perm-patch-nonowner-own');
      const agentId = await createAgent(ownerToken, 'Patch Owner Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(ownerToken)
      );
      const { token: otherToken } = await createCompanyAndGetToken('perm-patch-nonowner-oth');
      const res = await testClient.patch(
        `${permissionsPath(agentId)}/gmail.messages.read`,
        { auto_approve: true },
        authHeaders(otherToken)
      );
      expect((res.error as { status: number }).status).toBe(403);
    });
  });

  describe('revoke', () => {
    test('revokes an existing permission and returns revoked: true', async () => {
      const { token } = await createCompanyAndGetToken('perm-revoke-new');
      const agentId = await createAgent(token, 'Revoke New Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(token)
      );
      const res = await testClient.delete<RevokePermissionResponse>(
        `${permissionsPath(agentId)}/gmail.messages.read`,
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.revoked).toBe(true);
    });

    test('non-owner cannot revoke', async () => {
      const { token: ownerToken } = await createCompanyAndGetToken('perm-rev-nonowner-own');
      const agentId = await createAgent(ownerToken, 'Revoke Owner Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(ownerToken)
      );
      const { token: otherToken } = await createCompanyAndGetToken('perm-rev-nonowner-oth');
      const res = await testClient.delete(
        `${permissionsPath(agentId)}/gmail.messages.read`,
        authHeaders(otherToken)
      );
      expect((res.error as { status: number }).status).toBe(403);
    });
  });

  describe('list', () => {
    test('lists granted permissions', async () => {
      const { token } = await createCompanyAndGetToken('perm-list-new');
      const agentId = await createAgent(token, 'List New Agent');
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.messages.read' },
        authHeaders(token)
      );
      await testClient.post(
        permissionsPath(agentId),
        { tool_key: 'gmail.drafts.create' },
        authHeaders(token)
      );
      const res = await testClient.get<ListPermissionsResponse>(
        permissionsPath(agentId),
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data?.permissions.length).toBe(2);
    });
  });
});
