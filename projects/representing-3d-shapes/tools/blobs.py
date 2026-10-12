"""Approach 3: every cross-section blob is its own closed loop and its own epicycle chain.
Candidates come from axis-aligned planes or from planes at arbitrary orientations; a
greedy set-cover picks loops by (new coverage) / (Fourier parameters).

Variant: where a sweeping slice plane changes topology (a blob appears or vanishes at an
extremum, two blobs merge or split at a saddle) parallel slices cover worst, so the rule
"put a 90-degree crossing loop through every such point" adds loops from the planes that
contain the sweep axis."""
import heapq
import numpy as np
from scipy.spatial import cKDTree
from shapely.ops import nearest_points
import core


def fib_dirs(n):
    """n roughly uniform directions on a hemisphere (a plane normal and its negative are the same plane)."""
    i = np.arange(n) + 0.5
    z = i / n                                   # z in (0,1]
    phi = np.pi * (1 + 5 ** 0.5) * i
    r = np.sqrt(1 - z ** 2)
    return np.c_[r * np.cos(phi), r * np.sin(phi), z]


def fit(L, cov, tol, Q, cov2=None, **extra):
    """One cross-section loop -> candidate: shortest Fourier chain within tol, and the skin it paints."""
    L = core.arclen_resample(L, Q)
    N, (r0, A, B) = core.min_harmonics(L, tol, M=Q)
    rec = core.synth(r0, A, B, np.arange(N), max(64, 8 * N))
    c = dict(N=N, r0=r0, A=A, B=B, rec=rec, hit=np.flatnonzero(cov.hits(rec)), cost=core.n_params(N), **extra)
    if cov2 is not None:                        # same skin samples, tighter paint radius
        c["hit2"] = np.flatnonzero(cov2.hits(rec))
    return c


def candidates(mesh, cov, normals, spacing, tol=None, Q=256, min_area=0.0, phase=None, cov2=None):
    """phase: offset of the first plane from the low end (default half a spacing)."""
    tol = tol or cov.eps / 2
    V = mesh.vertices
    out = []
    for n in normals:
        n = np.asarray(n, float) / np.linalg.norm(n)
        proj = V @ n
        offs = np.arange(proj.min() + (spacing / 2 if phase is None else phase), proj.max(), spacing)
        for s in core.slice_loops(mesh, n, offs):
            for L, area in s:
                if area < min_area:
                    continue
                out.append(fit(L, cov, tol, Q, cov2, normal=n))
    return out


def critical_events(mesh, spacing, min_area=None):
    """Sweep a plane along X, Y and Z and report where the cross-section changes topology.
    Regions (solid cross-sections, holes respected) are tracked between adjacent slices by overlap:
    a region with no partner is an extremum, two regions sharing a partner are a saddle.
    Returns dicts(p=3D point, ax=sweep axis, kind="ext"|"sad"); features thinner than the slice
    spacing are invisible to this, which is the filtering wanted here."""
    min_area = (spacing / 4) ** 2 if min_area is None else min_area
    events = []
    for ax in range(3):
        n = np.eye(3)[ax]
        lo, hi = mesh.bounds[:, ax]
        offs = np.arange(lo + spacing / 2, hi, spacing)
        secs = list(mesh.section_multiplane(plane_origin=np.zeros(3), plane_normal=n, heights=offs)) + [None]
        T = next(s.metadata["to_3D"] for s in secs if s is not None)[:3, :3]     # 2D frame is shared by all heights

        def add(xy, off, kind):
            p = T @ np.array([xy[0], xy[1], 0.0]); p[ax] = off
            events.append(dict(p=p, ax=ax, kind=kind))

        def saddles(group, off):
            for i in range(len(group)):                 # one saddle between each region and its nearest sibling
                for j in range(i + 1, len(group)):
                    a, b = nearest_points(group[i], group[j])
                    add(((a.x + b.x) / 2, (a.y + b.y) / 2), off, "sad")

        prev = []
        for k, s in enumerate(secs):
            cur = [p for p in (s.polygons_full if s is not None else []) if p.area > min_area]
            mid = (offs[k - 1] if k else offs[0] - spacing) + spacing / 2
            link = [[j for j, q in enumerate(prev) if p.intersection(q).area > 0] for p in cur]
            for p, l in zip(cur, link):
                if not l:
                    add(p.centroid.coords[0], mid, "ext")                      # region appears
                elif len(l) > 1:
                    saddles([prev[j] for j in l], mid)                         # regions merge
            for j, q in enumerate(prev):
                kids = [p for p, l in zip(cur, link) if j in l]
                if not kids:
                    add(q.centroid.coords[0], mid, "ext")                      # region vanishes
                elif len(kids) > 1:
                    saddles(kids, mid)                                         # region splits
            prev = cur
    return events


