# NEXGEN Holdings — Design Plan

Redesign goal: the site's copy promises "we build the future"; the visual
language should finally match. This plan defines the design doctrine, colour,
type, motion, and the home-page scroll narrative. It is the single source of
truth for the redesign; the CSS, JS, and generator changes below implement it.

## 0. Doctrine (from the loaded skills)

- **impeccable-uxui** — a bold, intentional aesthetic; tinted neutrals; one
  dominant ground; contrast verified; no card-everything, no gradient text, no
  glassmorphism.
- **emil-design-eng / animate** — motion is purposeful, quiet-fast; only
  `transform`/`opacity` (plus the sanctioned `clip-path`); `ease-out` on
  entrances; never `scale(0)`; no `ease-in` on UI; press feedback on
  pointer-down; hover gated behind `(hover: hover) and (pointer: fine)`;
  reduced-motion keeps crossfades and drops movement.
- **apple-design** — dark mode uses *lighter surfaces* for depth, not shadows;
  display type gets negative tracking; small text gets positive tracking.
- **design-motion-principles** — a marketing/landing page weights polish and
  delight (Jakub/Jhey) over productivity-speed (Emil), but every effect still
  carries a `prefers-reduced-motion` static-complete fallback.

The one-sentence direction: **a dark cinematic ground you look *into*, with the
venture marks and the accent as the lit objects.** "Future" = precision, depth,
confidence — not neon, not cyberpunk, not gradient soup.

## 1. Colour

The current palette is light paper `#f4f6f6` with dark `#0f1a20` bands. We
invert the emphasis: **dark petrol is the primary canvas**, light surfaces
appear only where the venture marks (dark-ink alpha artwork) require a lit
tile, and the teal accent is the "lit" element.

### Ground ramp (petrol-tinted near-blacks — never pure black)

| Token | Value | Role |
| --- | --- | --- |
| `--ground-0` | `#080e12` | deepest — footer, drawer, statement base |
| `--ground`   | `#0a1216` | page canvas (replaces `--paper` role) |
| `--ground-1` | `#0f1a20` | elevated band / hero base |
| `--ground-2` | `#16242b` | surface — panels, cards |
| `--ground-3` | `#1d2f38` | hover / active surface |

Adjacent ground steps are deliberately close (1.03–1.15:1) — they are **depth,
not contrast**; text never relies on a ground-to-ground step.

### Text on dark (contrast measured against `--ground` `#0a1216`)

| Token | Value | Ratio | Role |
| --- | --- | --- | --- |
| `--ink-on-dark`  | `#eaf1f2` | **16.53:1** | headings (AAA) |
| `--body-on-dark` | `#c3d1d4` | **12.05:1** | body copy (AAA) |
| `--muted-on-dark`| `#8aa0a6` | **6.89:1**  | labels / meta (AA) |

### Accent family (kept — the mark's petrol/teal)

| Token | Value | Role |
| --- | --- | --- |
| `--teal`        | `#2a9d99` | accent **fills only** (5.74:1 under `--ground`; never body text) |
| `--teal-bright` | `#5fd3cf` | accent text/fills on dark — **10.54:1** |
| `--teal-ink`    | `#0a5a62` | accent text on any remaining light tile — **7.12:1** on `#eef4f4` |

Light "lit" tiles (`--lit: #eef4f4`, `--lit-2: #ffffff`) keep the *old* light
contrast set (verified): `#111a1f` 16.25:1, `#3d474b` 8.79:1, `#5f6c72` 5.00:1.

### Rules / hairlines (dark)

`--hairline: rgba(234,241,242,.10)`, `--line: rgba(234,241,242,.18)`,
`--line-strong: rgba(234,241,242,.30)`. Borders are depth cues only.

### Company themes

The four venture accent themes (saby violet, dari sky, esaal aqua,
trust-flow green) stay. Their `--teal-bright` values must clear 4.5:1 on
`--ground`; each is re-checked in CSS comments. `--teal-ink` becomes irrelevant
on the dark ground, so each theme now also re-derives `--teal-bright` for
dark-ground accent text.

## 2. Typography

**Main lever for "future": widen the display↔body contrast and tighten the
scale.** Keep the two-role system (Newsreader states, Instrument Sans
structures; Amiri / IBM Plex Sans Arabic for RTL).

### Scale (clamped, display end wider)

| Role | Token | Value |
| --- | --- | --- |
| label (wide-tracked) | `--fs-label` | `.8125rem` / 13px |
| body | `--fs-body` | `1.0625rem` / 17px |
| lead | `--fs-lead` | `clamp(1.1875rem, 1.35vw+.75rem, 1.375rem)` |
| h4 | `--fs-h4` | `1.0625rem` |
| h3 | `--fs-h3` | `clamp(1.375rem, 2.1vw+.65rem, 1.75rem)` |
| h2 | `--fs-h2` | `clamp(1.75rem, 3.4vw+.5rem, 2.625rem)` |
| h1 | `--fs-h1` | `clamp(2.125rem, 4.6vw+.5rem, 3.5rem)` |
| hero | `--fs-hero` | `clamp(2.625rem, 6.4vw+.6rem, 5rem)` |

The hero is now a full step larger and wider — the widest contrast to body —
with **variable-weight** treatment (Newsreader 400→600 axis) on the hero line.

