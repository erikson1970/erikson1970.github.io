"""Declarative A319: one parameter set -> (a) OpenSCAD source text, (b) the same solid built
with manifold3d (OpenSCAD's own CSG kernel) so it can be scored against the real mesh.
Frame: normalized A319, X = fuselage (nose +X), Y = span, Z = up, bbox diagonal = 1."""
import numpy as np
import trimesh

# Each lifting surface: hull of a root and tip "airfoil" ellipsoid.  (x_lead, x_trail, y, z, thickness)
P = dict(
    fus=dict(x0=-0.338, x1=0.338, zc=-0.051, r=0.042, nose=0.06, tail=0.13, tail_z=0.02),
    wing=dict(root=(0.105, -0.018, 0.04, -0.066, 0.016), tip=(-0.045, -0.077, 0.35, -0.040, 0.006)),
    htail=dict(root=(-0.245, -0.335, 0.0, -0.030, 0.010), tip=(-0.300, -0.330, 0.13, -0.022, 0.004)),
    vtail=dict(root=(-0.215, -0.338, -0.015, 0.0, 0.012), tip=(-0.300, -0.338, 0.115, 0.0, 0.004)),
    nac=dict(x0=0.030, x1=0.148, y=0.123, z=-0.093, r=0.022),
)

SCAD_TEMPLATE = """// A319, parametric. X=fuselage (nose +X), Y=span, Z=up, bbox diagonal = 1.
$fn=32;
module af(xl,xt,y,z,t){translate([(xl+xt)/2,y,z])scale([(xl-xt)/2,t,t/2])sphere(1);}
module vaf(xl,xt,z,y,t){translate([(xl+xt)/2,y,z])scale([(xl-xt)/2,t/2,t])sphere(1);}
module surf(r,t){hull(){af(r[0],r[1],r[2],r[3],r[4]);af(t[0],t[1],t[2],t[3],t[4]);}}
F=[{x0},{x1},{zc},{r},{nose},{tail},{tail_z}];
module fus(){hull(){
 translate([F[1]-F[4],0,F[2]])scale([F[4],F[3],F[3]])sphere(1);
 translate([F[0]+F[5],0,F[2]])rotate([0,90,0])cylinder(r=F[3],h=0.01);
 translate([F[0],0,F[2]+F[6]])scale([0.005,F[3]/4,F[3]/4])sphere(1);}}
union(){
 fus();
 for(s=[1,-1])mirror([0,s<0?1:0,0]){
  surf({wr},{wt});
  surf({hr},{ht});
  translate([{nx0},{ny},{nz}])rotate([0,90,0])cylinder(r={nr},h={nl});}
 hull(){vaf({vr0},{vr1},{vr2},0,{vr4});vaf({vt0},{vt1},{vt2},0,{vt4});}
}
"""


def scad_source(p=P):
    f, n = p["fus"], p["nac"]
    v = lambda t: "[" + ",".join(f"{a:g}" for a in t) + "]"
    vr, vt = p["vtail"]["root"], p["vtail"]["tip"]
    subs = dict(
        **{k: f"{x:g}" for k, x in f.items()},
        wr=v(p["wing"]["root"]), wt=v(p["wing"]["tip"]),
        hr=v(p["htail"]["root"]), ht=v(p["htail"]["tip"]),
        nx0=f"{n['x0']:g}", ny=f"{n['y']:g}", nz=f"{n['z']:g}", nr=f"{n['r']:g}",
        nl=f"{n['x1'] - n['x0']:g}",
        vr0=f"{vr[0]:g}", vr1=f"{vr[1]:g}", vr2=f"{vr[2]:g}", vr4=f"{vr[4]:g}",
        vt0=f"{vt[0]:g}", vt1=f"{vt[1]:g}", vt2=f"{vt[2]:g}", vt4=f"{vt[4]:g}")
    out = SCAD_TEMPLATE
    for k, x in subs.items():
        out = out.replace("{" + k + "}", x)
    return out


# ---- identical geometry via trimesh/manifold (sphere(1) ~ icosphere, hull = convex hull)
_S = trimesh.creation.icosphere(subdivisions=3).vertices


def ell(c, s):
    return _S * np.asarray(s) + np.asarray(c)


def hull(*pts):
    return trimesh.convex.convex_hull(np.vstack(pts))


def af(xl, xt, y, z, t):
    return ell([(xl + xt) / 2, y, z], [(xl - xt) / 2, t, t / 2])


def vaf(xl, xt, z, t):
    return ell([(xl + xt) / 2, 0, z], [(xl - xt) / 2, t / 2, t])


def build(p=P):
    f, n = p["fus"], p["nac"]
    th = np.linspace(0, 2 * np.pi, 32, endpoint=False)
    ring = np.c_[np.zeros(32), f["r"] * np.cos(th), f["r"] * np.sin(th)]
    fus = hull(ell([f["x1"] - f["nose"], 0, f["zc"]], [f["nose"], f["r"], f["r"]]),
               ring + [f["x0"] + f["tail"], 0, f["zc"]], ring + [f["x0"] + f["tail"] + 0.01, 0, f["zc"]],
               ell([f["x0"], 0, f["zc"] + f["tail_z"]], [0.005, f["r"] / 4, f["r"] / 4]))
    parts = [fus]
    for s in (1, -1):
        M = np.diag([1, s, 1])
        for key in ("wing", "htail"):
            parts.append(hull(af(*p[key]["root"]) @ M, af(*p[key]["tip"]) @ M))
        cyl = trimesh.creation.cylinder(radius=n["r"], height=n["x1"] - n["x0"], sections=32)
        cyl.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
        cyl.apply_translation([(n["x0"] + n["x1"]) / 2, s * n["y"], n["z"]])
        parts.append(cyl)
    vr, vt = p["vtail"]["root"], p["vtail"]["tip"]
    parts.append(hull(vaf(vr[0], vr[1], vr[2], vr[4]), vaf(vt[0], vt[1], vt[2], vt[4])))
    return trimesh.boolean.union(parts, engine="manifold")
