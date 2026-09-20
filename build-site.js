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
const FOOTER_COPY = '© Copyright 2025 NEXGEN Holding';

const NAV = [
  ['Home', 'index.html'],
  ['About Us', 'about.html'],
  ['InPipe Energy', 'inpipe-energy.html'],
  ['Our Companies', 'companies.html'],
  ['Trust Flow', 'trust-flow.html'],
  ['JYP', 'jyp.html'],
  ['Esaal', 'esaal.html'],
  ['Dari', 'dari.html'],
  ['SABY', 'saby.html'],
  ['Contact Us', 'contact.html'],
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
    name: 'JYP',
    file: 'jyp.html',
    kicker: 'Workforce Payments',
    title: 'Smart Wallet for the GCC Workforce',
    copy: 'A multilingual salary and remittance wallet enabling low-cost international transfers, compliant payroll distribution, and seamless employer integration.',
    img: 'venture-jyp.webp',
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
  const items = NAV.map(([label, href]) => {
    const current = href === active ? ' aria-current="page"' : '';
    return `          <li><a href="${href}"${current}>${label}</a></li>`;
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
      <a class="btn btn--accent topbar__cta" href="contact.html">Contact Us</a>
    </div>
  </header>`;
}

function ctaBand() {
  return `  <section class="cta-band">
    <div class="container cta-band__inner">
      <div>
        <h2>Let’s build the future together.</h2>
        <p>Ready to explore partnership opportunities across clean energy or digital innovation?</p>
      </div>
      <div class="cta-band__actions">
        <a class="btn btn--accent" href="contact.html">Contact Us</a>
      </div>
    </div>
  </section>`;
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
        <h4>Ventures</h4>
        <nav class="footer__links" aria-label="Ventures">
${ventureLinks}
        </nav>
      </div>
      <div>
        <h4>Company</h4>
        <nav class="footer__links" aria-label="Company">
          <a href="index.html">Home</a>
          <a href="about.html">About Us</a>
          <a href="inpipe-energy.html">InPipe Energy</a>
          <a href="companies.html">Our Companies</a>
          <a href="contact.html">Contact Us</a>
        </nav>
      </div>
      <div>
        <h4>Get in touch</h4>
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

function page({ slug, title, desc, active, head = '', body, ogImage = 'hero-home.webp' }) {
  const canonical = slug === 'index.html' ? `${SITE}/` : `${SITE}/${slug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Roboto:wght@300;400;500&display=swap">
<link rel="stylesheet" href="assets/css/site.css">
${head}</head>
<body>
${topbar(active)}
<main id="main">
${body}
</main>
${ctaBand()}
${footer()}
<script src="assets/js/site.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ blocks */

const stars = '<span aria-hidden="true">*</span>';

function ventureCards() {
  return VENTURES.map((v, i) => `        <article class="card venture reveal" data-delay="${i % 4}">
          <div class="venture__media">
            <img src="assets/img/${v.img}" alt="${v.name} — ${v.title}" loading="lazy" decoding="async">
          </div>
          <div class="venture__body">
            <p class="venture__kicker">${v.kicker}</p>
            <h3 class="venture__title">${v.name}</h3>
            <p><strong>${v.title}</strong></p>
            <p>${v.copy}</p>
            <div class="card__foot"><a class="link-arrow" href="${v.file}">Read More</a></div>
          </div>
        </article>`).join('\n');
}

function hero({ image, mark, title, lead, eyebrow, actions = '', cls = '' }) {
  const media = image
    ? `    <div class="hero__media"><img src="assets/img/${image}" alt="" fetchpriority="high" decoding="async"></div>\n`
    : '';
  const markHtml = mark
    ? `      <img class="hero__mark" src="assets/img/${mark}" alt="" width="240" height="240">\n`
    : '';
  const eyebrowHtml = eyebrow ? `      <p class="eyebrow">${eyebrow}</p>\n` : '';
  const actionsHtml = actions ? `      <div class="btn-row hero__actions">${actions}</div>\n` : '';
  return `  <section class="hero${cls}">
${media}    <div class="container hero__inner">
${markHtml}${eyebrowHtml}      <h1>${title}</h1>
      <p class="lead">${lead}</p>
${actionsHtml}    </div>
  </section>`;
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
  eyebrow: 'NEXGEN Holdings',
  title: 'Building the Next Generation of Impact-Driven Ventures',
  lead: `Building the Future of Clean Energy &amp; Digital Innovation — a Gulf-based holding company leading high-impact ventures in renewable energy, intelligent finance, data automation, and smart living technologies, delivering measurable results for governments, utilities, banks, and enterprises.`,
  actions: `<a class="btn btn--accent" href="inpipe-energy.html">Explore Clean Energy</a>
        <a class="btn btn--onDark" href="companies.html">View Our Ventures</a>`,
  cls: ' hero--home',
})}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">Who we are?</p>
        <h2>Innovation With Purpose. Impact With Scale.</h2>
        <p class="lead">NexGen is a diversified holding company headquartered in the Gulf, focused on building ventures that deliver economic, environmental, and digital transformation.</p>
        <p>Our portfolio spans clean energy, financial technology, workforce solutions, smart living, and digital automation, each designed to solve real challenges and create real value.</p>
        <p>We partner with global technology leaders, regional institutions, and forward-thinking organizations to bring world-class solutions to the GCC.</p>
        <div class="btn-row" style="margin-top:24px"><a class="btn btn--outline" href="about.html">Learn More</a></div>
      </div>
      <div class="dock reveal" data-delay="1">
        <img src="assets/img/home-dock-1.webp" alt="NexGen Holdings corporate presentation visual" loading="lazy" decoding="async">
        <img src="assets/img/home-dock-2.webp" alt="NexGen Holdings venture portfolio visual" loading="lazy" decoding="async">
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      ${splitImage('inpipe-plant.webp', 'HydroXS in-pipe hydropower technology')}
      <div class="reveal" data-delay="1">
        <p class="eyebrow">Flagship focus: Clean Energy</p>
        <h2>Clean Energy First — Transforming Water Pressure Into Renewable Power</h2>
        <p>NexGen is the Exclusive Regional Partner of InPipe Energy (USA), bringing the HydroXS technology to the Gulf.</p>
        <p>HydroXS converts excess water pressure inside pipelines into clean electricity—helping utilities cut energy costs, extend asset life, and reduce emissions without altering existing operations.</p>
        <div class="btn-row" style="margin-top:24px"><a class="btn btn--primary" href="inpipe-energy.html">Learn More About InPipe</a></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Our companies</p>
        <h2>Five Ventures Shaping the Future</h2>
        <p class="lead">Beyond clean energy, NexGen builds a growing portfolio of digital ventures shaping the future of finance, workforce empowerment, data intelligence, and smart living.</p>
      </div>
      <div class="grid grid-3" style="margin-top:48px">
${ventureCards()}
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Why NexGen</p>
        <h2>Built for Long-Term Relevance</h2>
      </div>
      <div class="grid grid-3" style="margin-top:40px">
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
  eyebrow: 'About Us',
  title: 'About NexGen Holdings',
  lead: 'A Gulf-based holding company building and scaling high-impact ventures across clean energy, financial innovation, and intelligent digital platforms.',
})}

  <section class="section">
    <div class="container split split--reverse">
      <div class="reveal">
        <p class="eyebrow">Who we are</p>
        <h2>Building the Next Generation of Impact-Driven Ventures</h2>
        <p class="lead">NexGen Holdings is a diversified holding company headquartered in the Gulf, focused on creating, scaling, and operating ventures that deliver measurable economic, environmental, and technological impact.</p>
        <p>We operate at the intersection of clean energy, financial technology, data intelligence, and smart living, transforming proven ideas into structured, market-ready businesses. NexGen combines strategic vision, regional insight, and disciplined execution to ensure every venture is built for long-term relevance and sustainable growth.</p>
        <p>Rather than pursuing volume, NexGen follows a selective, high-conviction approach—focusing on ventures that align with regional priorities, regulatory environments, and real market demand across the GCC.</p>
      </div>
      ${splitImage('contact-visual.webp', 'NexGen Holdings corporate visual')}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Why NexGen</p>
        <h2>Our Vision &amp; Mission</h2>
      </div>
      <div class="grid grid-2" style="margin-top:40px">
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
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Our values</p>
        <h2>How We Work</h2>
      </div>
      <div class="grid grid-3" style="margin-top:40px">
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
        <p class="person__role" style="color:#50d7d5">Founder &amp; Chief Executive Officer</p>
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
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Leadership</p>
        <h2>Our Leadership Structure</h2>
      </div>
      <div class="grid grid-2" style="margin-top:40px">
        <article class="person reveal">
          <div class="person__media"><img src="assets/img/team-omar.webp" alt="Omar Almutairi, Head Of Fintech" loading="lazy" decoding="async"></div>
          <div class="person__body">
            <h3 class="person__name">Omar Almutairi</h3>
            <p class="person__role">Head Of Fintech</p>
            <p class="person__note">Oversees NexGen’s financial technology portfolio, including digital onboarding platforms, compliance solutions, workforce payment systems, and financial infrastructure serving banks, investment firms, and enterprises.</p>
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

      <div class="center reveal" style="max-width:720px;margin:72px auto 0">
        <h2>Advisory Board</h2>
      </div>
      <div class="grid grid-3" style="margin-top:32px">
        <a class="advisor reveal" href="https://www.linkedin.com/in/abdullahmansouralenezi" target="_blank" rel="noopener">
          <img src="assets/img/advisor-alenzi.webp" alt="Abdullah Alenzi" loading="lazy" decoding="async">
          <span>
            <span class="advisor__name">Abdullah Alenzi</span>
            <span class="advisor__role">Founder &amp; CEO of JYB</span>
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
        <div class="btn-row" style="margin-top:24px"><a class="btn btn--primary" href="contact.html">Express Strategic Interest</a></div>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">Looking forward</p>
        <h2>Looking Forward</h2>
        <p>NexGen continues to expand its portfolio with future ventures aligned with sustainability, intelligent infrastructure, and digital transformation. Our platform is designed to evolve—welcoming new opportunities that strengthen the NexGen ecosystem while preserving focus, quality, and strategic intent.</p>
        <h3 style="margin-top:32px">Partner With NexGen</h3>
        <p>Whether you represent a government entity, enterprise, financial institution, or strategic partner, NexGen welcomes conversations that shape the future of clean energy and intelligent digital innovation.</p>
        <div class="btn-row" style="margin-top:24px"><a class="btn btn--outline" href="contact.html">Contact Us</a></div>
      </div>
    </div>
  </section>`;

const companiesBody = `${hero({
  image: 'hero-about.webp',
  eyebrow: 'Our companies',
  title: 'Our Companies',
  lead: 'Beyond clean energy, NexGen builds a growing portfolio of digital ventures shaping the future of finance, workforce empowerment, data intelligence, and smart living.',
})}

  <section class="section">
    <div class="container">
      <div class="grid grid-3">
