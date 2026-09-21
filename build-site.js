#!/usr/bin/env node
/* Generates the static NEXGEN Holdings site. No build step is required to view
   the output — this script just writes the plain HTML files once. */
const fs = require('fs');
const path = require('path');

const OUT = '/home/opc/.openclaw/workspace/nexgen/site';
const SITE = 'https://nexgen.bh';
const PHONE = '+973 3660 0911';
const PHONE_HREF = 'tel:+97336600911';
const EMAIL = 'info@nexgen.bh';
const LINKEDIN = 'https://www.linkedin.com/company/nexgen-holdings/';
const FOOTER_COPY = `© Copyright ${new Date().getFullYear()} NEXGEN Holding`;

const NAV = [
  { label: 'Home', href: 'index.html' },
  { label: 'About Us', href: 'about.html' },
  /* Every company sits behind one "Companies" group, so the bar stays short
     instead of naming each one. The label is a real link to the overview page
     and a separate caret button owns the disclosure. Contact is not a nav item:
     the accent button at the end of the bar is the single way in. */
  {
    label: 'Companies',
    href: 'companies.html',
    id: 'companies-menu',
    children: [
      { label: 'InPipe Energy', href: 'inpipe-energy.html' },
      { label: 'Trust Flow', href: 'trust-flow.html' },
      { label: 'Esaal', href: 'esaal.html' },
      { label: 'Dari', href: 'dari.html' },
      { label: 'SABY', href: 'saby.html' },
    ],
  },
];

const VENTURES = [
  {
    name: 'Trust Flow',
    file: 'trust-flow.html',
    kicker: 'Fintech',
    title: 'Corporate & Investor Onboarding AI',
    copy: 'A platform that accelerates onboarding for banks, investment firms, asset managers, & funds through AI-driven document processing, automated KYC/KYB, & intelligent compliance summaries.',
    img: 'venture-trust-flow.webp',
  },
  {
    name: 'Esaal',
    file: 'esaal.html',
    kicker: 'In collaboration with Esaal',
    title: 'Digital Receipts & Spending Intelligence',
    copy: 'An AI engine that converts receipts into structured, searchable financial data—powering insights for individuals, businesses, and retailers.',
    img: 'venture-esaal.webp',
  },
  {
    name: 'Dari',
    file: 'dari.html',
    kicker: 'Smart Living',
    title: 'AI-Powered Smart Living System',
    copy: 'A next-generation smart home and building platform that adapts to behavior, emotion, and daily routines—not just device commands.',
    img: 'venture-dari.webp',
  },
  {
    name: 'SABY',
    file: 'saby.html',
    kicker: 'Technology Studio',
    title: 'Modern Technology Studio',
    copy: 'NexGen’s dedicated software engineering arm specializing in AI development, digital transformation, and enterprise-grade platforms.',
    img: 'venture-saby.webp',
  },
];

/* ---------------------------------------------------------------- partials */

function topbar(active) {
  const items = NAV.map((item) => {
    if (!item.children) {
      const current = item.href === active ? ' aria-current="page"' : '';
      return `          <li><a href="${item.href}"${current}>${item.label}</a></li>`;
    }
    /* The group lights up when the overview page or any of its children is the
       page you are on, so the caret never hides where you are. */
    const groupCurrent = item.children.some((c) => c.href === active);
    const self = item.href === active ? ' aria-current="page"' : '';
    const kids = item.children
      .map((c) => `              <li><a href="${c.href}"${c.href === active ? ' aria-current="page"' : ''}>${c.label}</a></li>`)
      .join('\n');
    return `          <li class="drop${groupCurrent ? ' is-current' : ''}" data-drop>
            <a href="${item.href}"${self}>${item.label}</a>
            <button class="drop__toggle" type="button" data-drop-toggle aria-expanded="false" aria-controls="${item.id}" aria-label="Open ${item.label} menu">
              <span class="drop__caret" aria-hidden="true"></span>
            </button>
            <ul class="drop__menu" id="${item.id}">
${kids}
            </ul>
          </li>`;
  }).join('\n');

  return `  <a class="skip-link" href="#main">Skip to content</a>
  <header class="topbar" data-topbar>
    <div class="container topbar__inner">
      <a class="topbar__brand" href="index.html" aria-label="NEXGEN Holdings — Home">
        <img src="assets/img/mark.webp" alt="NEXGEN Holdings logo" width="52" height="52">
        <span class="topbar__brand-text">
          <span class="topbar__brand-name">NexGen</span>
          <span class="topbar__brand-tag">Holding</span>
        </span>
      </a>
      <button class="topbar__toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="primary-menu" aria-label="Open navigation menu">
        <span></span><span></span><span></span>
      </button>
      <nav class="topbar__nav" aria-label="Primary">
        <ul class="topbar__menu" id="primary-menu">
${items}
        </ul>
      </nav>
      <a class="btn btn--quiet topbar__cta" href="contact.html"${active === 'contact.html' ? ' aria-current="page"' : ''}>Contact</a>
    </div>
  </header>`;
}

/* One closing call to action per page, worded for the page it closes: the same
   action the hero offers, said once more where a reader who has finished the
   page is deciding what to do next. Phone is a quiet text alternative. */
