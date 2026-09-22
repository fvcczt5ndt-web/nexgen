#!/usr/bin/env node
/* Verify the built site: HTML parses, every local href/src resolves, no "Sample Page". */
const fs = require('fs');
const path = require('path');

const SITE = '/home/opc/.openclaw/workspace/nexgen/site';
const SLUGS = ['index.html','about.html','companies.html','inpipe-energy.html','trust-flow.html','esaal.html','saby.html','dari.html','contact.html'];
/* Both locales ship the same nine pages. The Arabic ones live under ar/ and
   reference the shared assets one level up, so every check below runs per
   directory rather than against a single flat list. */
const LOCALES = [
  { code: 'en', dir: SITE, pages: SLUGS.map((s) => ({ rel: s, abs: path.join(SITE, s) })) },
  { code: 'ar', dir: path.join(SITE, 'ar'), pages: SLUGS.map((s) => ({ rel: `ar/${s}`, abs: path.join(SITE, 'ar', s) })) },
];
const PAGES = LOCALES.flatMap((l) => l.pages.map((p) => p.abs));

let brokenLinks = 0, badRefs = [], samplePage = 0, parseErrors = [];
const allRefs = [];

function resolveRef(fromFile, ref) {
  if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref)) return { external: true };
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return { ok: true };
  const abs = path.resolve(path.dirname(fromFile), clean);
  return { ok: fs.existsSync(abs), abs, clean };
}

for (const abs of PAGES) {
  const p = path.relative(SITE, abs);
  const html = fs.readFileSync(abs, 'utf8');

  if (/Sample Page/i.test(html)) { samplePage++; console.log('!! "Sample Page" found in', p); }

  // crude structural parse: tag balance for key containers
  const opens = (html.match(/<(div|section|article|main|header|footer|nav|ul|ol|li|figure)\b/g) || []).length;
  const closes = (html.match(/<\/(div|section|article|main|header|footer|nav|ul|ol|li|figure)>/g) || []).length;
  if (opens !== closes) parseErrors.push(`${p}: unbalanced block tags open=${opens} close=${closes}`);

  // required head elements
  for (const needle of ['<title>', 'name="description"', 'rel="canonical"', 'property="og:title"', 'name="twitter:card"', 'charset="utf-8"']) {
    if (!html.includes(needle)) parseErrors.push(`${p}: missing ${needle}`);
  }

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    allRefs.push({ page: p, ref });
    const r = resolveRef(abs, ref);
    if (!r.external && !r.ok) { brokenLinks++; badRefs.push(`${p} -> ${ref}`); }
  }

  // Every page must carry the same nav: three top-level entries, with every
  // company nested under the Companies panel. Both sets are checked, so a
  // dropped link fails here rather than silently disappearing from the site.
  const navMatch = html.match(/<ul class="topbar__menu" id="primary-menu">([\s\S]*?)<\/ul>\s*<\/nav>/);
  if (!navMatch) { parseErrors.push(`${p}: nav menu not found`); continue; }
  const navBlock = navMatch[1];
  const topBlock = navBlock.replace(/<ul class="drop__menu"[\s\S]*?<\/ul>/, '');
  const navHrefs = [...topBlock.matchAll(/href="([^"]+)"/g)].map(x => x[1]);
  const expected = ['index.html','about.html','companies.html'];
  if (navHrefs.join(',') !== expected.join(',')) {
    parseErrors.push(`${p}: nav order mismatch -> ${navHrefs.join(',')}`);
  }
  const dropMatch = navBlock.match(/<ul class="drop__menu" id="[^"]+">([\s\S]*?)<\/ul>/);
  if (!dropMatch) { parseErrors.push(`${p}: Companies panel missing from nav`); continue; }
  const dropHrefs = [...dropMatch[1].matchAll(/href="([^"]+)"/g)].map(x => x[1]);
  const expectedDrop = ['inpipe-energy.html','trust-flow.html','esaal.html','dari.html','saby.html'];
  if (dropHrefs.join(',') !== expectedDrop.join(',')) {
    parseErrors.push(`${p}: Companies panel mismatch -> ${dropHrefs.join(',')}`);
  }
  // The overview link and every venture must be present or the group is pointless.
  const allNavHrefs = [...navBlock.matchAll(/href="([^"]+)"/g)].map(x => x[1]);
  for (const need of [...expected, ...expectedDrop]) {
    if (!allNavHrefs.includes(need)) parseErrors.push(`${p}: nav is missing ${need}`);
  }

  // canonical must use a clean slug
  const canon = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
  if (/-clone/.test(canon)) parseErrors.push(`${p}: clone slug in canonical (${canon})`);

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  console.log(p.padEnd(20), '|', title.slice(0, 58).padEnd(58), '| desc', desc.length + 'ch');
}

