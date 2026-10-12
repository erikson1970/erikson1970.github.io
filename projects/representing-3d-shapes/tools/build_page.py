"""Build the page from page_template.html and the result files.
  python build_page.py artifact out.html     body-only page for a claude.ai artifact (files linked on the site)
  python build_page.py site out/index.html   standalone page; expects stl/ and scad/ beside it"""
import json, sys
import numpy as np, DracoPy

mode, dst = sys.argv[1:3]
SITE = "https://erikson1970.github.io/projects/representing-3d-shapes/"
SCAD = {"A319": dict(bytes=981, gz=499, note="95.7% / 93.3%"),          # recall / precision, rendered with OpenSCAD
        "B17": dict(bytes=3360, gz=968, note="49.1% / 52.6% · not fitted"),
        "KingAir": dict(bytes=4878, gz=1570, note="100% / 100% · STL's own source")}
ORDER = ["A319", "B17", "PD808", "Simple", "KingAir"]

D0, sizes, prec = (json.load(open(f)) for f in ("artifact_data.json", "sizes.json", "precision.json"))
D = {}
for n in ORDER:
    m = D[n] = D0[n]
    m["sizes"], m["prec"], m["scad"], m["draco"] = sizes[n], prec[n], SCAD.get(n), {}
    for tag in ("hi", "scad"):                   # the decimated meshes, as the Draco decoder returns them
        d = DracoPy.decode(open(f"draco/{n}_{tag}.drc", "rb").read())
        z = sizes[n][f"decim_draco_{tag}"]
        m["draco"][tag] = dict(v=np.round(np.asarray(d.points), 4).tolist(), f=np.asarray(d.faces).reshape(-1, 3).tolist(),
                               faces=z["faces"], bytes=z["bytes"], q=z["q"], rp=z["rp"])

h = open("page_template.html").read()
assert h.count("/*DATA*/null") == 1
h = h.replace("/*DATA*/null", json.dumps(D, separators=(",", ":")))
if mode == "site":
    for old, new in (("<title>Epicycle Airframes</title>\n", ""),
                     ("<header>\n", '<header>\n  <a class="eyebrow" href="../../">← erikson1970</a>\n'),
                     ('<a href="{{BASE}}', '<a download href="')):
        assert old in h, old
        h = h.replace(old, new)
    h = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Representing 3D shapes: Epicycles vs wires vs mesh</title>
<meta name="description" content="Five aircraft described three ways: 3D Fourier epicycle wireframes, compressed triangle meshes, and OpenSCAD scripts, compared byte for byte at the same accuracy.">
<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
''' + h + "</body>\n</html>\n"
else:
    h = h.replace("{{BASE}}", SITE)
assert "{{" not in h
open(dst, "w").write(h)
print(dst, len(h), "bytes")
