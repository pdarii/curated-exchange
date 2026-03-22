import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';
import { setSession, USERS } from './helpers/auth.helper';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ---------------------------------------------------------------------------
  // Login page rendering
  // ---------------------------------------------------------------------------
  test('displays the login form with username and password fields', async ({ page }) => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toContainText('Sign In');
  });

  test('shows the brand name "The Curated Exchange"', async ({ page }) => {
    await expect(page.locator('text=The Curated Exchange')).toBeVisible();
  });

  test('password field is masked by default', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('password toggle reveals and re-hides the password', async () => {
    await loginPage.passwordInput.fill('secret');
    await loginPage.passwordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    await loginPage.passwordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  // ---------------------------------------------------------------------------
  // Successful logins
  // ---------------------------------------------------------------------------
  test('alice logs in and is redirected to /dashboard', async ({ page }) => {
    await loginPage.login('alice');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('bob logs in and is redirected to /dashboard', async ({ page }) => {
    await loginPage.login('bob');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('charlie logs in and is redirected to /dashboard', async ({ page }) => {
    await loginPage.login('charlie');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('admin logs in and is redirected to /admin', async ({ page }) => {
    await loginPage.login('admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('login accepts email-style username (alice@kinship.com)', async ({ page }) => {
    await loginPage.login('alice@kinship.com');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('any non-empty password is accepted for valid users', async ({ page }) => {
    await loginPage.login('alice', 'hunter2');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ---------------------------------------------------------------------------
  // Failed login
  // ---------------------------------------------------------------------------
  test('shows error message for unknown username', async ({ page }) => {
    await loginPage.login('unknown-user', 'pass');
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Invalid credentials');
  });

  test('stays on /login after failed login attempt', async ({ page }) => {
    await loginPage.login('unknown-user', 'pass');
    await expect(page).toHaveURL(/\/login/);
  });

  // ---------------------------------------------------------------------------
  // Auth guard — unauthenticated access
  // ---------------------------------------------------------------------------
  test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from /market to /login', async ({ page }) => {
    await page.goto('/market');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from /assets to /login', async ({ page }) => {
    await page.goto('/assets');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from /catalog to /login', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  // ---------------------------------------------------------------------------
  // Role guard — admin vs trader route isolation
  // ---------------------------------------------------------------------------
  test('admin is redirected from /dashboard to /admin', async ({ page }) => {
    await setSession(page, USERS.admin);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('trader is redirected from /admin to /dashboard', async ({ page }) => {
    await setSession(page, USERS.alice);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  test('logout returns to /login and clears session', async ({ page }) => {
    await loginPage.login('alice');
    await expect(page).toHaveURL(/\/dashboard/);

    // The wallet icon button triggers logout in shell.ts
    await page.locator('button[mat-icon-button]').filter({ has: page.locator('mat-icon:text("account_balance_wallet")') }).click();
    await expect(page).toHaveURL(/\/login/);

    // Navigating to a protected route should redirect back to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
