// Paso 0 — capturas de referencias visuales a refs/ (timebox: es un medio, no un entregable)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('refs', { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };
const NAV_TIMEOUT = 25_000;

const COOKIE_SELECTORS = [
  'button:has-text("Accept")',
  'button:has-text("Accept all")',
  'button:has-text("Aceptar")',
  'button:has-text("OK")',
  'button:has-text("Agree")',
  '[aria-label*="accept" i]',
  '#onetrust-accept-btn-handler',
];

async function dismissCookies(page) {
  for (const sel of COOKIE_SELECTORS) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(400);
      return;
    }
  }
}

const targets = [
  {
    name: 'supabase-bento',
    url: 'https://supabase.com',
    async run(page) {
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'refs/supabase-hero.png' });
      // buscar el grid de features y capturar celda normal + hover
      const cell = page
        .locator('main a[href*="database"], main [class*="feature" i], main [class*="card" i]')
        .first();
      if (await cell.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cell.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: 'refs/supabase-bento-normal.png' });
        await cell.hover();
        await page.waitForTimeout(900);
        await page.screenshot({ path: 'refs/supabase-bento-hover.png' });
      } else {
        await page.mouse.wheel(0, 1800);
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'refs/supabase-bento-normal.png' });
      }
    },
  },
  {
    name: 'linear',
    url: 'https://linear.app',
    async run(page) {
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'refs/linear-navbar-hero.png' });
    },
  },
  {
    name: 'raycast',
    url: 'https://www.raycast.com',
    async run(page) {
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'refs/raycast-hero.png' });
      await page.keyboard.press('Meta+k').catch(() => {});
      await page.keyboard.press('Control+k').catch(() => {});
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'refs/raycast-cmdk.png' });
    },
  },
  {
    name: 'rauno',
    url: 'https://rauno.me',
    async run(page) {
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'refs/rauno-top.png' });
      await page.mouse.wheel(0, 1600);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: 'refs/rauno-mid.png' });
      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: 'refs/rauno-low.png' });
    },
  },
  {
    name: 'dennissnellenberg',
    url: 'https://dennissnellenberg.com',
    async run(page) {
      await page.waitForTimeout(3500);
      await page.screenshot({ path: 'refs/dennis-hero.png' });
      await page.mouse.wheel(0, 1400);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'refs/dennis-transition.png' });
    },
  },
  {
    name: 'lusion',
    url: 'https://lusion.co',
    async run(page) {
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'refs/lusion-hero.png' });
    },
  },
];

const browser = await chromium.launch();
for (const t of targets) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    try {
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
      await dismissCookies(page);
      await t.run(page);
      console.log(`ok: ${t.name}`);
      await page.close();
      break;
    } catch (err) {
      console.error(`fail (${attempt}/2): ${t.name} — ${err.message.split('\n')[0]}`);
      await page.close();
    }
  }
}
await browser.close();
