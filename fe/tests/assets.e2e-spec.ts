import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';
import { AssetsPage } from './page-objects/AssetsPage';

test.describe('Assets Page', () => {
  let assets: AssetsPage;

  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
    assets = new AssetsPage(page);
    await assets.goto();
  });

  // ---------------------------------------------------------------------------
  // Page structure
  // ---------------------------------------------------------------------------
  test('displays "Portfolio Assets" heading', async () => {
    await expect(assets.pageTitle).toContainText('Portfolio Assets');
  });

  test("shows trader's name in the subtitle (Alice)", async () => {
    await expect(assets.traderNameSubtitle).toContainText('Alice');
  });

  test('shows Total Assets, Avg Health, and Liquidity stat cards', async () => {
    await expect(assets.totalAssetsCard).toBeVisible();
    await expect(assets.avgHealthCard).toBeVisible();
    await expect(assets.liquidityCard).toBeVisible();
  });

  test('Total Assets shows count with "Pets" suffix', async () => {
    await expect(assets.totalAssetsCard.locator('.stat-card__value')).toContainText('Pets');
  });

  // ---------------------------------------------------------------------------
  // Asset table rows
  // ---------------------------------------------------------------------------
  test('shows asset rows for alice (3 pets)', async () => {
    await expect(assets.assetRows).toHaveCount(3);
  });

  test('each row shows breed name, type, age, and intrinsic value', async () => {
    const firstRow = assets.assetRows.first();
    await expect(firstRow.locator('.assets-cell--breed')).toBeVisible();
    await expect(firstRow.locator('.assets-cell--type')).toBeVisible();
    await expect(firstRow.locator('.assets-cell--age')).toBeVisible();
    await expect(firstRow.locator('.assets-cell--value')).toContainText('$');
  });

  test('each row shows a health progress bar', async () => {
    await expect(assets.assetRows.first().locator('mat-progress-bar')).toBeVisible();
  });

  test('listed pet shows "Active Listing" status badge', async ({ page }) => {
    // Poodle (pet-a2) is in listing-1
    const poodleRow = assets.assetRows.filter({ hasText: 'Poodle' });
    await expect(poodleRow.locator('.status-badge--listed')).toContainText('Active Listing');
  });

  test('pet with no listing shows "In Inventory" status badge', async () => {
    const labRow = assets.assetRows.filter({ hasText: 'Labrador' });
    await expect(labRow.locator('.status-badge--inventory')).toContainText('In Inventory');
  });

  // ---------------------------------------------------------------------------
  // Search filter
  // ---------------------------------------------------------------------------
  test('searching by breed name filters the table', async ({ page }) => {
    await assets.search('Labrador');
    // Only Labrador row should remain
    await expect(assets.assetRows).toHaveCount(1);
    await expect(assets.assetRows.first().locator('.assets-cell--breed')).toContainText('Labrador');
  });

  test('searching with no match shows the empty state', async () => {
    await assets.search('XYZ-NonExistent-Breed');
    await expect(assets.emptyState).toBeVisible();
    await expect(assets.emptyState).toContainText('No pets match your filters');
  });

  test('clearing the search restores all rows', async () => {
    await assets.search('Labrador');
    await assets.search('');
    await expect(assets.assetRows).toHaveCount(3);
  });

  // ---------------------------------------------------------------------------
  // Pagination info
  // ---------------------------------------------------------------------------
  test('pagination info line shows total count', async () => {
    await expect(assets.paginationInfo).toContainText('3');
  });

  // ---------------------------------------------------------------------------
  // Row navigation to asset detail
  // ---------------------------------------------------------------------------
  test('clicking an asset row navigates to the asset detail page', async ({ page }) => {
    await assets.clickRow(0);
    await expect(page).toHaveURL(/\/assets\/pet-a/);
    await expect(page.locator('.detail-header')).toBeVisible();
  });

  test('breadcrumb on asset detail links back to /assets', async ({ page }) => {
    await assets.clickRow(0);
    await page.locator('.breadcrumb__link', { hasText: 'Assets' }).click();
    await expect(page).toHaveURL(/\/assets$/);
  });
});