// duplicate titles / descriptions?
const titles = PAGES.map(p => (fs.readFileSync(p, 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1]);
if (new Set(titles).size !== titles.length) parseErrors.push('duplicate <title> across pages');
const descs = PAGES.map(p => (fs.readFileSync(p, 'utf8').match(/name="description" content="([^"]*)"/) || [])[1]);
if (new Set(descs).size !== descs.length) parseErrors.push('duplicate meta description across pages');

// clone slugs anywhere in output HTML?
for (const p of PAGES) {
  const html = fs.readFileSync(p, 'utf8');
  if (/-clone/.test(html)) parseErrors.push(`${p}: "-clone" slug referenced in output`);
}

// JSON-LD on homepage only, and must parse
const idx = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const ldMatch = idx.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ldMatch) parseErrors.push('index.html: JSON-LD missing');
else {
  try {
    const obj = JSON.parse(ldMatch[1]);
    if (obj['@type'] !== 'Organization' || obj.name !== 'NEXGEN Holdings') parseErrors.push('JSON-LD: unexpected content');
    else console.log('\nJSON-LD Organization OK:', obj.name, '|', obj.url, '|', obj.email, '|', obj.telephone, '| sameAs:', obj.sameAs.join(', '));
  } catch (e) { parseErrors.push('JSON-LD invalid JSON: ' + e.message); }
}
/* JSON-LD belongs on the homepage of each locale, nowhere else. */
let ldCount = 0, ldWhere = [];
for (const abs of PAGES) if (/application\/ld\+json/.test(fs.readFileSync(abs, 'utf8'))) { ldCount++; ldWhere.push(path.relative(SITE, abs)); }
if (ldCount !== 2) parseErrors.push(`JSON-LD present on ${ldCount} pages (expected 2: each locale's homepage, got ${ldWhere.join(', ')})`);

// Language and direction must be declared on every page, and must match locale.
for (const loc of LOCALES) {
  for (const pg of loc.pages) {
    const html = fs.readFileSync(pg.abs, 'utf8');
    const m = html.match(/<html lang="([^"]*)" dir="([^"]*)">/);
    if (!m) { parseErrors.push(`${pg.rel}: <html> missing lang/dir`); continue; }
    const wantDir = loc.code === 'ar' ? 'rtl' : 'ltr';
    if (m[1] !== loc.code) parseErrors.push(`${pg.rel}: lang is "${m[1]}", expected "${loc.code}"`);
    if (m[2] !== wantDir) parseErrors.push(`${pg.rel}: dir is "${m[2]}", expected "${wantDir}"`);
    // Both alternates, pointing at the mirrored URL.
    if (!html.includes('hreflang="ar"') || !html.includes('hreflang="en"')) {
      parseErrors.push(`${pg.rel}: missing hreflang alternates`);
    }
    if (!/class="lang-switch"/.test(html)) parseErrors.push(`${pg.rel}: missing language switch`);
  }
}

// Arabic pages must actually contain Arabic, and Latin pages must not.
for (const loc of LOCALES) {
  for (const pg of loc.pages) {
    const raw = fs.readFileSync(pg.abs, 'utf8')
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '');
    /* The language switch names the OTHER language in its own script, so an
       English page legitimately carries the word "العربية". Drop that element
       before counting, then check the rest of the page. */
    const text = raw.replace(/<a class="lang-switch"[\s\S]*?<\/a>/g, '')
      .replace(/<[^>]+>/g, ' ');
    const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
    if (loc.code === 'ar' && arabic < 200) parseErrors.push(`${pg.rel}: only ${arabic} Arabic characters - looks untranslated`);
    if (loc.code === 'en' && arabic > 0) parseErrors.push(`${pg.rel}: ${arabic} Arabic characters on an English page`);
    /* And the switch itself must always be present, in both locales. */
    if (!/class="lang-switch"/.test(raw)) parseErrors.push(`${pg.rel}: language switch missing`);
  }
}

// sitemap / robots
const sm = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]);
console.log('\nsitemap urls:', smUrls.length);
smUrls.forEach(u => console.log('  ', u));
/* One entry per page per locale. */
if (smUrls.length !== SLUGS.length * 2) parseErrors.push(`sitemap has ${smUrls.length} urls (expected ${SLUGS.length * 2})`);
const smAlt = (sm.match(/hreflang="ar"/g) || []).length;
if (smAlt < SLUGS.length * 2) parseErrors.push(`sitemap alternates: ${smAlt} ar entries (expected ${SLUGS.length * 2})`);
const rb = fs.readFileSync(path.join(SITE, 'robots.txt'), 'utf8');
if (!/Sitemap:/.test(rb)) parseErrors.push('robots.txt missing Sitemap line');

// external references (should be fonts + esaal + linkedin + apps.apple only)
const ext = [...new Set(allRefs.filter(r => /^https?:/.test(r.ref)).map(r => r.ref.split('/').slice(0, 3).join('/')))];
console.log('\nexternal origins referenced:');
ext.forEach(o => console.log('  ', o));

// image size report
const imgDir = path.join(SITE, 'assets/img');
const imgs = fs.readdirSync(imgDir).map(f => ({ f, size: fs.statSync(path.join(imgDir, f)).size })).sort((a, b) => b.size - a.size);
console.log('\nimages:', imgs.length, '| total', (imgs.reduce((a, b) => a + b.size, 0) / 1024).toFixed(0) + 'KB', '| largest', (imgs[0].size / 1024).toFixed(0) + 'KB', imgs[0].f);

console.log('\n=== RESULT ===');
console.log('broken links:', brokenLinks, badRefs.length ? '\n  ' + badRefs.join('\n  ') : '');
console.log('"Sample Page" occurrences:', samplePage);
console.log('parse/consistency problems:', parseErrors.length, parseErrors.length ? '\n  ' + parseErrors.join('\n  ') : '');
process.exit(brokenLinks || samplePage || parseErrors.length ? 1 : 0);
