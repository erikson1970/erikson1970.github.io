"""Coordinate-search fit of the declarative A319 parameters to the real mesh (maximize recall+precision)."""
import copy, json, time
import numpy as np, trimesh
from scipy.spatial import cKDTree
import core, declarative as D

m = core.load("A319"); cov = core.Coverage(m)

def score(p, n=20000):
    try:
        d = D.build(p)
    except Exception:
        return -1, 0, 0
    Q, _ = trimesh.sample.sample_surface(d, n, seed=2)
    rec = (cKDTree(Q).query(cov.P)[0] < core.EPS).mean()
    prec = (cov.dense.query(Q)[0] < core.EPS).mean()
    return rec + prec, rec, prec

def flat(p):
    keys = []
    for a, v in p.items():
        for b, w in v.items():
            if isinstance(w, tuple):
                keys += [(a, b, i) for i in range(len(w))]
            else:
                keys.append((a, b, None))
    return keys

def get(p, k):
    a, b, i = k
    return p[a][b] if i is None else p[a][b][i]

def put(p, k, x):
    a, b, i = k
    if i is None:
        p[a][b] = x
    else:
        t = list(p[a][b]); t[i] = x; p[a][b] = tuple(t)

p = copy.deepcopy(D.P); best = score(p); print("start", np.round(best, 3))
keys = flat(p); rng = np.random.default_rng(0); t0 = time.time()
step = 0.006
for sweep in range(3):
    for k in rng.permutation(len(keys)):
        k = keys[k]
        for sgn in (1, -1):
            q = copy.deepcopy(p); put(q, k, round(get(q, k) + sgn * step, 4))
            s = score(q)
            if s[0] > best[0] + 1e-3:
                p, best = q, s
                break
    step /= 2
    print("sweep", sweep, np.round(best, 3), f"{time.time()-t0:.0f}s")
json.dump(p, open("a319_fit.json", "w"))
src = D.scad_source(p); open("a319.scad", "w").write(src)
print("final (60k samples)", np.round(score(p, 60000), 3), len(src.encode()), "bytes")
