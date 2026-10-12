"""Run all three approaches on all four aircraft; write results.json (stats) and viewer.json (coefficients)."""
import json, os, sys, time
import numpy as np
import trimesh
from scipy.spatial import cKDTree
import core, walk, spiral, blobs

SPACING = 2 * core.EPS
NGRID = [10, 20, 40, 70, 100, 150, 200, 300, 450, 700, 1000, 1500, 2000, 3000]
VIEW_MAX_H = 3000           # harmonics shipped to the viewer per single curve
MAX_LOOPS = 200             # loops shipped to the viewer per loop set


def locality(c, M=4096):
    """How far apart in space are points that are close in time?  Radius of gyration (bbox diagonals)
    of the points inside a time window, median over windows, for 1% and 5% of the period;
    "all" is the same figure for the whole curve, i.e. what an unrelated set of points would give.
    far5 / gap answer the reverse: share of points with a spatial neighbour more than 5% of the period
    away, and the median time gap to the farthest spatial neighbour."""
    r = core.arclen_resample(c, M)
    rg = lambda x: float(np.sqrt(((x - x.mean(0)) ** 2).sum(1).mean()))
    out = {"all": round(rg(r), 4)}
    for w in (0.01, 0.05):
        k = int(w * M)
        out[f"{int(w * 100)}"] = round(float(np.median([rg(np.roll(r, -s, 0)[:k]) for s in range(0, M, k // 2)])), 4)
    # the reverse question: for each point, how far away in time is its farthest neighbour within 2 eps?
    pr = cKDTree(r).query_pairs(2 * core.EPS, output_type="ndarray")
    d = np.abs(pr[:, 0] - pr[:, 1]); d = np.minimum(d, M - d) / M
    far = np.zeros(M); np.maximum.at(far, pr[:, 0], d); np.maximum.at(far, pr[:, 1], d)
    out.update(far5=round(float((far > 0.05).mean()), 4), gap=round(float(np.median(far)), 4))
    return out


def one_chain(sel, label):
    """Splice loops into ONE continuous curve and refit it as a single series.  bridge = wire spent
    walking out and back between loops, in bbox diagonals."""
    parts = [core.arclen_resample(c["rec"], 256) for c in sel]
    one = core.splice(parts)
    r, coef = sweep(cov, one, label)
    r.update(loops=len(sel), bridge=round(core.length(one) - sum(core.length(p) for p in parts), 3))
    return r, pack(*coef, VIEW_MAX_H)


def sweep(cov, c, label):
    M = 2 * (len(c) // 2)
    r0, A, B = core.fourier3(c, M)
    rows = []
    for N in NGRID:
        if N > len(A):
            break
        rec = core.synth(r0, A, B, np.arange(N), max(8 * N, 4000))
        rows.append(dict(N=N, params=core.n_params(N), cov=round(cov.frac(rec), 4),
                         onsurf=round(cov.on_surface(rec), 4)))
    print(f"   {label}: raw cov {cov.frac(c):.3f}, len {core.length(c):.1f}, "
          + " ".join(f"{r['params']}:{r['cov']:.2f}" for r in rows))
    return dict(raw_cov=round(cov.frac(c), 4), raw_onsurf=round(cov.on_surface(c), 4),
                length=round(core.length(c), 2), harmonics=len(A), sweep=rows, local=locality(c)), (r0, A, B)


def pack(r0, A, B, n):
    n = min(n, len(A))
    return dict(r0=np.round(r0, 4).tolist(), A=np.round(A[:n], 5).tolist(), B=np.round(B[:n], 5).tolist())


def loop_set(C, ch, cur, n):
    """Stats and viewer loops for one greedy loop sequence ch over candidates C.  After coverage at
    eps saturates the sequence is carried on to MAX_LOOPS against eps/2, which tightens the spacing."""
    on = cov.on_surface([C[i]["rec"] for i in ch])
    k95 = int(np.searchsorted(cur[1:, 1], 0.95) + 1)                 # loops needed for 95%
    full, _ = blobs.greedy(C, n, stop=1.0, key="hit2", chosen=ch, max_n=MAX_LOOPS)
    tr = blobs.trace(C, full, n)
    R = dict(loops=len(ch), final_cov=round(cur[-1, 1], 4), onsurf=round(on, 4),
             p80=at(cur, .8), p90=at(cur, .9), p95=at(cur, .95), n95=k95,
             curve=[[int(a), round(b, 4)] for a, b in cur],
             dense=[[int(a), round(b, 4), round(c, 4)] for a, b, c in tr],
             harm_hist=np.bincount([C[i]["N"] for i in ch]).tolist(),
             pieces95=blobs.components([C[i]["rec"] for i in ch[:k95]], core.EPS))
    V = [dict(pack(C[i]["r0"], C[i]["A"], C[i]["B"], C[i]["N"]), **({"x": 1} if C[i].get("x") else {})) for i in full]
    return R, V


def at(curve, f):
    k = np.searchsorted(curve[:, 1], f)
    return int(curve[k, 0]) if k < len(curve) else None


# optional model names on the command line; other models keep their saved results
load = lambda f: json.load(open(f)) if os.path.exists(f) else {}
results, viewer = load("results.json"), load("viewer.json")
for name in sys.argv[1:] or core.MODELS:
    t0 = time.time()
    m = core.load(name)
    cov = core.Coverage(m)
    cov2 = core.Coverage(m, eps=core.EPS / 2)       # same skin samples, half the paint radius
    S = walk.Surface(m)
    R, V = {}, {}
    print(name)

    # ---- approach 1: random walks
    for bias in (False, True):
        p, hist = walk.random_walk(m, cov, target=0.9, bias=bias, surf=S, max_steps=80000)
        lab = "walk_biased" if bias else "walk_pure"
        R[lab], coef = sweep(cov, p, lab)
        R[lab]["steps"] = len(p)
        if bias:
            V[lab] = pack(*coef, VIEW_MAX_H)

    # ---- approach 2: spirals
    for axes in (("X", "Y"), ("X", "Y", "Z")):
        c, parts = spiral.build(m, SPACING, axes)
        lab = "spiral_" + "".join(axes)
        R[lab], coef = sweep(cov, c, lab)
        if len(axes) == 3:
            V[lab] = pack(*coef, VIEW_MAX_H)

    # ---- approach 3: blob loops (separate chains), greedy selection
    n = len(cov.P)
    ax = blobs.candidates(m, cov, np.eye(3), SPACING, cov2=cov2)
    mid = blobs.candidates(m, cov, np.eye(3), SPACING, cov2=cov2, phase=SPACING)    # planes halfway between
    ob = blobs.candidates(m, cov, blobs.fib_dirs(24), SPACING)
    for lab, C in (("blobs_tilted", ob), ("blobs_both", ax + ob)):
        ch, cur = blobs.greedy(C, n)
        on = cov.on_surface([C[i]["rec"] for i in ch])
        R[lab] = dict(loops=len(ch), final_cov=round(cur[-1, 1], 4), onsurf=round(on, 4),
                      p80=at(cur, .8), p90=at(cur, .9), p95=at(cur, .95),
                      curve=[[int(a), round(b, 4)] for a, b in cur],
                      harm_hist=np.bincount([C[i]["N"] for i in ch]).tolist())
        print(f"   {lab}: {len(ch)} loops, params@80/90/95 {R[lab]['p80']}/{R[lab]['p90']}/{R[lab]['p95']}")

    ch, cur = blobs.greedy(ax, n)
    R["blobs_axis"], V["blobs_axis"] = loop_set(ax + mid, ch, cur, n)
    R["blobs_spliced"], V["blobs_spliced"] = one_chain([ax[i] for i in ch[: R["blobs_axis"]["n95"]]], "blobs_spliced")

    # ---- approach 3 with the crossing rule: a 90-degree loop through every saddle and extremum
    ev = blobs.critical_events(m, SPACING)
    xc = blobs.crossings(m, cov, ev, SPACING, cov2=cov2)
    C = ax + xc
    must = blobs.forced(C, n)
    ch, cur = blobs.greedy(C, n, chosen=must)
    R["blobs_crit"], V["blobs_crit"] = loop_set(C + mid, ch, cur, n)
    R["crit_spliced"], V["crit_spliced"] = one_chain([C[i] for i in ch[: R["blobs_crit"]["n95"]]], "crit_spliced")
    served = set().union(*(c["events"] for c in xc)) if xc else set()
    R["blobs_crit"].update(events=len(ev), extrema=sum(e["kind"] == "ext" for e in ev),
                           saddles=sum(e["kind"] == "sad" for e in ev), served=len(served),
                           forced=len(must), forced_params=int(sum(C[i]["cost"] for i in must)),
                           forced_cov=round(float(cur[len(must), 1]), 4))
    V["events"] = [np.round(e["p"], 4).tolist() + [int(e["kind"] == "sad")] for e in ev]
    ch, cur = blobs.greedy(C, n)                    # crossings merely offered, not required
    R["blobs_offered"] = dict(loops=len(ch), final_cov=round(cur[-1, 1], 4), p80=at(cur, .8), p90=at(cur, .9),
                              p95=at(cur, .95), crossings_taken=int(sum(1 for i in ch if C[i].get("x"))),
                              crossings_offered=len(xc))
    for lab in ("blobs_axis", "blobs_crit", "blobs_offered"):
        r = R[lab]
        print(f"   {lab}: {r['loops']} loops, params@80/90/95 {r['p80']}/{r['p90']}/{r['p95']}, final {r['final_cov']}"
              + (f", pieces@95 {r['pieces95']}, dense end {r['dense'][-1]}" if "dense" in r else f", crossings taken {r['crossings_taken']}/{r['crossings_offered']}")
              + (f", events {r['extrema']} ext + {r['saddles']} sad, forced {r['forced']} loops / {r['forced_params']} params -> {r['forced_cov']}" if "events" in r else ""))

    P, _ = trimesh.sample.sample_surface(m, 4000, seed=3)
    V["ghost"] = np.round(np.asarray(P), 3).tolist()
    results[name], viewer[name] = R, V
    print(f"   ({time.time() - t0:.0f}s)")
    json.dump(results, open("results.json", "w"))
    json.dump(viewer, open("viewer.json", "w"), separators=(",", ":"))
