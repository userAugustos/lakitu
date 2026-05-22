import { describe, expect, mock, test } from 'bun:test';

import { db } from '@api/db/client';
import { agents, companies, users } from '@api/db/schema';
import { auditLogRepository } from '@api/modules/audit-log/audit-log.repository';
import { auditLogService } from '@api/modules/audit-log/audit-log.service';
import type { CreateAgentResponse, RotateKeyResponse } from '@api/modules/agents/types';
import type { AppendAuditLogInput } from '@api/modules/audit-log/types';
import type { VerifyResponse } from '@api/modules/auth/types';
import type { Company } from '@api/modules/companies/types';
import { AppError } from '@core/errors';

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
    { name: `${emailPrefix}-co-${crypto.randomUUID()}` },
    authHeaders(token)
  );
  return { token, companyId: res.data!.id };
}

async function createTestAgent(suffix: string) {
  const userId = crypto.randomUUID();
  const companyId = crypto.randomUUID();
  const agentId = crypto.randomUUID();

  await db.insert(companies).values({ id: companyId, name: `test-co-${suffix}` });
  await db.insert(users).values({
    id: userId,
    email: `audit-${suffix}@lakitu.test`,
    companyId,
    status: 'ACTIVE',
  });
  await db.insert(agents).values({
    id: agentId,
    name: `agent-${suffix}`,
    ownerId: userId,
    companyId,
    ed25519PublicKey: `pub-${suffix}`,
    ed25519PrivateKey: `priv-${suffix}`,
  });

  return { userId, companyId, agentId };
}

function makeInput(
  ids: { agentId: string; userId: string; companyId: string },
  overrides: Partial<AppendAuditLogInput> = {}
): AppendAuditLogInput {
  return {
    agent_id: ids.agentId,
    owner_id: ids.userId,
    company_id: ids.companyId,
    action: 'tool.execute',
    decision: 'allow',
    reasons: ['policy matched'],
    ...overrides,
  };
}

