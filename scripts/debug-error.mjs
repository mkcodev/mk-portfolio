// Reproduce el ReferenceError y captura stack trace.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('pageerror', (err) => {
  console.log('=== pageerror ===');
  console.log('MESSAGE:', err.message);
  console.log('STACK:', err.stack);
});

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const loc = msg.location();
    console.log('=== console.error ===');
    console.log('TEXT:', msg.text());
    console.log('LOC:', `${loc.url}:${loc.lineNumber}:${loc.columnNumber}`);
  }
});

await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.click('[data-menu-toggle]');
await page.waitForTimeout(700);

await browser.close();