### Tracking (size-specific, per apple-design)

- Display (`h1`/`h2`): `-0.02em` → `-0.024em` as size grows.
- Label system: **wide-tracked uppercase** `+0.08em–0.12em`, `uppercase`
  (Latin only; RTL resets tracking to 0 and drops the transform).
- Body: `0`.
- Arabic: `letter-spacing: 0` everywhere (tracking severs joins).

### The label system

Reintroduce a visible uppercase micro-label as the "future" wayfinding device:
eyebrows become **wide-tracked uppercase sans labels** (not italic serif). The
serif stays for display heads only. This is the single biggest typographic
change and is what makes the page read "precise/engineered" instead of "ledger".

## 3. Motion vocabulary (exact values)

All durations/easings are tokens; nothing is invented per-element.

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(.23, 1, .32, 1)` | entrances (strong ease-out) |
| `--ease-in-out` | `cubic-bezier(.77, 0, .175, 1)` | on-screen movement |
| `--ease-expo` | `cubic-bezier(.16, 1, .3, 1)` | hero / large reveals (snappy) |
| `--dur-press` | `140ms` | press feedback (`scale(.975)`) |
| `--dur-ui` | `200ms` | colour/border/hover |
| `--dur-panel` | `240ms` | dropdown / drawer / panel |
| `--dur-reveal` | `560ms` | scroll reveal |
| `--dur-hero` | `820ms` | hero entrance (staggered) |
| `--stagger` | `50ms` | reveal stagger step |

Rules (from emil-design-eng): only `transform`/`opacity` (plus `clip-path` and
the sanctioned `mask`/`filter` on imagery); entrances from `translateY(16px)` +
`opacity:0`, never `scale(0)`; hover gated; `:active` scale on every pressable;
exits faster than entrances. **No bounce, no float, no scroll-jacking** — scroll
effects map 1:1 to scroll position and always end in a complete state.

`prefers-reduced-motion: reduce` → crossfades only; every scroll-driven element
renders its **final, complete state** with no JS involvement.

## 4. Imagery

Corporate stock is unified in CSS (no new stock):

- Petrol duotone: `filter: grayscale(1) contrast(1.06) brightness(.92)` under a
  petrol `multiply` overlay + a teal `screen` edge, tuned per hero.
- Tighter crops via `object-position` (already art-directed) + a subtle
  `mask-image` vignette.
- Grain: an inline SVG `feTurbulence` data-URI at ~5% opacity over imagery.
- Venture marks stay on **lit white tiles** (their ink is dark-alpha; they are
  the "lit" objects on the dark ground).

## 5. Home-page scroll narrative (beat by beat)

The home page becomes a narrative, not a stack of equal sections.

1. **Hero — pinned & resolving.** The hero section pins (`position: sticky`) for
   its first viewport of scroll. On load the headline enters as one staggered
   group (label → h1 → lead → actions, 50ms steps, `--dur-hero`). As the user
   scrolls, the headline **tightens** (tracking −0.024em → −0.01em, weight
   600→520) and the photograph **zooms slightly and darkens** (scale 1→1.06),
   resolving into the thesis. Implemented via rAF scroll progress, disabled
   under reduced-motion.
2. **Assembly band.** A full-width dark band carries an inline SVG
   "constellation": 7 nodes that connect with stroke lines as scroll progress
   runs 0→1 (`stroke-dashoffset` driven by progress; nodes pop in at their own
   progress threshold). Under the visual, the thesis sentence ("Innovation With
   Purpose…") sits. Static-complete at progress 0 for reduced-motion / no-JS.
3. **Three focus areas — horizontal chapter strip.** On ≥1024px the three
   pillars become a horizontal chapter strip (CSS `scroll-snap` horizontal, or
   a pinned panel that advances chapter-by-chapter via scroll progress). On
   mobile/tablet they stack vertically. Each chapter: number, name, blurb, and
   its company cards.
4. **Scale/zoom into ventures.** The ventures grid section enters with a
   `scale(.96)→1` + `opacity` transition triggered at the threshold — a
   deliberate "zoom in" that escalates from the strip. Reduced-motion: static.

Every beat is progressive enhancement: `site.js` adds `.js`, and with
`prefers-reduced-motion` or no IntersectionObserver the page is fully static
and complete.

## 6. What is NOT changing

- All nine pages and both locales; every URL, slug, nav item, and heading.
- All copy (English + Arabic) and every real, sourced number (InPipe runtime /
  availability / site deployments; Esaal receipts / opt-in / open / CTR).
- No fabricated statistics, clients, logos, awards, testimonials, or growth
  claims — momentum is carried by type, layout, colour, imagery, and motion.
- The build pipeline (`source → build-site.js → site`), the theme system, the
  RTL architecture, and the no-runtime-dependency rule (static HTML/CSS/JS).
- Dari remains "In development — coming soon".

## 7. Verification matrix

- `node verify.js` — links, nav, locales, sitemap, JSON-LD.
- Playwright/Chromium: every page × {en, ar} × {360×800, 390×844, 768×1024,
  1440×900} — no console errors, no 404s, no broken images, no horizontal
  overflow, correct `dir`, keyboard-reachable nav, reduced-motion renders the
  full page.
- Contrast: the token table above is the computed record (WebAIM formula).
