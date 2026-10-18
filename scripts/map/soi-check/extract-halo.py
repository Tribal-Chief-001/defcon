"""Extract the orange international-boundary halo strokes from the Survey of India political map SVG.

Usage: python3 -I extract-halo.py polmap.svg halo.json
The SVG comes from:  pdftocairo -svg POLMAP_ENGLISH-2026.pdf polmap.svg
Output: a list of stroked paths, each a list of subpaths of [x, y] in the path's own coordinates.
The paths carry transform matrix(0.999552, 0, 0, -0.999552, -4.080142, 2570.807529); register.mjs applies it.
"""
import json
import re
import sys

HALO = 'rgb(97.810364%, 69.889832%, 53.57666%)'  # boundary halo colour in the 13th edition (2026)
svg = open(sys.argv[1], encoding='utf8', errors='ignore').read()
out = []
for m in re.finditer(r'<path\b([^>]*?)/?>', svg, re.S):
    a = m.group(1)
    if HALO not in a or 'stroke-width="5.1024"' not in a:
        continue
    d = re.search(r'\bd="([^"]*)"', a).group(1)
    subs = []
    for sp in re.split(r'(?=M )', d):
        nums = [float(x) for x in re.findall(r'-?\d+\.?\d*', sp)]
        if len(nums) >= 4:
            subs.append([[nums[i], nums[i + 1]] for i in range(0, len(nums) - 1, 2)])
    out.append(subs)
json.dump(out, open(sys.argv[2], 'w'))
print(f'{len(out)} stroked halo paths, {sum(len(s) for p in out for s in p)} points')
