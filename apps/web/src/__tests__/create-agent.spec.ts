import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { setupAuthenticatedPage } from './auth.setup';

const MOCK_AGENT_RESPONSE = {
  agent: {
    id: 'agt_e2e_test_001',
    name: 'E2E Test Agent',
    owner_id: 'owner_placeholder',
    company_id: 'company_placeholder',
    ed25519_public_key: 'dGVzdC1wdWJsaWMta2V5LWJhc2U2NA==',
    clawkey_session_id: 'session_e2e_test',
    clawkey_status: 'pending',
    clawkey_registered_at: null,
    status: 'active',
    permissions: [],
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  ed25519_private_key: 'dGVzdC1wcml2YXRlLWtleS1iYXNlNjQ=',
  registration_url: 'https://api.ag9.ai/v1/agent/register/session_e2e_test',
};

const MOCK_PERMISSION_RESPONSE = {
  permission: {
    id: 'perm_e2e_001',
    agent_id: 'agt_e2e_test_001',
    action: 'read:telemetry',
    policy_limits: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
};

function interceptAgentCreation(page: Page) {
  return page.route('**/agents', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AGENT_RESPONSE),
      });
    }
    return route.continue();
  });
}

function interceptPermissionGrant(page: Page) {
  return page.route('**/agents/*/permissions', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PERMISSION_RESPONSE),
      });
    }
    return route.continue();
  });
}

test.describe('Create Agent flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
    await interceptAgentCreation(page);
    await interceptPermissionGrant(page);
  });

  test('shows the naming step with form elements', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await expect(page.getByTestId('agent-name-input')).toBeVisible();
    await expect(page.getByTestId('create-agent-submit')).toBeVisible();
    await expect(page.getByLabel('Agent name')).toBeVisible();
  });

  test('displays validation error when submitting an empty name', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByText('Agent name is required')).toBeVisible();
  });

  test('happy path: name -> permissions -> clawkey -> done', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('E2E Test Agent');
    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByTestId('permission-action-input')).toBeVisible();
    await expect(page.getByText(/Permissions for E2E Test Agent/)).toBeVisible();
    await expect(page.getByTestId('permissions-continue')).toBeVisible();

    await page.getByTestId('permissions-continue').click();

    await expect(page.getByTestId('clawkey-registration-url')).toBeVisible();
    await expect(page.getByTestId('private-key-display')).toBeVisible();
    await expect(page.getByText('Save this private key')).toBeVisible();
    await expect(page.getByTestId('clawkey-continue')).toBeVisible();

    await page.getByTestId('clawkey-continue').click();

    await expect(page.getByTestId('agent-done')).toBeVisible();
    await expect(page.getByText('Agent E2E Test Agent is live')).toBeVisible();
  });

  test('permissions step: add a permission before continuing', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('Permission Test Agent');
    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByTestId('permission-action-input')).toBeVisible();

    await page.getByTestId('permission-action-input').fill('read:telemetry');
    await page.getByTestId('add-permission-submit').click();

    await expect(page.getByText('read:telemetry')).toBeVisible();

    await page.getByTestId('permissions-continue').click();

    await expect(page.getByTestId('clawkey-registration-url')).toBeVisible();
  });

  test('clawkey step displays the registration URL and private key', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('ClawKey Detail Agent');
    await page.getByTestId('create-agent-submit').click();
    await page.getByTestId('permissions-continue').click();

    const registrationLink = page.getByTestId('clawkey-registration-url');
    await expect(registrationLink).toBeVisible();
    await expect(registrationLink).toHaveAttribute('href', /ag9\.ai/);

    const privateKeyDisplay = page.getByTestId('private-key-display');
    await expect(privateKeyDisplay).toBeVisible();
    await expect(privateKeyDisplay).not.toHaveText('');
  });

  test('done step auto-redirects back to dashboard', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('Redirect Agent');
    await page.getByTestId('create-agent-submit').click();
    await page.getByTestId('permissions-continue').click();
    await page.getByTestId('clawkey-continue').click();

    await expect(page.getByTestId('agent-done')).toBeVisible();
    await expect(page.getByText('Redirecting to dashboard')).toBeVisible();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });

  test('step indicator reflects current step', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await expect(page.getByText('Name', { exact: true })).toBeVisible();
    await expect(page.getByText('Permissions', { exact: true })).toBeVisible();
    await expect(page.getByText('ClawKey', { exact: true })).toBeVisible();
    await expect(page.getByText('Done', { exact: true })).toBeVisible();
  });
});
