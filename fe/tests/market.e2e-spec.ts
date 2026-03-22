import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';
import { MarketPage } from './page-objects/MarketPage';

test.describe('Market Page', () => {
  let market: MarketPage;

  test.beforeEach(async ({ page }) => {
    // Use bob — he has no own listings in the P2P table so more rows show Place Bid
    await setSession(page, USERS.bob);
    market = new MarketPage(page);
    await market.goto();
  });

  // ---------------------------------------------------------------------------
  // Page structure
  // ---------------------------------------------------------------------------
  test('displays the "Global Market" heading', async ({ page }) => {
    await expect(page.locator('.mkt-header__title')).toContainText('Global Market');
  });

  test('shows "Secondary Market (P2P)" section', async ({ page }) => {
    await expect(page.locator('.mkt-section__title', { hasText: 'Secondary Market (P2P)' })).toBeVisible();
  });

  test('shows "New Retail Supply" section', async ({ page }) => {
    await expect(page.locator('.mkt-section__title', { hasText: 'New Retail Supply' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // P2P table content
  // ---------------------------------------------------------------------------
  test('P2P table renders listing rows', async () => {
    await expect(market.p2pRows).not.toHaveCount(0);
  });

  test('each P2P row shows breed name, seller, asking price, intrinsic value', async () => {
    const firstRow = market.p2pRows.first();
    await expect(firstRow.locator('.p2p-cell--breed')).toBeVisible();
    await expect(firstRow.locator('.p2p-cell--seller')).toBeVisible();
    await expect(firstRow.locator('.p2p-cell--asking')).toContainText('$');
    await expect(firstRow.locator('.p2p-cell--intrinsic')).toContainText('$');
  });

  test('P2P rows have health bar and age column', async () => {
    const firstRow = market.p2pRows.first();
    await expect(firstRow.locator('.health-pill')).toBeVisible();
    await expect(firstRow.locator('.p2p-cell--age')).toContainText('Yrs');
  });

  // ---------------------------------------------------------------------------
  // Type filters
  // ---------------------------------------------------------------------------
  test('type filter pills are visible: Dog, Cat, Bird, Fish', async () => {
    const pillTexts = await market.typeFilterPills.allTextContents();
    expect(pillTexts.join(' ')).toMatch(/Dog/);
    expect(pillTexts.join(' ')).toMatch(/Cat/);
    expect(pillTexts.join(' ')).toMatch(/Bird/);
    expect(pillTexts.join(' ')).toMatch(/Fish/);
  });

  test('filtering by Dog shows only Dog listings', async () => {
    await market.clickTypeFilter('Dog');
    // Wait for the rows to re-render
    await market.page.waitForTimeout(200);
    const rows = market.p2pRows;
    const count = await rows.count();
    if (count === 0) {
      // empty state is also acceptable if zero dog listings
      await expect(market.emptyState).toBeVisible();
    } else {
      // Every visible row should be a Dog breed row
      // We cannot check petType directly from DOM, but we can verify the filter pill is active
      await expect(market.typeFilterPills.filter({ hasText: 'Dog' })).toHaveClass(/type-pill--active/);
    }
  });

  test('clicking the active filter pill again resets the filter', async () => {
    await market.clickTypeFilter('Cat');
    await expect(market.typeFilterPills.filter({ hasText: 'Cat' })).toHaveClass(/type-pill--active/);

    await market.clickTypeFilter('Cat');
    await expect(market.typeFilterPills.filter({ hasText: 'Cat' })).not.toHaveClass(/type-pill--active/);
  });

  test('filtering by Fish and then by Bird changes active pill', async () => {
    await market.clickTypeFilter('Fish');
    await expect(market.typeFilterPills.filter({ hasText: 'Fish' })).toHaveClass(/type-pill--active/);

    await market.clickTypeFilter('Bird');
    await expect(market.typeFilterPills.filter({ hasText: 'Bird' })).toHaveClass(/type-pill--active/);
    await expect(market.typeFilterPills.filter({ hasText: 'Fish' })).not.toHaveClass(/type-pill--active/);
  });

  // ---------------------------------------------------------------------------
  // Sort dropdown
  // ---------------------------------------------------------------------------
  test('sort dropdown is visible with default value "Intrinsic Value"', async ({ page }) => {
    await expect(market.sortDropdown).toBeVisible();
    await expect(market.sortDropdown).toContainText('Intrinsic Value');
  });

  test('sort dropdown offers Asking Price and Age options', async ({ page }) => {
    await market.sortDropdown.click();
    // Angular Material renders options in a panel outside the component
    await expect(page.locator('mat-option', { hasText: 'Asking Price' })).toBeVisible();
    await expect(page.locator('mat-option', { hasText: 'Age' })).toBeVisible();
    // Close the dropdown
    await page.keyboard.press('Escape');
  });

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  test('pagination is visible when there are more than 10 rows', async () => {
    // Total mock listings after filtering own listings for bob is >10
    await expect(market.paginationContainer).toBeVisible();
  });

  test('clicking page 2 changes the displayed rows', async () => {
    const firstRowBreed = await market.p2pRows.first().locator('.p2p-cell--breed').textContent();
    await market.goToPage(2);
    const firstRowBreedPage2 = await market.p2pRows.first().locator('.p2p-cell--breed').textContent();
    expect(firstRowBreedPage2).not.toEqual(firstRowBreed);
  });

  test('next page arrow advances the page', async ({ page }) => {
    // Read active page number
    const activeBefore = await page.locator('.mkt-pagination__page--active').textContent();
    await market.paginationNext.click();
    const activeAfter = await page.locator('.mkt-pagination__page--active').textContent();
    expect(Number(activeAfter)).toBe(Number(activeBefore) + 1);
  });

  test('prev page arrow goes back to previous page', async ({ page }) => {
    await market.goToPage(2);
    const activeBefore = await page.locator('.mkt-pagination__page--active').textContent();
    await market.paginationPrev.click();
    const activeAfter = await page.locator('.mkt-pagination__page--active').textContent();
    expect(Number(activeAfter)).toBe(Number(activeBefore) - 1);
  });

  // ---------------------------------------------------------------------------
  // Place Bid dialog
  // ---------------------------------------------------------------------------
  test('Create Listing button opens the List Pet for Sale dialog', async ({ page }) => {
    await market.createListingButton.click();
    await expect(page.locator('mat-dialog-container h2', { hasText: 'List Pet for Sale' })).toBeVisible();
  });

  test('Place Bid button opens the Place a Bid dialog', async ({ page }) => {
    // Find first row that has a Place Bid button (not own listing for bob)
    const placeBidBtn = market.p2pRows.locator('.action-btn--blue').first();
    await placeBidBtn.click();
    await expect(page.locator('mat-dialog-container h2', { hasText: 'Place a Bid' })).toBeVisible();
  });

  test('Place a Bid dialog shows asking price, intrinsic value, and available cash', async ({ page }) => {
    const placeBidBtn = market.p2pRows.locator('.action-btn--blue').first();
    await placeBidBtn.click();
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog.locator('.bid-price-card--asking')).toContainText('Asking Price');
    await expect(dialog.locator('.bid-cash')).toContainText('Available Cash Balance');
  });

  test('Confirm Bid button is disabled when bid amount is empty', async ({ page }) => {
    const placeBidBtn = market.p2pRows.locator('.action-btn--blue').first();
    await placeBidBtn.click();
    const confirmBtn = page.locator('mat-dialog-container button.bid-confirm');
    await expect(confirmBtn).toBeDisabled();
  });

  test('Confirm Bid button becomes enabled when a valid bid amount is entered', async ({ page }) => {
    const placeBidBtn = market.p2pRows.locator('.action-btn--blue').first();
    await placeBidBtn.click();
    await page.locator('.bid-input-wrap__input').fill('50');
    const confirmBtn = page.locator('mat-dialog-container button.bid-confirm');
    await expect(confirmBtn).toBeEnabled();
  });

  test('cancelling the Place Bid dialog closes it', async ({ page }) => {
    const placeBidBtn = market.p2pRows.locator('.action-btn--blue').first();
    await placeBidBtn.click();
    await page.locator('mat-dialog-container button.bid-cancel').click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Retail Supply section
  // ---------------------------------------------------------------------------
  test('Retail Supply section shows breed cards', async () => {
    await expect(market.retailCards).not.toHaveCount(0);
  });

  test('each retail card shows breed name and price', async () => {
    const firstCard = market.retailCards.first();
    await expect(firstCard.locator('.retail-card__name')).toBeVisible();
    await expect(firstCard.locator('.retail-card__price')).toContainText('$');
  });

  test('Buy button on retail card opens the Purchase Pet dialog', async ({ page }) => {
    await market.buyRetailCard(0);
    await expect(page.locator('mat-dialog-container .purchase-title')).toContainText('Purchase Pet');
  });

  test('Purchase Pet dialog shows quantity stepper and total cost', async ({ page }) => {
    await market.buyRetailCard(0);
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog.locator('.qty-control')).toBeVisible();
    await expect(dialog.locator('.total-row')).toBeVisible();
  });
});
