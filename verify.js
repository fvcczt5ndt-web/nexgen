#!/usr/bin/env node
/* Verify the built site: HTML parses, every local href/src resolves, no "Sample Page". */
const fs = require('fs');
const path = require('path');

const SITE = '/home/opc/.openclaw/workspace/nexgen/site';
const PAGES = ['index.html','about.html','companies.html','inpipe-energy.html','trust-flow.html','jyp.html','esaal.html','saby.html','dari.html','contact.html'];

let brokenLinks = 0, badRefs = [], samplePage = 0, parseErrors = [];
const allRefs = [];

function resolveRef(fromFile, ref) {
  if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref)) return { external: true };
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return { ok: true };
  const abs = path.resolve(path.dirname(fromFile), clean);
  return { ok: fs.existsSync(abs), abs, clean };
}

for (const p of PAGES) {
  const abs = path.join(SITE, p);
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

  // every page must carry the same 10 nav links
  const navMatch = html.match(/<ul class="topbar__menu" id="primary-menu">([\s\S]*?)<\/ul>/);
  if (!navMatch) { parseErrors.push(`${p}: nav menu not found`); continue; }
  const navHrefs = [...navMatch[1].matchAll(/href="([^"]+)"/g)].map(x => x[1]);
  const expected = ['index.html','about.html','inpipe-energy.html','companies.html','trust-flow.html','jyp.html','esaal.html','dari.html','saby.html','contact.html'];
  if (navHrefs.join(',') !== expected.join(',')) {
    parseErrors.push(`${p}: nav order mismatch -> ${navHrefs.join(',')}`);
  }

  // canonical must use a clean slug
  const canon = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
  if (/-clone/.test(canon)) parseErrors.push(`${p}: clone slug in canonical (${canon})`);

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  console.log(p.padEnd(20), '|', title.slice(0, 58).padEnd(58), '| desc', desc.length + 'ch');
}

// duplicate titles / descriptions?
const titles = PAGES.map(p => (fs.readFileSync(path.join(SITE, p), 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1]);
if (new Set(titles).size !== titles.length) parseErrors.push('duplicate <title> across pages');
const descs = PAGES.map(p => (fs.readFileSync(path.join(SITE, p), 'utf8').match(/name="description" content="([^"]*)"/) || [])[1]);
if (new Set(descs).size !== descs.length) parseErrors.push('duplicate meta description across pages');

// clone slugs anywhere in output HTML?
for (const p of PAGES) {
  const html = fs.readFileSync(path.join(SITE, p), 'utf8');
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
let ldCount = 0;
for (const p of PAGES) if (/application\/ld\+json/.test(fs.readFileSync(path.join(SITE, p), 'utf8'))) ldCount++;
if (ldCount !== 1) parseErrors.push(`JSON-LD present on ${ldCount} pages (expected 1, homepage only)`);

// sitemap / robots
const sm = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]);
console.log('\nsitemap urls:', smUrls.length);
smUrls.forEach(u => console.log('  ', u));
if (smUrls.length !== 10) parseErrors.push(`sitemap has ${smUrls.length} urls (expected 10)`);
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
