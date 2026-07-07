// Estados vivos del bento: entrada, demos corriendo y hover en celda.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch();

async function shots(width, height, suffix) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('#como-trabajo').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `shots/bento-in-${suffix}.png` });

  // demos avanzadas: terminal tipeando, claude streaming, keys loop
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `shots/bento-live-${suffix}.png` });

  if (width >= 1024) {
    await page.hover('[data-demo="gauge"]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `shots/bento-hover-${suffix}.png` });
  }

  if (errors.length) {
    console.error(`ERRORS (${suffix}):`);
    errors.forEach((e) => console.error(' ', e));
  } else {
    console.log(`${suffix}: 0 errores`);
  }
  await page.close();
}

await shots(1440, 900, '1440');
await shots(390, 844, '390');
await browser.close();
