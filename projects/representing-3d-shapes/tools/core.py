"""Shared toolkit: mesh loading/normalization, coverage metric, 3D Fourier series, loop splicing."""
import numpy as np
import trimesh
from scipy.spatial import cKDTree

# Canonical frame: X = fuselage (nose +X), Y = span, Z = up.  Permutations found by inspection.
MODELS = {
    "A319":   ("../stl/A319.stl",                   [1, 0, 2]),
    "B17":    ("../stl/B17.stl",                 [1, 0, 2]),
    "PD808":  ("../stl/Piaggio_PD-808_v8.stl",       [2, 0, 1]),
    "Simple": ("../stl/Simple_Airplane_Model_V2.stl", [1, 0, 2]),
    "KingAir": ("../stl/king_air_350_detailed.stl",  [1, 0, 2]),
}
EPS = 0.01          # wire "paint" radius, as a fraction of bbox diagonal
N_SAMPLES = 30000   # surface samples for the coverage metric


def load(name):
    f, perm = MODELS[name]
    m = trimesh.load(f)
    if not m.is_watertight:                      # PD-808 has stray fragments
        m = max(m.split(only_watertight=False), key=lambda b: len(b.faces))
    v = m.vertices[:, perm]
    m = trimesh.Trimesh(v, m.faces, process=True)
    if np.linalg.det(np.eye(3)[perm]) < 0:
        m.invert()
    m.apply_translation(-m.bounds.mean(axis=0))
    m.apply_scale(1.0 / np.linalg.norm(m.extents))
    return m


class Coverage:
    """Fraction of (area-uniform) surface samples within EPS of a curve."""
    def __init__(self, mesh, n=N_SAMPLES, seed=0, eps=EPS):
        self.P, fi = trimesh.sample.sample_surface_even(mesh, n, seed=seed) \
            if hasattr(trimesh.sample, "sample_surface_even") else trimesh.sample.sample_surface(mesh, n, seed=seed)
        self.P = np.asarray(self.P)
        self.tree = cKDTree(self.P)
        self.eps = eps
        D, _ = trimesh.sample.sample_surface(mesh, 200000, seed=seed + 7)
        self.dense = cKDTree(np.asarray(D))

    def on_surface(self, curves, closed=True):
        """Fraction of curve length lying within EPS of the skin (wire 'precision')."""
        if isinstance(curves, np.ndarray):
            curves = [curves]
        c = np.vstack([densify(x, self.eps * 0.4, closed) for x in curves])
        d, _ = self.dense.query(c)
        return (d < self.eps).mean()

    def hits(self, curve, closed=True):
        c = densify(curve, self.eps * 0.4, closed)
        idx = self.tree.query_ball_point(c, self.eps)
        out = np.zeros(len(self.P), bool)
        for i in idx:
            out[i] = True
        return out

    def frac(self, curves, closed=True):
        if isinstance(curves, np.ndarray):
            curves = [curves]
        h = np.zeros(len(self.P), bool)
        for c in curves:
            h |= self.hits(c, closed)
        return h.mean()


def densify(c, step, closed=True):
    c = np.asarray(c)
    if closed:
        c = np.vstack([c, c[:1]])
    seg = np.diff(c, axis=0)
    n = np.maximum(1, np.ceil(np.linalg.norm(seg, axis=1) / step).astype(int))
    out = [c[i] + seg[i] * (np.arange(n[i])[:, None] / n[i]) for i in range(len(seg))]
    return np.vstack(out + ([] if closed else [c[-1:]]))


def arclen_resample(c, M):
    c = np.vstack([c, c[:1]])
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(c, axis=0), axis=1))])
    s = np.linspace(0, L[-1], M, endpoint=False)
    return np.column_stack([np.interp(s, L, c[:, j]) for j in range(3)])


def length(c):
    return np.linalg.norm(np.diff(np.vstack([c, c[:1]]), axis=0), axis=1).sum()


# ---------------- 3D Fourier series ----------------
# r(t) = r0 + sum_k  A_k cos kt + B_k sin kt,  A_k,B_k in R^3.
# Each k-term is a 3D ellipse (a tilted epicycle): 6 real numbers per harmonic.

