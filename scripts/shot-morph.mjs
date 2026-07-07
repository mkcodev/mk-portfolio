// Verifica el morph View Transitions card→case study y el re-init del lifecycle tras el swap.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// Scroll hasta proyectos y click en la primera flagship card
await page.locator('#proyectos').scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await page.screenshot({ path: 'shots/morph-1-cards.png' });

await page.click('.proj-card');
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/morph-2-mid.png' });
await page.waitForTimeout(900);
await page.screenshot({ path: 'shots/morph-3-cs.png' });

console.log('URL tras click:', page.url());

// Volver al home vía back link y comprobar que reveals/scroll siguen vivos
await page.click('.cs-back');
await page.waitForTimeout(1000);
console.log('URL tras back:', page.url());
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/morph-4-back-home.png' });

if (errors.length) {
  console.error('CONSOLE ERRORS:');
  errors.forEach((e) => console.error(' ', e));
} else {
  console.log('0 errores de consola');
}
await browser.close();
