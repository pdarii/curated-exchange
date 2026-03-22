import { Page, Locator } from '@playwright/test';

export class AssetsPage {
  readonly page: Page;

  readonly pageTitle: Locator;
  readonly traderNameSubtitle: Locator;

  // Stats
  readonly totalAssetsCard: Locator;
  readonly avgHealthCard: Locator;
  readonly liquidityCard: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly typeFilterSelect: Locator;
  readonly sortSelect: Locator;

  // Table
  readonly assetRows: Locator;
  readonly emptyState: Locator;
  readonly paginationInfo: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.locator('.assets-header__title');
    this.traderNameSubtitle = page.locator('.assets-header__subtitle');

    this.totalAssetsCard = page.locator('.stat-card').filter({ hasText: 'Total Assets' });
    this.avgHealthCard = page.locator('.stat-card').filter({ hasText: 'Avg Health' });
    this.liquidityCard = page.locator('.stat-card').filter({ hasText: 'Liquidity' });

    this.searchInput = page.locator('.filters-bar__search input');
    this.typeFilterSelect = page.locator('.filters-bar__select').first().locator('mat-select');
    this.sortSelect = page.locator('.filters-bar__select').last().locator('mat-select');

    this.assetRows = page.locator('.assets-row:not(.assets-row--header)');
    this.emptyState = page.locator('.assets-empty');
    this.paginationInfo = page.locator('.assets-pagination__info');
  }

  async goto(): Promise<void> {
    await this.page.goto('/assets');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clickRow(index: number): Promise<void> {
    await this.assetRows.nth(index).click();
  }
}
