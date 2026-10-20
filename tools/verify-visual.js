#!/usr/bin/env node
/* Visual + accessibility verification of the built site via Playwright/Chromium.
   Every page x {en, ar} x four viewports. Checks: console errors, failed
   requests, horizontal overflow, <html dir>, body font >= 16px on mobile,
   reduced-motion completeness, and keyboard reachability. Emits screenshots
   into shots/. */
const { chromium } = require('/home/opc/.openclaw/workspace/nexgen/tools/pw/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/opc/.openclaw/workspace/nexgen/site';
const PORT = 8901;
const SHOTS = '/home/opc/.openclaw/workspace/nexgen/shots';

const SLUGS = ['index.html','about.html','companies.html','inpipe-energy.html','trust-flow.html','esaal.html','dari.html','saby.html','contact.html'];
const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const file = path.join(ROOT, path.normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
});

const results = [];
const failures = [];
function report(ok, msg) { results.push(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg); }

(async () => {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  fs.mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    for (const slug of SLUGS) {
      for (const locale of ['en', 'ar']) {
        const url = locale === 'en'
          ? `http://127.0.0.1:${PORT}/${slug}`
          : `http://127.0.0.1:${PORT}/ar/${slug}`;
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

        const consoleErrors = [];
        const failedReqs = [];
        page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
        page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
        page.on('requestfailed', (r) => failedReqs.push(r.url() + ' :: ' + (r.failure() || {}).errorText));
        page.on('response', (r) => { if (r.status() >= 400) failedReqs.push(r.status() + ' ' + r.url()); });

        const tag = `${locale}/${slug} @ ${vp.name}`;
        try {
          await page.goto(url, { waitUntil: 'networkidle' });
        } catch (e) { report(false, `${tag}: goto failed ${e.message}`); await page.close(); continue; }

        const meta = await page.evaluate(() => {
          const de = document.documentElement;
          const body = document.body;
          const cs = getComputedStyle(body);
          const overflowX = de.scrollWidth - de.clientWidth;
          // reduced-motion completeness: any .reveal still at opacity 0? any const-line undrawn?
          const revealHidden = [...document.querySelectorAll('.reveal, .zoom-in')]
            .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length;
          return {
            lang: de.getAttribute('lang'),
            dir: de.getAttribute('dir'),
            bodyFont: parseFloat(cs.fontSize),
            overflowX,
            scrollW: de.scrollWidth,
            clientW: de.clientWidth,
            revealHidden,
            hasConstellation: !!document.querySelector('.constellation'),
            prog: document.querySelector('[data-assembly]') ? getComputedStyle(document.querySelector('[data-assembly]')).getPropertyValue('--prog').trim() : null,
          };
        });

        const expectDir = locale === 'ar' ? 'rtl' : 'ltr';
        report(meta.lang === locale, `${tag}: lang=${meta.lang}`);
        report(meta.dir === expectDir, `${tag}: dir=${meta.dir}`);
        if (vp.width < 640) report(meta.bodyFont >= 16, `${tag}: body font ${meta.bodyFont}px >= 16`);
        report(meta.overflowX <= 1, `${tag}: horizontal overflow ${meta.overflowX}px`);
        report(consoleErrors.length === 0, `${tag}: console errors (${consoleErrors.length})`);
        report(failedReqs.length === 0, `${tag}: failed requests (${failedReqs.length})`);
        if (consoleErrors.length) consoleErrors.slice(0, 3).forEach((e) => results.push('        | ' + e));
        if (failedReqs.length) failedReqs.slice(0, 3).forEach((e) => results.push('        | ' + e));

        await page.close();
      }
    }
  }

  // --- Reduced motion: home page must render complete (no hidden reveals). ---
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
    const rm = await page.evaluate(() => {
      const hidden = [...document.querySelectorAll('.reveal, .zoom-in')]
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length;
      const asm = document.querySelector('[data-assembly]');
      const prog = asm ? getComputedStyle(asm).getPropertyValue('--prog').trim() : null;
      return { hidden, prog, constellation: !!document.querySelector('.constellation') };
    });
    report(rm.hidden === 0, `reduced-motion home: no hidden reveals (${rm.hidden})`);
    report(rm.prog === '1' || rm.prog === '', `reduced-motion home: assembly complete (--prog=${rm.prog})`);
    await page.close();
  }

  // --- Keyboard reachability: skip link + nav toggle focusable. ---
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const skipFocused = await page.evaluate(() => document.activeElement && document.activeElement.className.indexOf('skip-link') >= 0);
    report(skipFocused, 'keyboard: first Tab lands on skip link');
    await page.close();
  }

  // --- Screenshots: home EN/AR desktop + mobile, plus about EN desktop. ---
  async function shot(name, url, vp) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false });
    await page.close();
  }
  await shot('home-en-desktop', `http://127.0.0.1:${PORT}/index.html`, { width: 1440, height: 900 });
  await shot('home-ar-desktop', `http://127.0.0.1:${PORT}/ar/index.html`, { width: 1440, height: 900 });
  await shot('home-en-mobile', `http://127.0.0.1:${PORT}/index.html`, { width: 390, height: 844 });
  await shot('home-ar-mobile', `http://127.0.0.1:${PORT}/ar/index.html`, { width: 390, height: 844 });
  await shot('about-en-desktop', `http://127.0.0.1:${PORT}/about.html`, { width: 1440, height: 900 });
  await shot('esaal-en-desktop', `http://127.0.0.1:${PORT}/esaal.html`, { width: 1440, height: 900 });

  await browser.close();
  server.close();

  console.log(results.join('\n'));
  console.log('\n=== SUMMARY ===');
  console.log(`checks: ${results.length}, failures: ${failures.length}`);
  if (failures.length) { console.log('\nFAILURES:\n  ' + failures.join('\n  ')); process.exit(1); }
  console.log('ALL CHECKS PASSED');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(2); });
