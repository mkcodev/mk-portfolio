// P19 verificación: case study cinemático.
// - Geko: line SVG, nodos activos, métricas pending pulsantes
// - Total Muscle: line + nodos (sin métricas)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function capture(url, suffix, actions) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  if (actions) await actions(page);
  await page.screenshot({ path: `${OUT}/cs-${suffix}.png`, fullPage: false });
  if (errors.length) {
    console.error(`CONSOLE ERRORS ${suffix}:`);
    errors.forEach((e) => console.error('  ' + e));
  }
  await page.close();
  return errors.length;
}

let total = 0;

// Geko: header + hero image
total += await capture('/proyectos/geko-marketing', 'geko-top');
// Geko: cuerpo con line drawing y nodos activados (mid scroll)
total += await capture('/proyectos/geko-marketing', 'geko-body', async (page) => {
  await page.evaluate(() => {
    const el = document.querySelector('[data-cs-body]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(600);
});
// Geko: métricas pending
total += await capture('/proyectos/geko-marketing', 'geko-metrics', async (page) => {
  await page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-cs-metric-value]');
    const last = nodes[nodes.length - 1];
    if (last) last.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1600); // pending dot pulse
});

// Total Muscle: cuerpo + nodos
total += await capture('/proyectos/total-muscle', 'tm-body', async (page) => {
  await page.evaluate(() => {
    const el = document.querySelector('[data-cs-body]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(600);
});

await browser.close();
console.log(`done → ${OUT}/cs-*.png · console errors: ${total}`);
