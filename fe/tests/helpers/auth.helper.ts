import { Page } from '@playwright/test';

/**
 * Logs in via the UI and waits for the post-login redirect.
 * admin -> /admin, traders -> /dashboard
 */
export async function loginAs(page: Page, username: 'alice' | 'bob' | 'charlie' | 'admin'): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('mat-form-field');

  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', 'any-password');
  await page.click('button[type="submit"]');

  if (username === 'admin') {
    await page.waitForURL('**/admin**');
  } else {
    await page.waitForURL('**/dashboard**');
  }
}

/**
 * Injects a session directly into sessionStorage — avoids a full UI login round-trip.
 * Use this in beforeEach for tests that are not about authentication itself.
 */
export async function setSession(
  page: Page,
  user: { id: string; name: string; role: 'trader' | 'admin' },
): Promise<void> {
  // Navigate to the origin first so sessionStorage is accessible
  await page.goto('/login');
  await page.evaluate((u) => {
    sessionStorage.setItem('currentUser', JSON.stringify(u));
  }, user);
}

export const USERS = {
  alice: { id: 'trader-a', name: 'Alice', role: 'trader' as const },
  bob: { id: 'trader-b', name: 'Bob', role: 'trader' as const },
  charlie: { id: 'trader-c', name: 'Charlie', role: 'trader' as const },
  admin: { id: 'admin', name: 'Admin', role: 'admin' as const },
};
