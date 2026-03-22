import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  // Financial strip
  readonly availableCashCard: Locator;
  readonly lockedCashCard: Locator;
  readonly totalPortfolioCard: Locator;

  // Pet inventory
  readonly petCards: Locator;
  readonly inventorySection: Locator;

  // Active Market Operations table
  readonly operationsTable: Locator;
  readonly operationRows: Locator;

  // Global Market sidebar
  readonly globalMarketFeed: Locator;
  readonly newListingButton: Locator;

  // Notification bell (in the shell header)
  readonly notificationBell: Locator;
  readonly notificationPopup: Locator;
  readonly notificationItems: Locator;
  readonly notificationCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.availableCashCard = page.locator('.fin-card').filter({ hasText: 'Available Cash' });
    this.lockedCashCard = page.locator('.fin-card').filter({ hasText: 'Locked Cash' });
    this.totalPortfolioCard = page.locator('.fin-card').filter({ hasText: 'Total Portfolio Value' });

    this.petCards = page.locator('.pet-card');
    this.inventorySection = page.locator('.dash-section').filter({ hasText: "Inventory" });

    this.operationsTable = page.locator('.ops-table');
    this.operationRows = page.locator('.ops-row:not(.ops-row--header)');

    this.globalMarketFeed = page.locator('.sidebar-feed');
    this.newListingButton = page.locator('.btn-new-listing');

    this.notificationBell = page.locator('.notif-anchor button[mat-icon-button]');
    this.notificationPopup = page.locator('.feed-popup');
    this.notificationItems = page.locator('.feed-popup .feed-item');
    this.notificationCloseButton = page.locator('.feed-popup__close');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    // Wait for financial strip to be populated (signals that API call resolved)
    await this.availableCashCard.waitFor({ state: 'visible' });
  }

  async openNotificationPopup(): Promise<void> {
    await this.notificationBell.click();
    await this.notificationPopup.waitFor({ state: 'visible' });
  }

  async closeNotificationPopup(): Promise<void> {
    await this.notificationCloseButton.click();
    await this.notificationPopup.waitFor({ state: 'hidden' });
  }

  async clickPetCard(index: number): Promise<void> {
    await this.petCards.nth(index).click();
  }

  async clickBidReceivedBadge(): Promise<void> {
    await this.page.locator('.badge--primary-sm').first().click();
  }
}
