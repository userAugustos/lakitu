import { expect, test } from '@playwright/test';

import { setupAuthenticatedPage } from './auth.setup';

const LOG_ID_1 = 'log_001';
const LOG_ID_2 = 'log_002';

const MOCK_AUDIT_LOGS = [
  {
    id: LOG_ID_1,
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
    id: LOG_ID_2,
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

const MOCK_VERIFY_VALID = {
  valid: true,
  chain_length: 2,
};

test.describe('Audit logs', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);

    await page.route('**/audit-logs/verify**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_VERIFY_VALID),
        });
      }
      return route.continue();
    });

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

  test('page loads and renders the audit log table', async ({ page }) => {
    await page.goto('/dashboard/audit-logs');

    await expect(page.getByTestId('audit-logs-table')).toBeVisible();
    await expect(page.getByText('Payroll Agent')).toBeVisible();
    await expect(page.getByText('Email Agent')).toBeVisible();
  });

  test('filters rows with the global audit log search input', async ({ page }) => {
    await page.goto('/dashboard/audit-logs');

    await expect(page.getByText('Payroll Agent')).toBeVisible();
    await expect(page.getByText('Email Agent')).toBeVisible();

    await page.getByTestId('audit-logs-global-filter').fill('payroll');

    await expect(page.getByText('Payroll Agent')).toBeVisible();
    await expect(page.getByText('Email Agent')).toHaveCount(0);
  });

  test('verify-chain-button exists and clicking it shows the result pill', async ({ page }) => {
    await page.goto('/dashboard/audit-logs');

    const verifyButton = page.getByTestId('verify-chain-button');
    await expect(verifyButton).toBeVisible();
    await expect(verifyButton).toContainText('Verify Chain');

    await verifyButton.click();

    const resultPill = page.getByTestId('verify-chain-result-pill');
    await expect(resultPill).toBeVisible();
    await expect(resultPill).toContainText('Chain verified · 2 entries');
  });

  test('verify-chain-button shows verifying state while the request is in-flight', async ({
    page,
  }) => {
    let resolveVerify!: () => void;
    const verifyHeld = new Promise<void>((res) => {
      resolveVerify = res;
    });

    await page.route('**/audit-logs/verify**', async (route) => {
      await verifyHeld;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_VERIFY_VALID),
      });
    });

    await page.goto('/dashboard/audit-logs');

    const verifyButton = page.getByTestId('verify-chain-button');
    await verifyButton.click();

    await expect(verifyButton).toBeDisabled();
    await expect(verifyButton).toContainText('Verifying...');

    resolveVerify();

    await expect(page.getByTestId('verify-chain-result-pill')).toBeVisible();
  });

  test('event-filter dropdown exists and can be opened', async ({ page }) => {
    await page.goto('/dashboard/audit-logs');

    const eventFilter = page.getByTestId('event-filter');
    await expect(eventFilter).toBeVisible();

    await eventFilter.click();
    await expect(page.getByRole('option', { name: 'All decisions' })).toBeVisible();
  });

  test('audit-log-row-expand-{id} expands the detail drawer for a row', async ({ page }) => {
    await page.goto('/dashboard/audit-logs');

    await expect(page.getByTestId(`audit-log-row-${LOG_ID_1}`)).toBeVisible();

    const expandButton = page.getByTestId(`audit-log-row-expand-${LOG_ID_1}`);
    await expect(expandButton).toBeVisible();

    await expandButton.click();

    await expect(page.getByText('req_001')).toBeVisible();
  });

  test('collapsing a row hides the detail drawer content', async ({ page }) => {
    await page.goto('/dashboard/audit-logs');

    const expandButton = page.getByTestId(`audit-log-row-expand-${LOG_ID_1}`);
    await expandButton.click();
    await expect(page.getByText('req_001')).toBeVisible();

    await expandButton.click();
    await expect(page.getByText('req_001')).not.toBeVisible();
  });
});
