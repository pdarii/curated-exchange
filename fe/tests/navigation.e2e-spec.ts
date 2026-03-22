import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/dashboard');
    // Wait for shell header to be present
    await page.locator('.shell-header').waitFor({ state: 'visible' });
  });

  test('header shows the brand logo "THE CURATED EXCHANGE"', async ({ page }) => {
    await expect(page.locator('.shell-logo')).toContainText('THE CURATED EXCHANGE');
  });

  test('header contains nav links: Dashboard, Market, Assets', async ({ page }) => {
    const nav = page.locator('.shell-nav');
    await expect(nav.locator('a', { hasText: 'Dashboard' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Market' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Assets' })).toBeVisible();
  });

  test('clicking Market nav link navigates to /market', async ({ page }) => {
    await page.locator('.shell-nav a', { hasText: 'Market' }).click();
    await expect(page).toHaveURL(/\/market/);
    await expect(page.locator('.mkt-header__title')).toBeVisible();
  });

  test('clicking Assets nav link navigates to /assets', async ({ page }) => {
    await page.locator('.shell-nav a', { hasText: 'Assets' }).click();
    await expect(page).toHaveURL(/\/assets/);
    await expect(page.locator('.assets-header__title')).toBeVisible();
  });

  test('clicking Dashboard nav link navigates back to /dashboard', async ({ page }) => {
    await page.goto('/market');
    await page.locator('.shell-nav a', { hasText: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('the brand logo link navigates to /dashboard', async ({ page }) => {
    await page.goto('/market');
    await page.locator('.shell-logo').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('active nav link has the active CSS class', async ({ page }) => {
    const dashLink = page.locator('.shell-nav a', { hasText: 'Dashboard' });
    await expect(dashLink).toHaveClass(/shell-nav__link--active/);

    await page.locator('.shell-nav a', { hasText: 'Market' }).click();
    const mktLink = page.locator('.shell-nav a', { hasText: 'Market' });
    await expect(mktLink).toHaveClass(/shell-nav__link--active/);
  });

  test('"View All Assets" link on dashboard navigates to /assets', async ({ page }) => {
    await page.locator('a', { hasText: 'View All Assets' }).click();
    await expect(page).toHaveURL(/\/assets/);
  });

  test('market page has "View Catalog →" link that navigates to /catalog', async ({ page }) => {
    await page.goto('/market');
    await page.locator('a', { hasText: /View Catalog/i }).click();
    await expect(page).toHaveURL(/\/catalog/);
  });

  // ---------------------------------------------------------------------------
  // Admin shell navigation
  // ---------------------------------------------------------------------------
  test('admin header shows Dashboard and Settings links', async ({ page }) => {
    await setSession(page, USERS.admin);
    await page.goto('/admin');
    await page.locator('.admin-header').waitFor({ state: 'visible' });

    const nav = page.locator('.admin-nav');
    await expect(nav.locator('a', { hasText: 'Dashboard' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Settings' })).toBeVisible();
  });

  test('admin can navigate to /admin/settings', async ({ page }) => {
    await setSession(page, USERS.admin);
    await page.goto('/admin');
    await page.locator('.admin-nav a', { hasText: 'Settings' }).click();
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.locator('.set-header__title')).toBeVisible();
  });
});
