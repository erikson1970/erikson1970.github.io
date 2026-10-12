$fn = 20;

// Coordinate convention:
// +Y = nose
// -Y = tail
// X  = wingspan
// Z  = up

show_props = true;   // set true only if you want crude prop disks

module fuselage() {
    hull() {
        translate([0,  36, 0]) sphere(r=1.6, center=true);  // nose
        translate([0,  30, 0]) sphere(r=3.2, center=true);
        translate([0,  19, 0]) sphere(r=4.0, center=true);  // fattest section
        translate([0,  5, 0]) sphere(r=4.0, center=true);   // fattest section
        translate([0, -25, 0]) sphere(r=3.0, center=true);
        translate([0, -37, 0]) sphere(r=1.8, center=true);  // tail
    }
}

module cockpit_hump() {
    hull() {
        translate([0, 29, 2.6]) sphere(r=2.2, center=true);
        translate([0, 5 , 3.4]) sphere(r=1.3, center=true);
    }
}

module main_wing() {
    // center carry-through section
    translate([0, 12, -1.5])
        cube([16, 14, 1], center=true);

    // left/right tapered wing panels
    for (s = [-1, 1]) {
        hull() {
            translate([s*7,  12, -1.5])
                cube([1, 14, 1], center=true);   // root chord

            translate([s*51, 10, -1.5])
                cube([1,  7, 1], center=true);   // tip chord
        }
    }
}

module engine_pod(x) {
    // nacelle: fat round front, tapering aft into wing
    hull() {
        translate([x, 21.5, -1.5]) sphere(r=2.4, center=true); // engine cowling
        translate([x, 15.0, -1.6]) sphere(r=2.0, center=true);
        translate([x,  8.0, -1.8]) sphere(r=1.3, center=true); // aft fairing
    }

    // optional crude prop disk
    if (show_props) {
        translate([x, 24.2, -1.5])
            rotate([90, 0, 0])
                cylinder(h=0.5, r=3.2, center=true);
    }
}

module engines() {
    // Approximate B-17 four-engine layout.
    // Inboard engines close to fuselage, outboards about 2/3 span.
    for (x = [-35, -18, 18, 35]) {
        engine_pod(x);
    }
}

module horizontal_tail() {
    translate([0, -30, 1.0])
        cube([8, 8, 1], center=true);

    for (s = [-1, 1]) {
        hull() 
        {
            translate([s*4,  -30, 1.0])
                cube([1, 8, 1], center=true);

            translate([s*16, -31, 1.0])
                cube([1, 5, 1], center=true);
        }
    }
}

module vertical_tail() {
    //hull() 
    for (hh = [[[0, -30, 3.0],8],[[0, -32, 11.5],5],[[0, -36, 6.0],3]]) 
        //translate(hh[1])
            cube([1, hh[2], 1], center=true);

    hull() 
    {

        translate([0, -30, 3.0])
            cube([1, 8, 1], center=true);

        translate([0, -32, 11.5])
            cube([0.5, 5, 0.5], center=true);

        translate([0, -35, 6.0])
            cube([1, 3, 1], center=true);
    }
}

module dorsal_turret(){
    // optional tiny dorsal turret / RF bump;
    // delete if you want fewer mesh features
    translate([0, 24, 4.4])
        sphere(r=1.1, center=true);

}

module belly_turret(){
    // optional tiny dorsal turret / RF bump;
    // delete if you want fewer mesh features
    translate([0, 3, -4])
        sphere(r=1.1, center=true);

}

union() {
    fuselage();
    cockpit_hump();

    main_wing();
    engines();

    horizontal_tail();
    vertical_tail();
    dorsal_turret();
    belly_turret();
}
