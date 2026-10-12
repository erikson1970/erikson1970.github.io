$fn = 32;

// Coordinate convention:
// +Y = nose
// -Y = tail
// X  = wingspan
// Z  = up

show_props    = false;  // visual only; leave false for RF meshing
show_winglets = true;   // set false for simpler RF mesh
cabin_walls = 0.96;
show_windows = true;
thin_shell = true;

module ellipsoid(p=[0,0,0], s=[1,1,1]) {
    translate(p)
        scale(s)
            sphere(r=1);
}

module make_tube(){
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

module fuselage() {
    // Smooth King Air-style pressurized fuselage:
    // not a bubble canopy, just a tube with a sloped nose/cockpit crown.
    difference() 
       { 
        make_tube();
        if (show_windows) {
            for (s=[-7,-4,-1,2]) translate([0,s+1,1]) rotate([0,90,0]) scale(v=[1.3,1,1]) cylinder(h=30, r=.7,center=true);
            translate([0,12,1]) rotate([60,0,0]) cube(size=[30,1.7,2],center=true);
            translate([0,13.4,1]) scale([1,1.8,1]) difference() { 
                    rotate([0,0,45]) cube(size=[2.0,2.0,5],center=true);
                    translate([0,1.2,0]) cube(size=[2.9,2.5,7],center=true);
                    translate([0,-2.1,0]) cube(size=[2.3,2.3,7],center=true);
            }


        }
        if (thin_shell) scale(v=cabin_walls*[1,1,1]) make_tube();
       }
}

module main_wing() {
    // Low wing, modest dihedral, mildly tapered.

    difference() {
        make_wing(LL=28.8,WW=7,SS=5,TT=1,sw=show_winglets,cc="red");
        scale(v=cabin_walls*[1,1,1]) make_tube();
    }

}

module horiz_stab() {
    // Low wing, modest dihedral, mildly tapered.
    translate(v=[0, -22.5 ,9 ]) make_wing(LL=11,WW=4.5,SS=2,TA=6,TT=0.5,sw=false,cc="red");
}

module make_wing(LL=28.8,WW=7,TT=0.9,SS=4,TA=12,cc="red",sw=true,sides=[-1,1])  {
    // Low wing, modest dihedral, mildly tapered.

    for (s = sides) {
        rotate(a=s*[0,-SS,0]) color(cc) { 
             hull(){
                   translate([s*LL/2, WW-3, -1.25]) rotate(a=s*[0,90,-TA*0.75]) cylinder(h=LL+(sw?0:LL/7), r1=TT, r2=TT/3,center=true);
                   translate([s*LL/2, -(WW-3), -1.25]) rotate(a=s*[0,90,TA/3]) cylinder(h=LL+(sw?0:LL/7), r1=TT/4, r2=TT/8,center=true);
                   }
            if (sw){
                hull() {
                   translate([s*LL*1.01, WW/4, 0]) rotate(a=s*[0,25,-TA*0.75]) cylinder(h=LL/10, r1=TT/3, r2=TT/5,center=true);
                   translate([s*LL*1.01, -(WW/2.5), -0.5]) rotate(a=s*[0,25,TA/3]) cylinder(h=LL/20, r1=TT/8, r2=TT/8,center=true);
                }
            }
        }
        if (false) {
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
    
    translate([-1.25, -21, 2.2]) rotate(a=[10,0,0])  rotate(a=[0,-90,0]) make_wing(LL=5.75,WW=6,SS=0,TA=30,TT=.8,sw=false,cc="grey",sides=[1]);
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

    main_wing();
    engines();

    vertical_tail();
    //horizontal_tail();
    horiz_stab();
}