import { expect, test } from '@playwright/test';

import { setupAuthenticatedPage } from './auth.setup';

const MOCK_AUDIT_LOGS = [
  {
    id: 'log_001',
    audit_id: 'audit_001',
    agent_id: 'agt_001',
    agent_name: 'Payroll Agent',
    owner_id: 'owner_placeholder',
    company_id: 'company_placeholder',
    action: 'create:transaction',
    decision: 'approved',
    reasons: ['within policy'],
    policy_hit: null,
    request_id: 'req_001',
    context: null,
    created_at: Date.now(),
  },
  {
    id: 'log_002',
    audit_id: 'audit_002',
    agent_id: 'agt_002',
    agent_name: 'Email Agent',
    owner_id: 'owner_placeholder',
    company_id: 'company_placeholder',
    action: 'read:emails',
    decision: 'deny',
    reasons: ['outside working hours'],
    policy_hit: 'work_hours',
    request_id: 'req_002',
    context: null,
    created_at: Date.now() - 1_000,
  },
];

test.describe('Audit logs', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);

    await page.route('**/audit-logs**', (route) => {
      const request = route.request();
      if (request.method() !== 'GET' || request.resourceType() !== 'fetch') {
        return route.continue();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ entries: MOCK_AUDIT_LOGS }),
      });
    });
  });

  test('filters rows with the global audit log search input', async ({ page }) => {
    await page.goto('/dashboard/audit-logs');

    await expect(page.getByText('Payroll Agent')).toBeVisible();
    await expect(page.getByText('Email Agent')).toBeVisible();

    await page.getByTestId('audit-logs-global-filter').fill('payroll');

    await expect(page.getByText('Payroll Agent')).toBeVisible();
    await expect(page.getByText('Email Agent')).toHaveCount(0);
  });
});
