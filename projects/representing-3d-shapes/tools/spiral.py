"""Approach 2: plane-dominant 3D spirals.  A sweep along one axis visits a cross-section
per slice; consecutive cross-sections are morphed into one helical turn, so the pitch
comes for free.  The sweep goes out on even slices and back on odd ones, giving a
closed curve with no straight return leg."""
import numpy as np
import core

AXES = {"X": [1, 0, 0], "Y": [0, 1, 0], "Z": [0, 0, 1]}
# naming used in the write-up: sweep along X -> YZ-plane rings ("YZ-dominant")


def sweep_loops(mesh, axis, spacing, Q=128, pick="largest"):
    n = np.array(AXES[axis], float)
    lo, hi = mesh.bounds[:, "XYZ".index(axis)]
    offs = np.arange(lo + spacing / 2, hi, spacing)
    secs = core.slice_loops(mesh, n, offs)
    loops = []
    for s in secs:
        if not s:
            continue
        L = max(s, key=lambda t: t[1])[0] if pick == "largest" else None
        loops.append(core.arclen_resample(L, Q))
    # phase-align each loop to its predecessor (same start direction)
    for i in range(1, len(loops)):
        j = np.argmin(np.linalg.norm(loops[i] - loops[i - 1][0], axis=1))
        loops[i] = np.roll(loops[i], -j, axis=0)
    return loops


def helix(loops):
    """Out on even slices, back on odd slices, one morphing turn per pair."""
    n = len(loops)
    seq = list(range(0, n, 2)) + list(range(n - 1 - (n % 2 == 1), 0, -2))
    if n % 2 == 1:  # odd count: last even is n-1, back leg starts at n-2
        seq = list(range(0, n, 2)) + list(range(n - 2, 0, -2))
    Q = len(loops[0])
    u = (np.arange(Q) / Q)[:, None]
    pts = []
    for a, b in zip(seq, seq[1:] + seq[:1]):
        La = loops[a]
        Lb = np.roll(loops[b], -np.argmin(np.linalg.norm(loops[b] - La[0], axis=1)), axis=0)
        pts.append((1 - u) * La + u * Lb)
    return np.vstack(pts)


def build(mesh, spacing, axes=("X", "Y")):
    curves = [helix(sweep_loops(mesh, a, spacing)) for a in axes]
    return core.splice(curves) if len(curves) > 1 else curves[0], curves
