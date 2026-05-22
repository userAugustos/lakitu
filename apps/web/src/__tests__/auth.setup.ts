import type { Page } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

interface AuthSetupResult {
  token: string;
  user: { id: string; email: string; name: string | null; status: string };
}

let authCounter = 0;

function uniqueTestEmail(): string {
  authCounter += 1;
  return `e2e-${Date.now()}-${authCounter}@lakitu.test`;
}

async function authenticateViaApi(email: string): Promise<AuthSetupResult> {
  const challengeRes = await fetch(`${API_URL}/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!challengeRes.ok) {
    const body = await challengeRes.text();
    throw new Error(`auth/challenge failed (${challengeRes.status}): ${body}`);
  }

  const verifyRes = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, code: '111111' }),
  });

  if (!verifyRes.ok) {
    const body = await verifyRes.text();
    throw new Error(`auth/verify failed (${verifyRes.status}): ${body}`);
  }

  const verifyData = (await verifyRes.json()) as {
    token: string;
    user: AuthSetupResult['user'];
  };

  return { token: verifyData.token, user: verifyData.user };
}

async function createCompanyViaApi(
  token: string,
  companyName: string
): Promise<{ id: string; name: string }> {
  const res = await fetch(`${API_URL}/companies`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: companyName }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST /companies failed (${res.status}): ${body}`);
  }

  return (await res.json()) as { id: string; name: string };
}

const ONBOARDED_STATUS_RESPONSE = {
  onboarded: true,
  next_step: null,
  conditions: {
    company: { satisfied: true },
    very_ai_linked: { satisfied: true },
    very_ai_verified: { satisfied: true },
  },
};

export async function setupAuthenticatedPage(page: Page): Promise<AuthSetupResult> {
  const email = uniqueTestEmail();
  const auth = await authenticateViaApi(email);

  const companyName = `Test Co ${Date.now()}-${authCounter}`;
  await createCompanyViaApi(auth.token, companyName);

  await page.route('**/onboarding/status', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ONBOARDED_STATUS_RESPONSE),
    });
  });

  const zustandState = JSON.stringify({
    state: {
      user: auth.user,
      token: auth.token,
    },
    version: 0,
  });

  await page.addInitScript((storageValue: string) => {
    window.localStorage.setItem('lakitu-auth-storage', storageValue);
  }, zustandState);

  return auth;
}
