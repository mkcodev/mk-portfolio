// Verificación P18: commentary mode ON.
// 1) home OFF (baseline)
// 2) home ON con marker visible en hero (top del viewport)
// 3) home ON scroll a bento → tooltip visible sobre un marker
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(page, suffix) {
  await page.screenshot({ path: `${OUT}/cm-${suffix}.png`, fullPage: false });
}

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'no-preference',
});
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(err.message));

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shoot(page, 'off-hero');

// Activar commentary con tecla m
await page.keyboard.press('m');
await page.waitForTimeout(600);
await shoot(page, 'on-hero');

// Scroll hasta el bento
await page.evaluate(() => {
  const el = document.getElementById('como-trabajo');
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(800);
await shoot(page, 'on-bento');

// Hover sobre un marker del bento (buscar el `?` correcto)
const marker = await page.$('.cm-marker[aria-label*="Bento"]');
if (marker) {
  const box = await marker.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await shoot(page, 'on-bento-tooltip');
  }
}

// Toggle OFF con tecla m otra vez
await page.keyboard.press('m');
await page.waitForTimeout(400);
await shoot(page, 'off-bento');

if (errors.length > 0) {
  console.error('CONSOLE ERRORS:');
  errors.forEach((e) => console.error(`  ${e}`));
}

await browser.close();
console.log(`done → ${OUT}/cm-*.png · console errors: ${errors.length}`);
process.exit(errors.length > 0 ? 1 : 0);