describe('audit-log repository', () => {
  test('inserts a single audit log row and returns it', async () => {
    const ids = await createTestAgent('repo-insert');
    const row = await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: ids.agentId,
      ownerId: ids.userId,
      companyId: ids.companyId,
      action: 'tool.execute',
      decision: 'allow',
      reasons: JSON.stringify(['matched rule']),
    });

    expect(row.id).toBeString();
    expect(row.agentId).toBe(ids.agentId);
    expect(row.decision).toBe('allow');
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  test('insertMany inserts multiple rows', async () => {
    const ids = await createTestAgent('repo-insert-many');
    const auditId = crypto.randomUUID();

    await auditLogRepository.insertMany([
      {
        auditId,
        agentId: ids.agentId,
        ownerId: ids.userId,
        companyId: ids.companyId,
        action: 'tool.execute',
        decision: 'allow',
        reasons: JSON.stringify(['r1']),
      },
      {
        auditId,
        agentId: ids.agentId,
        ownerId: ids.userId,
        companyId: ids.companyId,
        action: 'tool.read',
        decision: 'deny',
        reasons: JSON.stringify(['r2']),
      },
      {
        auditId,
        agentId: ids.agentId,
        ownerId: ids.userId,
        companyId: ids.companyId,
        action: 'tool.write',
        decision: 'allow',
        reasons: JSON.stringify(['r3']),
      },
    ]);

    const rows = await auditLogRepository.findByAuditId(auditId);
    expect(rows).toHaveLength(3);
  });

  test('findByAuditId returns related rows ordered by created_at ASC', async () => {
    const ids = await createTestAgent('repo-audit-id-order');
    const auditId = crypto.randomUUID();

    await auditLogRepository.insert({
      auditId,
      agentId: ids.agentId,
      ownerId: ids.userId,
      companyId: ids.companyId,
      action: 'step.first',
      decision: 'allow',
      reasons: JSON.stringify([]),
    });

    await auditLogRepository.insert({
      auditId,
      agentId: ids.agentId,
      ownerId: ids.userId,
      companyId: ids.companyId,
      action: 'step.second',
      decision: 'deny',
      reasons: JSON.stringify([]),
    });

    const rows = await auditLogRepository.findByAuditId(auditId);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.createdAt.getTime()).toBeLessThanOrEqual(rows[1]!.createdAt.getTime());
    expect(rows[0]!.action).toBe('step.first');
    expect(rows[1]!.action).toBe('step.second');
  });

  test('findByAgentId filters by agent', async () => {
    const idsA = await createTestAgent('repo-agent-a');
    const idsB = await createTestAgent('repo-agent-b');

    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: idsA.agentId,
      ownerId: idsA.userId,
      companyId: idsA.companyId,
      action: 'tool.a',
      decision: 'allow',
      reasons: JSON.stringify([]),
    });
    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: idsB.agentId,
      ownerId: idsB.userId,
      companyId: idsB.companyId,
      action: 'tool.b',
      decision: 'deny',
      reasons: JSON.stringify([]),
    });

    const rows = await auditLogRepository.findByAgentId(idsA.agentId);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      expect(row.agentId).toBe(idsA.agentId);
    }
  });

  test('findByOwnerId filters by owner', async () => {
    const idsA = await createTestAgent('repo-owner-a');
    const idsB = await createTestAgent('repo-owner-b');

    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: idsA.agentId,
      ownerId: idsA.userId,
      companyId: idsA.companyId,
      action: 'tool.x',
      decision: 'allow',
      reasons: JSON.stringify([]),
    });
    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: idsB.agentId,
      ownerId: idsB.userId,
      companyId: idsB.companyId,
      action: 'tool.y',
      decision: 'deny',
      reasons: JSON.stringify([]),
    });

    const rows = await auditLogRepository.findByOwnerId(idsA.userId);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      expect(row.ownerId).toBe(idsA.userId);
    }
  });

  test('findByFilters filters by decision', async () => {
    const ids = await createTestAgent('repo-filter-decision');

    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: ids.agentId,
      ownerId: ids.userId,
      companyId: ids.companyId,
      action: 'tool.run',
      decision: 'allow',
      reasons: JSON.stringify([]),
    });
    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: ids.agentId,
      ownerId: ids.userId,
      companyId: ids.companyId,
      action: 'tool.run',
      decision: 'deny',
      reasons: JSON.stringify([]),
    });

    const rows = await auditLogRepository.findByFilters({
      agentId: ids.agentId,
      decision: 'deny',
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      expect(row.decision).toBe('deny');
    }
  });

  test('findByFilters filters by action', async () => {
    const ids = await createTestAgent('repo-filter-action');

    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: ids.agentId,
      ownerId: ids.userId,
      companyId: ids.companyId,
      action: 'file.read',
      decision: 'allow',
      reasons: JSON.stringify([]),
    });
    await auditLogRepository.insert({
      auditId: crypto.randomUUID(),
      agentId: ids.agentId,
      ownerId: ids.userId,
      companyId: ids.companyId,
      action: 'file.write',
      decision: 'allow',
      reasons: JSON.stringify([]),
    });

    const rows = await auditLogRepository.findByFilters({
      agentId: ids.agentId,
      action: 'file.read',
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      expect(row.action).toBe('file.read');
    }
  });
});

