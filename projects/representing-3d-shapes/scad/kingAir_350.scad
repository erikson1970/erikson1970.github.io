$fn = 12;

// Coordinate convention:
// +Y = nose
// -Y = tail
// X  = wingspan
// Z  = up

show_props    = false;  // visual only; leave false for RF meshing
show_winglets = true;   // set false for simpler RF mesh

module ellipsoid(p=[0,0,0], s=[1,1,1]) {
    translate(p)
        scale(s)
            sphere(r=1);
}

module fuselage() {
    // Smooth King Air-style pressurized fuselage:
    // not a bubble canopy, just a tube with a sloped nose/cockpit crown.
    hull() {
        translate([0,20,-1.75]) sphere(r=1);
        translate([0,17,-1.5]) sphere(r=2);
        translate([0,14,-1.5]) sphere(r=2);
        translate([0,9,0]) sphere(r=3);
        sphere(r=3);
        translate([0,-11,0]) sphere(r=3);
        translate([0,-24,2]) sphere(r=1);
    }
}

module sloped_cabin_roof() {
    // Subtle continuous roof crown.
    // This replaces the old "cockpit bubble."
    hull() {
        ellipsoid([0, 20.8, 0.95], [0.75, 0.9, 0.18]);  // low forward nose crown
        ellipsoid([0, 16.5, 1.45], [1.10, 1.8, 0.22]);  // windshield slope region
        ellipsoid([0,  6.0, 1.95], [1.55, 6.5, 0.24]);  // long cabin roof
        ellipsoid([0, -9.0, 1.75], [1.35, 4.5, 0.18]);  // taper aft
    }
}

module main_wing() {
    // Low wing, modest dihedral, mildly tapered.
    translate([0, 1.2, -1.35])
        cube([7.0, 8.8, 0.75], center=true);

    for (s = [-1, 1]) {
        hull() {
            translate([s*3.2, 1.2, -1.35])
                cube([1.0, 8.8, 0.75], center=true);   // root chord

            translate([s*28.8, 0.0, 0.25])
                cube([1.0, 4.8, 0.65], center=true);   // tip chord, raised
        }

        if (show_winglets) {
            hull() {
                translate([s*28.8, 0.0, 0.55])
                    cube([0.55, 4.4, 0.65], center=true);

                translate([s*29.2, -0.3, 2.9])
                    cube([0.45, 2.5, 0.65], center=true);
            }
        }
    }
}

module engine_nacelle(x) {
    // Smaller turboprop nacelle blended into the wing.
    // Front is just ahead of the wing leading edge; aft fairing trails back.
    hull() {
        ellipsoid([x,  6.9, -1.05], [1.30, 1.15, 1.00]); // cowling/front
        ellipsoid([x,  3.0, -1.10], [1.45, 2.35, 1.00]); // main nacelle
        ellipsoid([x, -3.0, -1.00], [1.05, 2.10, 0.75]); // aft fairing
    }

    // Upper fairing into the wing
    hull() {
        translate([x, 1.3, -0.95])
            cube([2.8, 4.8, 0.7], center=true);

        translate([x, -1.6, -0.45])
            cube([2.0, 3.0, 0.55], center=true);
    }

    // Crude prop disk, disabled by default
    if (show_props) {
        translate([x, 8.45, -1.05])
            rotate([90, 0, 0])
                cylinder(h=0.35, r=2.75, center=true);
    }
}

module engines() {
    engine_nacelle( 10.2);
    engine_nacelle(-10.2);
}

module vertical_tail() {
    // Swept vertical fin for the T-tail.
    hull() {
        translate([0, -19.0, 1.0])
            cube([0.9, 4.2, 1.0], center=true);

        translate([0, -21.8, 7.9])
            cube([0.9, 3.2, 1.0], center=true);

        translate([0, -24.5, 4.8])
            cube([0.9, 2.3, 1.0], center=true);
    }
}

module horizontal_tail() {
    // High-mounted T-tail, narrower than main wing.
    translate([0, -22.1, 7.9])
        cube([3.8, 3.5, 0.65], center=true);

    for (s = [-1, 1]) {
        hull() {
            translate([s*1.8, -22.1, 7.9])
                cube([1.0, 3.5, 0.65], center=true);

            translate([s*10.2, -22.5, 8.05])
                cube([1.0, 2.2, 0.55], center=true);
        }
    }
}

union() {
    fuselage();
//    sloped_cabin_roof();

    main_wing();
    engines();

    vertical_tail();
    horizontal_tail();
}