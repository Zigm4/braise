#!/usr/bin/env python3
"""Inject the traced muscle data into the interactive POC template."""
import json
import os

HERE = os.path.dirname(__file__)
TEMPLATE = os.path.join(HERE, "poc-template.html")
OUT = "/private/tmp/claude-501/-Users-overthecloud-Documents-Dev-Kettlebells/2545848f-f2e9-4a61-9d20-09991646d12f/scratchpad/braise-map-poc.html"
PROJECT_COPY = os.path.join(os.path.dirname(HERE), "poc-carte-musculaire.html")

data = json.load(open(os.path.join(HERE, "traced.json")))
muscles = open(os.path.join(HERE, "muscles-data.js")).read()
html = open(TEMPLATE).read()
html = html.replace("/*__MUSCLES__*/", muscles)
open(OUT, "w").write(html)
open(PROJECT_COPY, "w").write(html)
print("wrote", OUT, "and", PROJECT_COPY, len(html), "bytes")
