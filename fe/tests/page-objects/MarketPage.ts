import { Page, Locator } from '@playwright/test';

export class MarketPage {
  readonly page: Page;

  // Type filter pills
  readonly typeFilterPills: Locator;

  // P2P table
  readonly p2pTable: Locator;
  readonly p2pRows: Locator;
  readonly sortDropdown: Locator;
  readonly createListingButton: Locator;
  readonly paginationContainer: Locator;
  readonly paginationPages: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;
  readonly emptyState: Locator;

  // Retail section
  readonly retailCards: Locator;
  readonly viewCatalogLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.typeFilterPills = page.locator('.mkt-type-filters .type-pill');

    this.p2pTable = page.locator('.p2p-table');
    this.p2pRows = page.locator('.p2p-row:not(.p2p-row--header)');
    this.sortDropdown = page.locator('.sort-inline__field mat-select');
    this.createListingButton = page.locator('.btn-create-listing');
    this.paginationContainer = page.locator('.mkt-pagination');
    this.paginationPages = page.locator('.mkt-pagination__page');
    this.paginationNext = page.locator('.mkt-pagination__arrow').last();
    this.paginationPrev = page.locator('.mkt-pagination__arrow').first();
    this.emptyState = page.locator('.p2p-empty');

    this.retailCards = page.locator('.retail-card');
    this.viewCatalogLink = page.locator('a[routerlink="/catalog"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/market');
    await this.p2pTable.waitFor({ state: 'visible' });
  }

  async clickTypeFilter(label: string): Promise<void> {
    await this.typeFilterPills.filter({ hasText: label }).click();
  }

  async placeBidOnRow(rowIndex: number): Promise<void> {
    const row = this.p2pRows.nth(rowIndex);
    await row.locator('.action-btn--blue').click();
  }

  async updateBidOnRow(rowIndex: number): Promise<void> {
    const row = this.p2pRows.nth(rowIndex);
    await row.locator('.action-btn--amber').click();
  }

  async buyRetailCard(index: number): Promise<void> {
    await this.retailCards.nth(index).locator('.retail-card__buy').click();
  }

  async goToPage(pageNum: number): Promise<void> {
    await this.paginationPages.filter({ hasText: String(pageNum) }).click();
  }
}
