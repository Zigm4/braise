#!/usr/bin/env python3
"""Assemble the cleaned muscle-map SVGs from traced.json.

Assigns every traced component to one of the 15 muscle groups and emits:
- muscles-face.svg / muscles-dos.svg : neutral cleaned figures
- muscles-data.js : JS data module used by the interactive map (POC and app)
"""
import json
import os

OUT = os.path.dirname(__file__)
VIEWBOX = {"face": "90 200 480 1360", "dos": "630 200 480 1360"}

GROUPS = {
    "face": {
        "trapezes": [1, 2], "epaules": [6, 7], "pectoraux": [8, 9],
        "biceps": [12, 13], "avant_bras": [20, 21],
        "abdominaux": [16, 17, 25, 26, 29, 30], "obliques": [18, 19, 27, 28],
        "quadriceps": [33, 34, 35, 36], "adducteurs": [37, 38],
        "mollets": [41, 42, 43, 44],
    },
    "dos": {
        "trapezes": [3], "epaules": [4, 5], "triceps": [14, 15],
        "avant_bras": [23, 24], "dorsaux": [10, 11], "lombaires": [22],
        "fessiers": [31, 32], "ischios": [39, 40], "mollets": [45, 46],
    },
}

BODY_FILL = "#1a1a1e"
BODY_STROKE = "#8f8f96"
MUSCLE_FILL = "#26262b"
MUSCLE_STROKE = "#38383f"

def main():
    manifest = json.load(open(os.path.join(OUT, "traced.json")))
    data = {}
    for fig, groups in GROUPS.items():
        figure = manifest["figures"][fig]
        by_id = {c["id"]: c for c in figure["components"]}
        assigned = [i for ids in groups.values() for i in ids]
        missing = [i for i in assigned if i not in by_id]
        extra = [c["id"] for c in figure["components"] if c["id"] not in assigned]
        if missing or extra:
            raise SystemExit(f"{fig}: missing={missing} unassigned={extra}")
        entry = {"viewBox": VIEWBOX[fig], "body": figure["body"], "groups": {}, "states": {}}
        for group, ids in groups.items():
            entry["groups"][group] = [p for i in ids for p in by_id[i]["paths"]]
            states = {by_id[i]["state"] for i in ids}
            entry["states"][group] = sorted(states)
        data[fig] = entry

        svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VIEWBOX[fig]}">']
        for d in figure["body"]:
            svg.append(f'  <path d="{d}" fill="{BODY_FILL}" stroke="{BODY_STROKE}" stroke-width="2.6"/>')
        for group, ids in groups.items():
            svg.append(f'  <g id="{group}">')
            for i in ids:
                for d in by_id[i]["paths"]:
                    svg.append(f'    <path d="{d}" fill="{MUSCLE_FILL}" stroke="{MUSCLE_STROKE}" stroke-width="1.5"/>')
            svg.append("  </g>")
        svg.append("</svg>")
        path = os.path.join(OUT, f"muscles-{fig}.svg")
        open(path, "w").write("\n".join(svg))
        print("wrote", path, f"({len(figure['components'])} zones)")

    js = "const MUSCLES = " + json.dumps(data) + ";\n"
    open(os.path.join(OUT, "muscles-data.js"), "w").write(js)
    print("wrote muscles-data.js", len(js), "bytes")

if __name__ == "__main__":
    main()
