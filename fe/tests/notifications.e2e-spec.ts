import { test, expect } from '@playwright/test';
import { setSession, USERS } from './helpers/auth.helper';

test.describe('Notification Bell and Activity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/dashboard');
    await page.locator('.shell-header').waitFor({ state: 'visible' });
  });

  test('notification bell is visible in the header', async ({ page }) => {
    await expect(page.locator('.notif-anchor button[mat-icon-button]')).toBeVisible();
  });

  test('bell shows an unread count badge when there are unread notifications', async ({ page }) => {
    // Alice has unread notif-1 and notif-6 (bid_received) — badge should appear
    // mat-badge is added by Angular Material; check for the badge element or non-zero badge value
    const bell = page.locator('.notif-anchor button[mat-icon-button]');
    // The badge is hidden when count is 0; it should not be hidden for alice
    await expect(bell.locator('.mat-badge-content')).toBeVisible();
  });

  test('clicking the bell opens the Activity Feed popup', async ({ page }) => {
    await page.locator('.notif-anchor button[mat-icon-button]').click();
    await expect(page.locator('.feed-popup')).toBeVisible();
    await expect(page.locator('.feed-popup__title')).toContainText('Activity Feed');
  });

  test('Activity Feed popup lists notifications for alice', async ({ page }) => {
    await page.locator('.notif-anchor button[mat-icon-button]').click();
    const items = page.locator('.feed-popup .feed-item');
    await expect(items).not.toHaveCount(0);
  });

  test('each notification item shows icon, text, and timestamp', async ({ page }) => {
    await page.locator('.notif-anchor button[mat-icon-button]').click();
    const firstItem = page.locator('.feed-popup .feed-item').first();
    await expect(firstItem.locator('.feed-item__icon')).toBeVisible();
    await expect(firstItem.locator('.feed-item__text')).toBeVisible();
    await expect(firstItem.locator('.feed-item__time')).toBeVisible();
  });

  test('unread notification items have the --unread CSS class', async ({ page }) => {
    await page.locator('.notif-anchor button[mat-icon-button]').click();
    const unreadItem = page.locator('.feed-popup .feed-item--unread').first();
    await expect(unreadItem).toBeVisible();
  });

  test('clicking the close button hides the popup', async ({ page }) => {
    await page.locator('.notif-anchor button[mat-icon-button]').click();
    await expect(page.locator('.feed-popup')).toBeVisible();
    await page.locator('.feed-popup__close').click();
    await expect(page.locator('.feed-popup')).not.toBeVisible();
  });

  test('clicking the backdrop closes the popup', async ({ page }) => {
    await page.locator('.notif-anchor button[mat-icon-button]').click();
    await expect(page.locator('.feed-backdrop')).toBeVisible();
    await page.locator('.feed-backdrop').click();
    await expect(page.locator('.feed-popup')).not.toBeVisible();
  });

  test('opening the popup clears the unread badge', async ({ page }) => {
    // Before opening — badge should be visible
    const bell = page.locator('.notif-anchor button[mat-icon-button]');
    await expect(bell.locator('.mat-badge-content')).toBeVisible();

    // Open popup — shell.toggleFeed() sets unreadCount to 0
    await bell.click();
    // The mat-badge should now be hidden (matBadgeHidden binds to unreadCount() === 0)
    // After clicking, the badge is hidden via [matBadgeHidden]
    const badge = bell.locator('.mat-badge-content');
    // Playwright checks computed visibility; Angular applies display:none or visibility:hidden
    await expect(badge).toBeHidden();
  });

  // ---------------------------------------------------------------------------
  // Notification click opens Accept Bid dialog (bid_received type)
  // ---------------------------------------------------------------------------
  test('clicking a bid_received notification opens the Accept Trade Bid dialog', async ({ page }) => {
    await page.locator('.notif-anchor button[mat-icon-button]').click();
    // Find a bid_received notification (has the --clickable class)
    const clickableNotif = page.locator('.feed-popup .feed-item--clickable').first();
    await clickableNotif.click();

    // The popup should close and the dialog should open
    await expect(page.locator('.feed-popup')).not.toBeVisible();
    await expect(page.locator('mat-dialog-container .abd-title')).toContainText('Accept Trade Bid');
  });

  // ---------------------------------------------------------------------------
  // Bob's notifications (outbid event)
  // ---------------------------------------------------------------------------
  test('bob sees his own notifications in the Activity Feed', async ({ page }) => {
    await setSession(page, USERS.bob);
    await page.goto('/dashboard');
    await page.locator('.shell-header').waitFor({ state: 'visible' });

    await page.locator('.notif-anchor button[mat-icon-button]').click();
    const items = page.locator('.feed-popup .feed-item');
    await expect(items).not.toHaveCount(0);
    // Bob has notif-2 (bid_outbid about Bengal)
    await expect(items.filter({ hasText: 'Bengal' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Navigating between pages retains notification state
  // ---------------------------------------------------------------------------
  test('notification badge persists after navigating to Market and back', async ({ page }) => {
    // Navigate away and back — shell persists so badge should still be there
    await page.locator('.shell-nav a', { hasText: 'Market' }).click();
    await expect(page).toHaveURL(/\/market/);

    await page.locator('.shell-nav a', { hasText: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const bell = page.locator('.notif-anchor button[mat-icon-button]');
    await expect(bell.locator('.mat-badge-content')).toBeVisible();
  });
});
