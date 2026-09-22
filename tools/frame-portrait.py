#!/usr/bin/env python3
"""Fit a portrait into the site's leadership-card frame: cover-crop to the
target canvas, round the corners, draw the teal ring border — matching the
existing team/advisor cards (measured from team-jernej.webp / advisor-alenzi.webp)."""
import sys, json
from PIL import Image, ImageDraw

BORDER = (33, 117, 130, 255)   # measured ring colour
RADIUS = 28
RING = 9

def process(src, dst, canvas_w, canvas_h, top_frac=0.15, zoom=1.0):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    scale = max(canvas_w / w, canvas_h / h) * zoom
    sw, sh = round(w * scale), round(h * scale)
    im = im.resize((sw, sh), Image.LANCZOS)
    excess_x, excess_y = sw - canvas_w, sh - canvas_h
    left = round(excess_x * 0.5)
    top = round(excess_y * top_frac)
    im = im.crop((left, top, left + canvas_w, top + canvas_h))

    # Rounded-rect alpha mask, supersampled for a clean edge.
    S = 4
    mask = Image.new('L', (canvas_w * S, canvas_h * S), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, canvas_w * S - 1, canvas_h * S - 1), radius=RADIUS * S, fill=255)
    mask = mask.resize((canvas_w, canvas_h), Image.LANCZOS)

    out = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)

    # Teal ring: same rounded rect, stroked, drawn on top.
    ring = Image.new('RGBA', (canvas_w * S, canvas_h * S), (0, 0, 0, 0))
    ImageDraw.Draw(ring).rounded_rectangle(
        (RING * S // 2, RING * S // 2, canvas_w * S - RING * S // 2 - 1, canvas_h * S - RING * S // 2 - 1),
        radius=(RADIUS - RING // 2) * S, outline=BORDER, width=RING * S)
    ring = ring.resize((canvas_w, canvas_h), Image.LANCZOS)
    out.alpha_composite(ring)

    out.save(dst, 'WEBP', quality=88)
    print('wrote', dst, out.size)

JOBS = json.loads(sys.argv[1])
for j in JOBS:
    process(**j)
