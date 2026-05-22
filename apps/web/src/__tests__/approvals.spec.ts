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
    { action: 'read:emails', policy_limits: null },
    { action: 'create:transaction', policy_limits: { max_value: 500, max_by_day: 2 } },
  ],
  created_at: Date.now(),
  updated_at: Date.now(),
};

test.describe('Approvals simulation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);

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
            action: 'read:emails',
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

  test('trigger action only offers actions granted to the selected agent', async ({ page }) => {
    await page.goto('/dashboard/approvals');

    await page.getByTestId('simulate-btn').click();
    await page.getByTestId('simulate-agent-select').click();
    await page.getByRole('option', { name: 'Simulation Agent' }).click();

    await page.getByTestId('simulate-action-select').click();

    await expect(page.getByRole('option', { name: 'Read emails' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Create transaction' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Reply email' })).toHaveCount(0);
  });
});
