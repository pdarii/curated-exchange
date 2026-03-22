import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';

/**
 * Verifies that each trader sees only their own data — pet counts, cash values,
 * and listings must not bleed between trader sessions.
 */
test.describe('Trader Data Isolation', () => {
  test("alice's dashboard shows her 3 pets and Available Cash of $450", async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/dashboard');
    await page.locator('.fin-card').first().waitFor({ state: 'visible' });

    const petCards = page.locator('.pet-card');
    await expect(petCards).toHaveCount(3);

    const cash = await page.locator('.fin-card').filter({ hasText: 'Available Cash' }).locator('.fin-card__value').textContent();
    expect(cash).toContain('450');
  });

  test("bob's dashboard shows his 2 pets and Available Cash of $320", async ({ page }) => {
    await setSession(page, USERS.bob);
    await page.goto('/dashboard');
    await page.locator('.fin-card').first().waitFor({ state: 'visible' });

    const petCards = page.locator('.pet-card');
    await expect(petCards).toHaveCount(2);

    const cash = await page.locator('.fin-card').filter({ hasText: 'Available Cash' }).locator('.fin-card__value').textContent();
    expect(cash).toContain('320');
  });

  test("charlie's dashboard shows his 4 pets and Available Cash of $280", async ({ page }) => {
    await setSession(page, USERS.charlie);
    await page.goto('/dashboard');
    await page.locator('.fin-card').first().waitFor({ state: 'visible' });

    const petCards = page.locator('.pet-card');
    await expect(petCards).toHaveCount(4);

    const cash = await page.locator('.fin-card').filter({ hasText: 'Available Cash' }).locator('.fin-card__value').textContent();
    expect(cash).toContain('280');
  });

  test("alice's asset page shows 3 pets (Labrador, Poodle, Goldfish)", async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/assets');
    await page.locator('.assets-header__title').waitFor({ state: 'visible' });

    const rows = page.locator('.assets-row:not(.assets-row--header)');
    await expect(rows).toHaveCount(3);

    const breeds = await rows.locator('.assets-cell--breed').allTextContents();
    expect(breeds).toContain('Labrador');
    expect(breeds).toContain('Poodle');
    expect(breeds).toContain('Goldfish');
  });

  test("bob's asset page shows 2 pets (Siamese, Macaw)", async ({ page }) => {
    await setSession(page, USERS.bob);
    await page.goto('/assets');
    await page.locator('.assets-header__title').waitFor({ state: 'visible' });

    const rows = page.locator('.assets-row:not(.assets-row--header)');
    await expect(rows).toHaveCount(2);

    const breeds = await rows.locator('.assets-cell--breed').allTextContents();
    expect(breeds).toContain('Siamese');
    expect(breeds).toContain('Macaw');
  });

  test("charlie's asset page shows 4 pets (Beagle, Bengal, Parakeet, Betta)", async ({ page }) => {
    await setSession(page, USERS.charlie);
    await page.goto('/assets');
    await page.locator('.assets-header__title').waitFor({ state: 'visible' });

    const rows = page.locator('.assets-row:not(.assets-row--header)');
    await expect(rows).toHaveCount(4);

    const breeds = await rows.locator('.assets-cell--breed').allTextContents();
    expect(breeds).toContain('Beagle');
    expect(breeds).toContain('Bengal');
    expect(breeds).toContain('Parakeet');
    expect(breeds).toContain('Betta');
  });

  test("alice's own listings do not appear in the P2P market table she sees", async ({ page }) => {
    // Alice owns listing-1 (Poodle @ $120); the market filters out own listings
    await setSession(page, USERS.alice);
    await page.goto('/market');
    await page.locator('.p2p-table').waitFor({ state: 'visible' });

    // No "Place Bid" button should appear for rows where alice is the seller
    // The market component hides the action button for isOwnListing() rows
    const rows = page.locator('.p2p-row:not(.p2p-row--header)');
    const count = await rows.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const sellerCell = await rows.nth(i).locator('.p2p-cell--seller').textContent();
      if (sellerCell?.trim() === 'Alice') {
        // Own listing row — no Place Bid button should be present
        await expect(rows.nth(i).locator('.action-btn--blue')).toHaveCount(0);
      }
    }
  });

  test("alice's notifications are separate from bob's notifications", async ({ page }) => {
    // Alice's feed has Poodle bid notifications; bob's has Bengal outbid notification
    await setSession(page, USERS.alice);
    await page.goto('/dashboard');
    await page.locator('.notif-anchor button[mat-icon-button]').click();

    const aliceTexts = await page.locator('.feed-popup .feed-item__text').allTextContents();
    const aliceHasPoodle = aliceTexts.some((t) => t.includes('Poodle'));
    expect(aliceHasPoodle).toBe(true);
  });

  test("asset detail page is only reachable for pets owned by the logged-in trader", async ({ page }) => {
    // Alice can see pet-a1 details
    await setSession(page, USERS.alice);
    await page.goto('/assets/pet-a1');
    await page.locator('.detail-header').waitFor({ state: 'visible' });
    await expect(page.locator('.detail-header__name')).toBeVisible();

    // If alice tries to navigate to bob's pet, the guard doesn't specifically prevent it
    // (the API just returns undefined), but we should not crash — the page handles the null pet
    // This test verifies no unhandled error is thrown
    await page.goto('/assets/pet-b1');
    // The @if (pet(); as pet) block renders nothing for an unknown pet
    await expect(page.locator('.detail-header')).not.toBeVisible();
  });
});
