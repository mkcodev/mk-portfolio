// Verificación visual del navbar: top, scrolled (logo rotado + ring),
// hover-kbd, section-active y mobile.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shootTopStrip(page, suffix) {
  await page.screenshot({
    path: `${OUT}/nav-${suffix}.png`,
    clip: { x: 0, y: 0, width: 1440, height: 130 },
  });
}

async function capture(width, height, suffix, actions) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  if (actions) await actions(page);
  if (width >= 1440) await shootTopStrip(page, suffix);
  else
    await page.screenshot({
      path: `${OUT}/nav-${suffix}.png`,
      clip: { x: 0, y: 0, width, height: 130 },
    });
  if (errors.length) {
    console.error(`ERRORS (${suffix}):`);
    errors.forEach((e) => console.error(' ', e));
  }
  await page.close();
  return errors.length;
}

let total = 0;

// Top: scroll 0
total += await capture(1440, 900, 'top');

// Scrolled: threshold cruzado, esperar a que termine la animación de rotación
total += await capture(1440, 900, 'scrolled', async (page) => {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(1400);
});

// Hover kbd: hover en el link de proyectos
total += await capture(1440, 900, 'hover-kbd', async (page) => {
  const link = await page.$('.navbar-link[href*="proyectos"]');
  if (link) {
    const box = await link.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
    }
  }
});

// Section active: scrollear al bento (#como-trabajo)
total += await capture(1440, 900, 'section-active', async (page) => {
  await page.evaluate(() => {
    const el = document.getElementById('como-trabajo');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1500);
});

// Mobile
total += await capture(390, 844, 'mobile');

await browser.close();
console.log(`done → ${OUT}/nav-{top,scrolled,hover-kbd,section-active,mobile}.png · errors: ${total}`);
