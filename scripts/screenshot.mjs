// Verificación visual: capturas 1440px y 390px + estados interactivos.
// Uso: node scripts/screenshot.mjs [ruta] [nombre]
//   node scripts/screenshot.mjs            → home ES
//   node scripts/screenshot.mjs /en home-en
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
// Git Bash convierte "/ruta" en ruta de Windows: aceptar también "ruta" sin barra
const rawRoute = process.argv[2] ?? '/';
const route = rawRoute.includes(':/')
  ? '/'
  : `/${rawRoute.replace(/^\/+/, '')}`.replace(/\/$/, '') || '/';
const name = process.argv[3] ?? 'home';
const OUT = 'shots';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function capture(width, height, suffix, actions) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (actions) await actions(page);
  await page.screenshot({ path: `${OUT}/${name}-${suffix}.png`, fullPage: !actions });

  if (errors.length > 0) {
    console.error(`CONSOLE ERRORS (${suffix}):`);
    errors.forEach((e) => console.error(`  ${e}`));
  }
  await page.close();
  return errors.length;
}

let totalErrors = 0;
totalErrors += await capture(1440, 900, '1440');
totalErrors += await capture(390, 844, '390');

// Estado interactivo: mega menu abierto (desktop)
totalErrors += await capture(1440, 900, 'megamenu', async (page) => {
  await page.click('[data-menu-toggle]');
  await page.waitForTimeout(700);
});

await browser.close();
console.log(`done → ${OUT}/${name}-{1440,390,megamenu}.png · console errors: ${totalErrors}`);
