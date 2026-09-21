import * as T from './assets/three.module.js';
import {createPaperProcess} from './paper-material.js';
import {sample,ramp,cameraAt} from './journey-timeline.js';
export function createJourney({scene,root,camera,mat,rollers,agitator,scraps,pulp,web,paperRoll}){
 const group=new T.Group();root.add(group);
 const mesh=(geo,material,parent=group)=>{const m=new T.Mesh(geo,material);parent.add(m);return m;};
 const metal=new T.MeshStandardMaterial({color:0x36554c,metalness:.75,roughness:.3,side:T.DoubleSide});
 const glass=new T.MeshPhysicalMaterial({color:0x97d4c0,transparent:true,opacity:.13,metalness:.1,roughness:.15,side:T.DoubleSide,depthWrite:false});
 const panels=[];
 for(let i=0;i<6;i++){
  const g=new T.Group();g.position.set(-7.8+i*3,1.85,1.85);group.add(g);
  const frame=mesh(new T.BoxGeometry(2.82,2.45,.08),metal,g);
  const pane=mesh(new T.BoxGeometry(2.48,1.35,.09),glass,g);pane.position.set(0,.15,.06);
  // Transparent central insert and solid perimeter.
  frame.geometry.dispose();frame.geometry=new T.BoxGeometry(2.82,.32,.08);frame.position.y=-1;
  for(const x of [-1.36,1.36]){const post=mesh(new T.BoxGeometry(.10,2.4,.10),metal,g);post.position.x=x;}
  const top=mesh(new T.BoxGeometry(2.82,.16,.12),metal,g);top.position.y=1.12;
  panels.push(g);
 }
 const hood=mesh(new T.BoxGeometry(5.8,.16,3.8),metal);hood.position.set(2.4,3.25,0);
 const inlet=mesh(new T.BoxGeometry(2,.12,1.1),mat.rubber);inlet.position.set(-11.8,2.5,0);inlet.rotation.z=-.13;
 const waterMat=new T.MeshPhysicalMaterial({color:0x76a99a,transparent:true,opacity:.2,roughness:.2,side:T.DoubleSide,depthWrite:false});
 const waterClock={value:0};
 waterMat.onBeforeCompile=shader=>{shader.uniforms.scrollTime=waterClock;shader.vertexShader="uniform float scrollTime;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n transformed += normal * sin(position.x*28.0+scrollTime)*sin(position.z*24.0-scrollTime*.7)*.006;");};
 const water=mesh(new T.SphereGeometry(1.03,32,20),waterMat);water.position.set(-10.6,1.5,0);water.scale.y=.7;
 const lumen=new T.PointLight(0xc3efe0,1,3,.7);scene.add(lumen);
 const tubePath=new T.CatmullRomCurve3([[-10.6,2.07,0],[-9.8,2.075,0],[-9,2.075,0],[-8.2,1.95,0],[-7.6,1.5,0]].map(v=>new T.Vector3(...v)));
 const tube=mesh(new T.TubeGeometry(tubePath,100,.085,16,false),glass);
 // Microscopic contents live at actual small coordinates, inside the existing line.
 const fiberGeo=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.013,0,0),new T.Vector3(-.005,.003,.002),new T.Vector3(.006,-.002,0),new T.Vector3(.015,.002,.001)]),10,.0008,4,false);
 const fiberMat=new T.MeshStandardMaterial({color:0xe8dfbd,roughness:.86,transparent:true,opacity:1});
 const fibers=new T.InstancedMesh(fiberGeo,fiberMat,1600);group.add(fibers);fibers.frustumCulled=false;
 const dummy=new T.Object3D();
 const guideMat=new T.MeshStandardMaterial({color:0xffe0a0,emissive:0xa87c2d,emissiveIntensity:.5,roughness:.6});
 const guide=mesh(fiberGeo,guideMat);guide.scale.setScalar(1.8);
 const dirtMat=new T.MeshStandardMaterial({color:0x252c29,roughness:.7,transparent:true});
 const dirt=new T.InstancedMesh(new T.IcosahedronGeometry(.0018,0),dirtMat,220);group.add(dirt);dirt.frustumCulled=false;
 const bubbleMat=new T.MeshPhysicalMaterial({color:0xcbece4,transparent:true,opacity:.24,roughness:.05,metalness:.25,depthWrite:false});
 const bubbles=new T.InstancedMesh(new T.SphereGeometry(.003,8,6),bubbleMat,120);group.add(bubbles);bubbles.frustumCulled=false;
 const screen=new T.Group();screen.position.set(-9.8,2.075,0);group.add(screen);
 for(let i=-7;i<=7;i++){
  const bar=mesh(new T.BoxGeometry(.003,.14,.0016),mat.steel,screen);bar.position.z=i*.009;
  const cross=mesh(new T.BoxGeometry(.003,.0016,.14),mat.steel,screen);cross.position.y=i*.009;
 }
 const rejectPath=new T.CatmullRomCurve3([[-9.8,2.075,0],[-9.8,1.96,.08],[-9.65,1.84,.12]].map(v=>new T.Vector3(...v)));
 mesh(new T.TubeGeometry(rejectPath,30,.022,10,false),glass);
 const tornMat=new T.MeshStandardMaterial({color:0xc9bda1,roughness:.8,side:T.DoubleSide,transparent:true});
 const pieces=new T.InstancedMesh(new T.PlaneGeometry(.026,.035,2,2),tornMat,350);group.add(pieces);pieces.frustumCulled=false;
 const mistMat=new T.MeshBasicMaterial({color:0xc4e3d5,transparent:true,opacity:.18,depthWrite:false});
 const mist=new T.InstancedMesh(new T.SphereGeometry(.018,6,4),mistMat,100);group.add(mist);mist.frustumCulled=false;
 const finished=mesh(new T.CylinderGeometry(.78,.78,2.7,48),mat.paper);finished.rotation.x=Math.PI/2;finished.position.set(9.6,.45,2.5);
 const seeded=(i,n)=>{const x=Math.sin(i*127.1+n*311.7)*43758.5453;return x-Math.floor(x);};
 const tmp=new T.Vector3();
 const originalWeb=web.geometry.attributes.position.array.slice();
 const paperColor=new T.Color(0xf4edcf),wetColor=new T.Color(0x859e8e);
 const fiberPosition=(p)=>{
  if(p<.61)return tubePath.getPoint(ramp(p,.34,.62));
  return new T.Vector3(-7.6+ramp(p,.61,.71)*2.3,1.50,0);
 };
 const updatePaper=createPaperProcess({group,web,paperRoll,scraps});
 return function update(p,width,height){
  const s=sample(p),shot=cameraAt(p);waterClock.value=p*95;
  panels.forEach((g,i)=>{const travel=ramp(p,.068+i*.004,.13+i*.004)*(1-ramp(p,.93+i*.003,.975+i*.003));g.position.y=1.85+travel*2.8;});
  hood.position.y=3.25+s.open*3;
  camera.position.fromArray(shot.position);tmp.fromArray(shot.target);
  const outside=1-ramp(p,.06,.17)+ramp(p,.94,1);
  if(width<700)camera.position.addScaledVector(camera.position.clone().sub(tmp),outside*.65);
  camera.clearViewOffset();camera.near=.00015;camera.fov=42+10*ramp(p,.12,.22)*(1-ramp(p,.92,.99));camera.updateProjectionMatrix();camera.lookAt(tmp);camera.updateMatrixWorld();
  lumen.position.copy(camera.position);lumen.intensity=.08+.15*s.micro;lumen.distance=.15+2*(1-s.micro);
  scene.fog=new T.FogExp2(0x173d34,s.micro*11);
  for(const {group:g,r}of rollers)g.rotation.z=-s.rotation/r;
  agitator.rotation.y=s.rotation*2;
  pulp.material=waterMat;
  scraps.forEach((m,i)=>{
   const a=i*2.4+p*50,r=.25+(i%5)*.15;
   const entry=ramp(p,.18,.25);
   m.position.set(-12.7+entry*2.1+Math.cos(a)*r*entry,2.55-entry*.46,Math.sin(a)*r*entry);
   m.rotation.set(entry*.2,a,entry*.12);m.scale.setScalar(1-s.tear*.995);
  });
  tornMat.opacity=ramp(p,.255,.285)*(1-ramp(p,.31,.35));
  for(let i=0;i<350;i++){
   const a=seeded(i,1)*Math.PI*2+p*35,r=seeded(i,2)*.9;
   dummy.position.set(-10.6+Math.cos(a)*r,2.07-seeded(i,3)*s.tear*.65,Math.sin(a)*r);
   dummy.rotation.set(a,p*12,a*.5);dummy.scale.setScalar(1-s.tear*.8);dummy.updateMatrix();pieces.setMatrixAt(i,dummy.matrix);
  }pieces.instanceMatrix.needsUpdate=true;
  const center=p>=.34&&p<=.70?new T.Vector3(...shot.target):fiberPosition(p);guide.position.copy(center);guide.rotation.set(0,0,Math.sin(p*40)*.4);
  guideMat.transparent=true;guideMat.opacity=ramp(p,.30,.34)*(1-ramp(p,.695,.72));
  fiberMat.opacity=ramp(p,.285,.33)*(1-ramp(p,.695,.72));
  for(let i=0;i<1600;i++){
   const a=seeded(i,1)*Math.PI*2+p*9,rad=Math.sqrt(seeded(i,2))*.065;
   const nx=(seeded(i,4)-.5)*.35,nz=(seeded(i,5)-.5)*.18;
   dummy.position.set(center.x+(seeded(i,3)-.5)*.28,center.y+Math.cos(a)*rad,center.z+Math.sin(a)*rad);
   dummy.position.lerp(new T.Vector3(center.x+nx,1.497+seeded(i,6)*.0015,nz),s.network);
   dummy.rotation.set((1-s.network)*a,seeded(i,7)*6.28,(1-s.network)*Math.sin(a));dummy.scale.setScalar(.55+seeded(i,8));dummy.updateMatrix();fibers.setMatrixAt(i,dummy.matrix);
  }fibers.instanceMatrix.needsUpdate=true;
  dirtMat.opacity=ramp(p,.31,.35)*(1-ramp(p,.55,.58));
  for(let i=0;i<220;i++){
   const separation=i<80?s.clean:s.deink;
   dummy.position.set(center.x+(seeded(i,4)-.5)*.13,center.y+(seeded(i,2)-.5)*.065+separation*(i<80?-.13:.13),center.z+(seeded(i,3)-.5)*.08);
   dummy.rotation.set(i,p*8,i);dummy.scale.set(1,i<80?3:1,1);dummy.updateMatrix();dirt.setMatrixAt(i,dummy.matrix);
  }dirt.instanceMatrix.needsUpdate=true;
  bubbleMat.opacity=ramp(p,.485,.515)*(1-ramp(p,.56,.60))*.35;
  for(let i=0;i<120;i++){
   dummy.position.set(center.x+(seeded(i,1)-.5)*.15,center.y+(seeded(i,2)-.5)*.12+s.deink*.09,center.z+(seeded(i,3)-.5)*.10);dummy.scale.setScalar(.5+seeded(i,4));dummy.updateMatrix();bubbles.setMatrixAt(i,dummy.matrix);
  }bubbles.instanceMatrix.needsUpdate=true;
  mat.paper.color.copy(paperColor).lerp(wetColor,ramp(p,.20,.28)*(1-s.dry));mat.paper.roughness=.3+s.dry*.6;
  // The web becomes visible as the fiber network binds; the operating exterior retains its web.
  mat.paper.transparent=true;mat.paper.opacity=1-s.micro*(1-s.network);
  const positions=web.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   const x=originalWeb[i*3],y=originalWeb[i*3+1];
   const forming=x< -3.2?Math.sin(x*15+p*95)*.006*(1-s.press):0;
   positions.setY(i,y+forming);
  }positions.needsUpdate=true;
  paperRoll.scale.set(1,1,1);paperRoll.scale.x=paperRoll.scale.y=.78+s.wind*.22;
  finished.scale.setScalar(ramp(p,.89,.965));
  mistMat.opacity=(ramp(p,.74,.77)*(1-ramp(p,.86,.89)))*.24;
  for(let i=0;i<100;i++){
   const drying=ramp(p,.80,.82);dummy.position.set(-2.6+drying*(2.7+seeded(i,1)*4),1.57+(drying?seeded(i,2)*1.5:-seeded(i,2)*.7), (seeded(i,3)-.5)*2.6);dummy.position.y+=Math.sin(p*45+i)*.06;dummy.scale.setScalar(drying?1+seeded(i,5)*2:.3);dummy.updateMatrix();mist.setMatrixAt(i,dummy.matrix);
  }mist.instanceMatrix.needsUpdate=true;
  // Replaced material representations must never render over the detailed paper surfaces.
  for(const obsolete of [fibers,guide,pieces,water,mist,pulp])if(obsolete)obsolete.visible=false;
  scraps.forEach(m=>m.visible=false);
  updatePaper(p);
  return s;
 };
}
