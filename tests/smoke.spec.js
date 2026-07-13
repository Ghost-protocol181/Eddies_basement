const { test, expect } = require('@playwright/test');

const SITE = 'https://ghost-protocol181.github.io/Eddies_basement/';
const SITE_ORIGIN = new URL(SITE).origin;

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

function expectNoMeaningfulErrors(errors) {
  const ignored = [/favicon/i, /Failed to load resource.*image/i, /thum\.io/i, /net::ERR_BLOCKED_BY_CLIENT/i];
  const meaningful = errors.filter(message => !ignored.some(rx => rx.test(message)));
  expect(meaningful, `Unexpected browser errors: ${meaningful.join('\n')}`).toEqual([]);
}

async function expectCatalog(page) {
  await expect(page.locator('#gamesGrid .card').first()).toBeVisible({ timeout: 30000 });
  expect(await page.locator('#gamesGrid .card').count()).toBeGreaterThan(10);
  await expect(page.locator('#allCount')).not.toHaveText(/^(0|—)$/);
  await expect(page.locator('#catalogStatus')).toBeHidden();
}

test('catalog loads and shows a usable game wall', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Eddie's Basement/i);
  await expectCatalog(page);
  expectNoMeaningfulErrors(errors);
});

test('randomizer opens and chooses a game', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expectCatalog(page);
  await expect(page.locator('#randomBtn')).toBeVisible();
  await page.locator('#randomBtn').click();
  await expect(page.locator('#randomizer')).toBeVisible();
  await page.locator('#randomGo').click();
  await expect(page.locator('#modal')).toHaveClass(/open/, { timeout: 15000 });
  await expect(page.locator('#modalInner h2')).not.toBeEmpty();
  expectNoMeaningfulErrors(errors);
});

test('search, clear all, favorites and URL state work', async ({ page }) => {
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expectCatalog(page);
  await page.locator('#search').fill('fortnite');
  await expect(page.locator('#gamesGrid')).toContainText(/Fortnite/i);
  await expect(page).toHaveURL(/q=fortnite/);
  await page.locator('#clearBtn').click();
  await expect(page.locator('#search')).toHaveValue('');
  await page.locator('#gamesGrid .card .favoriteBtn').first().click();
  await expect(page.locator('#favoritesSection')).toBeVisible();
});

test('mobile header, controls and layout remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#brandImg')).toBeVisible();
  await expect(page.locator('#randomBtn')).toBeVisible();
  await expect(page.locator('#search')).toBeVisible();
  await expectCatalog(page);
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow, 'Mobile page should not scroll horizontally').toBeFalsy();
});

test('catalog survives blocked third-party requests', async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== SITE_ORIGIN) return route.abort('blockedbyclient');
    return route.continue();
  });
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expectCatalog(page);
  await expect(page.locator('#randomBtn')).toBeVisible();
});

test('catalog survives unavailable local storage', async ({ page }) => {
  await page.addInitScript(() => {
    const fail = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
    Object.defineProperty(Storage.prototype, 'getItem', { configurable: true, value: fail });
    Object.defineProperty(Storage.prototype, 'setItem', { configurable: true, value: fail });
    Object.defineProperty(Storage.prototype, 'removeItem', { configurable: true, value: fail });
  });
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expectCatalog(page);
  await page.locator('#randomBtn').click();
  await expect(page.locator('#randomizer')).toBeVisible();
});

test('health, legal and feedback pages respond', async ({ request }) => {
  const health = await request.get(`${SITE}health.json`);
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({ status: 'ok' });
  for (const path of ['privacy.html', 'terms.html', 'contact.html', 'feedback.html']) {
    const response = await request.get(`${SITE}${path}`);
    expect(response.ok(), `${path} should load`).toBeTruthy();
  }
});
