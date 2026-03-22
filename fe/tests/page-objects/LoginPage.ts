import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly passwordToggle: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    // Angular error message rendered in a <p> with text-error class
    this.errorMessage = page.locator('.text-error');
    // The visibility toggle sits as a mat-icon-button inside the password field suffix
    this.passwordToggle = page.locator('mat-form-field').filter({ hasText: 'Password' }).locator('button[mat-icon-button]');
    this.rememberMeCheckbox = page.locator('mat-checkbox');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.usernameInput.waitFor({ state: 'visible' });
  }

  async login(username: string, password = 'password'): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
