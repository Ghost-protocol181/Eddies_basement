const { test, expect } = require('@playwright/test');

const BASE = 'https://ghost-protocol181.github.io/Eddies_basement/';

test('homepage loads a usable game catalog', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Eddie's Basement/i);
  await expect(page.locator('#randomBtn')).toBeVisible();
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#allCount')).not.toHaveText(/^(0|—)$/);
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});

test('search, filters and clear all work', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible({ timeout: 20000 });
  await page.locator('#search').fill('fortnite');
  await expect(page.locator('#gamesGrid')).toContainText(/Fortnite/i);
  await page.locator('#clearBtn').click();
  await expect(page.locator('#search')).toHaveValue('');
});

test('randomizer opens and returns a game', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible({ timeout: 20000 });
  await page.locator('#randomBtn').click();
  await expect(page.locator('#randomizer')).toBeVisible();
  await page.locator('#randomGo').click();
  await expect(page.locator('#modal')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#modalInner h2')).toBeVisible();
});

test('health endpoint and legal pages respond', async ({ request }) => {
  const health = await request.get(`${BASE}health.json`);
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({ status: 'ok' });
  for (const path of ['privacy.html', 'terms.html', 'contact.html', 'feedback.html']) {
    const response = await request.get(`${BASE}${path}`);
    expect(response.ok(), path).toBeTruthy();
  }
});
