# Representing 3D shapes: Epicycles vs wires vs mesh

Five aircraft described three ways — 3D Fourier "epicycle" wireframes,
compressed triangle meshes, and OpenSCAD scripts — and compared byte for
byte at the same accuracy (1% of the bounding-box diagonal).

Served at `erikson1970.github.io/projects/representing-3d-shapes/`.

## Contents

```text
index.html   the whole page: copy, styles, script and the embedded results
stl/         the meshes the numbers were scored against (downloadable)
scad/        the OpenSCAD scripts behind the "declarative" rows (downloadable)
```

`index.html` is a single self-contained file. It loads three.js r128 and its
OrbitControls from public CDNs and two Google Fonts families; everything else,
including every Fourier coefficient and decoded Draco mesh, is inline.

## Where the numbers come from

The page is generated. The Python pipeline that produces it (surface walks,
spiral sweeps, slice loops, the mesh/Draco baselines, the float16 and
fixed-point encodings, and the page build) currently lives outside this
repository, so `index.html` cannot yet be regenerated from here — see
`ISSUES.md` ISSUE-017.

## File provenance

The scripts in `scad/` were written for this study, and the two King Air
STLs are renders of the King Air scripts. The A319, B-17, PD-808 and "Simple airplane"
STLs are third-party models whose source and licence are not yet recorded
here — see `ISSUES.md` ISSUE-016.
