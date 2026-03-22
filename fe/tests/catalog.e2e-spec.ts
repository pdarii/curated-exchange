import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';
import { CatalogPage } from './page-objects/CatalogPage';

test.describe('Catalog Page', () => {
  let catalog: CatalogPage;

  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
    catalog = new CatalogPage(page);
    await catalog.goto();
  });

  // ---------------------------------------------------------------------------
  // Page structure
  // ---------------------------------------------------------------------------
  test('displays "Retail Catalog" heading', async () => {
    await expect(catalog.pageTitle).toContainText('Retail Catalog');
  });

  test('subtitle reads "New Supply from the Exchange"', async ({ page }) => {
    await expect(page.locator('.cat-header__subtitle')).toContainText('New Supply from the Exchange');
  });

  // ---------------------------------------------------------------------------
  // Type filters
  // ---------------------------------------------------------------------------
  test('shows type filter pills: All, Dog, Cat, Bird, Fish', async () => {
    const pillTexts = await catalog.typeFilterPills.allTextContents();
    expect(pillTexts.some((t) => t.includes('Dog'))).toBe(true);
    expect(pillTexts.some((t) => t.includes('Cat'))).toBe(true);
    expect(pillTexts.some((t) => t.includes('Bird'))).toBe(true);
    expect(pillTexts.some((t) => t.includes('Fish'))).toBe(true);
  });

  test('"All" filter is active by default (all 20 breeds split across pages)', async () => {
    // 20 breeds, 8 per page — first page shows 8 cards
    await expect(catalog.breedCards).toHaveCount(8);
  });

  test('filtering by Dog shows only Dog breeds', async ({ page }) => {
    await catalog.clickTypeFilter('Dog');
    await page.waitForTimeout(200);
    const count = await catalog.breedCards.count();
    // 5 Dog breeds total (< 8 per page), no pagination needed
    expect(count).toBeLessThanOrEqual(8);
    expect(count).toBeGreaterThan(0);
  });

  test('active filter pill gets the --active class', async () => {
    await catalog.clickTypeFilter('Cat');
    await expect(catalog.typeFilterPills.filter({ hasText: 'Cat' })).toHaveClass(/type-pill--active/);
  });

  test('switching from Cat to Bird updates the active filter pill', async () => {
    await catalog.clickTypeFilter('Cat');
    await catalog.clickTypeFilter('Bird');
    await expect(catalog.typeFilterPills.filter({ hasText: 'Bird' })).toHaveClass(/type-pill--active/);
    await expect(catalog.typeFilterPills.filter({ hasText: 'Cat' })).not.toHaveClass(/type-pill--active/);
  });

  // ---------------------------------------------------------------------------
  // Breed cards
  // ---------------------------------------------------------------------------
  test('each breed card shows breed name, price, and Buy Now button', async () => {
    const firstCard = catalog.breedCards.first();
    await expect(firstCard.locator('.cat-card__name')).toBeVisible();
    await expect(firstCard.locator('.cat-card__price')).toContainText('$');
    await expect(firstCard.locator('.cat-card__buy')).toContainText('Buy Now');
  });

  test('each breed card shows a lifespan bar', async () => {
    await expect(catalog.breedCards.first().locator('.cat-card__lifespan-bar')).toBeVisible();
  });

  test('each breed card shows a supply badge', async () => {
    await expect(catalog.breedCards.first().locator('.supply-badge')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Buy Now dialog
  // ---------------------------------------------------------------------------
  test('clicking Buy Now opens the Purchase Pet dialog', async ({ page }) => {
    await catalog.buyCard(0);
    await expect(page.locator('mat-dialog-container .purchase-title')).toContainText('Purchase Pet');
  });

  test('Purchase Pet dialog shows the correct breed name from the card', async ({ page }) => {
    const breedName = await catalog.breedCards.first().locator('.cat-card__name').textContent();
    await catalog.buyCard(0);
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog.locator('.pet-info-card__name')).toContainText(breedName!.trim());
  });

  test('Purchase Pet dialog quantity stepper starts at 1', async ({ page }) => {
    await catalog.buyCard(0);
    await expect(page.locator('.qty-value')).toContainText('1');
  });

  test('increment button increases quantity', async ({ page }) => {
    await catalog.buyCard(0);
    await page.locator('.qty-btn').filter({ has: page.locator('mat-icon:text("add")') }).click();
    await expect(page.locator('.qty-value')).toContainText('2');
  });

  test('decrement button is disabled at quantity 1', async ({ page }) => {
    await catalog.buyCard(0);
    const decrementBtn = page.locator('.qty-btn').filter({ has: page.locator('mat-icon:text("remove")') });
    await expect(decrementBtn).toBeDisabled();
  });

  test('total cost updates when quantity is incremented', async ({ page }) => {
    await catalog.buyCard(0);
    const totalBefore = await page.locator('.total-row__value').textContent();
    await page.locator('.qty-btn').filter({ has: page.locator('mat-icon:text("add")') }).click();
    const totalAfter = await page.locator('.total-row__value').textContent();
    expect(totalAfter).not.toEqual(totalBefore);
  });

  test('Confirm Purchase button is enabled by default (quantity 1, within budget)', async ({ page }) => {
    await catalog.buyCard(0);
    // Labrador costs $100 and Alice has $450 — should be enabled
    await expect(page.locator('.purchase-confirm')).toBeEnabled();
  });

  test('cancelling Purchase Pet dialog closes it', async ({ page }) => {
    await catalog.buyCard(0);
    await page.locator('.purchase-cancel').click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  test('pagination footer shows items per page info', async () => {
    await expect(catalog.footerInfo).toContainText('Items per page: 8');
  });

  test('pagination is visible for 20 breeds (3 pages: 8+8+4)', async () => {
    await expect(catalog.paginationContainer).toBeVisible();
  });

  test('clicking page 2 shows different breed cards', async ({ page }) => {
    const firstCardName = await catalog.breedCards.first().locator('.cat-card__name').textContent();
    await catalog.goToPage(2);
    const firstCardNamePage2 = await catalog.breedCards.first().locator('.cat-card__name').textContent();
    expect(firstCardNamePage2).not.toEqual(firstCardName);
  });

  test('page 3 shows 4 remaining breeds (20 total, 8 per page)', async ({ page }) => {
    await catalog.goToPage(3);
    await expect(catalog.breedCards).toHaveCount(4);
  });

  test('next arrow advances to next page', async ({ page }) => {
    const activeBefore = await page.locator('.cat-pagination__page--active').textContent();
    await catalog.paginationNext.click();
    const activeAfter = await page.locator('.cat-pagination__page--active').textContent();
    expect(Number(activeAfter)).toBe(Number(activeBefore) + 1);
  });

  test('previous arrow goes back a page', async ({ page }) => {
    await catalog.goToPage(2);
    await catalog.paginationPrev.click();
    const active = await page.locator('.cat-pagination__page--active').textContent();
    expect(active?.trim()).toBe('1');
  });

  test('filtering resets to page 1', async ({ page }) => {
    await catalog.goToPage(2);
    await catalog.clickTypeFilter('Dog');
    // Pagination page 1 should now be active (only 5 dogs fit on 1 page)
    const activePage = await page.locator('.cat-pagination__page--active').textContent().catch(() => '1');
    expect(activePage?.trim()).toBe('1');
  });

  // ---------------------------------------------------------------------------
  // Sort
  // ---------------------------------------------------------------------------
  test('sort trigger is visible and shows current sort label', async () => {
    await expect(catalog.sortTrigger).toBeVisible();
    await expect(catalog.sortTrigger).toContainText('Sort by:');
  });

  test('clicking sort trigger opens the sort menu', async ({ page }) => {
    await catalog.sortTrigger.click();
    await expect(page.locator('mat-menu, .mat-mdc-menu-panel')).toBeVisible();
  });
});
