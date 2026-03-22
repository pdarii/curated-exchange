import { Page, Locator } from '@playwright/test';

export class CatalogPage {
  readonly page: Page;

  readonly pageTitle: Locator;
  readonly typeFilterPills: Locator;
  readonly sortTrigger: Locator;
  readonly breedCards: Locator;
  readonly emptyState: Locator;
  readonly paginationContainer: Locator;
  readonly paginationPages: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;
  readonly footerInfo: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.locator('.cat-header__title');
    this.typeFilterPills = page.locator('.cat-filters__pills .type-pill');
    this.sortTrigger = page.locator('.cat-filters__sort');
    this.breedCards = page.locator('.cat-card');
    this.emptyState = page.locator('.cat-empty');
    this.paginationContainer = page.locator('.cat-pagination');
    this.paginationPages = page.locator('.cat-pagination__page');
    this.paginationNext = page.locator('.cat-pagination__arrow').last();
    this.paginationPrev = page.locator('.cat-pagination__arrow').first();
    this.footerInfo = page.locator('.cat-footer__info');
  }

  async goto(): Promise<void> {
    await this.page.goto('/catalog');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async clickTypeFilter(label: string): Promise<void> {
    await this.typeFilterPills.filter({ hasText: label }).click();
  }

  async buyCard(index: number): Promise<void> {
    await this.breedCards.nth(index).locator('.cat-card__buy').click();
  }

  async goToPage(pageNum: number): Promise<void> {
    await this.paginationPages.filter({ hasText: String(pageNum) }).click();
  }
}
