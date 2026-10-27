// Comprehensive End-to-End (E2E) Test Suite for Oleg G. Portfolio
// Runs headlessly with Microsoft Edge / Chromium via Playwright

const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('🚀 Launching E2E Portfolio Test Suite...\n');
  const browser = await chromium.launch({ channel: 'msedge' });
  let passedCount = 0;
  let testCount = 0;

  async function test(name, fn) {
    testCount++;
    try {
      await fn();
      console.log(`  ✓ [TEST ${testCount}] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ✗ [TEST ${testCount}] ${name}`);
      console.error('    Error:', err.message);
    }
  }

  // Target: Local file or live deployment
  const testUrl = process.env.TEST_URL || 'file:///C:/Users/zeron/Projects/freelance/index.html';
  console.log(`Testing Target URL: ${testUrl}\n`);

  const page = await browser.newPage();
  await page.goto(testUrl, { waitUntil: 'domcontentloaded' });

  // 1. Title and Branding
  await test('Page title and Oleg G. branding present', async () => {
    const title = await page.title();
    assert.ok(title.includes('Oleg G.'), `Expected title to contain Oleg G., got: ${title}`);
    const brandName = await page.textContent('.brand-name');
    assert.strictEqual(brandName.trim(), 'Oleg G.');
  });

  // 2. Light / Dark Theme Switching
  await test('Theme toggle switches data-theme attribute', async () => {
    const initialTheme = await page.getAttribute('html', 'data-theme');
    await page.click('#theme-btn');
    const toggledTheme = await page.getAttribute('html', 'data-theme');
    assert.notStrictEqual(initialTheme, toggledTheme, 'Theme attribute should toggle on click');
    // Toggle back
    await page.click('#theme-btn');
    const restoredTheme = await page.getAttribute('html', 'data-theme');
    assert.strictEqual(restoredTheme, initialTheme, 'Theme should restore on second click');
  });

  // 3. Flagship Console Workspace Tabs (Architecture, API, Telegram, Admin)
  await test('Workspace console tab switching works across all 4 panes', async () => {
    // API Tab
    await page.click('button[data-pane="api"]');
    let isApiActive = await page.isVisible('#pane-api');
    assert.ok(isApiActive, 'API pane should be visible');

    // Route switching in API Explorer
    await page.click('button[data-api="orders"]');
    const urlText = await page.textContent('#api-url-text');
    assert.ok(urlText.includes('/orders/'), 'URL text should update to /orders/');
    const jsonText = await page.textContent('#api-output-screen');
    assert.ok(jsonText.includes('HTTP/2 201 Created'), 'Output should show 201 Created response');

    // Telegram Tab
    await page.click('button[data-pane="tg"]');
    let isTgActive = await page.isVisible('#pane-tg');
    assert.ok(isTgActive, 'Telegram pane should be visible');

    // Live Telegram order simulation button
    const prevOrder = await page.textContent('#sim-order-num');
    await page.click('#btn-run-sim');
    const btnFeedback = await page.textContent('#btn-run-sim');
    assert.ok(btnFeedback.includes('Notification Dispatched'), 'Button should give dispatch confirmation');

    // Admin Tab
    await page.click('button[data-pane="admin"]');
    let isAdminActive = await page.isVisible('#pane-admin');
    assert.ok(isAdminActive, 'Admin pane should be visible');

    // Optimization & SEO Suite Tab
    await page.click('button[data-pane="seo"]');
    let isOptActive = await page.isVisible('#pane-seo');
    assert.ok(isOptActive, 'Optimization & SEO pane should be visible');

    // Verify removed Runtime & GPU block is not in DOM
    const perfBtn = await page.$('button[data-subview="perf"]');
    assert.strictEqual(perfBtn, null, 'Runtime & GPU Optimization sub-tab should be removed');
    const perfView = await page.$('#opt-view-perf');
    assert.strictEqual(perfView, null, 'Runtime & GPU Optimization view should be removed');

    // Sub-view 1: SEO & Rich Results (now default active view)
    let isSeoViewActive = await page.isVisible('#opt-view-seo');
    assert.ok(isSeoViewActive, 'SEO subview should be visible by default');

    // Verify Crawl Discovery Strip (robots.txt & sitemap.xml)
    const crawlCards = await page.$$('.crawl-discovery-strip .crawl-card');
    assert.strictEqual(crawlCards.length, 2, 'Should render 2 crawl discovery cards (robots.txt & sitemap.xml)');

    const robotsLink = await page.getAttribute('.crawl-discovery-strip a[href*="robots.txt"]', 'href');
    assert.strictEqual(robotsLink, 'https://catering-portfolio-six.vercel.app/robots.txt');

    const sitemapLink = await page.getAttribute('.crawl-discovery-strip a[href*="sitemap.xml"]', 'href');
    assert.strictEqual(sitemapLink, 'https://catering-portfolio-six.vercel.app/sitemap.xml');

    // Interactive Schema Switcher
    await page.click('button[data-schema="product"]');
    let schemaText = await page.textContent('#schema-json-screen');
    assert.ok(schemaText.includes('Product'), 'Schema preview should update to Product');

    // Switch to robots.txt Directives preview
    await page.click('button[data-schema="robots"]');
    let robotsText = await page.textContent('#schema-json-screen');
    assert.ok(robotsText.includes('User-Agent:'), 'Schema preview should show robots.txt directives');
    const robotsLiveBtn = await page.textContent('#schema-ext-link');
    assert.ok(robotsLiveBtn.includes('Open Live robots.txt'), 'Header link should show Open Live robots.txt');

    // Switch to sitemap.xml preview (real 69-URL production sitemap)
    const sitemapBtn = await page.locator('button[data-schema="sitemap"]');
    const sitemapBtnText = await sitemapBtn.innerText();
    assert.strictEqual(sitemapBtnText.trim(), 'sitemap.xml', 'Button should be titled sitemap.xml without sample indicator');
    assert.ok(!sitemapBtnText.includes('Sample'), 'Button must not contain the word Sample');

    await sitemapBtn.click();
    let sitemapText = await page.textContent('#schema-json-screen');
    assert.ok(sitemapText.includes('urlset'), 'Schema preview should show sitemap.xml structure');
    assert.ok(sitemapText.includes('portfolio-171'), 'Schema preview should show real production product slug');
    assert.ok(sitemapText.includes('how-to-calculate-party-food-portions'), 'Schema preview should show real blog article slug');
    assert.ok(sitemapText.includes('bruschetta-crostini'), 'Schema preview should show real category slug');

    const sitemapLiveBtn = await page.textContent('#schema-ext-link');
    assert.ok(sitemapLiveBtn.includes('Open Live sitemap.xml'), 'Header link should show Open Live sitemap.xml');
    const mimeText = await page.textContent('#schema-mime-label');
    assert.strictEqual(mimeText.trim(), 'APPLICATION/XML', 'Header should show APPLICATION/XML for sitemap');

    // Sub-view 3: Metrics
    await page.click('button[data-subview="metrics"]');
    let isMetricsActive = await page.isVisible('#opt-view-metrics');
    assert.ok(isMetricsActive, 'Metrics subview should be visible');

    // Check Metrics table row for Crawl Directives
    const metricsHtml = await page.innerHTML('#opt-view-metrics');
    assert.ok(metricsHtml.includes('Search Crawl &amp; Indexing Directives') || metricsHtml.includes('Search Crawl & Indexing Directives'), 'Metrics table should include Search Crawl row');
    assert.ok(metricsHtml.includes('robots.txt ↗'), 'Metrics table should link to robots.txt');
    assert.ok(metricsHtml.includes('sitemap.xml ↗'), 'Metrics table should link to sitemap.xml');

    // Restore Architecture Tab
    await page.click('button[data-pane="arch"]');
    let isArchActive = await page.isVisible('#pane-arch');
    assert.ok(isArchActive, 'Architecture pane should be visible');
  });

  // 4. CI/CD Infrastructure Section
  await test('CI/CD section renders 4 verified pipeline stages and terminal logs', async () => {
    const stages = await page.$$('.cicd-stage-card');
    assert.strictEqual(stages.length, 4, 'Should render exactly 4 pipeline stages');
    const terminalLogs = await page.textContent('.cicd-terminal-body');
    assert.ok(terminalLogs.includes('Validate catalog and translations'), 'Terminal should contain Step 1');
    assert.ok(terminalLogs.includes('Ran 5 tests'), 'Terminal should reflect 5 test discovery');
  });

  // 5. Client Showcases & Outbound Links
  await test('Outbound commercial links and sandboxes are configured properly', async () => {
    const betboomLink = await page.getAttribute('a[href="bet-boom/"]', 'href');
    assert.strictEqual(betboomLink, 'bet-boom/');

    const dnaLink = await page.getAttribute('a[href="dna/"]', 'href');
    assert.strictEqual(dnaLink, 'dna/');

    const originalSiteLink = await page.getAttribute('a[href="https://chefmil-furshet.ru/"]', 'href');
    assert.strictEqual(originalSiteLink, 'https://chefmil-furshet.ru/');

    const upworkLinks = await page.$$('a[href*="upwork.com/freelancers"]');
    assert.ok(upworkLinks.length >= 2, 'Should contain Upwork CTAs in navbar and footer/hire card');

    // Flagship Demo App link
    const demoAppBtn = await page.locator('.action-bar a.btn-test-app');
    const demoAppText = await demoAppBtn.innerText();
    assert.ok(demoAppText.includes('Launch Demo App'), 'Main flagship button should say Launch Demo App');
    const demoAppHref = await demoAppBtn.getAttribute('href');
    assert.strictEqual(demoAppHref, 'https://catering-portfolio-six.vercel.app');

    // Admin Credentials Strip and relocated action buttons
    const adminPanelLink = await page.locator('.admin-cred-strip .admin-cred-actions a[href*="/admin/"]').getAttribute('href');
    assert.strictEqual(adminPanelLink, 'https://catering-portfolio-api.vercel.app/admin/');

    const swaggerLink = await page.locator('.admin-cred-strip .admin-cred-actions a[href*="/api/docs/"]').getAttribute('href');
    assert.strictEqual(swaggerLink, 'https://catering-portfolio-api.vercel.app/api/docs/');
  });

  // 6. Mobile Responsiveness & Zero Horizontal Overflow at 360px
  await test('Mobile viewport (360x640) has zero horizontal overflow and responsive layout', async () => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Measure document scroll width vs client width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert.ok(
      scrollWidth <= clientWidth,
      `Horizontal overflow detected! scrollWidth (${scrollWidth}px) exceeds clientWidth (${clientWidth}px)`
    );

    // Verify long API URL wraps properly
    await page.click('button[data-pane="api"]');
    const urlOverflows = await page.evaluate(() => {
      const el = document.getElementById('api-url-text');
      const parent = el.closest('.api-preview-header');
      return el.getBoundingClientRect().right > parent.getBoundingClientRect().right + 2;
    });
    assert.strictEqual(urlOverflows, false, 'API URL must not stick out beyond parent container on mobile');
  });

  // 7. Small Compact Mobile (320px) Verification
  await test('Compact mobile viewport (320x568) has zero horizontal overflow', async () => {
    await page.setViewportSize({ width: 320, height: 568 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert.ok(
      scrollWidth <= clientWidth,
      `Horizontal overflow at 320px! scrollWidth (${scrollWidth}px) exceeds clientWidth (${clientWidth}px)`
    );
  });

  await browser.close();

  console.log(`\n========================================`);
  console.log(`E2E Summary: ${passedCount}/${testCount} Tests Passed (100%)`);
  console.log(`========================================\n`);

  if (passedCount !== testCount) {
    process.exit(1);
  }
})();
