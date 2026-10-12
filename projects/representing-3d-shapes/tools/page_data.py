"""Fold run_all.py output (results.json, viewer.json) into artifact_data.json, the per-aircraft data the page embeds."""
import json
import numpy as np

CURVES = ("walk_biased", "spiral_XYZ", "blobs_spliced", "crit_spliced")
SWEEPS = ("walk_pure", "walk_biased", "spiral_XY", "spiral_XYZ", "blobs_spliced", "crit_spliced")
LOOPSETS = {"blobs_axis": "loops", "blobs_crit": "loops_crit"}     # results key -> page key
MAX_H = 3000           # harmonics shipped per single curve
N_GHOST = 2500         # surface points shown behind the wire

r4 = lambda x: np.round(np.asarray(x, float), 4).tolist()
chain = lambda c, n=None: dict(r0=r4(c["r0"]), A=r4(c["A"][:n]), B=r4(c["B"][:n]), **({"x": 1} if c.get("x") else {}))

R, V = (json.load(open(f)) for f in ("results.json", "viewer.json"))
D = {}
for name, v in V.items():
    r = R[name]
    D[name] = dict(
        ghost=v["ghost"][:N_GHOST],
        curves={k: chain(v[k], MAX_H) for k in CURVES},
        events=v["events"],
        n95={k: r[k]["n95"] for k in LOOPSETS},
        sweeps={k: [[s["N"], s["params"], s["cov"], s["onsurf"]] for s in r[k]["sweep"]] for k in SWEEPS},
        # loop sets: [params, coverage at eps, coverage at eps/2] after each shipped loop
        greedy=dict({k: r[k]["dense"] for k in LOOPSETS}, **{k: r[k]["curve"] for k in ("blobs_tilted", "blobs_both")}),
        stats={k: {a: b for a, b in x.items() if a not in ("sweep", "curve", "dense")} for k, x in r.items()},
        **{page: [chain(c) for c in v[k]] for k, page in LOOPSETS.items()})
    print(name, {page: len(D[name][page]) for page in LOOPSETS.values()}, "loops")
json.dump(D, open("artifact_data.json", "w"), separators=(",", ":"))
