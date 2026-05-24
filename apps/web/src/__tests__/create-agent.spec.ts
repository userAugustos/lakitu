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

const MOCK_TOOLS_RESPONSE = {
  tools: [
    {
      key: 'gmail.messages.read',
      provider: 'gmail',
      resource: 'messages',
      verb: 'read',
      label: 'Read messages',
      description: 'Read emails from a Gmail inbox.',
      risk_level: 'low',
      policy_fields: [],
    },
    {
      key: 'stripe.charges.create',
      provider: 'stripe',
      resource: 'charges',
      verb: 'create',
      label: 'Create charge',
      description: 'Create a new charge in Stripe.',
      risk_level: 'high',
      policy_fields: [
        { key: 'max_amount', label: 'Max amount', type: 'number', placeholder: '1000' },
      ],
    },
    {
      key: 'stripe.refunds.create',
      provider: 'stripe',
      resource: 'refunds',
      verb: 'create',
      label: 'Create refund',
      description: 'Initiate a refund on a Stripe charge.',
      risk_level: 'critical',
      policy_fields: [
        { key: 'max_amount', label: 'Max amount', type: 'number', placeholder: '1000' },
      ],
    },
  ],
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

function interceptToolsCatalog(page: Page) {
  return page.route('**/tools', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TOOLS_RESPONSE),
      });
    }
    return route.continue();
  });
}

let permissionGrantCounter = 0;

function interceptPermissionGrant(page: Page) {
  return page.route('**/agents/*/permissions', (route) => {
    if (route.request().method() === 'POST') {
      permissionGrantCounter += 1;
      const body = route.request().postDataJSON() as {
        tool_key: string;
        policy_limits?: Record<string, unknown> | null;
        auto_approve?: boolean;
      };

      const tool = MOCK_TOOLS_RESPONSE.tools.find((t) => t.key === body.tool_key);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          permission: {
            id: `perm_e2e_${permissionGrantCounter.toString().padStart(3, '0')}`,
            agent_id: MOCK_AGENT_RESPONSE.agent.id,
            tool_key: body.tool_key,
            policy_limits: body.policy_limits ?? null,
            auto_approve: body.auto_approve ?? false,
            created_at: Date.now(),
            updated_at: Date.now(),
            risk_level: tool?.risk_level ?? 'low',
          },
        }),
      });
    }
    return route.continue();
  });
}

