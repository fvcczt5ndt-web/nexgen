#!/usr/bin/env node
/* Generates the static NEXGEN Holdings site: English at the root, Arabic under
   /ar/. Both locales share ONE set of templates, so the two versions cannot
   drift apart — only the strings and the text direction change.

   Still no build step to view the output: this script writes plain HTML once.

   Assets are shared. English pages reference them as "assets/…"; Arabic pages
   live one directory deeper, so they reference "../assets/…". That prefix is the
   only structural difference between the two renders (ctx.A). */
const fs = require('fs');
const path = require('path');
const enContent = require('./en-content.js');
const arContent = require('./ar-content.js');

const OUT = '/home/opc/.openclaw/workspace/nexgen/site';
const SITE = 'https://nexgen.bh';
const PHONE = '+973 3660 0911';
const PHONE_HREF = 'tel:+97336600911';
const EMAIL = 'info@nexgen.bh';
const LINKEDIN = 'https://www.linkedin.com/company/nexgen-holdings/';

/* ------------------------------------------------------- structural metadata
   Things that do not translate: file names, slugs, image files. Everything a
   reader sees comes from the locale content files. */

const VENTURE_META = [
  { key: 'trust-flow', name: 'Trust Flow', file: 'trust-flow.html', img: 'venture-trust-flow.webp' },
  { key: 'esaal',      name: 'Esaal',      file: 'esaal.html',      img: 'venture-esaal.webp' },
  { key: 'dari',       name: 'Dari',       file: 'dari.html',       img: 'venture-dari.webp', status: true },
  { key: 'saby',       name: 'SABY',       file: 'saby.html',       img: 'venture-saby.webp' },
];

/* InPipe is a company too; it is kept apart from VENTURE_META because the footer
   and nav list it in their own place. */
const INPIPE_META = {
  key: 'inpipe', name: 'InPipe Energy', file: 'inpipe-energy.html',
  img: 'inpipe-plant.webp', round: true,
};

const PILLAR_META = [
  { key: 'energy',  files: ['inpipe-energy.html'] },
  { key: 'digital', files: ['esaal.html', 'saby.html'] },
  { key: 'ai',      files: ['trust-flow.html', 'dari.html'] },
];

const INPIPE_TEAM = [
  { file: 'inpipe-semler.webp',    name: 'Gregg Semler' },
  { file: 'inpipe-frost.webp',     name: 'David Frost' },
  { file: 'inpipe-klann.webp',     name: 'Richard Klann' },
  { file: 'inpipe-conner.webp',    name: 'Mickey Conner' },
  { file: 'inpipe-robinson.webp',  name: 'John Robinson' },
  { file: 'inpipe-perrin.webp',    name: 'Kyle Perrin' },
  { file: 'inpipe-morrison.webp',  name: 'Chris Morrison' },
  { file: 'inpipe-dickinson.webp', name: 'Mary Ann Dickinson' },
];

/* Esaal's own leadership. Advisors have no portrait in the source, so they are
   listed by name only rather than padded with a stock face. */
const ESAAL_TEAM = [
  { file: 'esaal-reem.webp',     name: 'Reem Musabbah' },
  { file: 'esaal-alhassan.webp', name: 'AlHassan A.' },
  { file: 'esaal-anas.webp',     name: 'Anas Ali' },
];

const ESAAL_ADVISORS = ['Mohamed Roushdy, MBA', 'Sreela Sreenarayanan', 'Ashutosh Ashish'];

/* NEXGEN's own people. `latin` is the name as it appears on the English site;
   the Arabic locale may carry its own rendering in T.people[key].name. */
const LEADERSHIP = [
  { key: 'omar',       file: 'team-omar.webp',      latin: 'Omar Almutairi',       altKey: 'omar' },
  { key: 'jernej',     file: 'team-jernej.webp',    latin: 'Jernej Hercog',        altKey: 'jernej' },
  { key: 'moatassem',  file: 'team-moatassem.webp', latin: 'Moatassem Abdelhaleem', altKey: 'moatassem' },
];

const ADVISORS = [
  { key: 'advisorAlenezi',  file: 'advisor-alenzi.webp',  latin: 'Abdullah Alenezi', url: 'https://www.linkedin.com/in/abdullahmansouralenezi' },
  { key: 'advisorAlsharah', file: 'advisor-alsharah.webp', latin: 'Hanan Alsharah',   url: 'https://www.linkedin.com/in/hanan-alsharah-67b9a01b9' },
];

/* Personal names are Latin in the English content; the Arabic locale supplies
   its own rendering by Latin key. Falling back to the Latin name is deliberate:
   a name the locale has not transliterated still renders (the Arabic faces
   carry the full Latin set) instead of vanishing. */
function nameFor(T, latin) {
  return (T.names && T.names[latin]) || latin;
}

/* Fills a {name}/{role}/{note} object from locale content, falling back to the
   Latin name where the locale has no rendering of it (non-Arab personal names). */
function person(T, key, latinName) {
  const p = (T.people && T.people[key]) || {};
  return { name: p.name || nameFor(T, latinName) || '', role: p.role || '', note: p.note || '' };
}

/* ------------------------------------------------------------------- chrome */

