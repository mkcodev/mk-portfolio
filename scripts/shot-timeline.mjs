// Timeline: estados del pin+scrub en desktop y stagger en mobile.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch();

async function run(width, height, suffix, scrolls) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('#trayectoria').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `shots/tl-start-${suffix}.png` });

  for (const [i, dy] of scrolls.entries()) {
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `shots/tl-scrub${i + 1}-${suffix}.png` });
  }

  if (errors.length) {
    console.error(`ERRORS (${suffix}):`);
    errors.forEach((e) => console.error(' ', e));
  } else {
    console.log(`${suffix}: 0 errores`);
  }
  await page.close();
}

await run(1440, 900, '1440', [600, 600]);
await run(390, 844, '390', [500]);
await browser.close();
