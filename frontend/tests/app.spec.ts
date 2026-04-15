import { test, expect, type Page } from '@playwright/test';

function mockAssist(page: Page, reply: string, field_updates: { key: string; value: string }[] = []) {
  return page.route('**/api/assist', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: reply, field_updates }),
    })
  );
}

function mockAuth(page: Page) {
  return page.route('**/api/auth/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'test-token', user_id: 1, email: 'test@example.com' }),
    })
  );
}

// ── Guest flow ────────────────────────────────────────────────────────────────

test('guest mode — land on app and see document selector', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Continue as Guest');
  await expect(page).toHaveURL('/app');
  await expect(page.locator('.doc-selector')).toBeVisible();
  await expect(page.locator('h2')).toContainText('What document would you like to create?');
});

test('guest mode — select document shows chat and preview', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Continue as Guest');
  await page.locator('.doc-card').first().click();
  await expect(page.locator('.chat-pane')).toBeVisible();
  await expect(page.locator('.preview-pane')).toBeVisible();
});

test('guest mode — Change Document returns to selector', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Continue as Guest');
  await page.locator('.doc-card').first().click();
  await page.click('text=Change Document');
  await expect(page.locator('.doc-selector')).toBeVisible();
});

// ── Login / register ─────────────────────────────────────────────────────────

test('login — sign in tab is shown by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.login-tab.active')).toContainText('Sign In');
});

test('login — switch to Create Account tab', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Create Account');
  await expect(page.locator('.login-tab.active')).toContainText('Create Account');
});

test('login — successful login redirects to /app', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/app');
});

test('login — shows error on failed login', async ({ page }) => {
  await page.route('**/api/auth/login', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Invalid credentials' }),
    })
  );
  await page.goto('/');
  await page.fill('#email', 'wrong@example.com');
  await page.fill('#password', 'wrongpass');
  await page.click('button[type=submit]');
  await expect(page.locator('.login-error')).toContainText('Invalid credentials');
});

// ── Chat ─────────────────────────────────────────────────────────────────────

test('chat — sends message and shows AI reply', async ({ page }) => {
  await mockAssist(page, 'Got it! I have noted both parties.');
  await page.goto('/');
  await page.click('text=Continue as Guest');
  await page.locator('.doc-card').first().click();
  await page.fill('.chat-input', 'Party A is Acme Corp');
  await page.click('.btn-send');
  await expect(page.locator('.chat-bubble.assistant').last()).toContainText('Got it!');
});

test('chat — send button disabled when input is empty', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Continue as Guest');
  await page.locator('.doc-card').first().click();
  await expect(page.locator('.btn-send')).toBeDisabled();
});

test('chat — initial greeting message is shown', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Continue as Guest');
  await page.locator('.doc-card').first().click();
  await expect(page.locator('.chat-bubble.assistant').first()).toBeVisible();
});
