const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const outputDir = path.join('C:', 'Users', 'zeron', 'Projects', 'freelance', 'portfolio-thumbnails');
  const artifactDir = path.join('C:', 'Users', 'zeron', '.gemini', 'antigravity', 'brain', '5c2c95a7-29de-4256-9939-d19345abbe0b');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // Upwork 5:4 Aspect Ratio (1.25): 1250 x 1000 px
  const context = await browser.newContext({
    viewport: { width: 1250, height: 1000 },
    deviceScaleFactor: 1
  });

  const projects = [
    {
      id: 'catering',
      name: '1_catering_ecommerce_5x4.png',
      url: 'http://localhost:3005/',
      prepare: async (page) => {
        await page.waitForTimeout(1000);
      }
    },
    {
      id: 'betboom',
      name: '2_betboom_campaign_5x4.png',
      url: 'file:///C:/Users/zeron/Projects/freelance/bet-boom/public/index.html',
      prepare: async (page) => {
        await page.waitForTimeout(1000);
      }
    },
    {
      id: 'dna',
      name: '3_dna_jewelry_5x4.png',
      url: 'file:///C:/Users/zeron/Projects/freelance/dna/index.html',
      prepare: async (page) => {
        await page.waitForTimeout(1000);
      }
    },
    {
      id: 'portfolio_hub',
      name: '4_fullstack_hub_5x4.png',
      url: 'file:///C:/Users/zeron/Projects/freelance/index.html',
      prepare: async (page) => {
        await page.waitForTimeout(1000);
      }
    }
  ];

  for (const proj of projects) {
    console.log(`Capturing ${proj.id} from ${proj.url}...`);
    const page = await context.newPage();
    await page.goto(proj.url, { waitUntil: 'load', timeout: 15000 });
    if (proj.prepare) {
      await proj.prepare(page);
    }

    const localPath = path.join(outputDir, proj.name);
    const artPath = path.join(artifactDir, proj.name);

    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artPath);
    console.log(`Saved ${proj.name} to ${localPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All 5:4 thumbnails successfully captured and copied to artifacts!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
