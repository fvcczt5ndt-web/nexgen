#!/usr/bin/env node
/* Screen-size parity: every page must show the same images and the same
   headings at every width, with no horizontal overflow and a real (non-empty)
   hero photograph wherever the desktop has one.
   Usage: node tools/parity-check.js [baseUrl]   (default: local site/ via file://) */
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { ({ chromium } = require('/tmp/nexver/node_modules/playwright-core')); }
const path = require('path');
const fs = require('fs');
const SITE = path.resolve(__dirname, '..', 'site');
const base = process.argv[2] || 'file://' + SITE + '/';
const WIDTHS = [360, 390, 768, 1024, 1440];
const PAGES = fs.readdirSync(SITE).filter(f => f.endsWith('.html'));

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const page of PAGES) {
    const snap = {};
    for (const w of WIDTHS) {
      const pg = await browser.newPage({ viewport: { width: w, height: 900 } });
      await pg.goto(base + page, { waitUntil: 'networkidle' });
      await pg.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important;transition:none!important}' });
      snap[w] = await pg.evaluate(() => {
        const shown = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
          return r.width > 8 && r.height > 8 && s.display !== 'none' && s.visibility !== 'hidden'; };
        const imgs = [...document.querySelectorAll('main img, section img, footer img')]
          .filter(shown).map(i => (i.currentSrc || i.src).split('/').pop().replace(/-960|-crop/, ''));
        const heads = [...document.querySelectorAll('h1,h2,h3')].filter(shown).map(h => h.textContent.trim().replace(/\s+/g, ' '));
        const hm = document.querySelector('.hero__media');
        const hero = hm ? Math.round(hm.getBoundingClientRect().height) : null;
        const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return { imgs: [...new Set(imgs)].sort(), heads, hero, over };
      });
      await pg.close();
    }
    const ref = snap[1440];
    const problems = [];
    for (const w of WIDTHS) {
      const s = snap[w];
      const missImgs = ref.imgs.filter(i => !s.imgs.includes(i));
      const missHeads = ref.heads.filter(h => !s.heads.includes(h));
      if (missImgs.length) problems.push(`${w}px missing images: ${missImgs.join(', ')}`);
      if (missHeads.length) problems.push(`${w}px missing headings: ${missHeads.join(' | ')}`);
      if (s.over > 0) problems.push(`${w}px horizontal overflow ${s.over}px`);
      if (ref.hero && (!s.hero || s.hero < 120)) problems.push(`${w}px hero photo missing/collapsed (${s.hero})`);
    }
    failures += problems.length;
    console.log((problems.length ? 'FAIL ' : 'ok   ') + page.padEnd(20) + ` heroH ${WIDTHS.map(w => snap[w].hero).join('/')}`);
    problems.forEach(p => console.log('       ' + p));
  }
  await browser.close();
  console.log(failures ? `\n${failures} parity problem(s)` : '\nparity: all pages match across 5 widths');
  process.exit(failures ? 1 : 0);
})();