function topbar(T, ctx) {
  const items = ctx.NAV.map((item) => {
    if (!item.children) {
      const current = item.href === ctx.active ? ' aria-current="page"' : '';
      return `          <li><a href="${item.href}"${current}>${item.label}</a></li>`;
    }
    /* The group lights up when the overview page or any of its children is the
       page you are on, so the caret never hides where you are. */
    const groupCurrent = item.children.some((c) => c.href === ctx.active);
    const self = item.href === ctx.active ? ' aria-current="page"' : '';
    const kids = item.children
      .map((c) => `              <li><a href="${c.href}"${c.href === ctx.active ? ' aria-current="page"' : ''}>${c.label}</a></li>`)
      .join('\n');
    return `          <li class="drop${groupCurrent ? ' is-current' : ''}" data-drop>
            <a href="${item.href}"${self}>${item.label}</a>
            <button class="drop__toggle" type="button" data-drop-toggle aria-expanded="false" aria-controls="${item.id}" aria-label="${T.nav.openMenu(item.label)}">
              <span class="drop__caret" aria-hidden="true"></span>
            </button>
            <ul class="drop__menu" id="${item.id}">
${kids}
            </ul>
          </li>`;
  }).join('\n');

  return `  <a class="skip-link" href="#main">${T.nav.skip}</a>
  <header class="topbar" data-topbar>
    <div class="container topbar__inner">
      <a class="topbar__brand" href="index.html" aria-label="${T.nav.brandHome}">
        <img src="${ctx.A}img/mark.webp" alt="${T.nav.brandName}" width="52" height="52">
        <span class="topbar__brand-text">
          <span class="topbar__brand-name">NEXGEN</span>
          <span class="topbar__brand-tag">Holdings</span>
        </span>
      </a>
      <button class="topbar__toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="primary-menu" aria-label="${T.nav.openNav}">
        <span></span><span></span><span></span>
      </button>
      <nav class="topbar__nav" aria-label="${T.nav.primary}">
        <ul class="topbar__menu" id="primary-menu">
${items}
        </ul>
      </nav>
      <div class="topbar__end">
        <a class="lang-switch" href="${ctx.switchHref}" hreflang="${ctx.switchLang}" lang="${ctx.switchLang}" aria-label="${T.nav.langAria}">${T.nav.langLabel}</a>
        <a class="btn btn--quiet topbar__cta" href="contact.html"${ctx.active === 'contact.html' ? ' aria-current="page"' : ''}>${T.nav.contact}</a>
      </div>
    </div>
  </header>`;
}

/* One closing call to action per page, worded for the page it closes: the same
   action the hero offers, said once more where a reader who has finished the
   page is deciding what to do next. Phone is a quiet text alternative. */
function ctaBand(T, ctx, cta, theme = '') {
  return `  <section class="cta-band${theme ? ` theme-${theme}` : ''}">
    <div class="container">
      <div class="cta-band__inner">
        <div class="cta-band__copy">
          <h2>${cta.title}</h2>
          <p>${cta.text}</p>
        </div>
        <div class="cta-band__actions">
          <a class="btn btn--primary" href="contact.html">${cta.label}</a>
          <a class="cta-band__alt" href="${PHONE_HREF}">${T.cta.alt(PHONE)}</a>
        </div>
      </div>
    </div>
  </section>`;
}

function footer(T, ctx) {
  /* Home and About Us are site pages, not companies — they sit under Quick
     Links. Ventures & Partnerships lists every company and partner in one
     place, InPipe included, so nothing is miscategorised as "Company". */
  const all = [INPIPE_META, ...VENTURE_META];
  const ventureLinks = all
    .map((v) => `            <a href="${v.file}">${v.name}</a>`)
    .join('\n');
  return `  <footer class="footer">
    <div class="container footer__top">
      <div class="footer__brand">
        <img src="${ctx.A}img/logo.webp" alt="${T.nav.brandName}" width="46" height="52">
        <p>${T.footer.blurb}</p>
      </div>
      <div>
        <h2 class="footer__heading">${T.footer.ventures}</h2>
        <nav class="footer__links" aria-label="${T.footer.venturesAria}">
${ventureLinks}
        </nav>
      </div>
      <div>
        <h2 class="footer__heading">${T.footer.quick}</h2>
        <nav class="footer__links" aria-label="${T.footer.quickAria}">
          <a href="index.html">${T.footer.home}</a>
          <a href="about.html">${T.footer.about}</a>
          <a href="companies.html">${T.footer.venturesLink}</a>
          <a href="contact.html">${T.footer.contact}</a>
        </nav>
      </div>
      <div>
        <h2 class="footer__heading">${T.footer.getInTouch}</h2>
        <div class="footer__contact">
          <div>
            <span class="footer__label">${T.footer.phone}</span>
            <a href="${PHONE_HREF}">${PHONE}</a>
          </div>
          <div>
            <span class="footer__label">${T.footer.email}</span>
            <a href="mailto:${EMAIL}">${EMAIL}</a>
          </div>
          <div>
            <span class="footer__label">${T.footer.linkedin}</span>
            <a href="${LINKEDIN}" target="_blank" rel="noopener">nexgen-holdings</a>
          </div>
        </div>
      </div>
    </div>
    <div class="container footer__bottom">
      <p>${T.footer.copyright}</p>
      <p><a href="${ctx.R}sitemap.xml">${T.footer.sitemap}</a></p>
    </div>
  </footer>`;
}

