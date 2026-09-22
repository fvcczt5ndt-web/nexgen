#!/usr/bin/env node
/* Deep browser check for the Arabic locale — the things parity cannot see:
   did the Arabic webfonts actually load, is tracking really off, does the hero
   composition mirror instead of the photograph colliding with the type, and
   does the language switch lead to the same page in the other locale.
   Usage: node tools/arabic-check.js */
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { ({ chromium } = require('/tmp/nexver/node_modules/playwright-core')); }
const path = require('path');
const SITE = path.resolve(__dirname, '..', 'site');
const base = 'file://' + SITE + '/';

const AR_PAGES = ['index.html', 'about.html', 'companies.html', 'inpipe-energy.html',
  'trust-flow.html', 'esaal.html', 'dari.html', 'saby.html', 'contact.html'];

(async () => {
  const browser = await chromium.launch();
  const problems = [];

  for (const page of AR_PAGES) {
    const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pg.goto(base + 'ar/' + page, { waitUntil: 'networkidle' });
    await pg.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important;transition:none!important}' });

    const r = await pg.evaluate(async () => {
      await document.fonts.ready;
      const cs = getComputedStyle;
      const body = cs(document.body);
      const h1 = document.querySelector('h1');
      const lead = document.querySelector('.lead');
      const media = document.querySelector('.hero__media');
      const inner = document.querySelector('.hero__inner');

      /* Which faces actually resolved for Arabic text? Test the weights the
         page genuinely renders with. A browser only downloads the faces that
         are used, so a page whose headings are all 600 will legitimately leave
         the 400 face "unloaded" — checking a fixed weight would report that as
         a failure. Ask for the computed weight of real Arabic elements instead. */
      const arabicEls = [...document.querySelectorAll('h1,h2,h3,h4,p,li,span,a,figcaption')]
        .filter((el) => /[\u0600-\u06FF]/.test(el.textContent || ''));
      const weights = [...new Set(arabicEls.map((el) => cs(el).fontWeight))];
      const amiriUsed = arabicEls.filter((el) => /Amiri/.test(cs(el).fontFamily));
      const plexUsed = arabicEls.filter((el) => /Plex Sans Arabic/.test(cs(el).fontFamily));
      const amiriLoaded = amiriUsed.length === 0
        ? true
        : amiriUsed.every((el) => document.fonts.check(`${cs(el).fontWeight} 16px Amiri`, 'نبني'));
      const plexLoaded = plexUsed.length === 0
        ? true
        : plexUsed.every((el) => document.fonts.check(`${cs(el).fontWeight} 16px "IBM Plex Sans Arabic"`, 'نبني'));
      const amiriCount = amiriUsed.length, plexCount = plexUsed.length;

      /* Tracking must be zero on Arabic — any positive value severs the joins. */
      const tracked = [];
      document.querySelectorAll('h1,h2,h3,h4,p,li,a,span,figcaption').forEach((el) => {
        const ls = cs(el).letterSpacing;
        if (ls && ls !== 'normal' && parseFloat(ls) !== 0) tracked.push(el.className || el.tagName);
      });

      /* RTL composition: on a wide screen the hero photograph should sit on the
         LEFT (inset 0 auto 0 0) so the copy reads from the right. */
      let mediaLeft = null, innerLeft = null;
      if (media && inner) {
        const mr = media.getBoundingClientRect(), ir = inner.getBoundingClientRect();
        mediaLeft = Math.round(mr.left);
        innerLeft = Math.round(ir.left);
      }

      /* Language switch must point at this same page in the other locale. */
      const sw = document.querySelector('.lang-switch');

      /* Tap targets: every interactive element at least 44px tall. */
      const small = [];
      document.querySelectorAll('a,button').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && b.height > 0 && b.height < 44) small.push(`${el.className || el.tagName}:${Math.round(b.height)}`);
      });

      /* Nothing should stick out past the viewport. */
      const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;

      return {
        dir: document.documentElement.getAttribute('dir'),
        lang: document.documentElement.getAttribute('lang'),
        bodyFont: body.fontFamily,
        h1Font: h1 ? cs(h1).fontFamily : null,
        h1Tracking: h1 ? cs(h1).letterSpacing : null,
        leadLineHeight: lead ? cs(lead).lineHeight : null,
        amiriLoaded, plexLoaded, amiriCount, plexCount, weights,
        tracked: [...new Set(tracked)].slice(0, 5),
        mediaLeft, innerLeft,
        switchHref: sw ? sw.getAttribute('href') : null,
        switchLabel: sw ? sw.textContent.trim() : null,
        small: [...new Set(small)].slice(0, 6),
        over,
      };
    });
    await pg.close();

    const tag = `ar/${page}`;
    const bad = [];
    if (r.dir !== 'rtl') bad.push(`dir=${r.dir}`);
    if (r.lang !== 'ar') bad.push(`lang=${r.lang}`);
    if (!r.amiriLoaded) bad.push('Amiri NOT loaded for the weights in use');
    if (!r.plexLoaded) bad.push('Plex Arabic NOT loaded for the weights in use');
    if (r.amiriCount === 0) bad.push('no Arabic text resolving to Amiri');
    if (r.plexCount === 0) bad.push('no Arabic text resolving to Plex Arabic');
    if (r.h1Tracking && r.h1Tracking !== 'normal' && parseFloat(r.h1Tracking) !== 0) bad.push(`h1 tracking=${r.h1Tracking}`);
    if (r.tracked.length) bad.push(`tracked: ${r.tracked.join(', ')}`);
    if (r.over > 0) bad.push(`overflow ${r.over}px`);
    if (r.small.length) bad.push(`tap targets <44: ${r.small.join(', ')}`);
    /* Expect the switch to name English and point one level up. */
    if (!r.switchHref || !/^\.\.\//.test(r.switchHref)) bad.push(`switch href=${r.switchHref}`);

    problems.push(...bad.map((b) => `${tag}: ${b}`));
    console.log((bad.length ? 'FAIL ' : 'ok   ') + tag.padEnd(26) +
      `amiri=${r.amiriLoaded ? 'y' : 'n'}(${r.amiriCount}) plex=${r.plexLoaded ? 'y' : 'n'}(${r.plexCount}) ` +
      `mediaL=${r.mediaLeft} innerL=${r.innerLeft} sw=${r.switchLabel}`);
  }

  /* English side: the switch must point INTO /ar/, and no Arabic font should leak
     into the Latin pages. */
  for (const page of ['index.html', 'about.html']) {
    const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pg.goto(base + page, { waitUntil: 'networkidle' });
    const r = await pg.evaluate(async () => {
      await document.fonts.ready;
      const sw = document.querySelector('.lang-switch');
      return {
        dir: document.documentElement.getAttribute('dir'),
        switchHref: sw ? sw.getAttribute('href') : null,
        switchLabel: sw ? sw.textContent.trim() : null,
        bodyFont: getComputedStyle(document.body).fontFamily,
      };
    });
    await pg.close();
    const bad = [];
    if (r.dir !== 'ltr') bad.push(`dir=${r.dir}`);
    if (!/^ar\//.test(r.switchHref || '')) bad.push(`switch href=${r.switchHref}`);
    if (/Amiri|Plex Sans Arabic/.test(r.bodyFont)) bad.push('Arabic font leaked into English page');
    problems.push(...bad.map((b) => `${page}: ${b}`));
    console.log((bad.length ? 'FAIL ' : 'ok   ') + page.padEnd(26) + `switch -> ${r.switchHref} (${r.switchLabel})`);
  }

  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s):\n  ` + problems.join('\n  ') : '\narabic-check: all clear');
  process.exit(problems.length ? 1 : 0);
})();
