import { describe, expect, mock, test } from 'bun:test';

import { pendingActionsRepository } from '@api/modules/pending-actions/pending-actions.repository';
import type { CreateAgentResponse } from '@api/modules/agents/types';
import type { VerifyResponse } from '@api/modules/auth/types';
import type { Company } from '@api/modules/companies/types';
import type { ListPendingActionsResponse, PendingAction } from '@api/modules/pending-actions/types';

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

void mock.module('@core/mailer', () => ({
  sendEmail: mock(async () => ({ ok: true })),
}));

setupE2ETests();

const bypassCode = '111111';

function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

async function createCompanyAndGetToken(
  emailPrefix: string
): Promise<{ token: string; companyId: string; userId: string }> {
  const email = `${emailPrefix}@lakitu.test`;
  await testClient.post('/auth/challenge', { email });
  const v = await testClient.post<VerifyResponse>('/auth/verify', { email, code: bypassCode });
  const token = v.data!.token;
  const userId = v.data!.user.id;
  const res = await testClient.post<Company>(
    '/companies',
    { name: `${emailPrefix}-co-${Date.now()}` },
    authHeaders(token)
  );
  return { token, companyId: res.data!.id, userId };
}

async function createAgentForUser(
  token: string,
  name: string
): Promise<{ agentId: string; ownerId: string; companyId: string }> {
  const res = await testClient.post<CreateAgentResponse>('/agents', { name }, authHeaders(token));
  return {
    agentId: res.data!.agent.id,
    ownerId: res.data!.agent.owner_id,
    companyId: res.data!.agent.company_id,
  };
}

async function seedPendingAction(
  agentId: string,
  ownerId: string,
  companyId: string,
  overrides: { expiresAt?: Date; status?: 'pending' | 'approved' | 'denied' | 'expired' } = {}
) {
  return pendingActionsRepository.create({
    agentId,
    ownerId,
    companyId,
    action: 'create_payment',
    context: JSON.stringify({ amount: 500, currency: 'USD' }),
    policyHit: 'max_amount_exceeded',
    status: overrides.status ?? 'pending',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 3_600_000),
  });
}