function page(T, ctx, { slug, title, desc, active, head = '', body, ogImage = 'hero-home.webp', noCta = false, cta = null, theme = '' }) {
  const home = slug === 'index.html';
  const canonical = ctx.code === 'en'
    ? (home ? `${SITE}/` : `${SITE}/${slug}`)
    : (home ? `${SITE}/ar/` : `${SITE}/ar/${slug}`);
  const altEn = home ? `${SITE}/` : `${SITE}/${slug}`;
  const altAr = home ? `${SITE}/ar/` : `${SITE}/ar/${slug}`;
  /* Fonts differ per locale, so preload only the pair this page renders in. */
  const preload = ctx.code === 'ar'
    ? `<link rel="preload" href="${ctx.A}fonts/amiri-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.A}fonts/plex-arabic-regular.woff2" as="font" type="font/woff2" crossorigin>`
    : `<link rel="preload" href="${ctx.A}fonts/newsreader-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.A}fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>`;
  return `<!DOCTYPE html>
<html lang="${ctx.code}" dir="${ctx.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${altEn}">
<link rel="alternate" hreflang="ar" href="${altAr}">
<link rel="alternate" hreflang="x-default" href="${altEn}">
<meta name="theme-color" content="#363634">
<meta property="og:type" content="website">
<meta property="og:site_name" content="NEXGEN Holdings">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/img/${ogImage}">
<meta property="og:locale" content="${ctx.ogLocale}">
${ctx.ogAlt ? `<meta property="og:locale:alternate" content="${ctx.ogAlt}">
` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}/assets/img/${ogImage}">
<link rel="icon" href="${ctx.R}favicon.png" type="image/png">
<link rel="apple-touch-icon" href="${ctx.R}favicon.png">
${preload}
<link rel="stylesheet" href="${ctx.A}css/site.css">
${head}</head>
<body>
${topbar(T, ctx)}
<main id="main"${theme ? ` class="theme-${theme}"` : ''}>
${body}
</main>
${noCta || !cta || cta.band === false ? '' : ctaBand(T, ctx, cta, theme)}
${footer(T, ctx)}
<script src="${ctx.A}js/site.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ blocks */

function ventureCard(T, ctx, v, h, i, wide) {
  const copy = T.ventures[v.key];
  const img = v.round
    ? `<img class="venture__mark--round" src="${ctx.A}img/${v.img}" alt="${v.name} — ${copy.kicker}" loading="lazy" decoding="async">`
    : `<img src="${ctx.A}img/${v.img}" alt="${v.name} — ${copy.kicker}" loading="lazy" decoding="async">`;
  /* A venture that is not live says so on its card, in the site's own pill. */
  const status = v.status
    ? `\n                <p class="status-note">${T.ui.inDevelopment}</p>`
    : '';
  return `            <article class="card venture reveal${wide ? ' venture--wide' : ''}" data-delay="${i % 3}">
              <div class="venture__media">
                ${img}
              </div>
              <div class="venture__body">
                <p class="venture__kicker">${copy.kicker}</p>${status}
                <h${h} class="venture__title">${v.name}</h${h}>
                <p>${copy.copy}</p>
                <div class="card__foot"><a class="link-arrow" href="${v.file}">${T.ui.readMore}</a></div>
              </div>
            </article>`;
}

/* Companies grouped under the three focus areas. headLevel is the pillar
   heading; cards sit one level below it. */
function pillarSections(T, ctx, headLevel, cardLevel) {
  const all = [INPIPE_META, ...VENTURE_META];
  return PILLAR_META.map((p, pi) => {
    const items = p.files.map((f) => all.find((v) => v.file === f));
    const cards = items.map((v, i) => ventureCard(T, ctx, v, cardLevel, i, items.length === 1)).join('\n');
    return `        <div class="pillar">
          <div class="pillar__head reveal">
            <p class="pillar__num">0${pi + 1}</p>
            <h${headLevel} class="pillar__title">${T.pillars[p.key].name}</h${headLevel}>
            <p>${T.pillars[p.key].blurb}</p>
          </div>
          <div class="pillar__cards${items.length > 1 ? ' pillar__cards--2' : ''}">
${cards}
          </div>
        </div>`;
  }).join('\n');
}

function teamCards(T, ctx, team, roles) {
  return team.map((m, i) => `        <article class="teammate reveal" data-delay="${i % 4}">
          <img src="${ctx.A}img/${m.file}" alt="${nameFor(T, m.name)}" loading="lazy" decoding="async">
          <h3 class="teammate__name">${nameFor(T, m.name)}</h3>
          <p class="teammate__role">${roles[m.name] || ''}</p>
        </article>`).join('\n');
}

/* Hero renditions: every width build-images.js emitted for this photograph,
   ascending. Reading them off disk keeps the markup honest — a page never
   advertises a width that was never produced, and a hero whose source is only
   1280px wide is never claimed as 1920w. */
function heroRenditions(image) {
  const base = image.replace(/\.webp$/, '');
  const out = [];
  for (const f of [`${base}-960.webp`, `${base}-1440.webp`, image]) {
    const dim = intrinsic(`assets/img/${f}`);
    if (dim && !out.some((r) => r.f === f)) out.push({ f, w: dim.w, h: dim.h });
  }
  return out.sort((a, b) => a.w - b.w);
}

function hero(T, ctx, { image, imageStacked, mark, title, lead, eyebrow, status = '', actions = '', cls = '' }) {
  /* Both the srcset and the sizes attribute are derived rather than assumed.
     They were wrong before in two ways that are exactly the "pixelated on a
     large screen" complaint:
       - every hero advertised 1920w whether or not a 1920px file existed, so a
         1280px source was upscaled to fill the claim;
       - sizes said 66vw for every hero, including the full-bleed ones, so a
         1440px screen asked for the 960px file and stretched it.
     A split hero paints into 66vw once the layout splits at 1100px; every other
     photo hero is full bleed at every width. */
  const rends = image ? heroRenditions(image) : [];
  const largest = rends[rends.length - 1];
  const sizes = /hero--split/.test(cls)
    ? '(max-width: 1099px) 100vw, 66vw'
    : '100vw';
  const dims = largest ? ` width="${largest.w}" height="${largest.h}"` : '';
  const webpSrcset = rends.map((r) => `${ctx.A}img/${r.f} ${r.w}w`).join(', ');
  /* AVIF rides along only where it survived the size check in build-images.js,
     so a <source> is emitted only when it is a real win at that width. */
  const avif = rends
    .map((r) => ({ ...r, f: r.f.replace(/\.webp$/, '.avif') }))
    .filter((r) => fs.existsSync(path.join(OUT, 'assets', 'img', r.f)));
  const sources = [];
  /* imageStacked: a tighter crop swapped in where the hero stacks (< 1100px).
     It is an art-directed frame with its own file, so it is listed first and
     wins by media query before the format sources below are considered. */
  if (imageStacked) sources.push(`<source media="(max-width: 1099px)" srcset="${ctx.A}img/${imageStacked}">`);
  if (avif.length) sources.push(`<source type="image/avif" srcset="${avif.map((r) => `${ctx.A}img/${r.f} ${r.w}w`).join(', ')}" sizes="${sizes}">`);
  sources.push(`<source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">`);
  const imgTag = `<img src="${ctx.A}img/${image}" srcset="${webpSrcset}" sizes="${sizes}"${dims} alt="" fetchpriority="high" decoding="async">`;
  const picture = `<picture>${sources.join('')}${imgTag}</picture>`;
  const media = image
    ? `    <div class="hero__media">${picture}</div>\n`
    : '';
  /* hero--photo marks the heroes that carry a backdrop photograph. Only those
     get the fade into the page ground; the compact petrol "plate" heroes hold
     their own dark ground edge to edge. */
  const photoCls = image ? ' hero--photo' : '';
  const markHtml = mark
    ? `      <img class="hero__mark" src="${ctx.A}img/${mark}" alt="" width="240" height="240">\n`
    : '';
  const eyebrowHtml = eyebrow ? `      <p class="eyebrow">${eyebrow}</p>\n` : '';
  const statusHtml = status ? `      <p class="status-note">${status}</p>\n` : '';
  const actionsHtml = actions ? `      <div class="btn-row hero__actions">${actions}</div>\n` : '';
  return `  <section class="hero${cls}${photoCls}">
${media}    <div class="container hero__inner">
${markHtml}${eyebrowHtml}      <h1>${title}</h1>
${statusHtml}      <p class="lead">${lead}</p>
${actionsHtml}    </div>
  </section>`;
}

