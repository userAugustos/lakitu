import { expect, test } from '@playwright/test';

import { setupAuthenticatedPage } from './auth.setup';

const MOCK_AGENT_WITH_PERMISSIONS = {
  id: 'agt_sim_001',
  name: 'Simulation Agent',
  owner_id: 'owner_placeholder',
  company_id: 'company_placeholder',
  ed25519_public_key: 'dGVzdC1wdWJsaWMta2V5LWJhc2U2NA==',
  clawkey_session_id: 'session_sim_test',
  clawkey_status: 'completed',
  clawkey_registered_at: Date.now(),
  status: 'active',
  permissions: [
    { tool_key: 'gmail.messages.read', policy_limits: null, auto_approve: false },
    { tool_key: 'stripe.charges.create', policy_limits: { max_amount: 500 }, auto_approve: false },
  ],
  created_at: Date.now(),
  updated_at: Date.now(),
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
      key: 'gmail.drafts.create',
      provider: 'gmail',
      resource: 'drafts',
      verb: 'create',
      label: 'Create draft',
      description: 'Create a new email draft in Gmail.',
      risk_level: 'low',
      policy_fields: [],
    },
  ],
};

test.describe('Approvals simulation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);

    await page.route('**/tools', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TOOLS_RESPONSE),
        });
      }
      return route.continue();
    });

    await page.route('**/agents', (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ agents: [MOCK_AGENT_WITH_PERMISSIONS] }),
      });
    });

    await page.route('**/pending-actions**', (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === 'GET' && url.pathname.endsWith('/pending-actions')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ pending_actions: [] }),
        });
      }
      if (
        route.request().method() === 'POST' &&
        url.pathname.endsWith('/pending-actions/simulate')
      ) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'pa_sim_001',
            agent_id: MOCK_AGENT_WITH_PERMISSIONS.id,
            agent_name: MOCK_AGENT_WITH_PERMISSIONS.name,
            tool_key: 'gmail.messages.read',
            context: {},
            policy_hit: 'manual_simulation',
            status: 'pending',
            expires_at: Date.now() + 86_400_000,
            resolved_by: null,
            resolution_note: null,
            resolved_at: null,
            created_at: Date.now(),
            updated_at: Date.now(),
          }),
        });
      }
      return route.continue();
    });
  });

  test('trigger tool only offers tools granted to the selected agent', async ({ page }) => {
    await page.goto('/dashboard/approvals');

    await page.getByTestId('simulate-btn').click();
    await page.getByTestId('simulate-agent-select').click();
    await page.getByRole('option', { name: 'Simulation Agent' }).click();

    await page.getByTestId('simulate-action-select').click();

    await expect(page.getByRole('option', { name: 'Read messages' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Create charge' })).toBeVisible();

    await expect(page.getByRole('option', { name: 'Create draft' })).toHaveCount(0);
  });
});
