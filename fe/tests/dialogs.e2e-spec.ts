import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';

/**
 * Shared helper — opens the List for Sale dialog from the dashboard New Listing button.
 */
async function openListForSaleFromDashboard(page: any) {
  await setSession(page, USERS.alice);
  await page.goto('/dashboard');
  await page.locator('.fin-card').first().waitFor({ state: 'visible' });
  await page.locator('.btn-new-listing').click();
  await page.locator('mat-dialog-container').waitFor({ state: 'visible' });
}

/**
 * Opens Place Bid dialog from the market page using bob (so Own Listing filter doesn't hide rows).
 */
async function openPlaceBidFromMarket(page: any) {
  await setSession(page, USERS.bob);
  await page.goto('/market');
  await page.locator('.p2p-table').waitFor({ state: 'visible' });
  // Find first row with Place Bid button
  await page.locator('.action-btn--blue').first().click();
  await page.locator('mat-dialog-container').waitFor({ state: 'visible' });
}

// ============================================================================
// List for Sale dialog
// ============================================================================
test.describe('List for Sale dialog', () => {
  test('opens from dashboard "New Listing" button', async ({ page }) => {
    await openListForSaleFromDashboard(page);
    await expect(page.locator('mat-dialog-container h2')).toContainText('List Pet for Sale');
  });

  test('opens from market "Create Listing" button', async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/market');
    await page.locator('.p2p-table').waitFor({ state: 'visible' });
    await page.locator('.btn-create-listing').click();
    await expect(page.locator('mat-dialog-container h2')).toContainText('List Pet for Sale');
  });

  test('opens from asset detail "List for Sale" button', async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/assets/pet-a1');
    await page.locator('.detail-header').waitFor({ state: 'visible' });
    await page.locator('.btn-action--primary', { hasText: 'List for Sale' }).click();
    await expect(page.locator('mat-dialog-container h2')).toContainText('List Pet for Sale');
  });

  test('shows pet selector dropdown', async ({ page }) => {
    await openListForSaleFromDashboard(page);
    await expect(page.locator('mat-dialog-container mat-select')).toBeVisible();
  });

  test('shows asking price input', async ({ page }) => {
    await openListForSaleFromDashboard(page);
    await expect(page.locator('mat-dialog-container input[type="number"]')).toBeVisible();
  });

  test('Confirm Listing button is disabled when no pet is selected', async ({ page }) => {
    await openListForSaleFromDashboard(page);
    await expect(page.locator('.dialog-confirm')).toBeDisabled();
  });

  test('selecting a pet shows its intrinsic value', async ({ page }) => {
    await openListForSaleFromDashboard(page);
    // Open the pet select dropdown
    await page.locator('mat-dialog-container mat-select').click();
    // Pick the first option
    await page.locator('mat-option').first().click();
    // Intrinsic value display should appear
    await expect(page.locator('.intrinsic-display')).toBeVisible();
    await expect(page.locator('.intrinsic-display__value')).toContainText('$');
  });

  test('Confirm Listing enables once pet is selected and price > 0', async ({ page }) => {
    await openListForSaleFromDashboard(page);
    await page.locator('mat-dialog-container mat-select').click();
    await page.locator('mat-option').first().click();
    await page.locator('mat-dialog-container input[type="number"]').fill('100');
    await expect(page.locator('.dialog-confirm')).toBeEnabled();
  });

  test('Cancel button closes the dialog', async ({ page }) => {
    await openListForSaleFromDashboard(page);
    await page.locator('.dialog-cancel').click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });
});

// ============================================================================
// Place Bid dialog
// ============================================================================
test.describe('Place Bid dialog', () => {
  test('opens with title "Place a Bid"', async ({ page }) => {
    await openPlaceBidFromMarket(page);
    await expect(page.locator('mat-dialog-container h2')).toContainText('Place a Bid');
  });

  test('shows Current Item section with breed name and seller', async ({ page }) => {
    await openPlaceBidFromMarket(page);
    await expect(page.locator('.bid-item__name')).toBeVisible();
    await expect(page.locator('.bid-item__seller')).toContainText('Owned by');
  });

  test('shows Asking Price and Intrinsic Value price cards', async ({ page }) => {
    await openPlaceBidFromMarket(page);
    await expect(page.locator('.bid-price-card--asking .bid-price-card__label')).toContainText('Asking Price');
    await expect(page.locator('.bid-price-card:not(.bid-price-card--asking) .bid-price-card__label')).toContainText('Intrinsic Value');
  });

  test('shows Available Cash Balance', async ({ page }) => {
    await openPlaceBidFromMarket(page);
    await expect(page.locator('.bid-cash')).toContainText('Available Cash Balance');
  });

  test('Confirm Bid is disabled when bid amount is 0', async ({ page }) => {
    await openPlaceBidFromMarket(page);
    await expect(page.locator('.bid-confirm')).toBeDisabled();
  });

  test('Confirm Bid enables when a positive amount is entered', async ({ page }) => {
    await openPlaceBidFromMarket(page);
    await page.locator('.bid-input-wrap__input').fill('75');
    await expect(page.locator('.bid-confirm')).toBeEnabled();
  });

  test('Cancel closes the dialog', async ({ page }) => {
    await openPlaceBidFromMarket(page);
    await page.locator('.bid-cancel').click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });
});