/* A venture page opens like the homepage: copy and logo tile on the ground, a
   photograph open on one side. The photograph is optional so a page never ships
   an empty frame: without assets/img/hero-<slug>.webp it keeps the compact
   petrol plate. */
function ventureHeroOpts(slug) {
  const big = `hero-${slug}.webp`;
  if (!fs.existsSync(path.join(OUT, 'assets', 'img', big))) return { cls: ' hero--plate hero--home' };
  return { image: big, cls: ` hero--home hero--split hero--venture hero--${slug}` };
}

function splitImage(ctx, src, alt, opts = {}) {
  return `        <figure class="figure reveal">
          <img src="${ctx.A}img/${src}" alt="${alt}" loading="lazy" decoding="async">
        </figure>`;
}

/* ------------------------------------------------------------------- pages */

function homeBody(T, ctx) {
  const p = T.pages.index;
  return `${hero(T, ctx, {
    image: 'hero-home.webp',
    title: p.heroTitle,
    lead: p.heroLead,
    actions: `<a class="btn btn--accent" href="#focus-areas">${p.heroBtn1}</a>
        <a class="btn btn--onDark" href="companies.html">${p.heroBtn2}</a>`,
    cls: ' hero--home hero--split',
  })}

  <section class="section">
    <div class="container split split--editorial">
      <div class="reveal">
        <h2>${p.h2}</h2>
        <p class="lead">${p.lead}</p>
      </div>
      <div class="reveal" data-delay="1">
        <p>${p.p1}</p>
        <p>${p.p2}</p>
        <div class="btn-row mt-3"><a class="btn btn--outline" href="about.html">${p.btn}</a></div>
      </div>
    </div>
  </section>

  <section class="section section--alt" id="focus-areas">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">${p.eyebrow}</p>
        <h2>${p.focusH2}</h2>
        <p class="lead">${p.focusLead}</p>
      </div>
      <div class="pillars mt-4">
${pillarSections(T, ctx, 3, 4)}
      </div>
    </div>
  </section>`;
}

function aboutBody(T, ctx) {
  const p = T.pages.about;
  const alts = T.imgAlts || {};
  const lead0 = LEADERSHIP[0], lead1 = LEADERSHIP[1], lead2 = LEADERSHIP[2];
  const p0 = person(T, lead0.key, lead0.latin);
  const p1 = person(T, lead1.key, lead1.latin);
  const p2 = person(T, lead2.key, lead2.latin);
  const adv0 = person(T, ADVISORS[0].key, ADVISORS[0].latin);
  const adv1 = person(T, ADVISORS[1].key, ADVISORS[1].latin);
  const founderRole = (T.people.abdullah || {}).role || 'Chairman &amp; CEO';
  const founderAlt = (T.people.abdullah || {}).alt || (T.people.abdullah || {}).altText || '';
  return `${hero(T, ctx, {
    image: 'hero-about.webp',
    cls: ' hero--abstract',
    title: p.heroTitle,
    lead: p.heroLead,
  })}

  <section class="section">
    <div class="container split split--reverse">
      <div class="reveal">
        <h2>${p.h2}</h2>
        <p class="lead">${p.lead}</p>
        <p>${p.p1}</p>
        <p>${p.p2}</p>
      </div>
      ${splitImage(ctx, 'contact-visual.webp', alts.corporateVisual || 'NEXGEN Holdings corporate visual')}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal intro">
        <h2>${p.vmH2}</h2>
      </div>
      <div class="grid grid-2 mt-4">
        <article class="panel reveal">
          <h3>${p.visionH}</h3>
          <p>${p.visionP}</p>
        </article>
        <article class="panel reveal" data-delay="1">
          <h3>${p.missionH}</h3>
          <p>${p.missionP}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">${p.valuesEyebrow}</p>
        <h2>${p.valuesH2}</h2>
      </div>
      <ul class="chips chips--center mt-4 reveal">
${p.values.map((v) => `        <li>${v}</li>`).join('\n')}
      </ul>
    </div>
  </section>

  <section class="section section--dark">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">${p.founderEyebrow}</p>
        <h2>${(T.people.abdullah || {}).name || p.founderName}</h2>
        <p class="person__role">${founderRole}</p>
        <p>${p.founderP1}</p>
        <p>${p.founderP2}</p>
        <p>${p.founderP3}</p>
        <p>${p.founderP4}</p>
      </div>
      <figure class="figure reveal" data-delay="1">
        <img src="${ctx.A}img/team-abdullah.webp" alt="${founderAlt}" loading="lazy" decoding="async">
      </figure>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">${p.leadershipEyebrow}</p>
        <h2>${p.leadershipH2}</h2>
      </div>
      <div class="grid grid-3 mt-4">
        <article class="person reveal">
          <div class="person__media"><img src="${ctx.A}img/${lead0.file}" alt="${p0.name}, ${p0.role}" loading="lazy" decoding="async"></div>
          <div class="person__body">
            <h3 class="person__name">${p0.name}</h3>
            <p class="person__role">${p0.role}</p>
            <p class="person__note">${p0.note}</p>
          </div>
        </article>
        <article class="person reveal" data-delay="1">
          <div class="person__media"><img src="${ctx.A}img/${lead1.file}" alt="${p1.name}, ${p1.role}" loading="lazy" decoding="async"></div>
          <div class="person__body">
            <h3 class="person__name">${p1.name}</h3>
            <p class="person__role">${p1.role}</p>
            <p class="person__note">${p1.note}</p>
          </div>
        </article>
        <article class="person reveal" data-delay="2">
          <div class="person__media"><img src="${ctx.A}img/${lead2.file}" alt="${p2.name}, ${p2.role}" loading="lazy" decoding="async"></div>
          <div class="person__body">
            <h3 class="person__name">${p2.name}</h3>
            <p class="person__role">${p2.role}</p>
            <p class="person__note">${p2.note}</p>
          </div>
        </article>
      </div>

      <div class="center reveal intro mt-6">
        <h2>${p.advisorsH2}</h2>
      </div>
      <!-- Advisory Board carries two members; the AI & digital transformation
           lead sits in the leadership grid above. -->
      <div class="grid grid-2 mt-4">
        <a class="advisor reveal" href="${ADVISORS[0].url}" target="_blank" rel="noopener">
          <img src="${ctx.A}img/${ADVISORS[0].file}" alt="${adv0.name}" loading="lazy" decoding="async">
          <span>
            <span class="advisor__name">${adv0.name}</span>
            <span class="advisor__role">${adv0.role}</span>
          </span>
        </a>
        <a class="advisor reveal" data-delay="1" href="${ADVISORS[1].url}" target="_blank" rel="noopener">
          <img src="${ctx.A}img/${ADVISORS[1].file}" alt="${adv1.name}" loading="lazy" decoding="async">
          <span>
            <span class="advisor__name">${adv1.name}</span>
            <span class="advisor__role">${adv1.role}</span>
          </span>
        </a>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">${p.partnershipsEyebrow}</p>
        <h2>${p.partnershipsH2}</h2>
        <p>${p.partnershipsP1}</p>
        <p>${p.partnershipsP2}</p>
        <p>${p.partnershipsP3}</p>
        <div class="btn-row mt-3"><a class="btn btn--primary" href="contact.html">${p.partnershipsBtn}</a></div>
      </div>
      <div class="reveal" data-delay="1">
        <h2>${p.forwardH2}</h2>
        <p>${p.forwardP}</p>
        <h3 class="mt-4">${p.partnerH3}</h3>
        <p>${p.partnerP}</p>
      </div>
    </div>
  </section>`;
}