describe('pending-actions', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-pa@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  describe('list', () => {
    test('returns pending actions for the authenticated owner', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-list');
      const { agentId, companyId } = await createAgentForUser(token, 'List Agent');

      await seedPendingAction(agentId, userId, companyId);
      await seedPendingAction(agentId, userId, companyId);

      const res = await testClient.get<ListPendingActionsResponse>(
        '/pending-actions',
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data!.pending_actions.length).toBe(2);
    });

    test('filters by status query param', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-list-filter');
      const { agentId, companyId } = await createAgentForUser(token, 'Filter Agent');

      await seedPendingAction(agentId, userId, companyId);
      await seedPendingAction(agentId, userId, companyId, { status: 'approved' });
      await seedPendingAction(agentId, userId, companyId, { status: 'denied' });

      const res = await testClient.get<ListPendingActionsResponse>(
        '/pending-actions?status=pending',
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data!.pending_actions.length).toBe(1);
      expect(res.data!.pending_actions[0]!.status).toBe('pending');
    });

    test('returns empty list when no pending actions exist', async () => {
      const { token } = await createCompanyAndGetToken('pa-list-empty');

      const res = await testClient.get<ListPendingActionsResponse>(
        '/pending-actions',
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data!.pending_actions).toEqual([]);
    });
  });

  describe('get by id', () => {
    test('returns a single pending action with correct fields', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-get');
      const { agentId, companyId } = await createAgentForUser(token, 'Get Agent');

      const seeded = await seedPendingAction(agentId, userId, companyId);

      const res = await testClient.get<PendingAction>(
        `/pending-actions/${seeded.id}`,
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data!.id).toBe(seeded.id);
      expect(res.data!.agent_id).toBe(agentId);
      expect(res.data!.owner_id).toBe(userId);
      expect(res.data!.company_id).toBe(companyId);
      expect(res.data!.action).toBe('create_payment');
      expect(res.data!.context).toEqual({ amount: 500, currency: 'USD' });
      expect(res.data!.policy_hit).toBe('max_amount_exceeded');
      expect(res.data!.status).toBe('pending');
      expect(res.data!.agent_name).toBe('Get Agent');
    });

    test('returns 404 for non-existent pending action', async () => {
      const { token } = await createCompanyAndGetToken('pa-get-404');

      const res = await testClient.get(
        '/pending-actions/00000000-0000-0000-0000-000000000000',
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(404);
    });

    test('returns 403 when requesting another owners pending action', async () => {
      const { token: ownerToken, userId: ownerId } = await createCompanyAndGetToken('pa-get-owner');
      const { agentId, companyId } = await createAgentForUser(ownerToken, 'Owner Agent');
      const seeded = await seedPendingAction(agentId, ownerId, companyId);

      const { token: otherToken } = await createCompanyAndGetToken('pa-get-other');

      const res = await testClient.get(`/pending-actions/${seeded.id}`, authHeaders(otherToken));
      expect((res.error as { status: number }).status).toBe(403);
    });
  });

  describe('approve', () => {
    test('approves a pending action with a note', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-approve');
      const { agentId, companyId } = await createAgentForUser(token, 'Approve Agent');
      const seeded = await seedPendingAction(agentId, userId, companyId);

      const res = await testClient.post<PendingAction>(
        `/pending-actions/${seeded.id}/approve`,
        { note: 'Looks good' },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data!.status).toBe('approved');
      expect(res.data!.resolution_note).toBe('Looks good');
      expect(res.data!.resolved_by).toBe(userId);
      expect(res.data!.resolved_at).toBeGreaterThan(0);
    });

    test('approves without a note', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-approve-no-note');
      const { agentId, companyId } = await createAgentForUser(token, 'Approve No Note');
      const seeded = await seedPendingAction(agentId, userId, companyId);

      const res = await testClient.post<PendingAction>(
        `/pending-actions/${seeded.id}/approve`,
        {},
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data!.status).toBe('approved');
      expect(res.data!.resolution_note).toBeNull();
    });

    test('rejects approving an already-approved action with 400', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-approve-dup');
      const { agentId, companyId } = await createAgentForUser(token, 'Approve Dup');
      const seeded = await seedPendingAction(agentId, userId, companyId);

      await testClient.post(`/pending-actions/${seeded.id}/approve`, {}, authHeaders(token));
      const res = await testClient.post(
        `/pending-actions/${seeded.id}/approve`,
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
    });

    test('rejects approving a denied action with 400', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-approve-denied');
      const { agentId, companyId } = await createAgentForUser(token, 'Approve Denied');
      const seeded = await seedPendingAction(agentId, userId, companyId, { status: 'denied' });

      const res = await testClient.post(
        `/pending-actions/${seeded.id}/approve`,
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
    });

    test('rejects approving an expired action with 400', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-approve-expired');
      const { agentId, companyId } = await createAgentForUser(token, 'Approve Expired');
      const seeded = await seedPendingAction(agentId, userId, companyId, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await testClient.post(
        `/pending-actions/${seeded.id}/approve`,
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
    });

    test('rejects approving another owners action with 403', async () => {
      const { token: ownerToken, userId: ownerId } =
        await createCompanyAndGetToken('pa-approve-owner');
      const { agentId, companyId } = await createAgentForUser(ownerToken, 'Approve Owner');
      const seeded = await seedPendingAction(agentId, ownerId, companyId);

      const { token: otherToken } = await createCompanyAndGetToken('pa-approve-other');

      const res = await testClient.post(
        `/pending-actions/${seeded.id}/approve`,
        {},
        authHeaders(otherToken)
      );
      expect((res.error as { status: number }).status).toBe(403);
    });

    test('returns 404 for non-existent pending action', async () => {
      const { token } = await createCompanyAndGetToken('pa-approve-404');

      const res = await testClient.post(
        '/pending-actions/00000000-0000-0000-0000-000000000000/approve',
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(404);
    });
  });

  describe('deny', () => {
    test('denies a pending action with a note', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-deny');
      const { agentId, companyId } = await createAgentForUser(token, 'Deny Agent');
      const seeded = await seedPendingAction(agentId, userId, companyId);

      const res = await testClient.post<PendingAction>(
        `/pending-actions/${seeded.id}/deny`,
        { note: 'Not allowed' },
        authHeaders(token)
      );
      expect(res.error).toBeNull();
      expect(res.data!.status).toBe('denied');
      expect(res.data!.resolution_note).toBe('Not allowed');
      expect(res.data!.resolved_by).toBe(userId);
      expect(res.data!.resolved_at).toBeGreaterThan(0);
    });

    test('rejects denying an already-denied action with 400', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-deny-dup');
      const { agentId, companyId } = await createAgentForUser(token, 'Deny Dup');
      const seeded = await seedPendingAction(agentId, userId, companyId);

      await testClient.post(`/pending-actions/${seeded.id}/deny`, {}, authHeaders(token));
      const res = await testClient.post(
        `/pending-actions/${seeded.id}/deny`,
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);
    });

    test('rejects denying another owners action with 403', async () => {
      const { token: ownerToken, userId: ownerId } =
        await createCompanyAndGetToken('pa-deny-owner');
      const { agentId, companyId } = await createAgentForUser(ownerToken, 'Deny Owner');
      const seeded = await seedPendingAction(agentId, ownerId, companyId);

      const { token: otherToken } = await createCompanyAndGetToken('pa-deny-other');

      const res = await testClient.post(
        `/pending-actions/${seeded.id}/deny`,
        {},
        authHeaders(otherToken)
      );
      expect((res.error as { status: number }).status).toBe(403);
    });
  });

  describe('expire stale', () => {
    test('expired action is caught when owner tries to approve', async () => {
      const { token, userId } = await createCompanyAndGetToken('pa-expire');
      const { agentId, companyId } = await createAgentForUser(token, 'Expire Agent');
      const seeded = await seedPendingAction(agentId, userId, companyId, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await testClient.post(
        `/pending-actions/${seeded.id}/approve`,
        {},
        authHeaders(token)
      );
      expect((res.error as { status: number }).status).toBe(400);

      const fetched = await testClient.get<PendingAction>(
        `/pending-actions/${seeded.id}`,
        authHeaders(token)
      );
      expect(fetched.data!.status).toBe('expired');
    });
  });
});
