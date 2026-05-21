import { createHash, sign } from 'node:crypto';

import { describe, expect, mock, test } from 'bun:test';

import { db, rawSqlite } from '@api/db/client';
import { agentPermissions, agents, companies, users } from '@api/db/schema';
import { generateEd25519KeyPair } from '@api/modules/agents/crypto';
import { sortedReplacer } from '@api/modules/gateway/lib/verify-signature';
import type { GatewayDecideRequest, GatewayDecideResponse } from '@api/modules/gateway/types';

import { setupE2ETests } from './e2e.setup';

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

function signGatewayRequest(body: GatewayDecideRequest, privateKeyBase64: string): string {
  const bodyJson = JSON.stringify(body, sortedReplacer);
  const sha256Hex = createHash('sha256').update(bodyJson).digest('hex');
  const digest = `${body.nonce}.${body.timestamp}.${sha256Hex}`;

  const privateKeyDer = Buffer.from(privateKeyBase64, 'base64');
  const signature = sign(null, Buffer.from(digest), {
    key: privateKeyDer,
    format: 'der',
    type: 'pkcs8',
  });
  return Buffer.from(signature).toString('base64');
}

function makeBody(
  agentId: string,
  overrides: Partial<GatewayDecideRequest> = {}
): GatewayDecideRequest {
  return {
    agent_id: agentId,
    action: 'create_payment',
    context: { amount: 100, currency: 'USD' },
    nonce: crypto.randomUUID().replace(/-/g, ''),
    timestamp: Date.now(),
    ...overrides,
  };
}

const BASE = 'http://localhost';