function companiesBody(T, ctx) {
  const p = T.pages.companies;
  return `${hero(T, ctx, {
    image: 'hero-about.webp',
    cls: ' hero--abstract',
    title: p.heroTitle,
    lead: p.heroLead,
  })}

  <section class="section">
    <div class="container">
      <div class="pillars">
${pillarSections(T, ctx, 2, 3)}
      </div>
    </div>
  </section>`;
}

function inpipeBody(T, ctx) {
  const p = T.pages.inpipe;
  const alts = T.imgAlts || {};
  const sites = T.inpipeSites;
  return `${hero(T, ctx, {
    image: 'hero-inpipe.webp',
    imageStacked: 'hero-inpipe-crop.webp',
    eyebrow: p.heroEyebrow,
    title: p.heroTitle,
    lead: p.heroLead,
    actions: `<a class="btn btn--accent" href="contact.html">${p.heroBtn}</a>`,
    cls: ' hero--bright hero--inpipe',
  })}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>${p.challengeH}</h2>
        <p>${p.challengeP1}</p>
        <p>${p.challengeP2}</p>
        <ul class="checklist">
${p.challengeList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
      ${splitImage(ctx, 'inpipe-visual.webp', alts.inpipeVisual || 'Water infrastructure energy recovery')}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split split--reverse">
      <div class="reveal">
        <h2>${p.solutionH}</h2>
        <p>${p.solutionP}</p>
        <h3 class="mt-4">${p.advH}</h3>
        <ul class="checklist">
${p.advList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
        <h3 class="mt-4">${p.specH}</h3>
        <ul class="checklist">
${p.specList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
      ${splitImage(ctx, 'inpipe-plant.webp', alts.inpipePlant || 'HydroXS installed on a water pipeline')}
    </div>
  </section>

  <section class="section section--dark">
    <div class="container">
      <div class="center reveal intro">
        <h2>${p.resultsH}</h2>
        <p class="lead">${p.resultsLead}</p>
      </div>
      <div class="stats reveal mt-4">
${p.statsTop.map((s) => `        <div class="stat">
          <p class="stat__value">${s.v}</p>
          <p class="stat__label">${s.l}</p>
        </div>`).join('\n')}
      </div>
      <div class="stats reveal mt-3">
${sites.map((s) => `        <div class="stat">
          <p class="stat__value">${s.v}</p>
          <p><strong>${s.n}</strong></p>
          <p>${s.d}</p>${s.extra ? `\n          <p>${s.extra}</p>` : ''}
        </div>`).join('\n')}
      </div>
      <div class="center mt-3">
        <p class="cred__note">${p.cite}</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>${p.useCasesH}</h2>
        <p>${p.useCasesP}</p>
        <ul class="checklist">
${p.useCasesList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">${p.processEyebrow}</p>
        <h2>${p.processH}</h2>
        <ol class="steps mt-3">
${p.steps.map((s) => `          <li class="step"><div><h3>${s}</h3></div></li>`).join('\n')}
        </ol>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">${p.teamEyebrow}</p>
        <h2>${p.teamH}</h2>
        <p class="lead">${p.teamLead}</p>
      </div>
      <div class="team-grid mt-4">
${teamCards(T, ctx, INPIPE_TEAM, T.inpipeTeamRoles)}
      </div>
    </div>
  </section>`;
}