test.describe('Asset Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
  });

  test('displays pet name, breed label, and status badge', async ({ page }) => {
    await page.goto('/assets/pet-a1');
    await page.locator('.detail-header').waitFor({ state: 'visible' });

    await expect(page.locator('.detail-header__name')).toBeVisible();
    await expect(page.locator('.detail-header__breed')).toBeVisible();
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('shows current valuation card with a dollar amount', async ({ page }) => {
    await page.goto('/assets/pet-a1');
    await page.locator('.valuation-card').waitFor({ state: 'visible' });
    await expect(page.locator('.valuation-card__amount')).toContainText('$');
  });

  test('shows stats cards: Health, Age vs Lifespan, Desirability, Maintenance', async ({ page }) => {
    await page.goto('/assets/pet-a1');
    await page.locator('.stats-row').waitFor({ state: 'visible' });

    const statsCards = page.locator('.stats-card');
    await expect(statsCards).toHaveCount(4);
    await expect(statsCards.filter({ hasText: 'Health' })).toBeVisible();
    await expect(statsCards.filter({ hasText: 'Age vs. Lifespan' })).toBeVisible();
    await expect(statsCards.filter({ hasText: 'Desirability' })).toBeVisible();
    await expect(statsCards.filter({ hasText: 'Maintenance' })).toBeVisible();
  });

  test('intrinsic value formula section shows Base × Health × Desir × Age = Total', async ({ page }) => {
    await page.goto('/assets/pet-a1');
    await page.locator('.formula-section').waitFor({ state: 'visible' });

    await expect(page.locator('.formula-section__title')).toContainText('Intrinsic Value Formula');
    await expect(page.locator('.formula-chip--total .formula-chip__label')).toContainText('Total');
    await expect(page.locator('.formula-op').first()).toContainText('×');
  });

  test('"List for Sale" button opens the List Pet for Sale dialog', async ({ page }) => {
    await page.goto('/assets/pet-a1');
    await page.locator('.btn-action--primary', { hasText: 'List for Sale' }).waitFor({ state: 'visible' });
    await page.locator('.btn-action--primary', { hasText: 'List for Sale' }).click();
    await expect(page.locator('mat-dialog-container h2', { hasText: 'List Pet for Sale' })).toBeVisible();
  });

  test('"View Trade History" button navigates to the trade history page', async ({ page }) => {
    await page.goto('/assets/pet-a1');
    await page.locator('.btn-action--outline', { hasText: 'View Trade History' }).waitFor({ state: 'visible' });
    await page.locator('.btn-action--outline', { hasText: 'View Trade History' }).click();
    await expect(page).toHaveURL(/\/assets\/pet-a1\/history/);
  });
});

test.describe('Trade History Page', () => {
  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/assets/pet-a1/history');
    await page.locator('.th-header').waitFor({ state: 'visible' });
  });

  test('breadcrumb links back to /assets', async ({ page }) => {
    await page.locator('.breadcrumb__link', { hasText: 'Inventory' }).click();
    await expect(page).toHaveURL(/\/assets$/);
  });

  test('displays Trade History heading with pet name', async ({ page }) => {
    await expect(page.locator('.th-header__title')).toContainText('Trade History');
  });

  test('shows Total Trades, Peak Valuation, and Days in Portfolio stat cards', async ({ page }) => {
    await expect(page.locator('.th-stat-card').filter({ hasText: 'Total Trades' })).toBeVisible();
    await expect(page.locator('.th-stat-card').filter({ hasText: 'Peak Valuation' })).toBeVisible();
    await expect(page.locator('.th-stat-card').filter({ hasText: 'Days in Portfolio' })).toBeVisible();
  });

  test('Event Ledger section is visible with table headers', async ({ page }) => {
    await expect(page.locator('.ledger__title')).toContainText('Event Ledger');
    await expect(page.locator('.ledger-row--header')).toBeVisible();
  });

  test('Filter button is visible and opens a filter menu', async ({ page }) => {
    await page.locator('.ledger__filter').click();
    await expect(page.locator('mat-menu, .mat-mdc-menu-panel')).toBeVisible();
  });
});