function ctaBand(cta, theme = '') {
  return `  <section class="cta-band${theme ? ` theme-${theme}` : ''}">
    <div class="container">
      <div class="cta-band__inner">
        <div class="cta-band__copy">
          <h2>${cta.title}</h2>
          <p>${cta.text}</p>
        </div>
        <div class="cta-band__actions">
          <a class="btn btn--primary" href="contact.html">${cta.label}</a>
          <a class="cta-band__alt" href="${PHONE_HREF}">or call ${PHONE}</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* Mobile-only action, and only for a reader who has shown intent: site.js
   reveals it past the halfway point of the page, hides it again once the
   closing block is on screen, and a dismissal is remembered for the session.
   Without JavaScript it never appears. */
function mobileCta(label, theme = '') {
  return `  <div class="mobile-cta${theme ? ` theme-${theme}` : ''}" data-mobile-cta>
    <a class="btn btn--primary" href="contact.html">${label}</a>
    <button class="mobile-cta__close" type="button" data-mobile-cta-close aria-label="Dismiss">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>`;
}

function footer() {
  const ventureLinks = VENTURES.map(v => `            <a href="${v.file}">${v.name}</a>`).join('\n');
  return `  <footer class="footer">
    <div class="container footer__top">
      <div class="footer__brand">
        <img src="assets/img/logo.webp" alt="NEXGEN Holdings" width="46" height="52">
        <p>A Gulf-based holding company building and scaling high-impact ventures across clean energy, financial innovation, and intelligent digital platforms.</p>
      </div>
      <div>
        <h2 class="footer__heading">Ventures</h2>
        <nav class="footer__links" aria-label="Ventures">
${ventureLinks}
        </nav>
      </div>
      <div>
        <h2 class="footer__heading">Company</h2>
        <nav class="footer__links" aria-label="Company">
          <a href="index.html">Home</a>
          <a href="about.html">About Us</a>
          <a href="inpipe-energy.html">InPipe Energy</a>
          <a href="companies.html">Companies</a>
          <a href="contact.html">Contact Us</a>
        </nav>
      </div>
      <div>
        <h2 class="footer__heading">Get in touch</h2>
        <div class="footer__contact">
          <div>
            <span class="footer__label">Phone</span>
            <a href="${PHONE_HREF}">${PHONE}</a>
          </div>
          <div>
            <span class="footer__label">Email</span>
            <a href="mailto:${EMAIL}">${EMAIL}</a>
          </div>
          <div>
            <span class="footer__label">LinkedIn</span>
            <a href="${LINKEDIN}" target="_blank" rel="noopener">nexgen-holdings</a>
          </div>
        </div>
      </div>
    </div>
    <div class="container footer__bottom">
      <p>${FOOTER_COPY}</p>
      <p><a href="sitemap.xml">Sitemap</a></p>
    </div>
  </footer>`;
}

function page({ slug, title, desc, active, head = '', body, ogImage = 'hero-home.webp', noCta = false, cta = null, theme = '' }) {
  const canonical = slug === 'index.html' ? `${SITE}/` : `${SITE}/${slug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#363634">
<meta property="og:type" content="website">
<meta property="og:site_name" content="NEXGEN Holdings">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/img/${ogImage}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}/assets/img/${ogImage}">
<link rel="icon" href="favicon.png" type="image/png">
<link rel="apple-touch-icon" href="favicon.png">
<link rel="preload" href="assets/fonts/newsreader-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
${head}</head>
<body>
${topbar(active)}
<main id="main"${theme ? ` class="theme-${theme}"` : ''}>
${body}
</main>
${noCta || !cta || cta.band === false ? '' : ctaBand(cta, theme)}
${footer()}
${noCta || !cta ? '' : mobileCta(cta.label, theme)}
<script src="assets/js/site.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ blocks */

const stars = '<span aria-hidden="true">*</span>';

function ventureCards(level) {
  /* On the homepage the cards sit under the "Four Ventures" h2, so they are
     h3. On the companies page they ARE the page's content, directly under the
     h1, so they take h2 — otherwise the outline jumps h1 -> h3. */
  const h = level || 3;
  return VENTURES.map((v, i) => `        <article class="card venture reveal" data-delay="${i % 3}">
          <div class="venture__media">
            <img src="assets/img/${v.img}" alt="${v.name} — ${v.title}" loading="lazy" decoding="async">
          </div>
          <div class="venture__body">
            <p class="venture__kicker">${v.kicker}</p>
            <h${h} class="venture__title">${v.name}</h${h}>
            <p>${v.copy}</p>
            <div class="card__foot"><a class="link-arrow" href="${v.file}">Read More</a></div>
          </div>
        </article>`).join('\n');
}

/* InPipe is a company too, so the Companies overview opens with it. It is a
   wide card rather than a fifth cell in the grid: the flagship first, then the
   four digital ventures beneath it. */
function inpipeFeature() {
  return `        <article class="card venture venture--wide reveal">
          <div class="venture__media">
            <img class="venture__mark--round" src="assets/img/inpipe-plant.webp" alt="InPipe Energy — HydroXS in-pipe hydropower" loading="lazy" decoding="async">
          </div>
          <div class="venture__body">
            <p class="venture__kicker">Clean Energy</p>
            <h2 class="venture__title">InPipe Energy</h2>
            <p>NexGen is the exclusive regional partner of InPipe Energy (USA), bringing HydroXS® technology to the Gulf—turning excess water pressure inside pipelines into clean electricity.</p>
            <div class="card__foot"><a class="link-arrow" href="inpipe-energy.html">Read More</a></div>
          </div>
        </article>`;
}

/* Partner team. Every entry is InPipe's own people, presented as such: the
   section says whose team it is, and the photos keep one grayscale treatment so
   nine different source photographs read as a set. */
const INPIPE_TEAM = [
  { file: 'inpipe-semler.webp',    name: 'Gregg Semler',       role: 'CEO &amp; Founder' },
  { file: 'inpipe-frost.webp',     name: 'David Frost',        role: 'Business Development' },
  { file: 'inpipe-klann.webp',     name: 'Richard Klann',      role: 'Vice President, Finance' },
  { file: 'inpipe-conner.webp',    name: 'Mickey Conner',      role: 'Director, Engineering' },
  { file: 'inpipe-robinson.webp',  name: 'John Robinson',      role: 'Operations Manager' },
  { file: 'inpipe-perrin.webp',    name: 'Kyle Perrin',        role: 'Sales Manager' },
  { file: 'inpipe-morrison.webp',  name: 'Chris Morrison',     role: 'Industry Advisor · Morrison Water' },
  { file: 'inpipe-dickinson.webp', name: 'Mary Ann Dickinson', role: 'Industry Advisor · Alliance for Water Efficiency' },
];

/* Esaal's own leadership, same treatment as the InPipe group. Photos come from
   Esaal's company profile. Advisors have no portrait in the source, so they are
   listed by name only rather than padded with a stock face. */
const ESAAL_TEAM = [
  { file: 'esaal-reem.webp',     name: 'Reem Musabbah', role: 'CEO &amp; Founder' },
  { file: 'esaal-alhassan.webp', name: 'AlHassan A.',   role: 'CTO' },
  { file: 'esaal-anas.webp',     name: 'Anas Ali',      role: 'COO &amp; Co-founder' },
];

const ESAAL_ADVISORS = [
  ['Mohamed Roushdy, MBA', 'Fintech · Open Banking · Digital Transformation'],
  ['Sreela Sreenarayanan', 'Commercial Operations · Pricing &amp; Financials'],
  ['Ashutosh Ashish', 'Digital Banking · Onboarding · Digital Channels'],
];

function teamCards(team) {
  return team.map((m, i) => `        <article class="teammate reveal" data-delay="${i % 4}">
          <img src="assets/img/${m.file}" alt="${m.name}" loading="lazy" decoding="async">
          <h3 class="teammate__name">${m.name}</h3>
          <p class="teammate__role">${m.role}</p>
        </article>`).join('\n');
}

function hero({ image, imageSmall, imageStacked, mark, title, lead, eyebrow, actions = '', cls = '' }) {
  /* imageSmall: a 960w rendition for phones; the wide one serves large screens. */
  const srcset = imageSmall
    ? ` srcset="assets/img/${imageSmall} 960w, assets/img/${image} 1920w" sizes="(max-width: 1099px) 100vw, 66vw" width="1920" height="1080"`
    : '';
  const imgTag = `<img src="assets/img/${image}"${srcset} alt="" fetchpriority="high" decoding="async">`;
  /* imageStacked: a tighter crop swapped in where the hero stacks (< 1100px). */
  const picture = imageStacked
    ? `<picture><source media="(max-width: 1099px)" srcset="assets/img/${imageStacked}">${imgTag}</picture>`
    : imgTag;
  const media = image
    ? `    <div class="hero__media">${picture}</div>\n`
    : '';
  /* hero--photo marks the heroes that carry a backdrop photograph. Only those
     get the fade into the page ground; the compact petrol "plate" heroes hold
     their own dark ground edge to edge. */
  const photoCls = image ? ' hero--photo' : '';
  const markHtml = mark
    ? `      <img class="hero__mark" src="assets/img/${mark}" alt="" width="240" height="240">\n`
    : '';
  const eyebrowHtml = eyebrow ? `      <p class="eyebrow">${eyebrow}</p>\n` : '';
  const actionsHtml = actions ? `      <div class="btn-row hero__actions">${actions}</div>\n` : '';
  return `  <section class="hero${cls}${photoCls}">
${media}    <div class="container hero__inner">
${markHtml}${eyebrowHtml}      <h1>${title}</h1>
      <p class="lead">${lead}</p>
${actionsHtml}    </div>
  </section>`;
}

/* A venture page opens like the homepage: copy and logo tile on the ground, a
   photograph open on the right (a band under the copy on small screens). The
   photograph is optional so a page never ships an empty frame: without
   assets/img/hero-<slug>.webp it keeps the compact petrol plate. */
function ventureHeroOpts(slug) {
  const big = `hero-${slug}.webp`;
  const small = `hero-${slug}-960.webp`;
  if (!fs.existsSync(path.join(OUT, 'assets', 'img', big))) return { cls: ' hero--plate hero--home' };
  return { image: big, imageSmall: fs.existsSync(path.join(OUT, 'assets', 'img', small)) ? small : undefined, cls: ` hero--home hero--split hero--venture hero--${slug}` };
}

function splitImage(src, alt, opts = {}) {
  const cls = opts.reverse ? ' figure reveal' : ' figure reveal';
  return `        <figure class="${cls.trim()}">
          <img src="assets/img/${src}" alt="${alt}" loading="lazy" decoding="async">
        </figure>`;
}

/* ------------------------------------------------------------------- pages */

const homeBody = `${hero({
  image: 'hero-home.webp',
  imageSmall: 'hero-home-960.webp',
  title: 'Building the Next Generation of <span class="nowrap">Impact-Driven</span> Ventures',
  lead: `Building the Future of Clean Energy &amp; Digital Innovation — a Gulf-based holding company leading high-impact ventures in renewable energy, intelligent finance, data automation, and smart living technologies, delivering measurable results for governments, utilities, banks, and enterprises.`,
  actions: `<a class="btn btn--accent" href="inpipe-energy.html">Explore Clean Energy</a>
        <a class="btn btn--onDark" href="companies.html">View Our Ventures</a>`,
  cls: ' hero--home hero--split',
})}

  <section class="section">
    <div class="container split split--editorial">
      <div class="reveal">
        <h2>Innovation With Purpose. Impact With Scale.</h2>
        <p class="lead">NexGen is a diversified holding company headquartered in the Gulf, focused on building ventures that deliver economic, environmental, and digital transformation.</p>
      </div>
      <div class="reveal" data-delay="1">
        <p>Our portfolio spans clean energy, financial technology, smart living, and digital automation, each designed to solve real challenges and create real value.</p>
        <p>We partner with global technology leaders, regional institutions, and forward-thinking organizations to bring world-class solutions to the GCC.</p>
        <div class="btn-row mt-3"><a class="btn btn--outline" href="about.html">Learn More</a></div>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      ${splitImage('hero-inpipe-crop.webp', 'HydroXS in-pipe hydropower installation')}
      <div class="reveal" data-delay="1">
        <h2>Clean Energy First — Transforming Water Pressure Into Renewable Power</h2>
        <p>NexGen is the Exclusive Regional Partner of InPipe Energy (USA), bringing the HydroXS technology to the Gulf.</p>
        <p>HydroXS converts excess water pressure inside pipelines into clean electricity—helping utilities cut energy costs, extend asset life, and reduce emissions without altering existing operations.</p>
        <div class="btn-row mt-3"><a class="btn btn--primary" href="inpipe-energy.html">Learn More About InPipe</a></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">Our companies</p>
        <h2>Four Ventures Shaping the Future</h2>
        <p class="lead">Beyond clean energy, NexGen builds a growing portfolio of digital ventures shaping the future of finance, data intelligence, and smart living.</p>
      </div>
      <div class="grid grid-2 mt-5">
${ventureCards()}
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">Why NexGen</p>
        <h2>Built for Long-Term Relevance</h2>
      </div>
      <div class="grid grid-3 mt-4">
        <article class="card reveal">
          <h3>Regional Presence &amp; Local Insight</h3>
          <p>Active across Bahrain, Kuwait, Saudi Arabia, and the wider GCC.</p>
        </article>
        <article class="card reveal" data-delay="1">
          <h3>Proven Global Partnerships</h3>
          <p>Including InPipe Energy (USA) and strategic collaborations across finance and digital sectors.</p>
        </article>
        <article class="card reveal" data-delay="2">
          <h3>End-To-End Delivery</h3>
          <p>From concept to deployment, NexGen leads technology, operations, and customer success across all ventures.</p>
        </article>
      </div>
    </div>
  </section>`;

const aboutBody = `${hero({
  image: 'hero-about.webp',
  cls: ' hero--abstract',
  title: 'About NexGen Holdings',
  lead: 'A Gulf-based holding company building and scaling high-impact ventures across clean energy, financial innovation, and intelligent digital platforms.',
})}

  <section class="section">
    <div class="container split split--reverse">
      <div class="reveal">
        <h2>Building the Next Generation of <span class="nowrap">Impact-Driven</span> Ventures</h2>
        <p class="lead">NexGen Holdings is a diversified holding company headquartered in the Gulf, focused on creating, scaling, and operating ventures that deliver measurable economic, environmental, and technological impact.</p>
        <p>We operate at the intersection of clean energy, financial technology, data intelligence, and smart living, transforming proven ideas into structured, market-ready businesses. NexGen combines strategic vision, regional insight, and disciplined execution to ensure every venture is built for long-term relevance and sustainable growth.</p>
        <p>Rather than pursuing volume, NexGen follows a selective, high-conviction approach—focusing on ventures that align with regional priorities, regulatory environments, and real market demand across the GCC.</p>
      </div>
      ${splitImage('contact-visual.webp', 'NexGen Holdings corporate visual')}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">Why NexGen</p>
        <h2>Our Vision &amp; Mission</h2>
      </div>
      <div class="grid grid-2 mt-4">
        <article class="panel reveal">
          <h3>Our Vision</h3>
          <p>To become the Gulf’s leading innovation holding—driving the transition toward sustainable energy, intelligent finance, and future-ready digital ecosystems.</p>
        </article>
        <article class="panel reveal" data-delay="1">
          <h3>Our Mission</h3>
          <p>To build and scale ventures that solve real-world challenges, reduce environmental impact, improve operational efficiency, and enable long-term value creation for governments, enterprises, and communities across the region.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">Our values</p>
        <h2>How We Work</h2>
      </div>
      <div class="grid grid-3 mt-4">
        <div class="value reveal">
          <h3>Innovation</h3>
          <p>We challenge conventional thinking and invest in forward-looking solutions.</p>
        </div>
        <div class="value reveal" data-delay="1">
          <h3>Sustainability</h3>
          <p>We prioritize long-term environmental and economic impact.</p>
        </div>
        <div class="value reveal" data-delay="2">
          <h3>Integrity</h3>
          <p>We operate with transparency, accountability, and trust.</p>
        </div>
        <div class="value reveal">
          <h3>Partnership</h3>
          <p>We grow through meaningful collaboration with global and regional partners.</p>
        </div>
        <div class="value reveal" data-delay="1">
          <h3>Excellence</h3>
          <p>We hold ourselves to the highest standards of execution and delivery.</p>
        </div>
        <div class="value reveal" data-delay="2">
          <h3>Impact</h3>
          <p>We focus on measurable outcomes that create real value.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--dark">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">Founder’s message</p>
        <h2>Abdullah Sultan AlMutairi</h2>
        <p class="person__role">Founder &amp; Chief Executive Officer</p>
        <p>NexGen was founded on the belief that innovation must deliver real value—not just ideas.</p>
        <p>As a holding company, our role goes beyond capital allocation. We actively shape ventures that address critical challenges facing our region, from clean energy and infrastructure efficiency to financial systems and digital transformation.</p>
        <p>We take a disciplined and selective approach, partnering with proven global innovators and regional institutions to ensure each venture is practical, scalable, and aligned with the long-term priorities of the Gulf.</p>
        <p>NexGen is committed to building companies that stand the test of time—creating sustainable impact for our partners, our markets, and future generations.</p>
      </div>
      <figure class="figure reveal" data-delay="1">
        <img src="assets/img/team-abdullah.webp" alt="Abdullah Sultan AlMutairi, Founder &amp; Chief Executive Officer of NexGen Holdings" loading="lazy" decoding="async">
      </figure>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">Leadership</p>
        <h2>Our Leadership Structure</h2>
      </div>
      <div class="grid grid-2 mt-4">
        <article class="person reveal">
          <div class="person__media"><img src="assets/img/team-omar.webp" alt="Omar Almutairi, Head Of Fintech" loading="lazy" decoding="async"></div>
          <div class="person__body">
            <h3 class="person__name">Omar Almutairi</h3>
            <p class="person__role">Head Of Fintech</p>
            <p class="person__note">Oversees NexGen’s financial technology portfolio, including digital onboarding platforms, compliance solutions, and financial infrastructure serving banks, investment firms, and enterprises.</p>
          </div>
        </article>
        <article class="person reveal" data-delay="1">
          <div class="person__media"><img src="assets/img/team-jernej.webp" alt="Jernej Hercog, Head Of Renewable Energy" loading="lazy" decoding="async"></div>
          <div class="person__body">
            <h3 class="person__name">Jernej Hercog</h3>
            <p class="person__role">Head Of Renewable Energy</p>
            <p class="person__note">Leads NexGen’s renewable energy initiatives, overseeing decarbonization projects, water-energy recovery solutions, and strategic partnerships with utilities and infrastructure operators across the GCC.</p>
          </div>
        </article>
      </div>

      <div class="center reveal intro mt-6">
        <h2>Advisory Board</h2>
      </div>
      <div class="grid grid-3 mt-4">
        <a class="advisor reveal" href="https://www.linkedin.com/in/abdullahmansouralenezi" target="_blank" rel="noopener">
          <img src="assets/img/advisor-alenzi.webp" alt="Abdullah Alenezi" loading="lazy" decoding="async">
          <span>
            <span class="advisor__name">Abdullah Alenezi</span>
            <span class="advisor__role">Shadow Executive · C-Suite Advisory</span>
          </span>
        </a>
        <a class="advisor reveal" data-delay="1" href="https://www.linkedin.com/in/hanan-alsharah-67b9a01b9" target="_blank" rel="noopener">
          <img src="assets/img/advisor-alsharah.webp" alt="Hanan Alsharah" loading="lazy" decoding="async">
          <span>
            <span class="advisor__name">HANAN ALSHARAH</span>
            <span class="advisor__role">Founder and CEO of Innotech</span>
          </span>
        </a>
        <a class="advisor reveal" data-delay="2" href="https://www.linkedin.com/in/moatassem-abdelhaleem" target="_blank" rel="noopener">
          <img src="assets/img/advisor-moatassem.webp" alt="Moatassem Abdelhaleem" loading="lazy" decoding="async">
          <span>
            <span class="advisor__name">moatassem abdelhaleem</span>
            <span class="advisor__role">Founder &amp; CEO of Hexaflow</span>
          </span>
        </a>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">Partnerships</p>
        <h2>Strategic Partnerships &amp; Investment Interest</h2>
        <p>NexGen selectively engages with strategic partners, institutional investors, and family offices that share our vision for sustainable growth and high-impact innovation across clean energy and digital ventures.</p>
        <p>We do not pursue open fundraising or public investment offerings. All partnership and investment discussions are evaluated privately and aligned with NexGen’s strategic roadmap, governance standards, and long-term objectives.</p>
        <p>Organizations interested in exploring strategic alignment with NexGen are invited to submit a confidential inquiry.</p>
        <div class="btn-row mt-3"><a class="btn btn--primary" href="contact.html">Express Strategic Interest</a></div>
      </div>
      <div class="reveal" data-delay="1">
        <h2>Looking Forward</h2>
        <p>NexGen continues to expand its portfolio with future ventures aligned with sustainability, intelligent infrastructure, and digital transformation. Our platform is designed to evolve—welcoming new opportunities that strengthen the NexGen ecosystem while preserving focus, quality, and strategic intent.</p>
        <h3 class="mt-4">Partner With NexGen</h3>
        <p>Whether you represent a government entity, enterprise, financial institution, or strategic partner, NexGen welcomes conversations that shape the future of clean energy and intelligent digital innovation.</p>
      </div>
    </div>
  </section>`;

const companiesBody = `${hero({
  image: 'hero-about.webp',
  cls: ' hero--abstract',
  title: 'Our Companies',
  lead: 'From clean energy to finance, data intelligence, and smart living, NexGen builds and partners across a focused portfolio of companies.',
})}

  <section class="section">
    <div class="container">
${inpipeFeature()}
      <div class="grid grid-2 mt-3">
${ventureCards(2)}
      </div>
    </div>
  </section>`;

const inpipeBody = `${hero({
  image: 'hero-inpipe.webp',
  imageStacked: 'hero-inpipe-crop.webp',
  eyebrow: 'InPipe Energy GCC',
  title: 'Turning Water Pressure Into Clean, Reliable Power',
  lead: 'NexGen is the exclusive regional partner bringing HydroXS® technology to the Gulf—enabling utilities, municipalities, and large facilities to recover energy, reduce emissions, and improve operational efficiency.',
  actions: `<a class="btn btn--accent" href="contact.html">Request Site Assessment</a>`,
  cls: ' hero--bright hero--inpipe',
})}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>The Challenge</h2>
        <p>Water delivery across the GCC consumes massive electricity. At pressure-control points, this energy is traditionally wasted as heat, driving up operating costs and carbon emissions.</p>
        <p>Utilities need solutions that:</p>
        <ul class="checklist">
          <li>Lower electricity consumption</li>
          <li>Reduce CO₂ emissions</li>
          <li>Improve pressure management</li>
          <li>Extend pipeline lifespan</li>
          <li>Require no operational disruption</li>
        </ul>
      </div>
      ${splitImage('inpipe-visual.webp', 'Water infrastructure energy recovery')}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split split--reverse">
      <div class="reveal">
        <h2>HydroXS Solution</h2>
        <p><strong>HydroXS</strong> installs directly onto existing pipeline infrastructure and captures energy from excess pressure. As water flows through, the system safely reduces pressure while generating clean electricity.</p>
        <h3 class="mt-4">Key Advantages</h3>
        <ul class="checklist">
          <li>No change in water operations</li>
          <li>Predictable renewable power (day &amp; night)</li>
          <li>Works with gravity, pumping, regulator sites</li>
          <li>Ideal for utilities, cooling networks, industrial systems, and RO desalination</li>
          <li>Supports national sustainability and Net Zero targets</li>
        </ul>
        <h3 class="mt-4">HydroXS Specifications</h3>
        <ul class="checklist">
          <li>Scalable from 10 kW to 2 MW</li>
          <li>Installs in pipe diameters of 4-110 inches <span class="nowrap">(5-280 cm)</span></li>
          <li>Made in the USA</li>
          <li>Patent issued, with additional patents pending</li>
        </ul>
      </div>
      ${splitImage('inpipe-plant.webp', 'HydroXS installed on a water pipeline')}
    </div>
  </section>

  <section class="section section--dark">
    <div class="container">
      <div class="center reveal intro">
        <h2>Real Results</h2>
        <p class="lead">Examples from existing deployments:</p>
      </div>
      <div class="stats reveal mt-4">
        <div class="stat">
          <p class="stat__value">89,000<sup>+</sup></p>
          <p class="stat__label">Hours of fleet runtime</p>
        </div>
        <div class="stat">
          <p class="stat__value">99<sup>%</sup></p>
          <p class="stat__label">Fleet availability</p>
        </div>
        <div class="stat">
          <p class="stat__value">97.9<sup>%</sup></p>
          <p class="stat__label">Lowest per-site availability</p>
        </div>
        <div class="stat">
          <p class="stat__value">99.9<sup>%</sup></p>
          <p class="stat__label">Highest per-site availability</p>
        </div>
      </div>
      <div class="stats reveal mt-3">
        <div class="stat">
          <p class="stat__value">30 kW</p>
          <p><strong>Hillsboro Water, Oregon</strong></p>
          <p>About 200,000 kWh per year<br>1,400 tons CO₂ offset<br>Commissioned September 2020</p>
          <p>Output net-metered, used for stadium lighting, EV charging and concessions.</p>
        </div>
        <div class="stat">
          <p class="stat__value">22 kW</p>
          <p><strong>Skagit PUD pumping facility</strong></p>
          <p>About 104,000 kWh per year<br>728 tons CO₂ offset over its lifetime<br>Commissioned July 2021</p>
        </div>
        <div class="stat">
          <p class="stat__value">30 kW</p>
          <p><strong>EBMUD (East Bay Municipal Utility District) pump facility</strong></p>
          <p>150,000 kWh per year<br>1,050 tons CO₂ offset<br>Commissioned September 2023</p>
          <p>InPipe owns, operates and maintains the structure.</p>
        </div>
        <div class="stat">
          <p class="stat__value">56 kW</p>
          <p><strong>Aurora Water regulator replacement</strong></p>
          <p>255,000 kWh per year<br>3,023 tons CO₂ offset<br>Commissioned October 2024</p>
        </div>
      </div>
      <div class="center mt-3">
        <p class="cred__note">Source: InPipe Energy company profile, 2025.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>GCC Use Cases</h2>
        <p>HydroXS is an ideal fit for:</p>
        <ul class="checklist">
          <li>Water transmission &amp; distribution</li>
          <li>District cooling lines</li>
          <li>Treated wastewater lines</li>
          <li>Firewater loops</li>
          <li>RO desalination networks</li>
          <li>High-pressure industrial water systems</li>
        </ul>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">Delivery process</p>
        <h2>NexGen Manages The Full Journey</h2>
        <ol class="steps mt-3">
          <li class="step"><div><h3>Data Collection Support</h3></div></li>
          <li class="step"><div><h3>Hydraulic &amp; Energy Analysis</h3></div></li>
          <li class="step"><div><h3>Technical &amp; Financial Proposal</h3></div></li>
          <li class="step"><div><h3>Procurement &amp; Installation</h3></div></li>
          <li class="step"><div><h3>Commissioning &amp; Monitoring</h3></div></li>
        </ol>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">Our technology partner</p>
        <h2>The InPipe Energy Team</h2>
        <p class="lead">The people behind HydroXS®, built on decades in water and clean energy.</p>
      </div>
      <div class="team-grid mt-4">
${teamCards(INPIPE_TEAM)}
      </div>
    </div>
  </section>`;

const trustFlowBody = `${hero({
  mark: 'venture-trust-flow.webp',
  eyebrow: 'Corporate &amp; Investor Onboarding AI',
  title: 'Trust Flow',
  lead: 'Intelligent onboarding for banks &amp; investment firms — a unified AI platform that accelerates onboarding, elevates compliance accuracy, and streamlines documentation for banks, corporate clients, investment firms, funds, and asset managers.',
  actions: `<a class="btn btn--accent" href="contact.html">Request a Demo</a>`,
  ...ventureHeroOpts('trust-flow'),
})}

  <section class="section">
    <div class="container">
      <div class="center reveal intro--wide">
        <h2>Intelligent Onboarding for Banks &amp; Investment Firms</h2>
        <p class="lead">Every file arrives complete, sourced, and audit-ready — without an analyst retyping a single document.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <h2>The Challenge</h2>
        <p>Financial institutions waste time and resources on:</p>
        <ul class="checklist">
          <li>Manual document handling</li>
          <li>Repeated follow-ups</li>
          <li>Slow investor and corporate onboarding</li>
          <li>Fragmented compliance workflows</li>
          <li>High regulatory pressure</li>
          <li>Long turnaround times</li>
        </ul>
        <p class="mt-3">These bottlenecks delay revenue, frustrate clients, and increase operational costs.</p>
      </div>
      <div class="reveal" data-delay="1">
        <h2>The Solution</h2>
        <p><strong>Trust Flow</strong> automates the entire onboarding process with AI, ensuring fast, accurate, and complete files.</p>
        <h3 class="mt-4">What It Includes</h3>
        <ul class="checklist">
          <li>AI document extraction</li>
          <li>Automated KYC/KYB</li>
          <li>Beneficial ownership mapping</li>
          <li>AML &amp; sanctions screening</li>
          <li>Risk scoring &amp; case summaries</li>
          <li>Digital submission &amp; electronic signatures</li>
          <li>Centralized analyst &amp; compliance workflows</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>Who Trust Flow Serves</h2>
        <ul class="checklist">
          <li>Banks</li>
          <li>Investment Firms &amp; Asset Managers</li>
          <li>Private Equity &amp; Venture Capital Funds</li>
          <li>Corporate Service Providers</li>
          <li>Real Estate Funds</li>
          <li>Family Offices</li>
        </ul>
      </div>
      <div class="reveal" data-delay="1">
        <h2>Value For Institutions</h2>
        <ul class="checklist">
          <li>Cost optimization</li>
          <li>Faster onboarding</li>
          <li>Higher compliance accuracy</li>
          <li>Better investor experience</li>
          <li>Standardized risk evaluation</li>
          <li>Reduced operational workload</li>
        </ul>
      </div>
    </div>
  </section>`;

const esaalBody = `${hero({
  mark: 'venture-esaal.webp',
  eyebrow: 'In collaboration with Esaal',
  title: 'Esaal',
  lead: 'Digital receipts &amp; spending intelligence — in collaboration with Esaal, NexGen brings a Plug-n-Play digital receipt platform to the GCC, replacing paper receipts with real-time data.',
  actions: `<a class="btn btn--accent" href="contact.html">Partner With Us</a>
        <a class="btn btn--onDark" href="https://www.esaal.co/" target="_blank" rel="noopener">Visit esaal.co</a>`,
  ...ventureHeroOpts('esaal'),
})}

  <section class="section">
    <div class="container">
      <div class="center reveal intro--wide">
        <h2>Digital Receipts &amp; Spending Intelligence</h2>
        <p class="lead">An AI engine that converts receipts into structured, searchable financial data—powering insights for individuals, businesses, and retailers. Esaal replaces the paper receipt with a smarter, digital one, and turns every transaction into a real-time customer signal.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <h2>The Problem</h2>
        <p>Businesses lose time and value to:</p>
        <ul class="checklist">
          <li>Lack of digitisation in invoicing processes</li>
          <li>Manual policy-compliance checks that consume staff time</li>
          <li>Customer profiling through data enrichment is very difficult</li>
          <li>Paper-receipt data that teams cannot put to use</li>
          <li>Limited tools for tax compliance and transparency in the UAE</li>
        </ul>
        <div class="panel reveal mt-4">
          <p class="stat__value">25<sup>%</sup></p>
          <p>Paper receipts leave 25% of businesses out of pocket by up to $10,000.</p>
          <p class="cred__note">Source: Esaal company profile.</p>
        </div>
      </div>
      <div class="reveal" data-delay="1">
        <h2>The Solution</h2>
        <p><strong>Esaal</strong> turns every receipt—paper, email, POS—into clean, structured financial data instantly.</p>
        <h3 class="mt-4">Features</h3>
        <ul class="checklist">
          <li>AI receipt scanning</li>
          <li>Spending insights</li>
          <li>Business expense reporting</li>
          <li>Retail analytics</li>
          <li>Integrations with POS and ERP</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro--wide">
        <p class="eyebrow">The platform</p>
        <h2>Seamless Plug-n-Play With Your POS</h2>
      </div>
      <div class="grid grid-3 mt-4">
        <article class="card reveal">
          <h3>Plug-n-Play Integration</h3>
          <p>Smart receipts integrate directly with your POS and other tools. No additional apps or hardware required for you or your customers.</p>
        </article>
        <article class="card reveal" data-delay="1">
          <h3>Real-Time Customer Profiling</h3>
          <p>Pinpoint your customers and their buying habits with advanced digital receipts, enhancing customer profiling and behavioral insights.</p>
        </article>
        <article class="card reveal" data-delay="2">
          <h3>Campaign Measurement</h3>
          <p>Determine the effectiveness of your digital receipt campaigns through receipt-based measurement.</p>
        </article>
        <article class="card reveal">
          <h3>Connect</h3>
          <p>Link in-store transactions with a seamless plug-in, ensuring real-time data integration and accessibility.</p>
        </article>
        <article class="card reveal" data-delay="1">
          <h3>Measure &amp; Optimise</h3>
          <p>Unlock comprehensive insights into your most valuable customers with the merchant dashboard, enabling targeted optimisation strategies.</p>
        </article>
        <article class="card reveal" data-delay="2">
          <h3>Privacy &amp; Compliance</h3>
          <p>Customer data is handled with explicit opt-in at checkout, and the platform operates in line with applicable privacy and data-protection requirements.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="section section--dark">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">By the numbers</p>
        <h2>It works. We’ve got the receipts.</h2>
      </div>
      <div class="stats reveal mt-4">
        <div class="stat">
          <p class="stat__value">15,000<sup>+</sup></p>
          <p class="stat__label">Yearly receipts sent from over 15k stores across the world</p>
        </div>
        <div class="stat">
          <p class="stat__value">30<sup>%</sup></p>
          <p class="stat__label">Opt-in rate for digital receipts at checkout</p>
        </div>
        <div class="stat">
          <p class="stat__value">70<sup>%</sup></p>
          <p class="stat__label">Open rates for our digital receipts</p>
        </div>
        <div class="stat">
          <p class="stat__value">20<sup>%</sup></p>
          <p class="stat__label">Click through rate on our digital receipts</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>Value</h2>
        <ul class="checklist">
          <li>Clear spending for individuals</li>
          <li>Accurate records for businesses</li>
          <li>Deep insights for retailers</li>
        </ul>
        <h3 class="mt-4">Capture Every Purchase</h3>
        <ol class="steps mt-2">
          <li class="step"><div><h3>Tap into Convenience: Get the App</h3><p>Hit download through the App Store, Google Play or App Gallery.</p></div></li>
          <li class="step"><div><h3>Quick Sign-Up: Your Number or UAE PASS, Your Choice</h3><p>A simple touch, a swift sign-up, and you’re in.</p></div></li>
          <li class="step"><div><h3>Embrace the Ease: Enjoy the Esaal Edge</h3><p>Step into a world of effortless e-billing and seamless transactions.</p></div></li>
        </ol>
        <div class="btn-row mt-4">
          <a class="btn btn--primary" href="https://apps.apple.com/ae/app/esaal/id6444912096" target="_blank" rel="noopener">Get the App</a>
        </div>
      </div>
      <figure class="figure figure--plate reveal" data-delay="1">
        <img src="assets/img/venture-esaal.webp" alt="Esaal app icon" loading="lazy" decoding="async" class="figure__mark figure__mark--lg">
        <figcaption>Esaal — the new, smarter way to E-receipt. In collaboration with Esaal.</figcaption>
      </figure>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <p class="eyebrow">Our venture partner</p>
        <h2>The Esaal Team</h2>
        <p class="lead">Esaal builds and runs the receipts platform. NEXGEN brings it to the Gulf.</p>
      </div>
      <div class="team-grid team-grid--trio mt-4">
${teamCards(ESAAL_TEAM)}
      </div>
      <div class="team-advisors reveal">
        <h3 class="team-advisors__title">Advisors</h3>
        <ul class="team-advisors__list">
${ESAAL_ADVISORS.map(([n, d]) => `          <li><strong>${n}</strong><span>${d}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>`;

const dariBody = `${hero({
  mark: 'venture-dari.webp',
  eyebrow: 'Smart Living',
  title: 'Dari',
  lead: 'AI Smart Living — a home and building ecosystem that understands behavior, emotion, and lifestyle.',
  actions: `<a class="btn btn--accent" href="contact.html">Partner With Us</a>`,
  ...ventureHeroOpts('dari'),
})}

  <section class="section">
    <div class="container">
      <div class="center reveal intro--wide">
        <h2>AI-Powered Smart Living System</h2>
        <p class="lead">Automation that anticipates the people in a building instead of reacting to the devices in it.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <h2>The Problem</h2>
        <p>Traditional smart home systems are device-based and reactive. They don’t understand people.</p>
      </div>
      <div class="reveal" data-delay="1">
        <h2>The Solution</h2>
        <p><strong>Dari</strong> creates human-centric automation using behavioral and emotional AI.</p>
        <h3 class="mt-4">Features</h3>
        <ul class="checklist">
          <li>Behavioral learning</li>
          <li>Emotion-aware automation</li>
          <li>Unified IoT control</li>
          <li>Smart building mode</li>
          <li>Energy optimization</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal intro">
        <h2>Value</h2>
      </div>
      <div class="grid grid-4 mt-4">
        <div class="value reveal"><h3>Energy efficiency</h3></div>
        <div class="value reveal" data-delay="1"><h3>Comfort</h3></div>
        <div class="value reveal" data-delay="2"><h3>Safety</h3></div>
        <div class="value reveal" data-delay="3"><h3>Premium living experience</h3></div>
      </div>
    </div>
  </section>`;

const sabyBody = `${hero({
  mark: 'venture-saby.webp',
  eyebrow: 'Technology Studio',
  title: 'SABY',
  lead: 'Modern technology studio — software engineering, AI development, digital transformation, and enterprise platforms.',
  actions: `<a class="btn btn--accent" href="contact.html">Partner With Us</a>`,
  ...ventureHeroOpts('saby'),
})}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <h2>Who We Are</h2>
        <p>SABY is NexGen’s dedicated studio delivering modern, scalable digital solutions for the region.</p>
      </div>
      <div class="reveal" data-delay="1">
        <h2>Expertise</h2>
        <ul class="checklist">
          <li>AI &amp; automation</li>
          <li>Web &amp; mobile apps</li>
          <li>SaaS engineering</li>
          <li>Cloud &amp; cybersecurity</li>
          <li>UX/UI</li>
          <li>Enterprise integrations</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal intro">
        <h2>Why SABY?</h2>
      </div>
      <div class="grid grid-3 mt-4">
        <article class="card reveal"><h3>Modern engineering practices</h3></article>
        <article class="card reveal" data-delay="1"><h3>Fast delivery cycles</h3></article>
        <article class="card reveal" data-delay="2"><h3>Enterprise-grade execution</h3></article>
      </div>
    </div>
  </section>`;

const contactBody = `${hero({
  title: 'Contact Us',
  lead: 'Whether you represent a government entity, enterprise, financial institution, or strategic partner, NexGen welcomes conversations that shape the future of clean energy and intelligent digital innovation.',
  cls: ' hero--plate',
})}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">Direct lines</p>
        <h2>Talk to NexGen</h2>
        <div class="contact-card mt-3">
          <a class="contact-row" href="${PHONE_HREF}">
            <span class="contact-row__label">Phone</span>
            <span class="contact-row__value">${PHONE}</span>
            <span class="contact-row__note">Call us for partnerships, ventures, and engineering assessments.</span>
          </a>
          <a class="contact-row" href="mailto:${EMAIL}">
            <span class="contact-row__label">Email</span>
            <span class="contact-row__value">${EMAIL}</span>
            <span class="contact-row__note">Organizations interested in exploring strategic alignment with NexGen are invited to submit a confidential inquiry.</span>
          </a>
          <a class="contact-row" href="${LINKEDIN}" target="_blank" rel="noopener">
            <span class="contact-row__label">LinkedIn</span>
            <span class="contact-row__value">nexgen-holdings</span>
            <span class="contact-row__note">Follow NexGen Holdings for venture and partnership updates.</span>
          </a>
        </div>
      </div>
      <figure class="figure reveal" data-delay="1">
        <img src="assets/img/contact-visual.webp" alt="NexGen Holdings corporate visual" loading="lazy" decoding="async">
      </figure>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal intro--wide">
        <p class="eyebrow">Where we operate</p>
        <h2>Regional Presence &amp; Local Insight</h2>
        <p class="lead">Active across Bahrain, Kuwait, Saudi Arabia, and the wider GCC.</p>
      </div>
      <div class="grid grid-3 mt-4">
        <article class="card reveal">
          <h3>Clean Energy</h3>
          <p>HydroXS in-pipe hydropower with InPipe Energy (USA) for utilities, municipalities, and large facilities.</p>
          <div class="card__foot"><a class="link-arrow" href="inpipe-energy.html">InPipe Energy</a></div>
        </article>
        <article class="card reveal" data-delay="1">
          <h3>Digital Ventures</h3>
          <p>Trust Flow, Esaal, Dari, and SABY — finance, digital receipts, smart living, and engineering.</p>
          <div class="card__foot"><a class="link-arrow" href="companies.html">Our Companies</a></div>
        </article>
        <article class="card reveal" data-delay="2">
          <h3>Strategic Partnerships</h3>
          <p>Including InPipe Energy (USA) and strategic collaborations across finance and digital sectors.</p>
          <div class="card__foot"><a class="link-arrow" href="about.html">About Us</a></div>
        </article>
      </div>
    </div>
  </section>`;

/* --------------------------------------------------------------- write out */

const PAGES = [
  { slug: 'index.html', active: 'index.html', title: 'NEXGEN Holdings — Clean Energy & Digital Innovation in the GCC', desc: 'NEXGEN Holdings is a Gulf-based holding company building high-impact ventures in clean energy, fintech, digital receipts, and smart living across the GCC.', body: homeBody, ogImage: 'hero-home.webp', home: true , cta: { title: 'Let’s build the future together.', text: 'Ready to explore partnership opportunities across clean energy or digital innovation?', label: 'Start a Conversation' } },
  { slug: 'about.html', active: 'about.html', title: 'About Us — NEXGEN Holdings', desc: 'NEXGEN Holdings builds and scales ventures across clean energy, financial innovation, and intelligent digital platforms — our vision, mission, values, and leadership.', body: aboutBody, ogImage: 'hero-about.webp' , cta: { label: 'Express Strategic Interest', band: false } },
  { slug: 'companies.html', active: 'companies.html', title: 'Our Companies — NEXGEN Holdings', desc: 'Explore the NEXGEN Holdings portfolio: InPipe Energy, Trust Flow, Esaal, Dari, and SABY — clean energy, finance, digital receipts, and smart living.', body: companiesBody, ogImage: 'hero-about.webp' , cta: { title: 'Not sure which venture fits?', text: 'Tell us what you are working on and we will point you to the right team.', label: 'Start a Conversation' } },
  { slug: 'inpipe-energy.html', active: 'inpipe-energy.html', title: 'InPipe Energy — HydroXS In-Pipe Hydropower | NEXGEN Holdings', desc: 'NEXGEN is the exclusive regional partner of InPipe Energy (USA), bringing HydroXS technology to the Gulf to turn excess water pressure into clean, reliable power.', body: inpipeBody, ogImage: 'hero-inpipe.webp' , cta: { title: 'Bring HydroXS to your network.', text: 'Share the details of your site and our team will follow up.', label: 'Request Site Assessment' } },
  { slug: 'trust-flow.html', active: 'trust-flow.html', title: 'Trust Flow — Corporate & Investor Onboarding AI | NEXGEN Holdings', desc: 'Trust Flow automates onboarding for banks, investment firms, funds, and asset managers with AI document extraction, automated KYC/KYB, and compliance workflows.', body: trustFlowBody, ogImage: 'venture-trust-flow.webp' , cta: { title: 'See Trust Flow on your own onboarding.', text: 'Request a demo for your bank, fund, or investment firm.', label: 'Request a Demo' } },
  { slug: 'esaal.html', active: 'esaal.html', title: 'Esaal — Digital Receipts & Spending Intelligence | NEXGEN Holdings', desc: 'In collaboration with Esaal, NEXGEN brings Plug-n-Play digital receipts to the GCC — real-time customer profiling, campaign measurement, and no extra hardware.', body: esaalBody, ogImage: 'venture-esaal.webp' , cta: { title: 'Bring digital receipts to your customers.', text: 'Talk to us about a Plug-n-Play rollout across your stores.', label: 'Partner With Us' } },
  { slug: 'dari.html', active: 'dari.html', title: 'Dari — AI-Powered Smart Living System | NEXGEN Holdings', desc: 'Dari is a human-centric smart home and building platform that adapts to behavior, emotion, and daily routines using behavioral and emotional AI.', body: dariBody, ogImage: 'venture-dari.webp' , cta: { title: 'Shape the next generation of smart living.', text: 'Explore a partnership around Dari.', label: 'Partner With Us' } },
  { slug: 'saby.html', active: 'saby.html', title: 'SABY — Modern Technology Studio | NEXGEN Holdings', desc: 'SABY is NexGen’s dedicated software engineering studio delivering AI development, digital transformation, and enterprise-grade platforms for the region.', body: sabyBody, ogImage: 'venture-saby.webp' , cta: { title: 'Have something to build?', text: 'Talk to our engineering studio about AI and digital transformation.', label: 'Partner With Us' } , theme: 'saby' },
  { slug: 'contact.html', active: 'contact.html', title: 'Contact Us — NEXGEN Holdings', desc: 'Contact NEXGEN Holdings for partnerships, ventures, and clean energy assessments. Phone +973 3660 0911, email info@nexgen.bh.', body: contactBody, ogImage: 'contact-visual.webp', noCta: true },
];

const JSONLD = `  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NEXGEN Holdings",
  "url": "https://nexgen.bh",
  "email": "${EMAIL}",
  "telephone": "+97336600911",
  "logo": "${SITE}/assets/img/logo.webp",
  "image": "${SITE}/assets/img/hero-home.webp",
  "description": "NEXGEN Holdings is a Gulf-based holding company building high-impact ventures in clean energy, intelligent finance, data automation, and smart living technologies.",
  "sameAs": [
    "${LINKEDIN}"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "BH"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+9733660911",
    "email": "${EMAIL}",
    "contactType": "general",
    "areaServed": "GCC"
  }
}
  </script>
