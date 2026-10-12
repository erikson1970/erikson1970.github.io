"""Coefficient precision: what float32 -> float16 (and fixed-point) does to wire bytes and coverage.
Reads the coefficients the viewer ships (artifact_data.json) and re-scores every encoding against the mesh."""
import gzip, json, os, sys
import numpy as np
import core

FLOATS = {"f64": np.float64, "f32": np.float32, "f16": np.float16}
STEPS = [core.EPS / 2 ** k for k in range(0, 9)]     # fixed-point steps tried, coarsest first
LOOPS = {"blobs_axis": "loops", "blobs_crit": "loops_crit"}   # loop-set methods -> key in the page data
TOL = 0.005                                          # coverage / on-skin loss allowed when picking a step


def chains(m, method):
    """The wire at the operating point the size table uses: list of (r0, A, B)."""
    if method in LOOPS:                              # the loops that reach 95% coverage
        return [(np.array(L["r0"]), np.array(L["A"]), np.array(L["B"])) for L in m[LOOPS[method]][:m["n95"][method]]]
    c = m["curves"][method]
    ok = [r[0] for r in m["sweeps"][method] if r[2] >= 0.85 and r[0] <= len(c["A"])]
    if not ok:
        return None
    N = ok[0]                                        # smallest swept N reaching 85%
    return [(np.array(c["r0"]), np.array(c["A"])[:N], np.array(c["B"])[:N])]


def flat(ch):
    return np.concatenate([np.concatenate([r0, A.ravel(), B.ravel()]) for r0, A, B in ch])


def unflat(x, ch):
    out, i = [], 0
    for r0, A, B in ch:
        n = A.size
        out.append((x[i:i + 3], x[i + 3:i + 3 + n].reshape(A.shape), x[i + 3 + n:i + 3 + 2 * n].reshape(B.shape)))
        i += 3 + 2 * n
    return out


def score(cov, ch):
    recs = [core.synth(r0, A, B, np.arange(len(A)), max(64, 8 * len(A), 4000 if len(ch) == 1 else 0))
            for r0, A, B in ch]
    return float(cov.frac(recs)), float(cov.on_surface(recs))


def header(ch):
    """Harmonic count per chain, so a decoder can split the stream."""
    return np.array([len(A) for _, A, _ in ch], np.uint16 if len(ch) == 1 else np.uint8).tobytes()


def fixed(x, step):
    """Uniform quantization to integer multiples of step, stored at the narrowest width that fits."""
    q = np.round(x / step).astype(np.int64)
    return q, q.astype(np.int8 if np.abs(q).max() < 128 else np.int16).tobytes()


if __name__ == "__main__":
    D = json.load(open("artifact_data.json"))
    out = json.load(open("precision.json")) if os.path.exists("precision.json") else {}
    for name in sys.argv[1:] or core.MODELS:         # optional model names on the command line
        cov = core.Coverage(core.load(name))
        out[name] = {}
        for method in ("blobs_axis", "blobs_crit", "blobs_spliced", "crit_spliced", "walk_biased", "spiral_XYZ"):
            ch = chains(D[name], method)
            if ch is None:
                continue
            x, h = flat(ch), header(ch)
            R = dict(params=len(x), chains=len(ch))
            for tag, dt in FLOATS.items():
                b = h + x.astype(dt).tobytes()
                c, on = score(cov, unflat(x.astype(dt).astype(float), ch))
                R[tag] = dict(bytes=len(b), gz=len(gzip.compress(b, 9)), cov=round(c, 4), onsurf=round(on, 4))
            for step in STEPS:                       # coarsest step that keeps coverage
                q, b = fixed(x, step)
                c, on = score(cov, unflat(q * step, ch))
                if c >= R["f64"]["cov"] - TOL and on >= R["f64"]["onsurf"] - TOL:
                    R["fixed"] = dict(step=step, bytes=len(h) + len(b), gz=len(gzip.compress(h + b, 9)),
                                      cov=round(c, 4), onsurf=round(on, 4))
                    break
            out[name][method] = R
            print(name, method, R["params"], *(f"{k}:{R[k]['bytes']}/{R[k]['gz']}B cov {R[k]['cov']:.3f}"
                                               for k in ("f32", "f16", "fixed") if k in R))
    json.dump(out, open("precision.json", "w"), indent=1)
