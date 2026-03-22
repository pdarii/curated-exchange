import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';
import { DashboardPage } from './page-objects/DashboardPage';

test.describe('Dashboard', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
    dashboard = new DashboardPage(page);
    await dashboard.goto();
  });

  // ---------------------------------------------------------------------------
  // Financial strip
  // ---------------------------------------------------------------------------
  test('displays Available Cash card', async () => {
    await expect(dashboard.availableCashCard).toBeVisible();
    await expect(dashboard.availableCashCard.locator('.fin-card__label')).toContainText('Available Cash');
  });

  test('displays Locked Cash card', async () => {
    await expect(dashboard.lockedCashCard).toBeVisible();
    await expect(dashboard.lockedCashCard.locator('.fin-card__label')).toContainText('Locked Cash');
  });

  test('displays Total Portfolio Value card', async () => {
    await expect(dashboard.totalPortfolioCard).toBeVisible();
    await expect(dashboard.totalPortfolioCard.locator('.fin-card__label')).toContainText('Total Portfolio Value');
  });

  test('cash values contain dollar signs and numbers', async () => {
    const availableText = await dashboard.availableCashCard.locator('.fin-card__value').textContent();
    expect(availableText).toMatch(/\$[\d,]+/);
  });

  // ---------------------------------------------------------------------------
  // Pet inventory
  // ---------------------------------------------------------------------------
  test("inventory section heading contains trader's name (Alice)", async ({ page }) => {
    const heading = page.locator('.dash-section__title', { hasText: "Inventory" });
    await expect(heading).toContainText("Alice");
  });

  test('shows 3 pet cards for alice (Labrador, Poodle, Goldfish)', async () => {
    await expect(dashboard.petCards).toHaveCount(3);
  });

  test('each pet card shows a breed name', async () => {
    const names = await dashboard.petCards.locator('.pet-card__name').allTextContents();
    expect(names).toContain('Labrador');
    expect(names).toContain('Poodle');
    expect(names).toContain('Goldfish');
  });

  test('pet card shows age and health stats', async () => {
    const firstCard = dashboard.petCards.first();
    const stats = await firstCard.locator('.pet-card__stats').textContent();
    expect(stats).toMatch(/Age/);
    expect(stats).toMatch(/Health/);
  });

  test('pet card shows a progress bar for health', async () => {
    await expect(dashboard.petCards.first().locator('mat-progress-bar')).toBeVisible();
  });

  test('listed pet shows "Active Listing" badge', async ({ page }) => {
    // pet-a2 (Poodle) has listing-1 in mock data
    const poodleCard = dashboard.petCards.filter({ hasText: 'Poodle' });
    await expect(poodleCard.locator('.badge--primary')).toContainText('Active Listing');
  });

  test('clicking a pet card navigates to the asset detail page', async ({ page }) => {
    await dashboard.clickPetCard(0);
    await expect(page).toHaveURL(/\/assets\/pet-a/);
    await expect(page.locator('.detail-header__name')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Active Market Operations
  // ---------------------------------------------------------------------------
  test('shows Active Market Operations section', async () => {
    await expect(dashboard.operationsTable).toBeVisible();
    // Alice has listing-1 (Poodle listed) and bid-2 (active bid on Bengal)
    await expect(dashboard.operationRows).not.toHaveCount(0);
  });

  test('listing row shows "Listing" type', async ({ page }) => {
    const listingRow = dashboard.operationRows.filter({ hasText: 'Listing' }).first();
    await expect(listingRow.locator('.ops-cell--type')).toContainText('Listing');
  });

  test('active bid row shows "Active Bid" type', async ({ page }) => {
    const bidRow = dashboard.operationRows.filter({ hasText: 'Active Bid' }).first();
    await expect(bidRow.locator('.ops-cell--type')).toContainText('Active Bid');
  });

  test('"1 Bid Received" badge is visible on listed pet with a bid', async () => {
    // listing-1 (Poodle) has a bid from Bob
    await expect(dashboard.page.locator('.badge--primary-sm', { hasText: '1 Bid Received' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Global Market sidebar
  // ---------------------------------------------------------------------------
  test('Global Market sidebar is visible with feed items', async () => {
    await expect(dashboard.globalMarketFeed).toBeVisible();
    const items = dashboard.globalMarketFeed.locator('.feed-item');
    await expect(items).not.toHaveCount(0);
  });

  test('New Listing button is visible in the sidebar', async () => {
    await expect(dashboard.newListingButton).toBeVisible();
    await expect(dashboard.newListingButton).toContainText('New Listing');
  });

  test('Market Sentiment section is visible', async ({ page }) => {
    await expect(page.locator('.sentiment__label')).toContainText('Market Sentiment');
  });

  // ---------------------------------------------------------------------------
  // Notification bell and Activity Feed popup
  // ---------------------------------------------------------------------------
  test('notification bell is visible in the header', async () => {
    await expect(dashboard.notificationBell).toBeVisible();
  });

  test('clicking notification bell opens the Activity Feed popup', async () => {
    await dashboard.openNotificationPopup();
    await expect(dashboard.notificationPopup).toBeVisible();
    await expect(dashboard.page.locator('.feed-popup__title')).toContainText('Activity Feed');
  });

  test('Activity Feed popup shows notification items for alice', async () => {
    await dashboard.openNotificationPopup();
    // Alice has notif-1, notif-4, notif-6, notif-7 in mock data
    await expect(dashboard.notificationItems).not.toHaveCount(0);
  });

  test('closing the Activity Feed popup via close button hides the popup', async () => {
    await dashboard.openNotificationPopup();
    await dashboard.closeNotificationPopup();
    await expect(dashboard.notificationPopup).not.toBeVisible();
  });

  test('clicking the backdrop closes the Activity Feed popup', async ({ page }) => {
    await dashboard.openNotificationPopup();
    await page.locator('.feed-backdrop').click();
    await expect(dashboard.notificationPopup).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // New Listing dialog
  // ---------------------------------------------------------------------------
  test('clicking New Listing opens the List Pet for Sale dialog', async ({ page }) => {
    await dashboard.newListingButton.click();
    // Mat dialog renders in an overlay — wait for the dialog title
    await expect(page.locator('mat-dialog-container h2', { hasText: 'List Pet for Sale' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Accept Bid dialog from dashboard
  // ---------------------------------------------------------------------------
  test('clicking "1 Bid Received" badge opens the Accept Trade Bid dialog', async ({ page }) => {
    await dashboard.clickBidReceivedBadge();
    await expect(page.locator('mat-dialog-container .abd-title')).toContainText('Accept Trade Bid');
  });
});
