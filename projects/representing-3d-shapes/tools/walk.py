"""Approach 1: continuous random walk on the surface until a coverage target is hit."""
import numpy as np
import trimesh
from scipy.spatial import cKDTree
import core


class Surface:
    """Dense surface point cloud with normals, used to project walk steps back onto the skin."""
    def __init__(self, mesh, n=200000, seed=1):
        P, fi = trimesh.sample.sample_surface(mesh, n, seed=seed)
        self.P, self.N = np.asarray(P), mesh.face_normals[fi]
        self.tree = cKDTree(self.P)

    def project(self, x):
        _, i = self.tree.query(x)
        return self.P[i], self.N[i]


def tangent(v, n):
    v = v - (v @ n) * n
    nv = np.linalg.norm(v)
    return v / nv if nv > 1e-12 else None


def random_walk(mesh, cov, target=0.9, step=0.004, sigma=0.35, bias=True,
                max_steps=60000, seed=0, look=4, n_cand=9, surf=None):
    """sigma: heading diffusion (rad/step).  bias=True steers toward uncovered samples:
    each step it scores n_cand headings by how many uncovered coverage samples lie
    near a point `look` steps ahead, and picks the best (plus noise)."""
    rng = np.random.default_rng(seed)
    S = surf or Surface(mesh)
    covered = np.zeros(len(cov.P), bool)
    x, n = S.project(cov.P[rng.integers(len(cov.P))])
    h = tangent(rng.normal(size=3), n)
    path, hist = [x], []
    stuck = 0
    last_cov = 0
    tgt, tgt_best, tgt_age = None, np.inf, 0
    for it in range(max_steps):
        for j in cov.tree.query_ball_point(x, cov.eps):
            covered[j] = True
        if it % 200 == 0:
            f = covered.mean(); hist.append((it, f))
            if f >= target:
                break
        if bias and tgt is not None:
            # travelling to an uncovered patch: step straight at it, then re-project
            d = np.linalg.norm(tgt - x)
            if d < tgt_best - 1e-4:
                tgt_best, tgt_age = d, 0
            else:
                tgt_age += 1
            if covered[tgt_i] or d < cov.eps or tgt_age > 40:
                if tgt_age > 40:          # unreachable this way; try a random uncovered one
                    unc = np.flatnonzero(~covered)
                    tgt_i = unc[rng.integers(len(unc))]; tgt = cov.P[tgt_i]
                    tgt_best, tgt_age = np.inf, 0
                else:
                    tgt = None; stuck = 0
            if tgt is not None:
                xn, nn = S.project(x + (tgt - x) / max(d, 1e-9) * step)
                h2 = tangent(xn - x, nn)
                h = h2 if h2 is not None else tangent(h, nn)
                if h is None:
                    h = tangent(rng.normal(size=3), nn)
                x, n = xn, nn; path.append(x)
                continue
        if bias:
            b = np.cross(n, h)
            angs = np.linspace(-np.pi / 2, np.pi / 2, n_cand) + rng.normal(0, sigma / 2)
            best, bs = None, -1
            for a in angs:
                d = np.cos(a) * h + np.sin(a) * b
                p, _ = S.project(x + d * step * look)
                ids = cov.tree.query_ball_point(p, cov.eps)
                s = len(ids) - covered[ids].sum() if ids else 0
                s += rng.random() * 0.5 - abs(a) * 0.3          # prefer straight
                if s > bs:
                    bs, best = s, d
            # 'stuck' = no real coverage gain over the last few steps
            ncov = covered.sum()
            stuck = stuck + 1 if ncov == last_cov else 0
            last_cov = ncov
            if stuck > 15:   # region exhausted: head for nearest uncovered sample
                unc = np.flatnonzero(~covered)
                tgt_i = unc[np.argmin(np.linalg.norm(cov.P[unc] - x, axis=1))]
                tgt, tgt_best, tgt_age = cov.P[tgt_i], np.inf, 0
            h = best
        else:
            b = np.cross(n, h)
            a = rng.normal(0, sigma)
            h = np.cos(a) * h + np.sin(a) * b
        xn, nn = S.project(x + h * step)
        h2 = tangent(xn - x, nn)
        h = h2 if h2 is not None else tangent(h, nn)
        if h is None:
            h = tangent(rng.normal(size=3), nn)
        x, n = xn, nn
        path.append(x)
    hist.append((len(path), covered.mean()))
    return np.array(path), hist        # closed implicitly by the jump path[-1] -> path[0]
