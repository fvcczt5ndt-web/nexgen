#!/usr/bin/env node
/* Compress + normalise all images used by the static NexGen site. */
const sharp = require('/home/opc/.openclaw/workspace/nexgen/tools/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const SRC = '/home/opc/.openclaw/workspace/nexgen/source/images';
const OUT = '/home/opc/.openclaw/workspace/nexgen/site/assets/img';

const S = (n) => path.join(SRC, n);
const ESAAL = '/home/opc/.openclaw/workspace/nexgen/source/esaal/esaal-appicon.png';
const HERO_HOME = '/home/opc/.openclaw/workspace/nexgen/source/images/hero-home-v2.jpg';
const MARK = (n) => '/home/opc/.openclaw/workspace/nexgen/source/marks/' + n;

// name, source, maxWidth, kind
const PLAN = [
  ['hero-home.webp',        HERO_HOME,  1920, 'hero'],
  ['hero-home-960.webp',    HERO_HOME,  960,  'hero'],
  ['hero-about.webp',       S('1766170156047_elegant_corporate_business_style_zoom_virtual_background_6.png'), 1920, 'hero'],
  ['hero-inpipe.webp',      S('1766173560541_inpipe_energy_for_nexgen.pdf_3.webp'), 1920, 'hero'],
  // Right side of the InPipe slide only (equipment + logo, no baked-in headline): used for the stacked hero band.
  ['hero-inpipe-crop.webp', S('1766173560541_inpipe_energy_for_nexgen.pdf_3.webp'), 1000, 'hero', { left: 678, top: 176, width: 602, height: 481 }],
  ['inpipe-plant.webp',     S('1766084020662_inpipe_energy_for_nexgen.pdf_2.webp'), 1200, 'content'],
  ['inpipe-visual.webp',    S('1766174630830_elegant_corporate_business_style_zoom_virtual_background_7.webp'), 1200, 'content'],
  ['venture-why.webp',      S('1765899457233_nexgen_profile_7.webp'), 900, 'content'],
  // The *-alpha.png files are the true-alpha rebuilds: the baked white ground is
  // keyed out and the ink re-solved into a dark band, so each mark reads on the
  // #fff plate. The older source/marks/*-clean.png files are opaque and carry
  // that white ground, so pointing these rows back at them would silently undo
  // the fix on the next run.
  ['venture-trust-flow.webp', S('venture-trust-flow-alpha.png'), 480, 'mark'],
  ['venture-dari.webp',     S('venture-dari-alpha.png'), 480, 'mark'],
  ['venture-saby.webp',     S('venture-saby-alpha.png'), 480, 'mark'],
  ['venture-esaal.webp',    S('venture-esaal-alpha.png'), 480, 'mark'],
  // Leadership/advisory portraits: no longer simple resizes — see the
  // LEADERSHIP block + tools/frame-portrait.py below, which crops each
  // photo onto the site's rounded, teal-ringed card frame.
  ['contact-visual.webp',   S('1765985907616_nexgen_profile_11.webp'), 1200, 'content'],
];

// Venture hero photographs: picked up automatically once source/images/hero-<slug>-v1.(jpg|png) exists.
for (const slug of ['trust-flow', 'esaal', 'dari', 'saby']) {
  const f = ['jpg', 'png'].map(e => S(`hero-${slug}-v1.${e}`)).find(fs.existsSync);
  if (f) {
    PLAN.push([`hero-${slug}.webp`, f, 1920, 'hero']);
    PLAN.push([`hero-${slug}-960.webp`, f, 960, 'hero']);
  }
}

// Leadership/advisory portraits. Plain corporate photos don't carry the
// rounded-card + teal-ring frame the rest of the site's people photos use, so
// each one is cropped onto that frame by tools/frame-portrait.py rather than
// run through the generic resize path above. top_frac is how much of the
// vertical crop is taken from the top of the cover-fit image (0 = keep the
// very top / trim only the bottom; higher = allow more headroom to be cut).
const LEADERSHIP = [
  // Plain crops, no baked ring/corners: .person__media (border-radius +
  // overflow:hidden) and .advisor img (border-radius:50%) do the shaping in
  // CSS, matching every other rounded card on the site. Canvas dims mirror
  // those CSS targets: 4:5 for the leadership tier, 1:1 for advisor circles.
  { name: 'team-abdullah.webp',     src: 'leadership-new/founder.jpg',   w: 900, h: 1125, top_frac: 0.08 },
  { name: 'team-omar.webp',         src: 'leadership-new/omar.jpg',      w: 900, h: 1125, top_frac: 0.22 },
  { name: 'team-jernej.webp',       src: 'leadership-new/jernej.jpg',    w: 900, h: 1125, top_frac: 0.15 },
  { name: 'advisor-alenzi.webp',    src: 'leadership-new/alenzi.jpg',    w: 700, h: 700,  top_frac: 0 },
  { name: 'advisor-alsharah.webp',  src: 'leadership-new/hanan.jpg',     w: 700, h: 700,  top_frac: 0.05 },
  { name: 'team-moatassem.webp',    src: 'leadership-new/moatassem.jpg', w: 900, h: 1125, top_frac: 0.15 },
];

function buildLeadershipPortraits() {
  const { execFileSync } = require('child_process');
  const jobs = LEADERSHIP.map(p => ({
    src: S(p.src), dst: path.join(OUT, p.name), canvas_w: p.w, canvas_h: p.h, top_frac: p.top_frac, frame: false,
  }));
  execFileSync('python3', [path.join(__dirname, 'tools', 'frame-portrait.py'), JSON.stringify(jobs)], { stdio: 'inherit' });
}

async function encode(file, width, quality, extract) {
  let pipe = sharp(file, { failOn: 'none' }).rotate();
  if (extract) pipe = pipe.extract(extract);
  const meta = extract ? { width: extract.width } : await pipe.metadata();
  if (meta.width > width) pipe = pipe.resize({ width, withoutEnlargement: true });
  return pipe.webp({ quality, effort: 5, smartSubsample: true }).toBuffer();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const report = [];
  for (const [name, file, width, kind, extract] of PLAN) {
    const q = kind === 'mark' ? 82 : 78;
    let buf = await encode(file, width, q, extract);
    let quality = q;
    while (buf.length > 150 * 1024 && quality > 55) {
      quality -= 8;
      buf = await encode(file, width, quality, extract);
    }
    fs.writeFileSync(path.join(OUT, name), buf);
    const before = fs.statSync(file).size;
    const meta = await sharp(buf).metadata();
    report.push({ name, before, after: buf.length, dim: meta.width + 'x' + meta.height, quality });
  }

  buildLeadershipPortraits();

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
