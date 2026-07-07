import { chromium } from 'playwright';

const BASE = 'http://localhost:4321';
const OUT = 'refs/verify';

const browser = await chromium.launch();
const errors = [];

async function run(width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${tag}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${tag}] ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => sessionStorage.setItem('booted', '1'));

  // About + hover ASCII
  await page.locator('#sobre-mi').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/about-${tag}.png` });
  if (width > 900) {
    await page.hover('[data-ascii]');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/about-ascii-${tag}.png` });
  }

  // Certs
  await page.locator('#certificaciones').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/certs-${tag}.png` });

  // Contact + magnetic + footer
  await page.locator('#contacto').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/contact-${tag}.png` });
  if (width > 900) {
    const btn = page.locator('.contact-mail');
    const box = await btn.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/contact-magnetic-${tag}.png` });
    }
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/footer-${tag}.png` });

  await page.close();
}

await run(1440, 900, '1440');
await run(390, 844, '390');

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'OK — 0 console errors');
await browser.close();