function trustFlowBody(T, ctx) {
  const p = T.pages.trustFlow;
  return `${hero(T, ctx, {
    mark: 'venture-trust-flow.webp',
    eyebrow: p.heroEyebrow,
    title: p.heroTitle,
    lead: p.heroLead,
    actions: `<a class="btn btn--accent" href="contact.html">${p.heroBtn}</a>`,
    ...ventureHeroOpts('trust-flow'),
  })}

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <h2>${p.challengeH}</h2>
        <p>${p.challengeP}</p>
        <ul class="checklist">
${p.challengeList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
        <p class="mt-3">${p.challengeP2}</p>
      </div>
      <div class="reveal" data-delay="1">
        <h2>${p.solutionH}</h2>
        <p>${p.solutionP}</p>
        <p>${p.solutionP2}</p>
        <h3 class="mt-4">${p.includesH}</h3>
        <ul class="checklist">
${p.includesList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>${p.servesH}</h2>
        <ul class="chips">
${p.servesList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
      <div class="reveal" data-delay="1">
        <h2>${p.gainH}</h2>
        <ul class="checklist">
${p.gainList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>`;
}

function esaalBody(T, ctx) {
  const p = T.pages.esaal;
  return `${hero(T, ctx, {
    mark: 'venture-esaal.webp',
    eyebrow: p.heroEyebrow,
    title: p.heroTitle,
    lead: p.heroLead,
    actions: `<a class="btn btn--accent" href="contact.html">${p.heroBtn}</a>
        <a class="btn btn--onDark" href="https://www.esaal.co/" target="_blank" rel="noopener">${p.heroBtn2}</a>`,
    ...ventureHeroOpts('esaal'),
  })}

  <section class="section">
    <div class="container">
      <div class="center reveal intro--wide">
        <h2>${p.introH}</h2>
        <p class="lead">${p.introLead}</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <h2>${p.problemH}</h2>
        <p>${p.problemP}</p>
        <ul class="checklist">
${p.problemList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
        <div class="panel reveal mt-4">
          <p class="stat__value">${p.problemStatV}</p>
          <p>${p.problemStatP}</p>
          <p class="cred__note">${p.problemCite}</p>
        </div>
      </div>
      <div class="reveal" data-delay="1">
        <h2>${p.solutionH}</h2>
        <p>${p.solutionP}</p>
        <h3 class="mt-4">${p.featuresH}</h3>
        <ul class="checklist">
${p.featuresList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro--wide">
        <p class="eyebrow">${p.platformEyebrow}</p>
        <h2>${p.platformH}</h2>
      </div>
      <div class="grid grid-3 mt-4">
${p.cards.map((c, i) => `        <article class="card reveal"${i % 3 ? ` data-delay="${i % 3}"` : ''}>
          <h3>${c.h}</h3>
          <p>${c.p}</p>
        </article>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section section--dark">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">${p.numbersEyebrow}</p>
        <h2>${p.numbersH}</h2>
      </div>
      <div class="stats reveal mt-4">
${p.stats.map((s) => `        <div class="stat">
          <p class="stat__value">${s.v}</p>
          <p class="stat__label">${s.l}</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>${p.valueH}</h2>
        <ul class="checklist">
${p.valueList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
        <div class="btn-row mt-4">
          <a class="btn btn--primary" href="https://apps.apple.com/ae/app/esaal/id6444912096" target="_blank" rel="noopener">${p.appBtn}</a>
        </div>
      </div>
      <figure class="figure figure--plate reveal" data-delay="1">
        <img src="${ctx.A}img/venture-esaal.webp" alt="${(T.imgAlts || {}).esaalMark || 'Esaal app icon'}" loading="lazy" decoding="async" class="figure__mark figure__mark--lg">
        <figcaption>${p.caption}</figcaption>
      </figure>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">${p.teamEyebrow}</p>
        <h2>${p.teamH}</h2>
        <p class="lead">${p.teamLead}</p>
      </div>
      <div class="team-grid team-grid--trio mt-4">
${teamCards(T, ctx, ESAAL_TEAM, T.esaalTeamRoles)}
      </div>
      <div class="team-advisors reveal">
        <h3 class="team-advisors__title">${p.advisorsTitle}</h3>
        <ul class="team-advisors__list">
${ESAAL_ADVISORS.map((n) => `          <li><strong>${nameFor(T, n)}</strong><span>${T.esaalAdvisorRoles[n] || ''}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>`;
}

function dariBody(T, ctx) {
  const p = T.pages.dari;
  return `${hero(T, ctx, {
    mark: 'venture-dari.webp',
    eyebrow: p.heroEyebrow,
    title: p.heroTitle,
    status: p.heroStatus,
    lead: p.heroLead,
    actions: `<a class="btn btn--accent" href="contact.html">${p.heroBtn}</a>`,
    ...ventureHeroOpts('dari'),
  })}

  <section class="section">
    <div class="container">
      <div class="center reveal intro--wide">
        <h2>${p.introH}</h2>
        <p class="lead">${p.introLead}</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <h2>${p.problemH}</h2>
        <p>${p.problemP}</p>
      </div>
      <div class="reveal" data-delay="1">
        <h2>${p.solutionH}</h2>
        <p>${p.solutionP}</p>
        <h3 class="mt-4">${p.featuresH}</h3>
        <ul class="checklist">
${p.featuresList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <h2>${p.valueH}</h2>
      </div>
      <div class="grid grid-4 mt-4">
${p.values.map((v, i) => `        <div class="value reveal"${i ? ` data-delay="${i}"` : ''}><h3>${v}</h3></div>`).join('\n')}
      </div>
    </div>
  </section>`;
}

function sabyBody(T, ctx) {
  const p = T.pages.saby;
  return `${hero(T, ctx, {
    mark: 'venture-saby.webp',
    eyebrow: p.heroEyebrow,
    title: p.heroTitle,
    lead: p.heroLead,
    actions: `<a class="btn btn--accent" href="contact.html">${p.heroBtn}</a>`,
    ...ventureHeroOpts('saby'),
  })}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>${p.whoH}</h2>
        <p>${p.whoP}</p>
      </div>
      <div class="reveal" data-delay="1">
        <h2>${p.expertiseH}</h2>
        <ul class="checklist">
${p.expertiseList.map((x) => `          <li>${x}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal intro">
        <h2>${p.whyH}</h2>
      </div>
      <div class="grid grid-3 mt-4">
${p.whyCards.map((c, i) => `        <article class="card reveal"${i ? ` data-delay="${i}"` : ''}><h3>${c}</h3></article>`).join('\n')}
      </div>
    </div>
  </section>`;
}

function contactBody(T, ctx) {
  const p = T.pages.contact;
  return `${hero(T, ctx, {
    title: p.heroTitle,
    lead: p.heroLead,
    cls: ' hero--plate',
  })}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">${p.eyebrow}</p>
        <h2>${p.h2}</h2>
        <div class="contact-card mt-3">
          <a class="contact-row" href="${PHONE_HREF}">
            <span class="contact-row__label">${p.phoneLabel}</span>
            <span class="contact-row__value">${PHONE}</span>
            <span class="contact-row__note">${p.phoneNote}</span>
          </a>
          <a class="contact-row" href="mailto:${EMAIL}">
            <span class="contact-row__label">${p.emailLabel}</span>
            <span class="contact-row__value">${EMAIL}</span>
            <span class="contact-row__note">${p.emailNote}</span>
          </a>
          <a class="contact-row" href="${LINKEDIN}" target="_blank" rel="noopener">
            <span class="contact-row__label">${p.linkedinLabel}</span>
            <span class="contact-row__value">nexgen-holdings</span>
            <span class="contact-row__note">${p.linkedinNote}</span>
          </a>
        </div>
      </div>
      <figure class="figure reveal" data-delay="1">
        <img src="${ctx.A}img/contact-visual.webp" alt="${(T.imgAlts || {}).corporateVisual || 'NEXGEN Holdings corporate visual'}" loading="lazy" decoding="async">
      </figure>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal intro--wide">
        <p class="eyebrow">${p.focusEyebrow}</p>
        <h2>${p.focusH}</h2>
        <p class="lead">${p.focusLead}</p>
      </div>
      <div class="grid grid-3 mt-4">
        <article class="card reveal">
          <h3>${p.cardEnergyH}</h3>
          <p>${p.cardEnergyP}</p>
          <div class="card__foot card__foot--links"><a class="link-arrow" href="inpipe-energy.html">InPipe Energy</a></div>
        </article>
        <article class="card reveal" data-delay="1">
          <h3>${p.cardDigitalH}</h3>
          <p>${p.cardDigitalP}</p>
          <div class="card__foot card__foot--links"><a class="link-arrow" href="esaal.html">Esaal</a><a class="link-arrow" href="saby.html">SABY</a></div>
        </article>
        <article class="card reveal" data-delay="2">
          <h3>${p.cardAiH}</h3>
          <p>${p.cardAiP}</p>
          <div class="card__foot card__foot--links"><a class="link-arrow" href="trust-flow.html">Trust Flow</a><a class="link-arrow" href="dari.html">Dari</a></div>
        </article>
      </div>
    </div>
  </section>`;
}

/* --------------------------------------------------------------- page table */

function pageList(T, ctx) {
  return [
    { slug: 'index.html', active: 'index.html', title: T.pages.index.title, desc: T.pages.index.desc, body: homeBody(T, ctx), ogImage: 'hero-home.webp', home: true },
    { slug: 'about.html', active: 'about.html', title: T.pages.about.title, desc: T.pages.about.desc, body: aboutBody(T, ctx), ogImage: 'hero-about.webp' },
    { slug: 'companies.html', active: 'companies.html', title: T.pages.companies.title, desc: T.pages.companies.desc, body: companiesBody(T, ctx), ogImage: 'hero-about.webp' },
    { slug: 'inpipe-energy.html', active: 'inpipe-energy.html', title: T.pages.inpipe.title, desc: T.pages.inpipe.desc, body: inpipeBody(T, ctx), ogImage: 'hero-inpipe.webp' },
    { slug: 'trust-flow.html', active: 'trust-flow.html', title: T.pages.trustFlow.title, desc: T.pages.trustFlow.desc, body: trustFlowBody(T, ctx), ogImage: 'venture-trust-flow.webp', theme: 'trust-flow' },
    { slug: 'esaal.html', active: 'esaal.html', title: T.pages.esaal.title, desc: T.pages.esaal.desc, body: esaalBody(T, ctx), ogImage: 'venture-esaal.webp', theme: 'esaal' },
    { slug: 'dari.html', active: 'dari.html', title: T.pages.dari.title, desc: T.pages.dari.desc, body: dariBody(T, ctx), ogImage: 'venture-dari.webp', theme: 'dari' },
    { slug: 'saby.html', active: 'saby.html', title: T.pages.saby.title, desc: T.pages.saby.desc, body: sabyBody(T, ctx), ogImage: 'venture-saby.webp', theme: 'saby' },
    { slug: 'contact.html', active: 'contact.html', title: T.pages.contact.title, desc: T.pages.contact.desc, body: contactBody(T, ctx), ogImage: 'contact-visual.webp', noCta: true },
  ];
}

/* A page's closing band, taken from its own locale content. A page without a
   ctaTitle gets no band. */
function ctaFor(T, key) {
  const p = T.pages[key];
  if (!p || !p.ctaTitle || p.ctaBand === false) return null;
  return { title: p.ctaTitle, text: p.ctaText, label: p.ctaLabel };
}

function jsonld(T, ctx) {
  const home = ctx.code === 'en' ? `${SITE}/` : `${SITE}/ar/`;
  return `  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${T.jsonld.name}",
  "url": "${home}",
  "email": "${EMAIL}",
  "telephone": "+97336600911",
  "logo": "${SITE}/assets/img/logo.webp",
  "image": "${SITE}/assets/img/hero-home.webp",
  "description": "${T.jsonld.description}",
  "sameAs": [
    "${LINKEDIN}"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "BH"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+97336600911",
    "email": "${EMAIL}",
    "contactType": "general",
    "areaServed": "GCC"
  }
}
  </script>
`;
}

/* --- Intrinsic image sizes -------------------------------------------------
   Every <img> gets width/height so a lazy-loaded image reserves its box and the
   page never reflows as it arrives (this was the visible "jump" on scroll). */
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fmt = b.toString('ascii', 12, 16);
  if (fmt === 'VP8X') {
    return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
             h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
  }
  if (fmt === 'VP8 ') {
    return { w: (b[26] | (b[27] << 8)) & 0x3fff, h: (b[28] | (b[29] << 8)) & 0x3fff };
  }
  if (fmt === 'VP8L') {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
  }
  return null;
}

const sizeCache = new Map();
function intrinsic(src) {
  /* Arabic pages carry an "../assets/…" prefix; the file lives at the same
     place either way. */
  const rel = src.replace(/^(\.\.\/)+/, '');
  if (sizeCache.has(rel)) return sizeCache.get(rel);
  const file = path.join(OUT, rel);
  let dim = null;
  if (fs.existsSync(file)) { try { dim = webpSize(file); } catch (e) { dim = null; } }
  sizeCache.set(rel, dim);
  return dim;
}

function withIntrinsicSizes(html) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\swidth=/.test(tag) && /\sheight=/.test(tag)) return tag;
    const m = tag.match(/\ssrc="((?:\.\.\/)*assets\/img\/[^"]+)"/);
    if (!m) return tag;
    const dim = intrinsic(m[1]);
    if (!dim) return tag;
    return tag.slice(0, -1) + ` width="${dim.w}" height="${dim.h}">`;
  });
}

