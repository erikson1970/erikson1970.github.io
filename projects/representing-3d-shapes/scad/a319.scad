// A319, parametric. X=fuselage (nose +X), Y=span, Z=up, bbox diagonal = 1.
$fn=32;
module af(xl,xt,y,z,t){translate([(xl+xt)/2,y,z])scale([(xl-xt)/2,t,t/2])sphere(1);}
module vaf(xl,xt,z,y,t){translate([(xl+xt)/2,y,z])scale([(xl-xt)/2,t/2,t])sphere(1);}
module surf(r,t){hull(){af(r[0],r[1],r[2],r[3],r[4]);af(t[0],t[1],t[2],t[3],t[4]);}}
F=[-0.332,0.3275,-0.051,0.042,0.063,0.1405,0.026];
module fus(){hull(){
 translate([F[1]-F[4],0,F[2]])scale([F[4],F[3],F[3]])sphere(1);
 translate([F[0]+F[5],0,F[2]])rotate([0,90,0])cylinder(r=F[3],h=0.01);
 translate([F[0],0,F[2]+F[6]])scale([0.005,F[3]/4,F[3]/4])sphere(1);}}
union(){
 fus();
 for(s=[1,-1])mirror([0,s<0?1:0,0]){
  surf([0.105,-0.012,0.0415,-0.066,0.022],[-0.045,-0.077,0.344,-0.04,0.012]);
  surf([-0.245,-0.335,0,-0.03,0.0085],[-0.294,-0.324,0.136,-0.022,0.004]);
  translate([0.039,0.117,-0.0915])rotate([0,90,0])cylinder(r=0.022,h=0.103);}
 hull(){vaf(-0.206,-0.338,-0.012,0,0.012);vaf(-0.294,-0.332,0.115,0,0.01);}
}
