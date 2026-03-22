import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.admin);
    await page.goto('/admin');
    await page.locator('.adm-header').waitFor({ state: 'visible' });
  });

  // ---------------------------------------------------------------------------
  // Page structure
  // ---------------------------------------------------------------------------
  test('displays "Market Overview" heading', async ({ page }) => {
    await expect(page.locator('.adm-header__title')).toContainText('Market Overview');
  });

  test('subtitle describes real-time ecosystem health', async ({ page }) => {
    await expect(page.locator('.adm-header__subtitle')).toContainText('Real-time');
  });

  // ---------------------------------------------------------------------------
  // Stats strip
  // ---------------------------------------------------------------------------
  test('shows Total Volume stat', async ({ page }) => {
    await expect(page.locator('.adm-stat').filter({ hasText: 'Total Volume' })).toBeVisible();
  });

  test('shows Avg Trade Price stat', async ({ page }) => {
    await expect(page.locator('.adm-stat').filter({ hasText: 'Avg Trade Price' })).toBeVisible();
  });

  test('shows Active Listings stat with a progress bar', async ({ page }) => {
    const listingsStat = page.locator('.adm-stat').filter({ hasText: 'Active Listings' });
    await expect(listingsStat).toBeVisible();
    await expect(listingsStat.locator('mat-progress-bar')).toBeVisible();
  });

  test('shows System Uptime stat', async ({ page }) => {
    await expect(page.locator('.adm-stat').filter({ hasText: 'System Uptime' })).toBeVisible();
  });

  test('stat values contain dollar signs or percentage signs', async ({ page }) => {
    const totalVolumeValue = await page
      .locator('.adm-stat')
      .filter({ hasText: 'Total Volume' })
      .locator('.adm-stat__value')
      .textContent();
    expect(totalVolumeValue).toMatch(/\$/);
  });

  // ---------------------------------------------------------------------------
  // Weekly Transaction Momentum chart
  // ---------------------------------------------------------------------------
  test('shows "Weekly Transaction Momentum" chart card', async ({ page }) => {
    await expect(page.locator('.adm-card-title', { hasText: 'Weekly Transaction Momentum' })).toBeVisible();
  });

  test('chart has 7 bar elements (one per day)', async ({ page }) => {
    await expect(page.locator('.adm-bar')).toHaveCount(7);
  });

  // ---------------------------------------------------------------------------
  // Live Activity Feed
  // ---------------------------------------------------------------------------
  test('shows "Live Activity Feed" card', async ({ page }) => {
    await expect(page.locator('.adm-card-title', { hasText: 'Live Activity Feed' })).toBeVisible();
  });

  test('activity feed contains feed items', async ({ page }) => {
    await expect(page.locator('.adm-feed-item')).not.toHaveCount(0);
  });

  test('each feed item has an avatar and text', async ({ page }) => {
    const firstItem = page.locator('.adm-feed-item').first();
    await expect(firstItem.locator('.adm-feed-item__avatar')).toBeVisible();
    await expect(firstItem.locator('.adm-feed-item__text')).toBeVisible();
  });

  test('"View All Activity Logs" button is visible', async ({ page }) => {
    await expect(page.locator('.adm-feed-btn')).toContainText('View All Activity Logs');
  });

  // ---------------------------------------------------------------------------
  // Admin navigation
  // ---------------------------------------------------------------------------
  test('admin nav shows both Dashboard and Settings links', async ({ page }) => {
    const nav = page.locator('.admin-nav');
    await expect(nav.locator('a', { hasText: 'Dashboard' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Settings' })).toBeVisible();
  });

  test('admin logo is "The Curated Exchange" and links to /admin', async ({ page }) => {
    await expect(page.locator('.admin-logo')).toContainText('The Curated Exchange');
    await page.locator('.admin-logo').click();
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.admin);
    await page.goto('/admin/settings');
    await page.locator('.set-header').waitFor({ state: 'visible' });
  });

  test('displays "Platform Settings" heading', async ({ page }) => {
    await expect(page.locator('.set-header__title')).toContainText('Platform Settings');
  });

  // ---------------------------------------------------------------------------
  // Simulation Parameters
  // ---------------------------------------------------------------------------
  test('shows "Simulation Parameters" card', async ({ page }) => {
    await expect(page.locator('.set-card__title', { hasText: 'Simulation Parameters' })).toBeVisible();
  });

  test('shows Time Dilation label and a value in minutes', async ({ page }) => {
    await expect(page.locator('.sim-param__label')).toContainText('Time Dilation');
    await expect(page.locator('.sim-param__value')).toContainText('Minutes');
  });

  test('time dilation slider is rendered', async ({ page }) => {
    await expect(page.locator('mat-slider')).toBeVisible();
  });

  test('shows Health Fluctuation Rate and Metabolic Aging Curve gauges', async ({ page }) => {
    await expect(page.locator('.sim-gauge__label', { hasText: 'Health Fluctuation Rate' })).toBeVisible();
    await expect(page.locator('.sim-gauge__label', { hasText: 'Metabolic Aging Curve' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Platform Inventory List
  // ---------------------------------------------------------------------------
  test('shows "Platform Inventory List" card', async ({ page }) => {
    await expect(page.locator('.set-card__title', { hasText: 'Platform Inventory List' })).toBeVisible();
  });

  test('inventory table has Breed, Priority, Retail Supply, Total Stock columns', async ({ page }) => {
    const header = page.locator('.inv-row--header');
    await expect(header).toContainText('Breed');
    await expect(header).toContainText('Priority');
    await expect(header).toContainText('Retail Supply');
    await expect(header).toContainText('Total Stock');
  });

  test('inventory table has at least one data row', async ({ page }) => {
    await expect(page.locator('.inv-row:not(.inv-row--header)')).not.toHaveCount(0);
  });

  test('"Download .CSV" action is visible', async ({ page }) => {
    await expect(page.locator('.set-card__action', { hasText: 'Download .CSV' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Inject Inventory sidebar
  // ---------------------------------------------------------------------------
  test('shows "Inject Inventory" card', async ({ page }) => {
    await expect(page.locator('.set-card__title', { hasText: 'Inject Inventory' })).toBeVisible();
  });

  test('shows "Pre-defined Stock" tag', async ({ page }) => {
    await expect(page.locator('.inject-tag')).toContainText('Pre-defined Stock');
  });

  test('inject items list contains at least one item with an Inject button', async ({ page }) => {
    await expect(page.locator('.inject-item')).not.toHaveCount(0);
    await expect(page.locator('.inject-btn').first()).toContainText('Inject');
  });

  test('"Bulk Inject All Stock" button is visible', async ({ page }) => {
    await expect(page.locator('.bulk-inject-btn')).toContainText('Bulk Inject All Stock');
  });
});