describe('audit-log service', () => {
  test('append generates audit_id when not provided', async () => {
    const ids = await createTestAgent('svc-gen-audit-id');
    const entry = await auditLogService.append(makeInput(ids, { audit_id: undefined }));

    expect(entry.audit_id).toBeString();
    expect(entry.audit_id.length).toBeGreaterThan(0);
  });

  test('append uses provided audit_id', async () => {
    const ids = await createTestAgent('svc-provided-audit-id');
    const explicitId = crypto.randomUUID();
    const entry = await auditLogService.append(makeInput(ids, { audit_id: explicitId }));

    expect(entry.audit_id).toBe(explicitId);
  });

  test('append serializes reasons and context correctly', async () => {
    const ids = await createTestAgent('svc-serialize');
    const entry = await auditLogService.append(
      makeInput(ids, {
        reasons: ['policy.alpha', 'policy.beta'],
        context: { model: 'gpt-4', temperature: 0.7, tags: ['a', 'b'] },
      })
    );

    expect(Array.isArray(entry.reasons)).toBe(true);
    expect(entry.reasons).toEqual(['policy.alpha', 'policy.beta']);
    expect(typeof entry.context).toBe('object');
    expect(entry.context).not.toBeNull();
    expect(entry.context!.model).toBe('gpt-4');
    expect(entry.context!.temperature).toBe(0.7);
    expect(entry.context!.tags).toEqual(['a', 'b']);
  });

  test('appendMany inserts all entries', async () => {
    const ids = await createTestAgent('svc-append-many');
    const auditId = crypto.randomUUID();

    await auditLogService.appendMany([
      makeInput(ids, { audit_id: auditId, action: 'step.one' }),
      makeInput(ids, { audit_id: auditId, action: 'step.two' }),
    ]);

    const entries = await auditLogService.findRelated(auditId);
    expect(entries).toHaveLength(2);
  });

  test('search requires at least one scoping filter', async () => {
    try {
      await auditLogService.search({});
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.status).toBe(400);
      expect(appErr.code).toBe('audit_log.missing_scope');
    }
  });

  test('search filters by agent_id and decision', async () => {
    const ids = await createTestAgent('svc-search-combo');

    await auditLogService.append(makeInput(ids, { decision: 'allow', action: 'tool.a' }));
    await auditLogService.append(makeInput(ids, { decision: 'deny', action: 'tool.b' }));
    await auditLogService.append(makeInput(ids, { decision: 'deny', action: 'tool.c' }));

    const results = await auditLogService.search({
      agent_id: ids.agentId,
      decision: 'deny',
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    for (const entry of results) {
      expect(entry.agent_id).toBe(ids.agentId);
      expect(entry.decision).toBe('deny');
    }
  });

  test('returned DTOs use snake_case and correct types', async () => {
    const ids = await createTestAgent('svc-dto-shape');
    const entry = await auditLogService.append(makeInput(ids));

    expect(typeof entry.id).toBe('string');
    expect(typeof entry.audit_id).toBe('string');
    expect(typeof entry.agent_id).toBe('string');
    expect(typeof entry.owner_id).toBe('string');
    expect(typeof entry.company_id).toBe('string');
    expect(typeof entry.action).toBe('string');
    expect(typeof entry.decision).toBe('string');
    expect(Array.isArray(entry.reasons)).toBe(true);
    expect(typeof entry.created_at).toBe('number');
    expect(entry.policy_hit).toBeNull();
    expect(entry.context).toBeNull();
    expect(entry.request_id).toBeNull();

    const dto = entry as unknown as Record<string, unknown>;
    expect(dto.agentId).toBeUndefined();
    expect(dto.ownerId).toBeUndefined();
    expect(dto.companyId).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
    expect(dto.auditId).toBeUndefined();
    expect(dto.policyHit).toBeUndefined();
    expect(dto.requestId).toBeUndefined();
  });
});

describe('audit-log operational API events', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-audit-log-api@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  test('lists agent, permission, and key management events for the current company', async () => {
    const { token, companyId } = await createCompanyAndGetToken('audit-events');

    const created = await testClient.post<CreateAgentResponse>(
      '/agents',
      { name: 'Audited Agent' },
      authHeaders(token)
    );
    const agentId = created.data!.agent.id;

    await testClient.post(
      `/agents/${agentId}/permissions`,
      { action: 'read:emails' },
      authHeaders(token)
    );
    await testClient.post<RotateKeyResponse>(
      `/agents/${agentId}/rotate-key`,
      {},
      authHeaders(token)
    );
    await testClient.patch(`/agents/${agentId}/revoke`, {}, authHeaders(token));

    const auditLogs = await auditLogService.search({ company_id: companyId });
    const actions = auditLogs.map((entry) => entry.action);
    expect(actions).toContain('agent.create');
    expect(actions).toContain('permission.grant');
    expect(actions).toContain('agent.rotate_key');
    expect(actions).toContain('agent.revoke');
    expect(auditLogs.every((entry) => entry.company_id === companyId)).toBe(true);
  });
});