async function postGateway(
  body: GatewayDecideRequest,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: GatewayDecideResponse | null; raw: unknown }> {
  const { lakituApi } = await import('@api/app');
  const res = await lakituApi.handle(
    new Request(`${BASE}/gateway/decide`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  );
  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return {
    status: res.status,
    data: res.ok ? (parsed as GatewayDecideResponse) : null,
    raw: parsed,
  };
}

interface TestAgent {
  agentId: string;
  userId: string;
  companyId: string;
  publicKeyBase64: string;
  privateKeyBase64: string;
}

async function createFullAgent(
  suffix: string,
  overrides: {
    agentStatus?: 'active' | 'revoked';
    clawkeySessionId?: string | null;
    clawkeyStatus?: 'pending' | 'completed' | 'expired' | 'failed';
    veryAiStatus?: 'unlinked' | 'pending' | 'verified' | 'revoked';
    userCompanyId?: string;
  } = {}
): Promise<TestAgent> {
  const userId = crypto.randomUUID();
  const companyId = crypto.randomUUID();
  const agentId = crypto.randomUUID();
  const keys = generateEd25519KeyPair();

  await db.insert(companies).values({ id: companyId, name: `gw-co-${suffix}-${Date.now()}` });
  await db.insert(users).values({
    id: userId,
    email: `gw-${suffix}-${Date.now()}@lakitu.test`,
    companyId: overrides.userCompanyId ?? companyId,
    status: 'ACTIVE',
    veryAiStatus: overrides.veryAiStatus ?? 'verified',
  });
  await db.insert(agents).values({
    id: agentId,
    name: `agent-${suffix}`,
    ownerId: userId,
    companyId,
    ed25519PublicKey: keys.publicKeyBase64,
    ed25519PrivateKey: keys.privateKeyBase64,
    status: overrides.agentStatus ?? 'active',
    clawkeySessionId:
      overrides.clawkeySessionId !== undefined ? overrides.clawkeySessionId : 'mock-session-id',
    clawkeyStatus: overrides.clawkeyStatus ?? 'completed',
  });

  return {
    agentId,
    userId,
    companyId,
    publicKeyBase64: keys.publicKeyBase64,
    privateKeyBase64: keys.privateKeyBase64,
  };
}

async function grantPermission(
  agentId: string,
  action: string,
  policyLimits?: Record<string, unknown>
) {
  await db.insert(agentPermissions).values({
    agentId,
    action,
    policyLimits: policyLimits ? JSON.stringify(policyLimits) : null,
  });
}

describe('gateway /decide', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    const body = makeBody(crypto.randomUUID());
    postGateway(body)
      .then(() => done())
      .catch((e) => done(e));
  });

  test('denies when signature header is missing', async () => {
    const agent = await createFullAgent('no-sig');
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);

    const res = await postGateway(body);

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('missing signature');
  });

  test('denies when agent is not found', async () => {
    const fakeAgentId = crypto.randomUUID();
    const keys = generateEd25519KeyPair();
    const body = makeBody(fakeAgentId);
    const sig = signGatewayRequest(body, keys.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('agent not found');
  });

  test('denies when signature is invalid (wrong key)', async () => {
    const agent = await createFullAgent('bad-sig');
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);

    const wrongKeys = generateEd25519KeyPair();
    const sig = signGatewayRequest(body, wrongKeys.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('invalid signature');
  });

  test('denies when timestamp is too old (6 min ago)', async () => {
    const agent = await createFullAgent('old-ts');
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId, {
      timestamp: Date.now() - 6 * 60 * 1000,
    });
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons[0]).toContain('replay');
  });

  test('denies when timestamp is too far in the future (6 min ahead)', async () => {
    const agent = await createFullAgent('future-ts');
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId, {
      timestamp: Date.now() + 6 * 60 * 1000,
    });
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons[0]).toContain('replay');
  });

  test('denies when agent status is revoked', async () => {
    const agent = await createFullAgent('revoked', { agentStatus: 'revoked' });
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('agent revoked');
  });

  test('denies when clawkey session is not completed', async () => {
    const agent = await createFullAgent('no-clawkey', {
      clawkeySessionId: null,
    });
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('no clawkey binding');
  });

  test('denies when owner veryAiStatus is not verified', async () => {
    const agent = await createFullAgent('unverified-owner', {
      veryAiStatus: 'pending',
    });
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('owner identity not verified');
  });

  test('denies when owner left company (companyId mismatch)', async () => {
    const otherCompanyId = crypto.randomUUID();
    await db.insert(companies).values({ id: otherCompanyId, name: `gw-other-co-${Date.now()}` });
    const agent = await createFullAgent('left-company', {
      userCompanyId: otherCompanyId,
    });
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('owner no longer member of agent company');
  });

  test('denies when agent has no permission for the action', async () => {
    const agent = await createFullAgent('no-perm');
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('no permission for action');
  });

  test('denies when amount exceeds policy max_amount', async () => {
    const agent = await createFullAgent('exceed-amount');
    await grantPermission(agent.agentId, 'create_payment', { max_amount: 50 });
    const body = makeBody(agent.agentId, {
      context: { amount: 100, currency: 'USD' },
    });
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons[0]).toContain('exceeds');
  });

  test('denies when outside allowed hours window', async () => {
    const agent = await createFullAgent('bad-hours');
    const currentHour = new Date().getUTCHours();
    const outsideStart = (currentHour + 2) % 24;
    const outsideEnd = (currentHour + 4) % 24;
    await grantPermission(agent.agentId, 'create_payment', {
      allowed_hours: { start: outsideStart, end: outsideEnd },
    });
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons[0]).toContain('outside allowed window');
  });

  test('returns approval_required when policy requires approval', async () => {
    const agent = await createFullAgent('needs-approval');
    await grantPermission(agent.agentId, 'create_payment', { requires_approval: true });
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('approval_required');
    expect(res.data!.reasons).toContain('requires approval per policy');
    expect(res.data!.pending_action_id).toBeString();
    expect(res.data!.pending_action_id!.length).toBeGreaterThan(0);
  });

  test('allows when all checks pass and no policy limits', async () => {
    const agent = await createFullAgent('happy-no-limits');
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('allow');
    expect(res.data!.reasons).toEqual([]);
    expect(res.data!.audit_id).toBeString();
  });

  test('allows when amount is within policy limit', async () => {
    const agent = await createFullAgent('within-limit');
    await grantPermission(agent.agentId, 'create_payment', { max_amount: 500 });
    const body = makeBody(agent.agentId, {
      context: { amount: 100, currency: 'USD' },
    });
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('allow');
    expect(res.data!.reasons).toEqual([]);
  });

  test('denies when clawkey live check returns non-completed status', async () => {
    const agent = await createFullAgent('clawkey-pending');
    await grantPermission(agent.agentId, 'create_payment');
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const { clawkeyClient } = await import('@api/modules/agents/clawkey.client');
    (clawkeyClient.getSessionStatus as ReturnType<typeof mock>).mockResolvedValueOnce({
      status: 'pending',
      deviceId: 'mock-device',
      registration: null,
    });

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('clawkey binding not completed');
  });

  test('denies when owner not found', async () => {
    const agent = await createFullAgent('orphan');
    await grantPermission(agent.agentId, 'create_payment');

    const orphanOwnerId = crypto.randomUUID();
    rawSqlite.exec('PRAGMA foreign_keys = OFF');
    rawSqlite.exec(`UPDATE agents SET owner_id = '${orphanOwnerId}' WHERE id = '${agent.agentId}'`);

    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    try {
      const res = await postGateway(body, { 'agent-signature': sig });

      expect(res.status).toBe(200);
      expect(res.data!.decision).toBe('deny');
      expect(res.data!.reasons).toContain('owner not found');
    } finally {
      rawSqlite.exec('PRAGMA foreign_keys = ON');
    }
  });

  test('denies when policy limits contain invalid JSON', async () => {
    const agent = await createFullAgent('bad-json');
    await db.insert(agentPermissions).values({
      agentId: agent.agentId,
      action: 'create_payment',
      policyLimits: 'not valid json {{{',
    });
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('malformed policy limits');
  });

  test('denies when policy limits are valid JSON but invalid schema', async () => {
    const agent = await createFullAgent('bad-schema');
    await db.insert(agentPermissions).values({
      agentId: agent.agentId,
      action: 'create_payment',
      policyLimits: '{"max_amount": "not-a-number"}',
    });
    const body = makeBody(agent.agentId);
    const sig = signGatewayRequest(body, agent.privateKeyBase64);

    const res = await postGateway(body, { 'agent-signature': sig });

    expect(res.status).toBe(200);
    expect(res.data!.decision).toBe('deny');
    expect(res.data!.reasons).toContain('malformed policy limits');
  });
});
