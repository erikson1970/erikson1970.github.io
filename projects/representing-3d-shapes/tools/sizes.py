"""Empirical mesh baselines: bytes to describe each aircraft surface, and at what fidelity."""
import gzip, io, json, os, sys
import numpy as np, trimesh, DracoPy, pymeshlab
from scipy.spatial import cKDTree
import core

def score(cov, V, F, n=40000):
    t = trimesh.Trimesh(V, F, process=False)
    Q, _ = trimesh.sample.sample_surface(t, n, seed=5)
    return (cKDTree(Q).query(cov.P)[0] < core.EPS).mean(), (cov.dense.query(Q)[0] < core.EPS).mean()

def draco(V, F, q):
    return DracoPy.encode(V.astype(np.float32), F.astype(np.uint32), quantization_bits=q, compression_level=10)

def min_q(cov, V, F, need):
    for q in range(6, 15):
        b = draco(V, F, q); d = DracoPy.decode(b)
        r, p = score(cov, np.asarray(d.points), np.asarray(d.faces).reshape(-1, 3))
        if r >= need[0] and p >= need[1]:
            return q, b, (r, p)
    return None, None, None

def collapse(V, F, n):
    ms = pymeshlab.MeshSet(); ms.add_mesh(pymeshlab.Mesh(V, F))
    ms.meshing_decimation_quadric_edge_collapse(targetfacenum=int(n), preservenormal=True)
    c = ms.current_mesh()
    return c.vertex_matrix(), c.face_matrix()

def decimate(cov, m, need):
    """Fewest faces (MeshLab quadric edge collapse) that still meet (recall, precision) >= need.
    Tries the mesh as supplied and a voxel remesh of it, and keeps whichever gets smaller."""
    vg = m.voxelized(pitch=0.003).fill(); r = vg.marching_cubes; r.apply_transform(vg.transform)
    best = None
    for V, F in ((np.asarray(m.vertices), np.asarray(m.faces)), (np.asarray(r.vertices), np.asarray(r.faces))):
        lo, hi = 40, min(len(F), 4000)             # hi is assumed to pass
        while hi - lo > max(2, hi // 50):
            mid = int((lo * hi) ** 0.5)
            rp = score(cov, *collapse(V, F, mid))
            if rp[0] >= need[0] and rp[1] >= need[1]:
                hi = mid
            else:
                lo = mid
        Vd, Fd = collapse(V, F, hi)
        if best is None or len(Fd) < len(best[1]):
            best = (Vd, Fd)
    return best

if __name__ == "__main__":
  out = json.load(open("sizes.json")) if os.path.exists("sizes.json") else {}
  os.makedirs("draco", exist_ok=True)
  for name in sys.argv[1:] or core.MODELS:          # optional model names on the command line
      fn = core.MODELS[name][0]
      m = core.load(name); cov = core.Coverage(m)
      raw = open(fn, "rb").read()
      glb = m.export(file_type="glb")
      R = dict(faces=len(m.faces), stl=len(raw), stl_gz=len(gzip.compress(raw, 9)),
               glb=len(glb), glb_gz=len(gzip.compress(glb, 9)))
      for tag, need in (("hi", (0.99, 0.99)), ("scad", (0.955, 0.93))):
          q, nb, rp = min_q(cov, m.vertices, m.faces, need)
          Vd, Fd = decimate(cov, m, need)
          q2, nb2, rp2 = min_q(cov, Vd, Fd, need)
          R[f"draco_{tag}"] = dict(q=q, bytes=len(nb), rp=np.round(rp, 3).tolist())
          R[f"decim_draco_{tag}"] = dict(faces=len(Fd), q=q2, bytes=len(nb2), rp=np.round(rp2, 3).tolist())
          open(f"draco/{name}_{tag}.drc", "wb").write(nb2)    # the bytes the viewer decodes
      print(name, R)
      out[name] = R
  json.dump(out, open("sizes.json", "w"), indent=1)