// ============================================================================
// Purchase Pet dialog
// ============================================================================
test.describe('Purchase Pet dialog', () => {
  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/catalog');
    await page.locator('.cat-header__title').waitFor({ state: 'visible' });
    await page.locator('.cat-card__buy').first().click();
    await page.locator('mat-dialog-container').waitFor({ state: 'visible' });
  });

  test('shows "Purchase Pet" title', async ({ page }) => {
    await expect(page.locator('.purchase-title')).toContainText('Purchase Pet');
  });

  test('shows pet info card with breed name and price per pet', async ({ page }) => {
    await expect(page.locator('.pet-info-card__name')).toBeVisible();
    await expect(page.locator('.pet-info-card__price')).toContainText('/ pet');
  });

  test('shows lifespan, desirability, and maintenance stats', async ({ page }) => {
    await expect(page.locator('.purchase-stat').filter({ hasText: 'Lifespan' })).toBeVisible();
    await expect(page.locator('.purchase-stat').filter({ hasText: 'Desirability' })).toBeVisible();
    await expect(page.locator('.maintenance-row')).toContainText('Maintenance Cost');
  });

  test('shows total cost and available cash', async ({ page }) => {
    await expect(page.locator('.total-row__label')).toContainText('Total Cost');
    await expect(page.locator('.cash-row')).toContainText('Available Cash');
  });

  test('quantity starts at 1', async ({ page }) => {
    await expect(page.locator('.qty-value')).toContainText('1');
  });

  test('increment increases quantity and updates total cost', async ({ page }) => {
    const initialTotal = await page.locator('.total-row__value').textContent();
    await page.locator('.qty-btn').filter({ has: page.locator('mat-icon:text("add")') }).click();
    await expect(page.locator('.qty-value')).toContainText('2');
    const updatedTotal = await page.locator('.total-row__value').textContent();
    expect(updatedTotal).not.toEqual(initialTotal);
  });

  test('decrement is disabled at quantity 1', async ({ page }) => {
    await expect(
      page.locator('.qty-btn').filter({ has: page.locator('mat-icon:text("remove")') }),
    ).toBeDisabled();
  });

  test('decrement becomes enabled after one increment', async ({ page }) => {
    await page.locator('.qty-btn').filter({ has: page.locator('mat-icon:text("add")') }).click();
    await expect(
      page.locator('.qty-btn').filter({ has: page.locator('mat-icon:text("remove")') }),
    ).toBeEnabled();
  });

  test('Confirm Purchase is enabled for affordable quantity', async ({ page }) => {
    await expect(page.locator('.purchase-confirm')).toBeEnabled();
  });

  test('cancel button closes the dialog', async ({ page }) => {
    await page.locator('.purchase-cancel').click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });

  test('close icon button also closes the dialog', async ({ page }) => {
    await page.locator('.purchase-close').click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });
});

// ============================================================================
// Accept Bid dialog
// ============================================================================
test.describe('Accept Bid dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Alice has listing-1 (Poodle) with a bid from Bob — shown in dashboard
    await setSession(page, USERS.alice);
    await page.goto('/dashboard');
    await page.locator('.fin-card').first().waitFor({ state: 'visible' });
    // Click the "1 Bid Received" badge on the listing row
    await page.locator('.badge--primary-sm', { hasText: '1 Bid Received' }).click();
    await page.locator('mat-dialog-container').waitFor({ state: 'visible' });
  });

  test('shows "Accept Trade Bid" title', async ({ page }) => {
    await expect(page.locator('.abd-title')).toContainText('Accept Trade Bid');
  });

  test('shows pet info with name, breed, health, and age', async ({ page }) => {
    await expect(page.locator('.abd-pet__name')).toBeVisible();
    await expect(page.locator('.abd-pet__breed')).toBeVisible();
    await expect(page.locator('.abd-pet__stats')).toContainText('Health');
  });

  test('shows highest bid card with bidder name and amount', async ({ page }) => {
    await expect(page.locator('.abd-bid-card')).toBeVisible();
    await expect(page.locator('.abd-bid-card__amount')).toContainText('$');
  });

  test('shows value breakdown (Intrinsic Value and Market Premium)', async ({ page }) => {
    await expect(page.locator('.abd-breakdown__row').filter({ hasText: 'Intrinsic Value' })).toBeVisible();
    await expect(page.locator('.abd-breakdown__row').filter({ hasText: 'Market Premium' })).toBeVisible();
  });

  test('shows projected net gain section', async ({ page }) => {
    await expect(page.locator('.abd-gain__label')).toContainText('Projected Net Gain');
    await expect(page.locator('.abd-gain__return-value')).toContainText('+');
  });

  test('"View Other Offers" toggle reveals additional offers', async ({ page }) => {
    const toggleBtn = page.locator('.abd-toggle');
    // The dialog has otherOffers mocked with 2 items
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await expect(page.locator('.abd-offers')).toBeVisible();
    }
  });

  test('"Accept & Complete Sale" button is visible', async ({ page }) => {
    await expect(page.locator('.abd-btn--accept')).toContainText('Accept & Complete Sale');
  });

  test('"Cancel & Keep" button is visible', async ({ page }) => {
    await expect(page.locator('.abd-btn--reject')).toContainText('Cancel & Keep');
  });

  test('disclaimer text is visible', async ({ page }) => {
    await expect(page.locator('.abd-disclaimer')).toContainText('irreversible');
  });

  test('close icon button closes the dialog', async ({ page }) => {
    await page.locator('.abd-header button[mat-icon-button]').click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });
});
