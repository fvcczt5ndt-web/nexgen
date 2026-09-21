#!/usr/bin/env node
/* Compress + normalise all images used by the static NexGen site. */
const sharp = require('/home/opc/.openclaw/workspace/nexgen/tools/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const SRC = '/home/opc/.openclaw/workspace/nexgen/source/images';
const OUT = '/home/opc/.openclaw/workspace/nexgen/site/assets/img';

const S = (n) => path.join(SRC, n);
const ESAAL = '/home/opc/.openclaw/workspace/nexgen/source/esaal/esaal-appicon.png';
const HERO_HOME = '/tmp/ngsrc/hero-home.png';

// name, source, maxWidth, kind
const PLAN = [
  ['hero-home.webp',        HERO_HOME,  1920, 'hero'],
  ['hero-about.webp',       S('1766170156047_elegant_corporate_business_style_zoom_virtual_background_6.png'), 1920, 'hero'],
  ['hero-inpipe.webp',      S('1766173560541_inpipe_energy_for_nexgen.pdf_3.webp'), 1920, 'hero'],
  ['inpipe-plant.webp',     S('1766084020662_inpipe_energy_for_nexgen.pdf_2.webp'), 1200, 'content'],
  ['inpipe-visual.webp',    S('1766174630830_elegant_corporate_business_style_zoom_virtual_background_7.webp'), 1200, 'content'],
  ['venture-why.webp',      S('1765899457233_nexgen_profile_7.webp'), 900, 'content'],
  ['venture-trust-flow.webp', S('1765898295901_nexgen_profile_3.webp'), 600, 'mark'],
  ['venture-dari.webp',     S('1765898296093_nexgen_profile_2.webp'), 600, 'mark'],
  ['venture-saby.webp',     S('1765898293300_nexgen_profile_1.png'), 600, 'mark'],
  ['venture-esaal.webp',    ESAAL, 600, 'mark'],
  ['team-abdullah.webp',    S('1765903483458_nexgen_profile_9.webp'), 900, 'content'],
  ['team-omar.webp',        S('1765904277616_nexgen_profile_10.webp'), 900, 'content'],
  ['team-jernej.webp',      S('1765903486740_nexgen_profile_8.webp'), 900, 'content'],
  ['advisor-alenzi.webp',   S('1766186380853_nexgen_profile_15.webp'), 700, 'card'],
  ['advisor-alsharah.webp', S('1766187515349_nexgen_profile_16.png'), 700, 'card'],
  ['advisor-moatassem.webp', S('1766187527755_nexgen_profile_17.png'), 700, 'card'],
  ['contact-visual.webp',   S('1765985907616_nexgen_profile_11.webp'), 1200, 'content'],
];

async function encode(file, width, quality) {
  let pipe = sharp(file, { failOn: 'none' }).rotate();
  const meta = await pipe.metadata();
  if (meta.width > width) pipe = pipe.resize({ width, withoutEnlargement: true });
  return pipe.webp({ quality, effort: 5, smartSubsample: true }).toBuffer();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const report = [];
  for (const [name, file, width, kind] of PLAN) {
    const q = kind === 'mark' ? 82 : 78;
    let buf = await encode(file, width, q);
    let quality = q;
    while (buf.length > 150 * 1024 && quality > 55) {
      quality -= 8;
      buf = await encode(file, width, quality);
    }
    fs.writeFileSync(path.join(OUT, name), buf);
    const before = fs.statSync(file).size;
    const meta = await sharp(buf).metadata();
    report.push({ name, before, after: buf.length, dim: meta.width + 'x' + meta.height, quality });
  }

  // --- logo: alpha-trim, then pad, then export webp + favicon png ---
  const logoFile = S('1745450260181_nexgen_logo-with_new_colors_2.webp');
  const small = await sharp(logoFile).resize({ height: 200 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = small;
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
  }
  const scale = 5249 / info.width;
  const box = {
    left: Math.max(0, Math.round(minX * scale)),
    top: Math.max(0, Math.round(minY * scale)),
    width: Math.round((maxX - minX + 1) * scale),
    height: Math.round((maxY - minY + 1) * scale),
  };
  console.log('logo trim box:', JSON.stringify(box));

  const trimmed = await sharp(logoFile).extract(box).png().toBuffer();
  const tmeta = await sharp(trimmed).metadata();
  const padx = Math.round(tmeta.width * 0.06), pady = Math.round(tmeta.height * 0.06);

  const logo = await sharp(trimmed)
    .resize({ height: 320, withoutEnlargement: true })
    .extend({ top: pady, bottom: pady, left: padx, right: padx, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, effort: 5 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, 'logo.webp'), logo);
  report.push({ name: 'logo.webp', before: fs.statSync(logoFile).size, after: logo.length, dim: (await sharp(logo).metadata()).width + 'x' + (await sharp(logo).metadata()).height, quality: 88 });

  const fav = await sharp(trimmed)
    .resize({ width: 200, height: 200, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync('/home/opc/.openclaw/workspace/nexgen/site/favicon.png', fav);
  report.push({ name: 'favicon.png (site root)', before: fs.statSync(logoFile).size, after: fav.length, dim: '200x200', quality: 'png' });

  const sum = (k) => report.reduce((a, r) => a + r[k], 0);
  for (const r of report) {
    console.log(r.name.padEnd(26), r.dim.padEnd(11), 'q' + String(r.quality).padEnd(4), (Math.round(r.before / 1024) + 'KB').padStart(7), '->', (Math.round(r.after / 1024) + 'KB').padStart(6));
  }
  console.log('---');
  console.log('files:', report.length, '| before:', Math.round(sum('before') / 1024) + 'KB', '| after:', Math.round(sum('after') / 1024) + 'KB');
  const over = report.filter(r => r.after > 150 * 1024);
  console.log('over 150KB:', over.length ? over.map(o => o.name).join(', ') : 'none');
})().catch(e => { console.error(e); process.exit(1); });