def crossings(mesh, cov, events, spacing, tol=None, Q=256, cov2=None):
    """The 90-degree crossing loops: for an event found sweeping along one axis, the cross-sections
    through it in the two planes that contain that axis.  Each candidate lists the events it serves."""
    tol = tol or cov.eps / 2
    P = np.array([e["p"] for e in events])
    out = []
    for u in range(3):
        mine = [i for i, e in enumerate(events) if e["ax"] != u]
        if not mine:
            continue
        offs = np.unique(np.round(P[mine, u] / (cov.eps / 4))) * (cov.eps / 4)   # merge near-identical planes
        on_plane = [[i for i in mine if abs(P[i, u] - o) <= cov.eps / 4] for o in offs]
        for s, ev in zip(core.slice_loops(mesh, np.eye(3)[u], offs), on_plane):
            for L, _ in s:
                d = cKDTree(core.densify(L, cov.eps * 0.4)).query(P[ev])[0]
                served = [i for i, x in zip(ev, d) if x < spacing]              # loop passes through / beside the point
                if served:
                    out.append(fit(L, cov, tol, Q, cov2, normal=np.eye(3)[u], events=set(served), x=1))
    return out


def greedy(cands, n_total, stop=0.97, key="hit", chosen=(), max_n=None):
    """Lazy greedy weighted set cover.  Returns chosen indices and the (params, coverage) curve.
    chosen: loops already taken (they stay first); key: which paint radius to score against;
    max_n: stop at this many loops."""
    covered = np.zeros(n_total, bool)
    chosen, curve, params = list(chosen), [(0, 0.0)], 0
    for i in chosen:
        covered[cands[i][key]] = True
        params += cands[i]["cost"]
        curve.append((params, covered.mean()))
    heap = [(-len(c[key]) / c["cost"], i) for i, c in enumerate(cands) if i not in set(chosen)]
    heapq.heapify(heap)
    while heap and (max_n is None or len(chosen) < max_n):
        neg, i = heapq.heappop(heap)
        c = cands[i]
        g = (~covered[c[key]]).sum() / c["cost"]
        if heap and g < -heap[0][0] - 1e-12:      # stale: re-push with fresh score
            if g > 0:
                heapq.heappush(heap, (-g, i))
            continue
        if g <= 0:
            break
        covered[c[key]] = True
        params += c["cost"]
        chosen.append(i)
        curve.append((params, covered.mean()))
        if covered.mean() >= stop:
            break
    return chosen, np.array(curve)


def forced(cands, n_total):
    """The crossing rule: until every critical event has a crossing loop, take the crossing
    candidate with the best (new coverage)/(parameters) among those serving an unserved event."""
    todo = set().union(*(c["events"] for c in cands if "events" in c)) if cands else set()
    covered, chosen = np.zeros(n_total, bool), []
    while todo:
        opts = [i for i, c in enumerate(cands) if c.get("events", set()) & todo and i not in chosen]
        i = max(opts, key=lambda i: ((~covered[cands[i]["hit"]]).sum() + 1e-6 * len(cands[i]["events"] & todo)) / cands[i]["cost"])
        covered[cands[i]["hit"]] = True
        todo -= cands[i]["events"]
        chosen.append(i)
    return chosen


def trace(cands, chosen, n_total):
    """(params, coverage at eps, coverage at eps/2) after each loop of a chosen sequence."""
    a, b, params, rows = np.zeros(n_total, bool), np.zeros(n_total, bool), 0, [(0, 0.0, 0.0)]
    for i in chosen:
        a[cands[i]["hit"]] = True; b[cands[i]["hit2"]] = True
        params += cands[i]["cost"]
        rows.append((params, a.mean(), b.mean()))
    return np.array(rows)


def components(loops, tol):
    """How many separate pieces the wire set falls into when loops closer than tol count as joined."""
    pts = [core.densify(L, tol * 0.4) for L in loops]
    parent = list(range(len(pts)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i
    trees = [cKDTree(p) for p in pts]
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            if find(i) != find(j) and trees[i].sparse_distance_matrix(trees[j], tol, output_type="coo_matrix").nnz:
                parent[find(i)] = find(j)
    return len({find(i) for i in range(len(pts))})