/* ------------------------------------------------------------------- render */

const LOCALES = [
  {
    code: 'en', dir: 'ltr', T: enContent, out: OUT, A: 'assets/', R: '',
    urlBase: SITE, ogLocale: 'en_US', ogAlt: 'ar_BH',
  },
  {
    code: 'ar', dir: 'rtl', T: arContent, out: path.join(OUT, 'ar'), A: '../assets/', R: '../',
    urlBase: `${SITE}/ar`, ogLocale: 'ar_BH', ogAlt: 'en_US',
  },
];

/* Structural nav for a locale: labels translate, hrefs and ids do not. */
function navFor(T) {
  return [
    { label: T.nav.home, href: 'index.html' },
    { label: T.nav.about, href: 'about.html' },
    /* Every company sits behind one group, so the bar stays short instead of
       naming each one. The label is a real link to the overview page and a
       separate caret button owns the disclosure. Contact is not a nav item:
       the accent button at the end of the bar is the single way in. */
    {
      label: T.nav.ventures,
      href: 'companies.html',
      id: 'companies-menu',
      children: [INPIPE_META, ...VENTURE_META].map((v) => ({ label: v.name, href: v.file })),
    },
  ];
}

const written = [];

for (const loc of LOCALES) {
  const T = loc.T;
  if (!fs.existsSync(loc.out)) fs.mkdirSync(loc.out, { recursive: true });
  const pages = pageList(T, { ...loc, NAV: navFor(T), active: '' });
  for (const p of pages) {
    const home = p.slug === 'index.html';
    /* The switcher points at this same page in the other locale. */
    const switchHref = loc.code === 'en'
      ? (home ? 'ar/' : `ar/${p.slug}`)
      : (home ? '../' : `../${p.slug}`);
    const ctx = {
      ...loc, NAV: navFor(T), active: p.active,
      switchHref, switchLang: loc.code === 'en' ? 'ar' : 'en',
    };
    const key = { 'index.html': 'index', 'about.html': 'about', 'companies.html': 'companies',
      'inpipe-energy.html': 'inpipe', 'trust-flow.html': 'trustFlow', 'esaal.html': 'esaal',
      'dari.html': 'dari', 'saby.html': 'saby', 'contact.html': 'contact' }[p.slug];
    const html = page(T, ctx, {
      slug: p.slug, title: p.title, desc: p.desc, active: p.active,
      body: p.body, ogImage: p.ogImage,
      noCta: !!p.noCta, cta: ctaFor(T, key), theme: p.theme || '',
      head: p.home ? jsonld(T, ctx) : '',
    });
    const out = withIntrinsicSizes(html);
    fs.writeFileSync(path.join(loc.out, p.slug), out);
    written.push({ loc: loc.code, slug: p.slug, kb: (out.length / 1024).toFixed(1) });
    console.log(`wrote ${loc.code}/${p.slug}`, (out.length / 1024).toFixed(1) + 'KB');
  }
}

