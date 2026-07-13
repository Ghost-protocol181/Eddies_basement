const { test, expect } = require('@playwright/test');

async function waitForCatalog(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#allCount')).not.toHaveText('—', { timeout: 20000 });
  const count = Number(await page.locator('#allCount').textContent());
  expect(count).toBeGreaterThan(20);
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible({ timeout: 15000 });
}

test('catalog loads without a zero-game state', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  await waitForCatalog(page);
  await expect(page.locator('#count')).toContainText('game');
  expect(consoleErrors.filter(x => !/favicon|ERR_BLOCKED_BY_CLIENT/i.test(x))).toEqual([]);
});

test('search, filters, and clear all stay usable', async ({ page }) => {
  await waitForCatalog(page);
  await page.locator('#search').fill('fortnite');
  await expect(page.locator('#gamesGrid .card')).toHaveCount(1, { timeout: 10000 });
  await page.locator('#clearBtn').click();
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible();
});

test('randomizer opens and produces a non-repeating result', async ({ page }) => {
  await waitForCatalog(page);
  await page.locator('#randomBtn').click();
  await expect(page.locator('#randomizer')).toBeVisible();
  await page.locator('#randomGo').click();
  await expect(page.locator('#modal')).toHaveClass(/open/);
  const first = (await page.locator('#modalInner h2').textContent()).trim();
  await page.locator('#pickAgain').click();
  const second = (await page.locator('#modalInner h2').textContent()).trim();
  expect(second).not.toBe(first);
});

test('blocked third-party images fall back without breaking cards', async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    const allowed = url.hostname === 'ghost-protocol181.github.io';
    if (!allowed && route.request().resourceType() === 'image') return route.abort();
    return route.continue();
  });
  await waitForCatalog(page);
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible();
  await expect(page.locator('#catalogStatus')).toBeHidden();
});

test('cached catalog survives a blocked primary data request', async ({ page, context }) => {
  await waitForCatalog(page);
  await page.reload();
  await page.route('**/vault-data.js**', route => route.abort());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#allCount')).not.toHaveText('—', { timeout: 20000 });
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible();
});

test('slow connection shows loading state then catalog', async ({ page, browserName }) => {
  await page.route('**/vault-data.js**', async route => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#catalogStatus')).toContainText(/Getting the games ready|Loading games/i);
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible({ timeout: 25000 });
});

test('fresh private-style context works without stored data', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await waitForCatalog(page);
  await context.close();
});

test('problem reporting saves a user report', async ({ page }) => {
  await waitForCatalog(page);
  await page.locator('#gamesGrid .card').first().click();
  page.on('dialog', async dialog => dialog.accept('Broken link test'));
  await page.locator('#reportBtn').click();
  const reports = await page.evaluate(() => JSON.parse(localStorage.getItem('eb-reports') || '[]'));
  expect(reports.at(-1).reason).toBe('Broken link test');
});

test('health and legal pages respond', async ({ request }) => {
  for (const path of ['health.json', 'privacy.html', 'terms.html', 'contact.html', 'feedback.html']) {
    const response = await request.get(path);
    expect(response.ok(), path).toBeTruthy();
  }
});