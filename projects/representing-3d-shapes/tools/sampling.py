"""How fast is "points on the surface" from each representation?  Draw N points from the mesh
(area-weighted triangles), from the slice loops, and from a single-curve series at random
times and at evenly spaced times (one inverse FFT), and check how many land on the skin."""
import json, time
import numpy as np, trimesh
import core, precision

N = 100_000
rng = np.random.default_rng(0)


def best(f, reps=3):
    t = []
    for _ in range(reps):
        t0 = time.perf_counter(); out = f(); t.append(time.perf_counter() - t0)
    return min(t), out


def direct(r0, A, B, t, chunk=2000):
    """Sum the series at arbitrary times: cost grows with points x harmonics."""
    k = np.arange(1, len(A) + 1)
    out = np.empty((len(t), 3))
    for i in range(0, len(t), chunk):
        ph = np.outer(t[i:i + chunk], k)
        out[i:i + chunk] = r0 + np.cos(ph) @ A + np.sin(ph) @ B
    return out


def even(r0, A, B, n):
    """n evenly spaced times in one inverse FFT: cost barely depends on the harmonic count."""
    F = np.zeros((n // 2 + 1, 3), complex)
    F[0] = r0
    F[1:len(A) + 1] = (A - 1j * B) / 2
    return np.fft.irfft(F * n, n=n, axis=0)


def loops(ch, n):
    """Pick a loop in proportion to its length, then a random time on it."""
    L = np.array([core.length(core.synth(r0, A, B, np.arange(len(A)), 64)) for r0, A, B in ch])
    cnt = rng.multinomial(n, L / L.sum())
    return np.vstack([direct(r0, A, B, rng.random(c) * 2 * np.pi) for (r0, A, B), c in zip(ch, cnt) if c])


if __name__ == "__main__":
    D = json.load(open("artifact_data.json"))
    out = {}
    for name in core.MODELS:
        m = core.load(name); cov = core.Coverage(m)
        on = lambda P: round(float((cov.dense.query(P)[0] < core.EPS).mean()), 4)
        R = {}
        t, P = best(lambda: trimesh.sample.sample_surface(m, N, seed=1)[0])
        R["mesh"] = dict(faces=len(m.faces), s=t, on=1.0)
        ch = precision.chains(D[name], "blobs_axis")
        t, P = best(lambda: loops(ch, N))
        R["loops"] = dict(chains=len(ch), harmonics=int(sum(len(A) for _, A, _ in ch)), s=t, on=on(P))
        c = D[name]["curves"]["blobs_spliced"]
        r0, A, B = (np.array(c[k]) for k in ("r0", "A", "B"))
        for H in (300, 1000, 3000):
            t, P = best(lambda: direct(r0, A[:H], B[:H], rng.random(N) * 2 * np.pi), reps=1)
            R[f"random_{H}"] = dict(harmonics=H, s=t, on=on(P))
            t, P = best(lambda: even(r0, A[:H], B[:H], N))
            R[f"even_{H}"] = dict(harmonics=H, s=t, on=on(P))
        out[name] = R
        print(name, {k: (round(N / v["s"] / 1e6, 2), v["on"]) for k, v in R.items()}, "Mpts/s, on-skin")
    json.dump(out, open("sampling.json", "w"), indent=1)