${ventureCards()}
      </div>
    </div>
  </section>`;

const inpipeBody = `${hero({
  image: 'hero-inpipe.webp',
  eyebrow: 'InPipe Energy GCC',
  title: 'Turning Water Pressure Into Clean, Reliable Power',
  lead: 'NexGen is the exclusive regional partner bringing HydroXS® technology to the Gulf—enabling utilities, municipalities, and large facilities to recover energy, reduce emissions, and improve operational efficiency.',
  actions: `<a class="btn btn--accent" href="contact.html">Request Site Assessment</a>`,
  cls: ' hero--bright',
})}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">The challenge</p>
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
        <p class="eyebrow">HydroXS solution</p>
        <h2>HydroXS Solution</h2>
        <p><strong>HydroXS</strong> installs directly onto existing pipeline infrastructure and captures energy from excess pressure. As water flows through, the system safely reduces pressure while generating clean electricity.</p>
        <h3 style="margin-top:32px">Key Advantages</h3>
        <ul class="checklist">
          <li>No change in water operations</li>
          <li>Predictable renewable power (day &amp; night)</li>
          <li>Works with gravity, pumping, regulator sites</li>
          <li>Ideal for utilities, cooling networks, industrial systems, and RO desalination</li>
          <li>Supports national sustainability and Net Zero targets</li>
        </ul>
      </div>
      ${splitImage('inpipe-plant.webp', 'HydroXS installed on a water pipeline')}
    </div>
  </section>

  <section class="section section--dark">
    <div class="container">
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Real results</p>
        <h2>Real Results</h2>
        <p class="lead">Examples from existing deployments:</p>
      </div>
      <div class="stats reveal" style="margin-top:40px">
        <div class="stat">
          <p class="stat__value">200,000</p>
          <p class="stat__label">kWh annually from a single site (up to)</p>
        </div>
        <div class="stat">
          <p class="stat__value">&gt;97<sup>%</sup></p>
          <p class="stat__label">High system uptime</p>
        </div>
        <div class="stat">
          <p class="stat__value">CO₂</p>
          <p class="stat__label">Reductions lasting decades</p>
        </div>
        <div class="stat">
          <p class="stat__value">24/7</p>
          <p class="stat__label">Electricity used for pumps, lighting, EV chargers, and grid support</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">GCC use cases</p>
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
        <ol class="steps" style="margin-top:24px">
          <li class="step"><div><h3>Data Collection Support</h3></div></li>
          <li class="step"><div><h3>Hydraulic &amp; Energy Analysis</h3></div></li>
          <li class="step"><div><h3>Technical &amp; Financial Proposal</h3></div></li>
          <li class="step"><div><h3>Procurement &amp; Installation</h3></div></li>
          <li class="step"><div><h3>Commissioning &amp; Monitoring</h3></div></li>
        </ol>
        <div class="btn-row" style="margin-top:32px"><a class="btn btn--primary" href="contact.html">Request Engineering Assessment</a></div>
      </div>
    </div>
  </section>`;

const trustFlowBody = `${hero({
  mark: 'venture-trust-flow.webp',
  eyebrow: 'Trust Flow',
  title: 'Trust Flow',
  lead: 'Intelligent onboarding for banks &amp; investment firms — a unified AI platform that accelerates onboarding, elevates compliance accuracy, and streamlines documentation for banks, corporate clients, investment firms, funds, and asset managers.',
  actions: `<a class="btn btn--accent" href="contact.html">Request a Demo</a>`,
  cls: ' hero--plate hero--home',
})}

  <section class="section">
    <div class="container">
      <div class="center reveal" style="max-width:760px;margin-inline:auto">
        <p class="eyebrow">Trust Flow</p>
        <h2>Intelligent Onboarding for Banks &amp; Investment Firms</h2>
        <p class="lead">A unified AI platform that accelerates onboarding, elevates compliance accuracy, and streamlines documentation for banks, corporate clients, investment firms, funds, and asset managers.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">The challenge</p>
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
        <p style="margin-top:24px">These bottlenecks delay revenue, frustrate clients, and increase operational costs.</p>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">The solution</p>
        <h2>The Solution</h2>
        <p><strong>Trust Flow</strong> automates the entire onboarding process with AI, ensuring fast, accurate, and complete files.</p>
        <h3 style="margin-top:32px">What It Includes</h3>
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
        <p class="eyebrow">Who Trust Flow serves</p>
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
        <p class="eyebrow">Value for institutions</p>
        <h2>Value For Institutions</h2>
        <ul class="checklist">
          <li>Cost optimization</li>
          <li>Faster onboarding</li>
          <li>Higher compliance accuracy</li>
          <li>Better investor experience</li>
          <li>Standardized risk evaluation</li>
          <li>Reduced operational workload</li>
        </ul>
        <div class="btn-row" style="margin-top:32px">
          <a class="btn btn--primary" href="contact.html">Schedule a Strategy Call</a>
          <a class="btn btn--outline" href="contact.html">Contact Us</a>
        </div>
      </div>
    </div>
  </section>`;

const jypBody = `${hero({
  mark: 'venture-jyp.webp',
  eyebrow: 'JYP',
  title: 'JYP',
  lead: 'Smart wallet for the GCC workforce — a secure, multilingual wallet for salary distribution, low-cost remittances, and seamless employer integration.',
  actions: `<a class="btn btn--accent" href="contact.html">Partner With Us</a>`,
  cls: ' hero--plate hero--home',
})}

  <section class="section">
    <div class="container">
      <div class="center reveal" style="max-width:760px;margin-inline:auto">
        <p class="eyebrow">JYP</p>
        <h2>Smart Wallet For The GCC Workforce</h2>
        <p class="lead">A secure, multilingual wallet for salary distribution, low-cost remittances, and seamless employer integration.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">The problem</p>
        <h2>The Problem</h2>
        <p>Financial institutions waste time and resources on:</p>
        <ul class="checklist">
          <li>Cash-heavy payroll</li>
          <li>High transfer fees</li>
          <li>Limited access to financial services</li>
          <li>Compliance complexity (WPS requirements)</li>
        </ul>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">The solution</p>
        <h2>The Solution</h2>
        <p><strong>JYP</strong> provides employers and workers with a modern financial platform that reduces costs, increases transparency, and improves access.</p>
        <h3 style="margin-top:32px">Features</h3>
        <ul class="checklist">
          <li>Digital salary payments</li>
          <li>Wallet-to-wallet transfers</li>
          <li>Low-cost international remittances</li>
          <li>Employer dashboard</li>
          <li>Multi-language support</li>
          <li>Identity verification</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid grid-2">
        <div class="panel reveal">
          <p class="eyebrow">Value for employers</p>
          <h3>Value For Employers</h3>
          <ul class="checklist">
            <li>Full compliance</li>
            <li>Transparent reporting</li>
            <li>No cash handling</li>
          </ul>
        </div>
        <div class="panel reveal" data-delay="1">
          <p class="eyebrow">Value for workers</p>
          <h3>Value For Workers</h3>
          <ul class="checklist">
            <li>Cheaper remittances</li>
            <li>Faster salaries</li>
            <li>Easy access to financial tools</li>
          </ul>
        </div>
      </div>
      <div class="btn-row center" style="margin-top:40px;justify-content:center">
        <a class="btn btn--primary" href="contact.html">Schedule a Strategy Call</a>
        <a class="btn btn--outline" href="contact.html">Contact Us</a>
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
  cls: ' hero--plate hero--home',
})}

  <section class="section">
    <div class="container">
      <div class="center reveal" style="max-width:760px;margin-inline:auto">
        <p class="eyebrow">In collaboration with Esaal</p>
        <h2>Digital Receipts &amp; Spending Intelligence</h2>
        <p class="lead">An AI engine that converts receipts into structured, searchable financial data—powering insights for individuals, businesses, and retailers. Esaal replaces the paper receipt with a smarter, digital one, and turns every transaction into a real-time customer signal.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">The problem</p>
        <h2>The Problem</h2>
        <p>Financial institutions waste time and resources on:</p>
        <ul class="checklist">
          <li>Lost receipts</li>
          <li>Manual reconciliation</li>
          <li>Lack of spending clarity</li>
          <li>No structured financial data</li>
        </ul>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">The solution</p>
        <h2>The Solution</h2>
        <p><strong>Esaal</strong> turns every receipt—paper, email, POS—into clean, structured financial data instantly.</p>
        <h3 style="margin-top:32px">Features</h3>
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
      <div class="center reveal" style="max-width:760px;margin-inline:auto">
        <p class="eyebrow">The platform</p>
        <h2>Seamless Plug-n-Play With Your POS</h2>
      </div>
      <div class="grid grid-3" style="margin-top:40px">
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
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">By the numbers</p>
        <h2>It works. We’ve got the receipts.</h2>
      </div>
      <div class="stats reveal" style="margin-top:40px">
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
        <p class="eyebrow">Value</p>
        <h2>Value</h2>
        <ul class="checklist">
          <li>Clear spending for individuals</li>
          <li>Accurate records for businesses</li>
          <li>Deep insights for retailers</li>
        </ul>
        <h3 style="margin-top:32px">Capture Every Purchase</h3>
        <ol class="steps" style="margin-top:16px">
          <li class="step"><div><h3>Tap into Convenience: Get the App</h3><p>Hit download through the App Store, Google Play or App Gallery.</p></div></li>
          <li class="step"><div><h3>Quick Sign-Up: Your Number or UAE PASS, Your Choice</h3><p>A simple touch, a swift sign-up, and you’re in.</p></div></li>
          <li class="step"><div><h3>Embrace the Ease: Enjoy the Esaal Edge</h3><p>Step into a world of effortless e-billing and seamless transactions.</p></div></li>
        </ol>
        <div class="btn-row" style="margin-top:32px">
          <a class="btn btn--primary" href="contact.html">Contact Us</a>
          <a class="btn btn--outline" href="https://apps.apple.com/ae/app/esaal/id6444912096" target="_blank" rel="noopener">App Store</a>
        </div>
      </div>
      <figure class="figure figure--plate reveal" data-delay="1">
        <img src="assets/img/venture-esaal.webp" alt="Esaal app icon" loading="lazy" decoding="async" style="max-width:220px;margin-inline:auto">
        <figcaption>Esaal — the new, smarter way to E-receipt. In collaboration with Esaal.</figcaption>
      </figure>
    </div>
  </section>`;

const dariBody = `${hero({
  mark: 'venture-dari.webp',
  eyebrow: 'Dari',
  title: 'Dari',
  lead: 'AI Smart Living — a home and building ecosystem that understands behavior, emotion, and lifestyle.',
  actions: `<a class="btn btn--accent" href="contact.html">Partner With Us</a>`,
  cls: ' hero--plate hero--home',
})}

  <section class="section">
    <div class="container">
      <div class="center reveal" style="max-width:760px;margin-inline:auto">
        <p class="eyebrow">Dari</p>
        <h2>AI-Powered Smart Living System</h2>
        <p class="lead">A home and building ecosystem that understands behavior, emotion, and lifestyle.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">The problem</p>
        <h2>The Problem</h2>
        <p>Traditional smart home systems are device-based and reactive. They don’t understand people.</p>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">The solution</p>
        <h2>The Solution</h2>
        <p><strong>Dari</strong> creates human-centric automation using behavioral and emotional AI.</p>
        <h3 style="margin-top:32px">Features</h3>
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
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Value</p>
        <h2>Value</h2>
      </div>
      <div class="grid grid-4" style="margin-top:40px">
        <div class="value reveal"><h3>Energy efficiency</h3></div>
        <div class="value reveal" data-delay="1"><h3>Comfort</h3></div>
        <div class="value reveal" data-delay="2"><h3>Safety</h3></div>
        <div class="value reveal" data-delay="3"><h3>Premium living experience</h3></div>
      </div>
      <div class="btn-row center" style="margin-top:40px;justify-content:center">
        <a class="btn btn--primary" href="contact.html">Schedule a Strategy Call</a>
        <a class="btn btn--outline" href="contact.html">Contact Us</a>
      </div>
    </div>
  </section>`;

const sabyBody = `${hero({
  mark: 'venture-saby.webp',
  eyebrow: 'SABY',
  title: 'SABY',
  lead: 'Modern technology studio — software engineering, AI development, digital transformation, and enterprise platforms.',
  actions: `<a class="btn btn--accent" href="contact.html">Partner With Us</a>`,
  cls: ' hero--plate hero--home',
})}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">Who we are</p>
        <h2>Who We Are</h2>
        <p>SABY is NexGen’s dedicated studio delivering modern, scalable digital solutions for the region.</p>
      </div>
      <div class="reveal" data-delay="1">
        <p class="eyebrow">Expertise</p>
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
      <div class="center reveal" style="max-width:720px;margin-inline:auto">
        <p class="eyebrow">Why SABY?</p>
        <h2>Why SABY?</h2>
      </div>
      <div class="grid grid-3" style="margin-top:40px">
        <article class="card reveal"><h3>Modern engineering practices</h3></article>
        <article class="card reveal" data-delay="1"><h3>Fast delivery cycles</h3></article>
        <article class="card reveal" data-delay="2"><h3>Enterprise-grade execution</h3></article>
      </div>
      <div class="btn-row center" style="margin-top:40px;justify-content:center">
        <a class="btn btn--primary" href="contact.html">Schedule a Strategy Call</a>
        <a class="btn btn--outline" href="contact.html">Contact Us</a>
      </div>
    </div>
  </section>`;

const contactBody = `${hero({
  eyebrow: 'Get in touch',
  title: 'Contact Us',
  lead: 'Whether you represent a government entity, enterprise, financial institution, or strategic partner, NexGen welcomes conversations that shape the future of clean energy and intelligent digital innovation.',
  cls: ' hero--plate',
})}

  <section class="section">
    <div class="container split">
      <div class="reveal">
        <p class="eyebrow">Direct lines</p>
        <h2>Talk to NexGen</h2>
        <div class="contact-card" style="margin-top:24px">
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
      <div class="center reveal" style="max-width:760px;margin-inline:auto">
        <p class="eyebrow">Where we operate</p>
        <h2>Regional Presence &amp; Local Insight</h2>
        <p class="lead">Active across Bahrain, Kuwait, Saudi Arabia, and the wider GCC.</p>
      </div>
      <div class="grid grid-3" style="margin-top:40px">
        <article class="card reveal">
          <h3>Clean Energy</h3>
          <p>HydroXS in-pipe hydropower with InPipe Energy (USA) for utilities, municipalities, and large facilities.</p>
          <div class="card__foot"><a class="link-arrow" href="inpipe-energy.html">InPipe Energy</a></div>
        </article>
        <article class="card reveal" data-delay="1">
          <h3>Digital Ventures</h3>
          <p>Trust Flow, JYP, Esaal, Dari, and SABY — finance, workforce payments, digital receipts, smart living, and engineering.</p>
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
  { slug: 'index.html', active: 'index.html', title: 'NEXGEN Holdings — Clean Energy & Digital Innovation in the GCC', desc: 'NEXGEN Holdings is a Gulf-based holding company building high-impact ventures in clean energy, fintech, workforce payments, digital receipts, and smart living across the GCC.', body: homeBody, ogImage: 'hero-home.webp', home: true },
  { slug: 'about.html', active: 'about.html', title: 'About Us — NEXGEN Holdings', desc: 'NEXGEN Holdings builds and scales ventures across clean energy, financial innovation, and intelligent digital platforms — our vision, mission, values, and leadership.', body: aboutBody, ogImage: 'hero-about.webp' },
  { slug: 'companies.html', active: 'companies.html', title: 'Our Companies — NEXGEN Holdings', desc: 'Explore the NEXGEN Holdings portfolio: Trust Flow, JYP, Esaal, Dari, and SABY — five ventures shaping finance, workforce payments, digital receipts, and smart living.', body: companiesBody, ogImage: 'hero-about.webp' },
  { slug: 'inpipe-energy.html', active: 'inpipe-energy.html', title: 'InPipe Energy — HydroXS In-Pipe Hydropower | NEXGEN Holdings', desc: 'NEXGEN is the exclusive regional partner of InPipe Energy (USA), bringing HydroXS technology to the Gulf to turn excess water pressure into clean, reliable power.', body: inpipeBody, ogImage: 'hero-inpipe.webp' },
  { slug: 'trust-flow.html', active: 'trust-flow.html', title: 'Trust Flow — Corporate & Investor Onboarding AI | NEXGEN Holdings', desc: 'Trust Flow automates onboarding for banks, investment firms, funds, and asset managers with AI document extraction, automated KYC/KYB, and compliance workflows.', body: trustFlowBody, ogImage: 'venture-trust-flow.webp' },
  { slug: 'jyp.html', active: 'jyp.html', title: 'JYP — Smart Wallet for the GCC Workforce | NEXGEN Holdings', desc: 'JYP is a secure, multilingual salary and remittance wallet for the GCC: digital payroll, low-cost international transfers, and seamless employer integration.', body: jypBody, ogImage: 'venture-jyp.webp' },
  { slug: 'esaal.html', active: 'esaal.html', title: 'Esaal — Digital Receipts & Spending Intelligence | NEXGEN Holdings', desc: 'In collaboration with Esaal, NEXGEN brings Plug-n-Play digital receipts to the GCC — real-time customer profiling, campaign measurement, and no extra hardware.', body: esaalBody, ogImage: 'venture-esaal.webp' },
  { slug: 'dari.html', active: 'dari.html', title: 'Dari — AI-Powered Smart Living System | NEXGEN Holdings', desc: 'Dari is a human-centric smart home and building platform that adapts to behavior, emotion, and daily routines using behavioral and emotional AI.', body: dariBody, ogImage: 'venture-dari.webp' },
  { slug: 'saby.html', active: 'saby.html', title: 'SABY — Modern Technology Studio | NEXGEN Holdings', desc: 'SABY is NexGen’s dedicated software engineering studio delivering AI development, digital transformation, and enterprise-grade platforms for the region.', body: sabyBody, ogImage: 'venture-saby.webp' },
  { slug: 'contact.html', active: 'contact.html', title: 'Contact Us — NEXGEN Holdings', desc: 'Contact NEXGEN Holdings for partnerships, ventures, and clean energy assessments. Phone +973 3660 0911, email info@nexgen.bh.', body: contactBody, ogImage: 'contact-visual.webp' },
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

for (const p of PAGES) {
  const html = page({
    slug: p.slug,
    title: p.title,
    desc: p.desc,
    active: p.active,
    body: p.body,
    ogImage: p.ogImage,
    head: p.home ? JSONLD : '',
  });
  fs.writeFileSync(path.join(OUT, p.slug), html);
  console.log('wrote', p.slug, (html.length / 1024).toFixed(1) + 'KB');
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
