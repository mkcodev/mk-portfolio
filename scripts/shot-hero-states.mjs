// Estados interactivos del hero: boot overlay, terminal tras comando, foco input.
// Uso: node scripts/shot-hero-states.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let totalErrors = 0;

async function withPage(name, fn) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await fn(page);
  if (errors.length > 0) {
    console.error(`CONSOLE ERRORS (${name}):`);
    errors.forEach((e) => console.error(`  ${e}`));
    totalErrors += errors.length;
  }
  await page.close();
}

// 1. Boot overlay (sessionStorage limpio → primera visita)
await withPage('boot', async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: 'commit' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/hero-boot.png` });
});

// 2. Terminal tras intro neofetch (estado por defecto tras hidratar)
await withPage('terminal-intro', async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/hero-terminal-intro.png` });
});

// 3. Terminal tras ejecutar comandos reales
await withPage('terminal-cmd', async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.click('[data-terminal] .term-body');
  await page.keyboard.type('sudo hire-me', { delay: 20 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await page.keyboard.type('ls projects', { delay: 20 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/hero-terminal-cmd.png` });
});

// 4. Comando desconocido + EN
await withPage('terminal-en', async (page) => {
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.click('[data-terminal] .term-body');
  await page.keyboard.type('vim', { delay: 20 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/hero-terminal-en.png` });
});

await browser.close();
console.log(`done → shots/hero-*.png · console errors: ${totalErrors}`);
