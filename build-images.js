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
// Heroes are listed ONCE. build-images.js derives every rendition width from
// the source itself and names them <base>-<w>.webp, so a second "-960" row
// would regenerate the same filenames from a different plan entry and clobber
// the real 960 file with the largest one.
const PLAN = [
  ['hero-home.webp',        HERO_HOME,  1920, 'hero'],
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
  if (f) PLAN.push([`hero-${slug}.webp`, f, 1920, 'hero']);
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

/* Widths offered per hero photograph. The largest rendition is the native
   source width (capped at 1920), never upscaled: a wide retina screen gets the
   best file that exists rather than an interpolated one, and a phone never
   downloads the desktop rendition. */
const HERO_WIDTHS = [960, 1440, 1920];

/* Quality and size policy, per kind.

   This replaces a loop that walked quality down whenever a file passed 150KB.
   That rule was blind to which image it was punishing, and the victim was
   always the same one: hero-home — the largest, most visible image on the site
   — shipped at q54, which is what the visible blocking on a large screen was.

   A hero is the one place where bytes buy something, so heroes get a high fixed
   quality and a generous safety cap that only exists to catch a pathological
   file. Small marks and inline content images keep a tight budget because at
   their rendered size the difference is invisible. */
const QUALITY = { hero: 85, mark: 84, content: 82 };
const CAP = { hero: 480 * 1024, mark: 160 * 1024, content: 260 * 1024 };
/* AVIF quality for heroes. Measured against the same source: AVIF q75 lands at
   MSE 8.7 versus WebP q85's 11.3 — better — while weighing 405KB against 460KB.
   So the large, high-DPI screen that needs the bytes most gets a smaller file
   that holds more detail. */
const AVIF_QUALITY = 75;

async function sourceWidth(file) {
  const m = await sharp(file, { failOn: 'none' }).metadata();
  return m.width || 0;
}

/* One resize pipeline, two encoders. WebP is written for every image; heroes
   also get AVIF, the format a large high-DPI screen benefits from most. */
async function encode(file, width, quality, extract) {
  let pipe = sharp(file, { failOn: 'none' }).rotate();
  if (extract) pipe = pipe.extract(extract);
  const meta = extract ? { width: extract.width } : await pipe.metadata();
  if (meta.width > width) pipe = pipe.resize({ width, withoutEnlargement: true });
  return pipe.webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
}

async function encodeAvif(file, width, quality, extract) {
  let pipe = sharp(file, { failOn: 'none' }).rotate();
  if (extract) pipe = pipe.extract(extract);
  const meta = extract ? { width: extract.width } : await pipe.metadata();
  if (meta.width > width) pipe = pipe.resize({ width, withoutEnlargement: true });
  return pipe.avif({ quality, effort: 4 }).toBuffer();
}

/* The renditions a hero photograph should ship: every step from HERO_WIDTHS the
   source can actually fill, plus the native width itself when it sits between
   two steps (so a 1280px source yields 960 and 1280, not a stretched 1440).
   The longest is written under the plan's own name, the rest get a -<w> suffix. */
function heroRenditions(name, srcW) {
  const base = name.replace(/\.webp$/, '');
  const max = Math.min(srcW, 1920);
  const widths = HERO_WIDTHS.filter((w) => w <= max);
  if (max > 960 && !widths.includes(max)) widths.push(max);
  widths.sort((a, b) => a - b);
  const largest = widths[widths.length - 1];
  return widths.map((w) => (w === largest ? { out: name, w } : { out: `${base}-${w}.webp`, w }));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const report = [];
  const produced = new Set();
  for (const [name, file, width, kind, extract] of PLAN) {
    const q = QUALITY[kind] || 82;
    const cap = CAP[kind] || 260 * 1024;
    /* A cropped hero (the art-directed stacked band) is a single fixed frame. */
    const jobs = (kind === 'hero' && !extract)
      ? heroRenditions(name, await sourceWidth(file))
      : [{ out: name, w: width }];
    for (const job of jobs) {
      let quality = q;
      let buf = await encode(file, job.w, quality, extract);
      /* Safety net only. It never walks far enough to damage the image: the
         floor is well above the point where artefacts show. */
      while (buf.length > cap && quality > 76) {
        quality -= 4;
        buf = await encode(file, job.w, quality, extract);
      }
      fs.writeFileSync(path.join(OUT, job.out), buf);
      produced.add(job.out);
      const meta = await sharp(buf).metadata();
      report.push({ name: job.out, before: fs.statSync(file).size, after: buf.length, dim: meta.width + 'x' + meta.height, quality });
      /* Heroes also ship as AVIF. The cropped stacked band is skipped: it is a
         single art-directed frame with its own <source>, so an AVIF beside it
         would never be referenced. */
      if (kind === 'hero' && !extract) {
        const avifOut = job.out.replace(/\.webp$/, '.avif');
        let aq = AVIF_QUALITY;
        let abuf = await encodeAvif(file, job.w, aq, extract);
        while (abuf.length > cap && aq > 52) {
          aq -= 6;
          abuf = await encodeAvif(file, job.w, aq, extract);
        }
        /* Keep AVIF only when it measurably beats WebP for this exact frame.
           Several of these photographs arrive already compressed, and on those
           AVIF re-encodes LARGER (measured: hero-saby +12%, hero-inpipe +5%).
           Shipping those would spend bytes to no benefit, so the comparison is
           per file rather than a blanket policy. */
        if (abuf.length < buf.length) {
          fs.writeFileSync(path.join(OUT, avifOut), abuf);
          produced.add(avifOut);
          report.push({ name: avifOut, before: fs.statSync(file).size, after: abuf.length, dim: meta.width + 'x' + meta.height, quality: 'avif' + aq });
        } else {
          try { fs.unlinkSync(path.join(OUT, avifOut)); } catch {}
        }
      }
    }
  }

  /* Drop hero renditions left by an earlier run that this one did not produce.
     A renamed or re-sourced hero would otherwise leave a stale file on disk for
     the page to keep advertising — and a file written under the wrong width is
     worse than a missing one, because it looks fine until it is downloaded. */
  for (const f of fs.readdirSync(OUT)) {
    if (!/^hero-.*\.(webp|avif)$/.test(f)) continue;
    if (produced.has(f)) continue;
    fs.unlinkSync(path.join(OUT, f));
    console.log('removed stale rendition', f);
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
