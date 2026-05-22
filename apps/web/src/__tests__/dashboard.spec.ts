import { expect, test } from '@playwright/test';

import { setupAuthenticatedPage } from './auth.setup';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('renders the main layout elements', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page.getByLabel('Lakitu')).toBeVisible();
    await expect(page.getByTestId('new-agent-button')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible();
  });

  test('shows the user greeting with agent count', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText(/Hey .+ 👋/)).toBeVisible();
    await expect(page.getByText(/agents on the grid/)).toBeVisible();
  });

  test('displays the agent table with mock data when no real agents exist', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText('Race Officiator')).toBeVisible();
    await expect(page.getByText('Lap Counter')).toBeVisible();
    await expect(page.getByText('Showing')).toBeVisible();
  });

  test('shows quick action cards', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText('Approval Inbox')).toBeVisible();
    await expect(page.getByText('Audit Logs')).toBeVisible();
  });

  test('navigating to create-agent via the new agent button', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByTestId('new-agent-button').click();

    await expect(page).toHaveURL(/\/dashboard\/create-agent/);
    await expect(page.getByTestId('agent-name-input')).toBeVisible();
  });

  test('navigating to audit logs via the quick action card', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByText('Audit Logs').click();

    await expect(page).toHaveURL(/\/dashboard\/audit-logs/);
  });
});