test.describe('Create Agent flow', () => {
  test.beforeEach(async ({ page }) => {
    permissionGrantCounter = 0;
    await setupAuthenticatedPage(page);
    await interceptAgentCreation(page);
    await interceptToolsCatalog(page);
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

  test('happy path: name -> tool access step -> clawkey -> done', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('E2E Test Agent');
    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByTestId('tool-select-trigger')).toBeVisible();
    await expect(page.getByText(/Tool Access for E2E Test Agent/)).toBeVisible();
    await expect(page.getByTestId('tool-access-continue')).toBeVisible();

    await page.getByTestId('tool-access-continue').click();

    await expect(page.getByTestId('clawkey-registration-url')).toBeVisible();
    await expect(page.getByTestId('private-key-display')).toBeVisible();
    await expect(page.getByText('Save this private key')).toBeVisible();
    await expect(page.getByTestId('clawkey-continue')).toBeVisible();

    await page.getByTestId('clawkey-continue').click();

    await expect(page.getByTestId('agent-done')).toBeVisible();
    await expect(page.getByText('Agent E2E Test Agent is live')).toBeVisible();
  });

  test('tool access step: granting gmail.messages.read (Low) shows LOW badge and no auto-approve toggle', async ({
    page,
  }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('Low Risk Agent');
    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByTestId('tool-select-trigger')).toBeVisible();

    await page.getByTestId('tool-select-trigger').click();
    await page.getByTestId('tool-select-option-gmail.messages.read').click();

    await expect(page.getByTestId('tool-risk-badge')).toBeVisible();
    await expect(page.getByTestId('tool-risk-badge')).toContainText('LOW');

    await expect(page.getByTestId('auto-approve-toggle')).not.toBeVisible();

    await page.getByTestId('tool-access-submit').click();

    await expect(page.getByTestId('granted-tool-row-gmail.messages.read')).toBeVisible();
  });

  test('tool access step: granting stripe.charges.create (High) shows auto-approve toggle', async ({
    page,
  }) => {
    const grantBodies: Array<{ tool_key: string; auto_approve?: boolean }> = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/permissions')) {
        grantBodies.push(request.postDataJSON() as { tool_key: string; auto_approve?: boolean });
      }
    });

    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('High Risk Agent');
    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByTestId('tool-select-trigger')).toBeVisible();

    await page.getByTestId('tool-select-trigger').click();
    await page.getByTestId('tool-select-option-stripe.charges.create').click();

    await expect(page.getByTestId('tool-risk-badge')).toContainText('HIGH');
    await expect(page.getByTestId('auto-approve-toggle')).toBeVisible();

    await expect(page.getByTestId('critical-tool-banner')).not.toBeVisible();

    await page.getByTestId('auto-approve-toggle').click();

    await page.getByTestId('tool-policy-field-max_amount').fill('500');

    await page.getByTestId('tool-access-submit').click();

    await expect(page.getByTestId('granted-tool-row-stripe.charges.create')).toBeVisible();
    expect(grantBodies[0]?.auto_approve).toBe(true);
  });

  test('tool access step: selecting stripe.refunds.create (Critical) shows critical banner and hides auto-approve toggle', async ({
    page,
  }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('Critical Risk Agent');
    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByTestId('tool-select-trigger')).toBeVisible();

    await page.getByTestId('tool-select-trigger').click();
    await page.getByTestId('tool-select-option-stripe.refunds.create').click();

    await expect(page.getByTestId('tool-risk-badge')).toContainText('CRITICAL');
    await expect(page.getByTestId('critical-tool-banner')).toBeVisible();
    await expect(page.getByTestId('critical-tool-banner')).toContainText(
      'every request will require manual approval'
    );

    await expect(page.getByTestId('auto-approve-toggle')).not.toBeVisible();
  });

  test('tool access step: continue button skips granting and advances to clawkey', async ({
    page,
  }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('Skip Permissions Agent');
    await page.getByTestId('create-agent-submit').click();

    await expect(page.getByTestId('tool-access-continue')).toBeVisible();
    await expect(page.getByTestId('tool-access-continue')).toContainText('Skip & continue');

    await page.getByTestId('tool-access-continue').click();

    await expect(page.getByTestId('clawkey-registration-url')).toBeVisible();
  });

  test('clawkey step displays the registration URL and private key', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('ClawKey Detail Agent');
    await page.getByTestId('create-agent-submit').click();
    await page.getByTestId('tool-access-continue').click();

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
    await page.getByTestId('tool-access-continue').click();
    await page.getByTestId('clawkey-continue').click();

    await expect(page.getByTestId('agent-done')).toBeVisible();
    await expect(page.getByText('Redirecting to dashboard')).toBeVisible();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });

  test('step indicator reflects current step labels', async ({ page }) => {
    await page.goto('/dashboard/create-agent');

    await expect(page.getByText('Name', { exact: true })).toBeVisible();
    await expect(page.getByText('Permissions', { exact: true })).toBeVisible();
    await expect(page.getByText('ClawKey', { exact: true })).toBeVisible();
    await expect(page.getByText('Done', { exact: true })).toBeVisible();
  });

  test('granted tool row has a revoke button', async ({ page }) => {
    page.on('request', () => {});

    await page.route('**/agents/*/permissions/gmail.messages.read', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.continue();
    });

    await page.goto('/dashboard/create-agent');

    await page.getByTestId('agent-name-input').fill('Revoke Test Agent');
    await page.getByTestId('create-agent-submit').click();

    await page.getByTestId('tool-select-trigger').click();
    await page.getByTestId('tool-select-option-gmail.messages.read').click();
    await page.getByTestId('tool-access-submit').click();

    await expect(page.getByTestId('granted-tool-row-gmail.messages.read')).toBeVisible();
    await expect(page.getByTestId('granted-tool-revoke-gmail.messages.read')).toBeVisible();
  });
});