/* robots.txt + sitemap.xml. The sitemap lists both locales and states the
   alternates, so search engines pair the two versions instead of treating the
   Arabic pages as duplicates. */
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

const today = new Date().toISOString().slice(0, 10);
const enPages = pageList(enContent, { code: 'en' });
const urls = enPages.map((p, i) => {
  const home = p.slug === 'index.html';
  const enLoc = home ? `${SITE}/` : `${SITE}/${p.slug}`;
  const arLoc = home ? `${SITE}/ar/` : `${SITE}/ar/${p.slug}`;
  const priority = home ? '1.0' : (i <= 3 ? '0.8' : '0.7');
  const entry = (loc) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${arLoc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${enLoc}"/>
  </url>`;
  return entry(enLoc) + '\n' + entry(arLoc);
}).join('\n');

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`);

/* CNAME — GitHub Pages reads the custom domain from this file, and within a
   workflow build the file is what binds (or unbinds) the domain. It is therefore
   gated: emit it only when CUSTOM_DOMAIN is set, so the default build serves on
   the github.io preview URL and the live domain can be switched on deliberately.
     CUSTOM_DOMAIN=nexgen.bh node build-site.js    # bind the custom domain
     node build-site.js                            # unbind, preview only
   Content must be the bare host, no scheme. */
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || '';
if (CUSTOM_DOMAIN) {
  fs.writeFileSync(path.join(OUT, 'CNAME'), CUSTOM_DOMAIN + '\n');
  console.log(`wrote robots.txt, sitemap.xml, CNAME (${CUSTOM_DOMAIN})`);
} else {
  try { fs.unlinkSync(path.join(OUT, 'CNAME')); } catch {}
  console.log('wrote robots.txt, sitemap.xml (no CNAME -> github.io preview)');
}

console.log(`\n${written.length} pages: ${written.filter((w) => w.loc === 'en').length} en + ${written.filter((w) => w.loc === 'ar').length} ar`);