`;

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
  if (sizeCache.has(src)) return sizeCache.get(src);
  const file = path.join(OUT, src);
  let dim = null;
  if (fs.existsSync(file)) { try { dim = webpSize(file); } catch (e) { dim = null; } }
  sizeCache.set(src, dim);
  return dim;
}

function withIntrinsicSizes(html) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\swidth=/.test(tag) && /\sheight=/.test(tag)) return tag;
    const m = tag.match(/\ssrc="(assets\/img\/[^"]+)"/);
    if (!m) return tag;
    const dim = intrinsic(m[1]);
    if (!dim) return tag;
    return tag.slice(0, -1) + ` width="${dim.w}" height="${dim.h}">`;
  });
}

for (const p of PAGES) {
  const html = page({
    slug: p.slug,
    title: p.title,
    desc: p.desc,
    active: p.active,
    body: p.body,
    ogImage: p.ogImage,
    noCta: !!p.noCta,
    cta: p.cta || null,
    theme: p.theme || '',
    head: p.home ? JSONLD : '',
  });
  const out = withIntrinsicSizes(html);
  fs.writeFileSync(path.join(OUT, p.slug), out);
  console.log('wrote', p.slug, (out.length / 1024).toFixed(1) + 'KB');
}

/* robots.txt + sitemap.xml */
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

const today = new Date().toISOString().slice(0, 10);
const urls = PAGES.map((p, i) => {
  const loc = p.slug === 'index.html' ? `${SITE}/` : `${SITE}/${p.slug}`;
  const priority = p.slug === 'index.html' ? '1.0' : (i <= 3 ? '0.8' : '0.7');
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n');

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);

console.log('wrote robots.txt, sitemap.xml');
