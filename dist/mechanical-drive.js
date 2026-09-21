import * as T from './assets/three.module.js';
export const DRIVE={inputTeeth:18,outputTeeth:36,module:.018,ratio:2,outputRadius:.324,inputRadius:.162,centerDistance:.486};
// Involute spur gears: both gears share the same module and 20-degree pressure angle.
export function gearGeometry(teeth){
 const rp=teeth*DRIVE.module/2,base=rp*Math.cos(Math.PI/9),root=rp-1.25*DRIVE.module,tip=rp+DRIVE.module;
 const inv=r=>{const t=Math.sqrt(Math.max(0,r*r/(base*base)-1));return t-Math.atan(t);};
 const pitchInv=inv(rp),half=Math.PI/(2*teeth),shape=new T.Shape();let first=true;
 const point=(r,a)=>{const x=Math.cos(a)*r,y=Math.sin(a)*r;if(first){shape.moveTo(x,y);first=false;}else shape.lineTo(x,y);};
 for(let k=0;k<teeth;k++){
  const a=k*Math.PI*2/teeth;
  point(root,a-half-pitchInv);
  for(let j=0;j<=7;j++){const r=Math.max(root,base)+(tip-Math.max(root,base))*j/7;point(r,a-half-pitchInv+inv(r));}
  for(let j=1;j<=4;j++)point(tip,a+(-half-pitchInv+inv(tip))*(1-j/4)+(half+pitchInv-inv(tip))*j/4);
  for(let j=7;j>=0;j--){const r=Math.max(root,base)+(tip-Math.max(root,base))*j/7;point(r,a+half+pitchInv-inv(r));}
  point(root,a+half+pitchInv);point(root,a+Math.PI*2/teeth-half-pitchInv);
 }
 shape.closePath();const hole=new T.Path();hole.absarc(0,0,teeth===36?.086:.064,0,Math.PI*2,true);shape.holes.push(hole);
 const geo=new T.ExtrudeGeometry(shape,{depth:.10,steps:1,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2,curveSegments:48});geo.translate(0,0,-.05);return geo;
}
export function addFunctionalDrive(a,mat){
 const gearbox=new T.Group();a.drive.add(gearbox);gearbox.position.z=2.12;
 const gearMat=mat.steel.clone();gearMat.color.set(0x8d928c);gearMat.roughness=.42;
 const output=new T.Mesh(gearGeometry(36),gearMat),input=new T.Mesh(gearGeometry(18),gearMat);input.position.y=DRIVE.centerDistance;gearbox.add(output,input);
 output.castShadow=input.castShadow=true;output.receiveShadow=input.receiveShadow=true;
 a.motor.position.y=a.coupling.position.y=DRIVE.centerDistance;
 const inputShaft=new T.Mesh(new T.CylinderGeometry(.062,.062,.56,96),mat.chrome);inputShaft.rotation.x=Math.PI/2;inputShaft.position.set(0,DRIVE.centerDistance,2.32);a.drive.add(inputShaft);
 const caseMat=mat.frame.clone();caseMat.transparent=true;caseMat.side=T.DoubleSide;
 const face=new T.Shape();face.moveTo(-.41,-.4);face.lineTo(.41,-.4);face.lineTo(.41,.72);face.lineTo(-.41,.72);face.closePath();
 for(const y of [0,DRIVE.centerDistance]){const hole=new T.Path();hole.absarc(0,y,.1,0,Math.PI*2,true);face.holes.push(hole);}
 const cover=new T.Mesh(new T.ExtrudeGeometry(face,{depth:.07,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:2,curveSegments:48}),caseMat);cover.position.z=2.21;a.drive.add(cover);
 // Four fixed casing walls; only the front service cover is cut away.
 for(const [size,pos]of [[[.06,1.12,.3],[-.41,.16,2.12]],[[.06,1.12,.3],[.41,.16,2.12]],[[.88,.06,.3],[0,-.4,2.12]],[[.88,.06,.3],[0,.72,2.12]]]){
  const wall=new T.Mesh(new T.BoxGeometry(...size),mat.frame);wall.position.set(...pos);a.drive.add(wall);wall.castShadow=true;
 }
 // Bearing outer race is fixed. Inner race follows its shaft, rolling elements orbit inside.
 const outer=new T.Mesh(new T.TorusGeometry(.155,.028,12,96),mat.steel);outer.position.z=.157;a.bearing.add(outer);
 const inner=new T.Mesh(new T.TorusGeometry(.096,.019,12,96),mat.chrome);inner.position.z=.172;a.bearing.add(inner);
 const cage=new T.Group();cage.position.z=.169;a.bearing.add(cage);
 for(let i=0;i<12;i++){const ball=new T.Mesh(new T.SphereGeometry(.017,16,12),mat.chrome),angle=i*Math.PI/6;ball.position.set(Math.cos(angle)*.125,Math.sin(angle)*.125,0);cage.add(ball);}
 const grease=new T.Mesh(new T.TorusGeometry(.126,.006,8,96),new T.MeshStandardMaterial({color:0x31332c,roughness:.25}));grease.position.z=.156;a.bearing.add(grease);
 return {input,output,caseMat,inner,cage,inputShaft,update(angle,opening,exploded){
  output.rotation.z=angle;input.rotation.z=-DRIVE.ratio*angle;
  a.shaft.rotation.z=inner.rotation.z=angle;
  a.coupling.rotation.z=a.fan.rotation.z=-DRIVE.ratio*angle;
  // Rolling-element cage speed for an inner-driven ball bearing with a fixed outer race.
  cage.rotation.z=angle*.432;
  cage.children.forEach(ball=>{ball.rotation.z=-angle*3.2;});
  caseMat.opacity=1-opening*.91;
  // Transmission slows for the exploded teaching pose; no random movement is added.
  inputShaft.position.z=2.32+exploded*.10;
 }};
}
// Equal-pulley drive. The complete closed path guarantees a taut belt with tangent spans.
export function addBeltDrive(parent,mat){
 const x0=-5.88,x1=-5.02,y=1.24,z=-1.94,r=.18,d=x1-x0,total=2*d+2*Math.PI*r;
 const group=new T.Group();parent.add(group);const pulleys=[];
 for(const x of [x0,x1]){
  const wheel=new T.Group();wheel.position.set(x,y,z);group.add(wheel);
  const hub=new T.Mesh(new T.CylinderGeometry(r,r,.13,96),mat.steel);hub.rotation.x=Math.PI/2;wheel.add(hub);
  const axle=new T.Mesh(new T.CylinderGeometry(.065,.065,.54,64),mat.chrome);axle.rotation.x=Math.PI/2;axle.position.z=.15;wheel.add(axle);
  for(let i=0;i<6;i++){const bolt=new T.Mesh(new T.CylinderGeometry(.013,.013,.02,6),mat.chrome);bolt.rotation.x=Math.PI/2;bolt.position.set(Math.cos(i*Math.PI/3)*.12,Math.sin(i*Math.PI/3)*.12,-.077);wheel.add(bolt);}
  pulleys.push(wheel);
 }
 const point=t=>{
  let s=((t%1)+1)%1*total;
  if(s<d)return new T.Vector3(x0+s,y+r,z);
  s-=d;if(s<Math.PI*r){const a=Math.PI/2-s/r;return new T.Vector3(x1+Math.cos(a)*r,y+Math.sin(a)*r,z);}
  s-=Math.PI*r;if(s<d)return new T.Vector3(x1-s,y-r,z);
  s-=d;const a=-Math.PI/2-s/r;return new T.Vector3(x0+Math.cos(a)*r,y+Math.sin(a)*r,z);
 };
 const segments=180,vertices=[],indices=[];
 for(let i=0;i<=segments;i++){const p=point(i/segments);vertices.push(p.x,p.y,p.z-.05,p.x,p.y,p.z+.05);if(i){const j=(i-1)*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
 const rubber=mat.rubber.clone();rubber.side=T.DoubleSide;const belt=new T.Mesh(geo,rubber);group.add(belt);
 const ribs=new T.InstancedMesh(new T.BoxGeometry(.009,.007,.11),mat.rubber,90);group.add(ribs);const dummy=new T.Object3D();
 return {radius:r,length:total,point,update(distance){
  pulleys.forEach(wheel=>wheel.rotation.z=-distance/r);
  for(let i=0;i<90;i++){const t=i/90+distance/total,p=point(t),ahead=point(t+.0001);dummy.position.copy(p);dummy.rotation.z=Math.atan2(ahead.y-p.y,ahead.x-p.x);dummy.updateMatrix();ribs.setMatrixAt(i,dummy.matrix);}ribs.instanceMatrix.needsUpdate=true;
 }};
}
