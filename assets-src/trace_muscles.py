#!/usr/bin/env python3
"""Trace the user's muscle-map bitmap into clean SVG paths.

Pipeline: color-segment the source image, label each muscle zone,
vectorize every zone with potrace, and emit one SVG per figure
(face / back) with per-muscle paths in image coordinates.
Outputs a JSON manifest with component metadata (centroid, bbox,
state in the source image) used to assign muscle-group ids.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = os.path.join(os.path.dirname(__file__), "seance-a_0.webp")
OUT_DIR = os.path.dirname(__file__)
CROP_Y = (200, 1560)  # keep figures only: title above, labels/legend below
MIN_AREA = 160
FIGURE_SPLIT_X = 600

def masks(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    maxc = a.max(axis=2)
    minc = a.min(axis=2)
    sat = maxc - minc
    orange = (R - B > 35) & (R > 80) & (G > B)
    bright = orange & (R > 185)
    grayish = sat < 14
    pec = grayish & (maxc > 55) & (maxc < 100)
    outline = grayish & (maxc >= 100) & (maxc < 200)
    return orange, bright, pec, outline

def potrace_path(mask, turdsize=8):
    """Vectorize a binary mask; return list of absolute-coordinate path strings."""
    h, w = mask.shape
    with tempfile.TemporaryDirectory() as td:
        pbm = os.path.join(td, "m.pbm")
        svg = os.path.join(td, "m.svg")
        Image.fromarray(((~mask) * 255).astype(np.uint8)).convert("1").save(pbm)
        subprocess.run(
            ["potrace", "-b", "svg", "-t", str(turdsize), "-a", "1.0",
             "-O", "0.4", "-o", svg, pbm],
            check=True, capture_output=True)
        text = open(svg).read()
    m = re.search(r'translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+),([-\d.]+)\)', text)
    tx, ty, sx, sy = (float(g) for g in m.groups())
    paths = []
    for d in re.findall(r'<path d="([^"]+)"', text):
        paths.append(transform_potrace_d(d, tx, ty, sx, sy))
    return paths

def transform_potrace_d(d, tx, ty, sx, sy):
    """Apply potrace's group transform to its M/c/l/z path data."""
    tokens = re.findall(r'[MmCcLlZz]|-?[\d.]+', d)
    out = []
    i = 0
    cmd = None
    while i < len(tokens):
        t = tokens[i]
        if t in "MmCcLlZz":
            cmd = t
            i += 1
            if cmd in "Zz":
                out.append("Z")
            continue
        if cmd == "M":
            x, y = float(tokens[i]), float(tokens[i + 1])
            out.append(f"M{tx + sx * x:.1f},{ty + sy * y:.1f}")
            i += 2
            cmd = "l"  # potrace: implicit relative lineto after M
        elif cmd == "m":
            x, y = float(tokens[i]), float(tokens[i + 1])
            out.append(f"m{sx * x:.1f},{sy * y:.1f}")
            i += 2
            cmd = "l"
        elif cmd == "c":
            vals = [float(tokens[i + k]) for k in range(6)]
            seg = []
            for k in range(0, 6, 2):
                seg.append(f"{sx * vals[k]:.1f},{sy * vals[k + 1]:.1f}")
            out.append("c" + " ".join(seg))
            i += 6
        elif cmd == "l":
            x, y = float(tokens[i]), float(tokens[i + 1])
            out.append(f"l{sx * x:.1f},{sy * y:.1f}")
            i += 2
        else:
            raise ValueError(f"unhandled potrace command {cmd}")
    return "".join(out)

def main():
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    orange, bright, pec, outline = masks(a)

    keep = np.zeros((h, w), bool)
    keep[CROP_Y[0]:CROP_Y[1], :] = True
    orange &= keep
    bright &= keep
    pec &= keep
    outline &= keep

    # Pec plates: keep only large components whose centroid sits below the neck zone
    pec_l, n = ndimage.label(pec)
    pec_keep = np.zeros_like(pec)
    for i in range(1, n + 1):
        comp = pec_l == i
        area = int(comp.sum())
        cy = ndimage.center_of_mass(comp)[0]
        if area > 1200 and cy > 430:
            pec_keep |= comp
    muscles = orange | pec_keep

    # Solidify: close small gaps, fill interior gradient holes
    muscles = ndimage.binary_closing(muscles, np.ones((3, 3)))
    muscles = ndimage.binary_fill_holes(muscles)

    # Body silhouette: close the outline and fill it
    fat = ndimage.binary_dilation(outline, np.ones((5, 5)))
    body = ndimage.binary_fill_holes(fat)
    body = ndimage.binary_erosion(body, np.ones((3, 3)))
    body |= muscles

    labels, n = ndimage.label(muscles, np.ones((3, 3)))
    manifest = {"figures": {}}
    for fig, (x0, x1) in (("face", (0, FIGURE_SPLIT_X)), ("dos", (FIGURE_SPLIT_X, w))):
        fig_body = body.copy()
        fig_body[:, :x0] = False
        fig_body[:, x1:] = False
        # keep the largest body component (drops stray text remnants)
        bl, bn = ndimage.label(fig_body)
        if bn > 1:
            sizes = ndimage.sum(fig_body, bl, range(1, bn + 1))
            fig_body = bl == (1 + int(np.argmax(sizes)))
        body_paths = potrace_path(fig_body, turdsize=50)
        comps = []
        for i in range(1, n + 1):
            comp = labels == i
            ys, xs = np.where(comp)
            if xs.mean() < x0 or xs.mean() >= x1 or len(xs) < MIN_AREA:
                continue
            state = "bright" if bright[comp].mean() > 0.35 else ("pec" if pec_keep[comp].mean() > 0.5 else "dark")
            paths = potrace_path(comp)
            comps.append({
                "id": i,
                "state": state,
                "area": int(len(xs)),
                "centroid": [round(float(xs.mean()), 1), round(float(ys.mean()), 1)],
                "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
                "paths": paths,
            })
        comps.sort(key=lambda c: (c["centroid"][1], c["centroid"][0]))
        manifest["figures"][fig] = {"body": body_paths, "components": comps}
        print(fig, "body subpaths:", len(body_paths), "muscle components:", len(comps))

    with open(os.path.join(OUT_DIR, "traced.json"), "w") as f:
        json.dump(manifest, f)
    print("wrote traced.json")

if __name__ == "__main__":
    sys.exit(main())