def fourier3(c, M=None):
    """Return r0 (3,), A (K,3), B (K,3) using all harmonics up to Nyquist."""
    M = M or len(c)
    r = arclen_resample(c, M)
    F = np.fft.rfft(r, axis=0) / M
    r0 = F[0].real
    A, B = 2 * F[1:].real, -2 * F[1:].imag
    if M % 2 == 0:                       # Nyquist bin counted once
        A[-1] /= 2; B[-1] /= 2
    return r0, A, B


def select(A, B, N, mode="low"):
    """Indices (0-based harmonic-1) of kept terms: lowest N, or N strongest."""
    K = len(A)
    if mode == "low":
        return np.arange(min(N, K))
    mag = np.linalg.norm(A, axis=1) ** 2 + np.linalg.norm(B, axis=1) ** 2
    return np.sort(np.argsort(mag)[::-1][:N])


def synth(r0, A, B, idx, n_pts):
    t = np.linspace(0, 2 * np.pi, n_pts, endpoint=False)
    k = (idx + 1)[:, None]
    return r0 + np.cos(k * t).T @ A[idx] + np.sin(k * t).T @ B[idx]


def n_params(n_harm):
    return 6 * n_harm + 3


def min_harmonics(c, tol, M=512):
    """Smallest lowest-N truncation whose max deviation from c is < tol."""
    r0, A, B = fourier3(c, M)
    ref = arclen_resample(c, M)
    lo, hi = 1, len(A)
    while lo < hi:
        mid = (lo + hi) // 2
        rec = synth(r0, A, B, np.arange(mid), M)
        if np.max(np.linalg.norm(rec - ref, axis=1)) < tol:
            hi = mid
        else:
            lo = mid + 1
    return lo, (r0, A[:lo], B[:lo])


# ---------------- splicing closed loops into one ----------------
def splice(loops):
    """Join closed loops into one closed curve: greedily attach each loop at its
    closest point pair with an out-and-back bridge (a 'pen-down jump')."""
    loops = [np.asarray(l) for l in loops]
    order = sorted(range(len(loops)), key=lambda i: -len(loops[i]))
    cur = loops[order[0]]
    rest = [loops[i] for i in order[1:]]
    while rest:
        tree = cKDTree(cur)
        best = None
        for j, L in enumerate(rest):
            d, ii = tree.query(L)
            q = int(np.argmin(d))
            if best is None or d[q] < best[0]:
                best = (d[q], j, int(ii[q]), q)
        _, j, a, b = best
        L = rest.pop(j)
        Lr = np.roll(L, -b, axis=0)              # starts and ends at L[b]
        cur = np.vstack([cur[:a + 1], Lr, L[b:b + 1], cur[a:]])
    return cur


def polygon_area2(p2):
    x, y = p2[:, 0], p2[:, 1]
    return 0.5 * (x @ np.roll(y, -1) - y @ np.roll(x, -1))


def slice_loops(mesh, normal, offsets, min_pts=8):
    """All closed cross-section loops for planes n.x = offset.  Returns list per offset of
    (loop3d, area) tuples, loops oriented CCW about the normal."""
    normal = np.asarray(normal, float); normal /= np.linalg.norm(normal)
    secs = mesh.section_multiplane(plane_origin=np.zeros(3), plane_normal=normal, heights=offsets)
    out = []
    for s in secs:
        loops = []
        if s is not None:
            T = s.metadata["to_3D"]
            for d in s.discrete:
                if len(d) < min_pts:
                    continue
                if np.linalg.norm(d[0] - d[-1]) < 1e-6:
                    d = d[:-1]
                a = polygon_area2(d)
                p3 = np.c_[d, np.zeros(len(d)), np.ones(len(d))] @ T.T
                p3 = p3[:, :3]
                # orient CCW w.r.t. the requested normal (vector area)
                va = 0.5 * np.cross(p3, np.roll(p3, -1, axis=0)).sum(axis=0)
                if va @ normal < 0:
                    p3 = p3[::-1]
                loops.append((p3, abs(a)))
        out.append(loops)
    return out
