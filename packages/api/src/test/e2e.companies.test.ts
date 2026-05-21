import { describe, expect, test } from 'bun:test';

import type { VerifyResponse } from '@api/modules/auth/types';
import type {
  Company,
  ListMembersResponse,
  SearchCompaniesResponse,
} from '@api/modules/companies/types';
import type { OnboardingStatus } from '@api/modules/onboarding/types';

import { setupE2ETests } from './e2e.setup';
import { testClient } from './test.utils';

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

describe('companies', () => {
  test('warmup (absorbs Bun first-POST timing quirk)', (done) => {
    testClient
      .post('/auth/challenge', { email: 'warmup-companies@lakitu.test' })
      .then(() => done())
      .catch((e) => done(e));
  });

  describe('create', () => {
    test('requires authentication', async () => {
      const res = await testClient.post('/companies', { name: 'Acme Inc' });
      expect(res.error).not.toBeNull();
    });

    test('creates a company and assigns user', async () => {
      const token = await getToken('create-co@lakitu.test');
      const res = await testClient.post<Company>(
        '/companies',
        { name: 'Acme Inc' },
        authHeaders(token)
      );

      expect(res.error).toBeNull();
      expect(res.data?.name).toBe('Acme Inc');
      expect(res.data?.id).toBeTruthy();
      expect(res.data?.created_at).toBeGreaterThan(0);
    });

    test('rejects duplicate company name with 409', async () => {
      const token = await getToken('create-co-dup@lakitu.test');
      await testClient.post('/companies', { name: 'Duplicate Corp' }, authHeaders(token));

      const token2 = await getToken('create-co-dup2@lakitu.test');
      const res = await testClient.post(
        '/companies',
        { name: 'Duplicate Corp' },
        authHeaders(token2)
      );

      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(409);
    });

    test('rejects if user already belongs to a company with 409', async () => {
      const token = await getToken('create-co-already@lakitu.test');
      await testClient.post('/companies', { name: 'Already Corp' }, authHeaders(token));

      const res = await testClient.post('/companies', { name: 'Another Corp' }, authHeaders(token));

      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(409);
    });

    test('rejects empty name with 400', async () => {
      const token = await getToken('create-co-empty@lakitu.test');
      const res = await testClient.post('/companies', { name: '   ' }, authHeaders(token));

      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(400);
    });
  });

  describe('join', () => {
    test('joins an existing company', async () => {
      const ownerToken = await getToken('join-owner@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Joinable Inc' },
        authHeaders(ownerToken)
      );
      const companyId = created.data!.id;

      const joinerToken = await getToken('join-joiner@lakitu.test');
      const res = await testClient.post<Company>(
        `/companies/${companyId}/join`,
        {},
        authHeaders(joinerToken)
      );

      expect(res.error).toBeNull();
      expect(res.data?.id).toBe(companyId);
      expect(res.data?.name).toBe('Joinable Inc');
    });

    test('rejects join for non-existent company with 404', async () => {
      const token = await getToken('join-notfound@lakitu.test');
      const res = await testClient.post(
        '/companies/00000000-0000-0000-0000-000000000000/join',
        {},
        authHeaders(token)
      );

      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(404);
    });

    test('rejects join if user already belongs to a company with 409', async () => {
      const ownerToken = await getToken('join-already-owner@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Join Already Inc' },
        authHeaders(ownerToken)
      );

      const res = await testClient.post(
        `/companies/${created.data!.id}/join`,
        {},
        authHeaders(ownerToken)
      );

      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(409);
    });
  });

  describe('search', () => {
    test('finds companies by substring', async () => {
      const token = await getToken('search-co@lakitu.test');
      await testClient.post('/companies', { name: 'Searchable Labs' }, authHeaders(token));

      const token2 = await getToken('search-co2@lakitu.test');
      const res = await testClient.get<SearchCompaniesResponse>(
        '/companies?q=Searchable',
        authHeaders(token2)
      );

      expect(res.error).toBeNull();
      expect(res.data?.companies.length).toBeGreaterThanOrEqual(1);
      expect(res.data?.companies.some((c) => c.name === 'Searchable Labs')).toBe(true);
    });

    test('returns empty array for non-matching query', async () => {
      const token = await getToken('search-empty@lakitu.test');
      const res = await testClient.get<SearchCompaniesResponse>(
        '/companies?q=zzz-nonexistent-zzz',
        authHeaders(token)
      );

      expect(res.error).toBeNull();
      expect(res.data?.companies).toEqual([]);
    });
  });

  describe('list members', () => {
    test('lists members of a company the user belongs to', async () => {
      const ownerToken = await getToken('members-owner@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Members Inc' },
        authHeaders(ownerToken)
      );
      const companyId = created.data!.id;

      const joinerToken = await getToken('members-joiner@lakitu.test');
      await testClient.post(`/companies/${companyId}/join`, {}, authHeaders(joinerToken));

      const res = await testClient.get<ListMembersResponse>(
        `/companies/${companyId}/members`,
        authHeaders(ownerToken)
      );

      expect(res.error).toBeNull();
      expect(res.data?.members.length).toBe(2);
      const emails = res.data?.members.map((m) => m.email).sort();
      expect(emails).toEqual(['members-joiner@lakitu.test', 'members-owner@lakitu.test']);
    });

    test('rejects non-member with 403', async () => {
      const ownerToken = await getToken('members-priv-owner@lakitu.test');
      const created = await testClient.post<Company>(
        '/companies',
        { name: 'Private Inc' },
        authHeaders(ownerToken)
      );

      const outsiderToken = await getToken('members-outsider@lakitu.test');
      const res = await testClient.get(
        `/companies/${created.data!.id}/members`,
        authHeaders(outsiderToken)
      );

      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(403);
    });

    test('rejects for non-existent company with 404', async () => {
      const token = await getToken('members-notfound@lakitu.test');
      const res = await testClient.get(
        '/companies/00000000-0000-0000-0000-000000000000/members',
        authHeaders(token)
      );

      expect(res.error).not.toBeNull();
      expect((res.error as { status: number }).status).toBe(404);
    });
  });

  describe('onboarding integration', () => {
    test('company condition flips to satisfied after creating a company', async () => {
      const email = 'onboard-co@lakitu.test';
      const token = await getToken(email);

      const before = await testClient.get<OnboardingStatus>(
        '/onboarding/status',
        authHeaders(token)
      );
      expect(before.data?.conditions.company.satisfied).toBe(false);

      await testClient.post('/companies', { name: 'Onboard Corp' }, authHeaders(token));

      const after = await testClient.get<OnboardingStatus>(
        '/onboarding/status',
        authHeaders(token)
      );
      expect(after.data?.conditions.company.satisfied).toBe(true);
    });
  });
});
