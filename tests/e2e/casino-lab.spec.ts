import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const root = '/calculators/casino/';
const games = [
  'baccarat',
  'blackjack',
  'sic-bo',
  'craps',
  'video-poker',
  'three-card-poker',
  'casino-war',
  'slots',
  'session-lab',
];
test.describe('casino probability lab', () => {
  test('directory groups working labs and mobile/desktop pages fit the viewport', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [root, ...games.map((g) => `${root}${g}/`), '/calculators/roulette/']) {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
          'href',
          new RegExp(path + '$'),
        );
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          path,
        ).toBe(true);
      }
    }
    await page.goto(root);
    for (const label of [
      'Card games',
      'Dice games',
      'Wheel & reel games',
      'Probability & session tools',
    ])
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    for (const g of games)
      await expect(page.locator(`main a[href="${root}${g}/"]`).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
  test('baccarat plays staged rules and computes exact finite-shoe probabilities', async ({
    page,
  }) => {
    await page.goto(root + 'baccarat/');
    await page.getByRole('button', { name: 'Deal next hand', exact: true }).click();
    await page.getByRole('button', { name: 'Apply Player rule' }).click();
    await page.getByRole('button', { name: 'Apply Banker rule & settle' }).click();
    await expect(page.locator('[role=status]').first()).toContainText('net');
    await page.getByRole('button', { name: 'Calculate exact odds' }).click();
    await expect(page.getByText('45.86%', { exact: true })).toBeVisible();
    await expect(page.getByText('1.058%', { exact: true })).toBeVisible();
    await page.getByLabel('Player initial total').selectOption('4');
    await page.getByLabel('Banker initial total').selectOption('6');
    await page.getByLabel('Player third-card point').selectOption('6');
    await expect(page.getByText('Player draws. Banker draws.', { exact: true })).toBeVisible();
    await page.getByLabel('Player third-card point').selectOption('8');
    await expect(page.getByText('Player draws. Banker stands.', { exact: true })).toBeVisible();
    await page.getByLabel('Player initial total').selectOption('8');
    await expect(page.getByText('Natural: neither hand draws.', { exact: true })).toBeVisible();
  });
  test('blackjack splits a seeded pair, settles both hands, and runs dealer analysis', async ({
    page,
  }) => {
    await page.goto(root + 'blackjack/');
    await page.getByLabel('Replay seed (new shoe)').fill('7');
    await page.getByRole('button', { name: 'Deal hand', exact: true }).click();
    await page.getByRole('button', { name: 'Split', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Hand 1/ })).toBeVisible();
    while (await page.getByRole('button', { name: 'Stand', exact: true }).isVisible())
      await page.getByRole('button', { name: 'Stand', exact: true }).click();
    await expect(page.locator('[role=status]').first()).toContainText('Round settled');
    await page.getByRole('button', { name: 'Calculate dealer & actions' }).click();
    await expect(page.getByRole('heading', { name: 'Exact dealer distribution' })).toBeVisible();
    await expect(page.getByText('Bust on your next card', { exact: true })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: 'surrender', exact: true })).toBeVisible();
    await page.getByLabel('Dealer blackjack check').selectOption('false');
    await page.getByRole('button', { name: 'Calculate dealer & actions' }).click();
    await expect(page.getByRole('heading', { name: 'Exact dealer distribution' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: 'surrender', exact: true })).toHaveCount(0);
  });
  test('sic bo exposes triples and all 216 outcomes', async ({ page }) => {
    await page.goto(root + 'sic-bo/');
    await expect(page.getByText('105 / 216', { exact: true })).toBeVisible();
    await page.getByText('Faces & combinations', { exact: true }).click();
    await page.getByRole('button', { name: 'Triple 2', exact: true }).click();
    await expect(page.getByText('1 / 216', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Roll three dice' }).click();
    await expect(page.locator('[role=status]')).toContainText('Triple 2');
    await expect(page.getByLabel('All 216 ordered dice results').locator('span')).toHaveCount(216);
  });
  test('craps establishes a point, adds Come and odds, and handles simultaneous contracts', async ({
    page,
  }) => {
    await page.goto(root + 'craps/');
    await page.getByLabel('Replay seed (after reset)').fill('3');
    await page.getByRole('button', { name: 'Place line bet' }).click();
    await page.getByRole('button', { name: 'Roll dice', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Point is 6' })).toBeVisible();
    await page.getByRole('button', { name: 'Add odds', exact: true }).click();
    await page.getByRole('button', { name: 'Place Come bet' }).click();
    await page.getByRole('button', { name: 'Roll dice', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'Come', exact: true })).toBeVisible();
    await expect(
      page
        .getByRole('row')
        .filter({ has: page.getByRole('cell', { name: 'Come', exact: true }) })
        .getByRole('cell', { name: '4', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Reset session' }).click();
    await expect(page.getByRole('heading', { name: 'Come-out roll' })).toBeVisible();
  });
  test('video poker worker analyzes all holds and a played hand draws replacements', async ({
    page,
  }) => {
    await page.goto(root + 'video-poker/');
    await page.getByRole('button', { name: 'Analyze all 32 holds' }).click();
    const result = page
      .getByRole('table')
      .filter({ has: page.getByRole('columnheader', { name: 'Hold card positions' }) });
    await expect(result.locator('tbody tr')).toHaveCount(32, { timeout: 30000 });
    await expect(result.locator('tbody tr').first()).toContainText('800');
    await page.getByRole('button', { name: 'Deal five cards' }).click();
    await page.getByRole('button', { name: 'Draw replacements' }).click();
    await expect(page.locator('[role=status]').first()).toContainText('gross return');
  });
  test('three-card poker calculates all possible dealer hands and settles Play', async ({
    page,
  }) => {
    await page.goto(root + 'three-card-poker/');
    await page.getByRole('button', { name: 'Enumerate dealer hands' }).click();
    await expect(page.getByText('18424', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Deal three cards' }).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('[role=status]').first()).toContainText('Ante/Play net');
  });
  test('Casino War lets the player choose after a real seeded tie', async ({ page }) => {
    await page.goto(root + 'casino-war/');
    await page.getByLabel('Replay seed (after reset)').fill('1');
    await page.getByRole('button', { name: 'Deal', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Go to war', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Go to war', exact: true }).click();
    await expect(page.locator('[role=status]').first()).toContainText('War settled');
    await expect(page.getByText('War expected net after this tie', { exact: true })).toBeVisible();
  });
  test('slot design recomputes return and validates empty reel weights', async ({ page }) => {
    await page.goto(root + 'slots/');
    await page.getByRole('button', { name: 'Spin reels' }).click();
    await expect(page.locator('[role=status]').first()).toContainText('gross');
    for (const label of ['Cherry', 'Lemon', 'Bell', 'Star', 'Seven'])
      await page.getByLabel(label + ' weight', { exact: true }).fill('0');
    await expect(page.getByRole('alert').first()).toContainText('Weights');
    await page.getByRole('button', { name: 'Spin reels' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await page.getByLabel('Cherry weight', { exact: true }).fill('1');
    await expect(page.getByText('Theoretical return (RTP)', { exact: true })).toBeVisible();
  });
  test('roulette settles overlapping chips on one pocket and compares sessions', async ({
    page,
  }) => {
    await page.goto('/calculators/roulette/');
    const table = page.locator('#multi-bet-table');
    await table.getByRole('button', { name: 'Add selected bet' }).click();
    await table.getByRole('button', { name: '1', exact: true }).click();
    await expect(table.getByRole('row')).toHaveCount(3);
    await table.getByRole('button', { name: 'Spin & settle all bets' }).click();
    await expect(table.locator('[role=status]').first()).toContainText('combined net');
    await expect(table.getByText('Total stake / spin', { exact: true })).toBeVisible();
    await table.getByRole('button', { name: 'Compare sessions' }).click();
    await expect(table.getByText('Average final balance', { exact: true })).toHaveCount(2);
  });
  test('session worker rejects invalid input and gives reproducible comparisons', async ({
    page,
  }) => {
    await page.goto(root + 'session-lab/');
    await page.getByLabel('Rounds per session').fill('10001');
    await page.getByRole('button', { name: 'Compare sessions' }).click();
    await expect(page.locator('main').getByRole('alert')).toContainText('1–10,000');
    await page.getByLabel('Rounds per session').fill('100');
    await page.getByRole('button', { name: 'Compare sessions' }).click();
    await expect(page.getByText('Average final balance', { exact: true })).toHaveCount(2);
    const a = await page.locator('figure').innerText();
    await page.getByRole('button', { name: 'Compare sessions' }).click();
    await expect(page.getByText('Average final balance', { exact: true })).toHaveCount(2);
    expect(await page.locator('figure').innerText()).toBe(a);
  });
  test('combined sitemap and content index discover every lab', async ({ request }) => {
    const sitemap = await request.get('/sitemaps/tools.xml');
    expect(sitemap.ok()).toBe(true);
    const xml = await sitemap.text();
    const index = await request.get('/content-index/');
    expect(index.ok()).toBe(true);
    const html = await index.text();
    for (const g of games) {
      expect(xml).toContain(root + g + '/');
      expect(html).toContain(root + g + '/');
    }
  });
  test('mobile controls complete hands and calculations without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(root + 'baccarat/');
    await page.getByRole('button', { name: 'Deal next hand', exact: true }).click();
    await page.getByRole('button', { name: 'Apply Player rule' }).click();
    await page.getByRole('button', { name: 'Apply Banker rule & settle' }).click();
    await expect(page.locator('[role=status]').first()).toContainText('net');
    await page.getByRole('button', { name: 'Calculate exact odds' }).click();
    await expect(page.getByText('45.86%', { exact: true })).toBeVisible();
    await page.goto(root + 'blackjack/');
    await page.getByRole('button', { name: 'Calculate dealer & actions' }).click();
    await expect(page.getByRole('heading', { name: 'Exact dealer distribution' })).toBeVisible();
    await page.goto(root + 'sic-bo/');
    await page.getByRole('button', { name: 'Roll three dice' }).click();
    await expect(page.locator('[role=status]').first()).toContainText('net');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  });
  test('lab directory and core tables have no automated accessibility violations', async ({
    page,
  }) => {
    for (const slug of ['', 'baccarat/', 'blackjack/', 'sic-bo/', 'video-poker/']) {
      await page.goto(root + slug);
      const consent = page.getByRole('button', { name: 'Continue without ads' });
      if (await consent.isVisible()) await consent.click();
      const results = await new AxeBuilder({ page }).include('main').analyze();
      expect(
        results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
        slug,
      ).toEqual([]);
    }
  });
});
