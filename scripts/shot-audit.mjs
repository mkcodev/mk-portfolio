// Auditoría visual completa del portfolio.
// Captura todas las páginas + secciones + estados interactivos a 1440 y 390.
// Uso: node scripts/shot-audit.mjs
// Output: shots/audit/*.png
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT = 'shots/audit';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const browser = await chromium.launch();
let totalErrors = 0;
const results = [];

async function newPage(vp) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return { page, errors };
}

async function fullPage(url, filename, vp) {
  const { page, errors } = await newPage(vp);
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/${filename}.png`, fullPage: true });
  await page.close();
  if (errors.length) {
    console.error(`ERRORS ${filename}:`);
    errors.forEach((e) => console.error(`  ${e}`));
    totalErrors += errors.length;
  }
  results.push(`${OUT}/${filename}.png`);
}

async function sectionShot(url, sectionSel, filename, vp) {
  const { page, errors } = await newPage(vp);
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  try {
    await page.locator(sectionSel).first().scrollIntoViewIfNeeded({ timeout: 3000 });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${OUT}/${filename}.png`, fullPage: false });
  } catch (e) {
    console.error(`  skip ${filename}: ${e.message.split('\n')[0]}`);
  }
  await page.close();
  if (errors.length) {
    console.error(`ERRORS ${filename}:`);
    errors.forEach((e) => console.error(`  ${e}`));
    totalErrors += errors.length;
  }
  results.push(`${OUT}/${filename}.png`);
}

async function interactive(name, vp, fn) {
  const { page, errors } = await newPage(vp);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await fn(page);
  await page.close();
  if (errors.length) {
    console.error(`ERRORS ${name}:`);
    errors.forEach((e) => console.error(`  ${e}`));
    totalErrors += errors.length;
  }
  results.push(`${OUT}/${name}.png`);
}

// ============ 1. Full pages a 1440 y 390 ============
const PAGES = [
  ['/', 'home-es'],
  ['/en', 'home-en'],
  ['/proyectos/geko-marketing', 'case-geko'],
  ['/proyectos/total-muscle', 'case-totalmuscle'],
  ['/blog', 'blog-es'],
  ['/en/blog', 'blog-en'],
  ['/uses', 'uses-es'],
  ['/en/uses', 'uses-en'],
  ['/404', 'notfound'],
];

console.log('▸ Full pages');
for (const [url, name] of PAGES) {
  await fullPage(url, `${name}-1440`, VIEWPORTS.desktop);
  await fullPage(url, `${name}-390`, VIEWPORTS.mobile);
  console.log(`  ✓ ${name}`);
}

// ============ 2. Secciones home focadas ============
const SECTIONS = [
  ['#proyectos', 'proyectos'],
  ['#como-trabajo', 'bento'],
  ['#trayectoria', 'timeline'],
  ['#sobre-mi', 'about'],
  ['#certificaciones', 'certs'],
  ['#contacto', 'contact'],
];

console.log('▸ Secciones (viewport)');
for (const [sel, name] of SECTIONS) {
  await sectionShot('/', sel, `section-${name}-1440`, VIEWPORTS.desktop);
  await sectionShot('/', sel, `section-${name}-390`, VIEWPORTS.mobile);
  console.log(`  ✓ ${name}`);
}

// ============ 3. Estados interactivos (1440) ============
console.log('▸ Estados interactivos');

// 3.1 Mega menu abierto
await interactive('state-megamenu-1440', VIEWPORTS.desktop, async (page) => {
  await page.click('[data-menu-toggle]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/state-megamenu-1440.png` });
});
console.log('  ✓ mega menu');

// 3.2 Command palette abierto (Ctrl+K)
await interactive('state-cmdk-1440', VIEWPORTS.desktop, async (page) => {
  await page.keyboard.press('Control+K');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-cmdk-1440.png` });
});
console.log('  ✓ ⌘K palette');

// 3.3 Terminal tras comando
await interactive('state-terminal-cmd-1440', VIEWPORTS.desktop, async (page) => {
  await page.waitForTimeout(2000);
  await page.click('[data-terminal] .term-body');
  await page.keyboard.type('sudo hire-me', { delay: 25 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await page.keyboard.type('ls projects', { delay: 25 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-terminal-cmd-1440.png` });
});
console.log('  ✓ terminal');

// 3.4 Hover en project card
await interactive('state-project-hover-1440', VIEWPORTS.desktop, async (page) => {
  await page.locator('#proyectos').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const card = page.locator('#proyectos a').first();
  await card.hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-project-hover-1440.png` });
});
console.log('  ✓ project hover');

// 3.5 Hover en bento cell
await interactive('state-bento-hover-1440', VIEWPORTS.desktop, async (page) => {
  await page.locator('#como-trabajo').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const cells = page.locator('#como-trabajo [data-demo]');
  const count = await cells.count();
  if (count > 0) {
    await cells.first().hover();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}/state-bento-hover-1440.png` });
});
console.log('  ✓ bento hover');

// 3.6 Navbar compact (scroll >80px)
await interactive('state-navbar-compact-1440', VIEWPORTS.desktop, async (page) => {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${OUT}/state-navbar-compact-1440.png`,
    clip: { x: 0, y: 0, width: 1440, height: 120 },
  });
});
console.log('  ✓ navbar compact');

// 3.7 Mobile menu abierto
await interactive('state-menu-390', VIEWPORTS.mobile, async (page) => {
  const toggle = page.locator('[data-menu-toggle]');
  if ((await toggle.count()) > 0) {
    await toggle.first().click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}/state-menu-390.png` });
});
console.log('  ✓ mobile menu');

await browser.close();
console.log(`\n▸ Done → ${results.length} shots · ${totalErrors} console errors`);
console.log(`   Output: ${OUT}/`);
