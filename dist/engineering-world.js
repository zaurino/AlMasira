import * as T from './assets/three.module.js';
import {addFunctionalDrive,addBeltDrive} from './mechanical-drive.js';
import {RoundedBoxGeometry} from './assets/addons/geometries/RoundedBoxGeometry.js';
import {modules,moduleState,cameraAt,ramp} from './engineering-timeline.js';
export function createEngineering({scene,root,camera,mat,rollers,agitator,scraps,pulp,web,tank,moving=[]}){
 const group=new T.Group();group.name='engineering-reveals';root.add(group);
 const box=(parent,size,pos,material)=>{const m=new T.Mesh(new RoundedBoxGeometry(...size,2,Math.min(.02,...size.map(x=>x*.15))),material);m.position.set(...pos);parent.add(m);m.castShadow=m.receiveShadow=true;return m;};
 const cyl=(parent,r,length,pos,material,segments=96)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,length,segments),material);m.rotation.x=Math.PI/2;m.position.set(...pos);parent.add(m);m.castShadow=m.receiveShadow=true;return m;};
 const material=mat.frame.clone();material.side=T.DoubleSide;
 const assemblies=[];
 for(const [index,config]of modules.entries()){
  const {x,y}=config,assembly=new T.Group();assembly.position.set(x,0,0);group.add(assembly);
  const cover=new T.Group();cover.position.set(-.85,0,2.48);assembly.add(cover);
  const guardWidth=index===1?2.9:1.7;
  box(cover,[guardWidth,1.7,.06],[guardWidth/2,1.6,0],material);
  for(let k=0;k<9;k++)box(cover,[guardWidth*.55,.017,.006],[guardWidth/2,1.15+k*.08,.036],mat.dark);
  box(cover,[.07,.32,.07],[guardWidth-.12,1.65,.06],mat.chrome);
  for(const h of [1.02,2.15])cyl(cover,.055,.12,[0,h,0],mat.steel);
  const drive=new T.Group();drive.position.set(0,y,0);assembly.add(drive);
  const bearing=new T.Group();bearing.position.z=1.78;drive.add(bearing);
  box(bearing,[.53,.58,.24],[0,0,0],mat.frame);cyl(bearing,.20,.26,[0,0,.01],mat.chrome);
  for(const dx of [-.18,.18])for(const dy of [-.2,.2])cyl(bearing,.035,.045,[dx,dy,.15],mat.steel,6);
  const shaft=new T.Group();shaft.position.z=1.98;drive.add(shaft);cyl(shaft,.085,.55,[0,0,0],mat.chrome);
  const coupling=new T.Group();coupling.position.z=2.27;drive.add(coupling);
  cyl(coupling,.19,.16,[0,0,0],mat.steel);cyl(coupling,.17,.055,[0,0,.08],mat.rubber);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;cyl(coupling,.023,.035,[Math.cos(a)*.135,Math.sin(a)*.135,.095],mat.chrome,6);}
  const motor=new T.Group();motor.position.z=2.72;drive.add(motor);cyl(motor,.27,.6,[0,0,0],mat.frame);
  for(let j=0;j<10;j++)cyl(motor,.294,.024,[0,0,-.27+j*.059],mat.dark);
  cyl(motor,.20,.06,[0,0,.33],mat.dark);box(motor,[.28,.16,.22],[0,.3,.05],mat.frame);
  const fan=new T.Group();fan.position.z=.37;motor.add(fan);
  for(let j=0;j<7;j++){const vane=box(fan,[.16,.035,.016],[.10,0,0],mat.steel);vane.rotation.z=j*Math.PI*2/7;vane.position.set(Math.cos(vane.rotation.z)*.10,Math.sin(vane.rotation.z)*.10,0);}
  box(assembly,[.8,.12,1.2],[0,y-.4,2.52],mat.steel);
  const roof=new T.Group();roof.position.set(0,3.15,0);assembly.add(roof);
  box(roof,[index===3?3.8:1.9,.10,3.3],[0,0,0],mat.frame);
  // Gas strut sections telescope as the local protective cover lifts.
  const struts=[];for(const z of [-1.5,1.5]){const strut=cyl(assembly,.035,.72,[.65,2.85,z],mat.chrome);strut.rotation.x=0;struts.push(strut);}
  const a={config,assembly,cover,roof,motor,coupling,shaft,bearing,fan,struts,drive};
  a.transmission=addFunctionalDrive(a,mat);
  if(index===0){
   // The pulper's horizontal reduction stage feeds an enclosed right-angle drive.
   a.pulperShaft=new T.Group();a.pulperShaft.position.set(0,y,0);assembly.add(a.pulperShaft);
   cyl(a.pulperShaft,.085,1.78,[0,0,.89],mat.chrome);
   box(assembly,[.36,.36,.36],[0,y,0],mat.frame);
   const vertical=new T.Mesh(new T.CylinderGeometry(.085,.085,.36,96),mat.chrome);vertical.position.set(0,y+.18,0);assembly.add(vertical);
  }
  // Motor feet rise to the offset gearbox input centerline.
  for(const x of [-.19,.19])box(assembly,[.08,.5,.55],[x,y-.1,2.72],mat.steel);
  assemblies.push(a);
 }
 // Physical vacuum headers and hydraulic lines remain fixed to the original machine.
 const lines=new T.Group();group.add(lines);
 for(let i=0;i<5;i++){
  const x=-7.4+i*.7;const curve=new T.CatmullRomCurve3([new T.Vector3(x,1.05,0),new T.Vector3(x,.52,.8),new T.Vector3(x,.52,1.4)]);
  const hose=new T.Mesh(new T.TubeGeometry(curve,40,.048,12,false),mat.rubber);lines.add(hose);
 }
 for(const x of [-2.6,-1.5])for(const z of [-1.75,1.75]){
  const cylinder=new T.Mesh(new T.CylinderGeometry(.115,.115,.35,64),mat.steel);cylinder.position.set(x,2.82,z);group.add(cylinder);
  const rod=new T.Mesh(new T.CylinderGeometry(.043,.043,.23,48),mat.chrome);rod.position.set(x,2.6,z);group.add(rod);
 }
 // A real-scale factory hall, fading individually to reveal the unchanged production line.
 const hall=new T.Group();scene.add(hall);hall.name='factory-hall';
 const hallMat=new T.MeshStandardMaterial({color:0x9b9f9a,roughness:.92,transparent:true});
 const floorMat=new T.MeshStandardMaterial({color:0x747b75,roughness:.9,roughnessMap:mat.dark.roughnessMap??null});
 const floor=new T.Mesh(new T.PlaneGeometry(150,150),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.485;floor.receiveShadow=true;scene.add(floor);
 for(let x=-25;x<=25;x+=10){
  for(const z of [-12,12])box(hall,[.35,10,.35],[x,4.5,z],hallMat);
  box(hall,[.25,.45,24],[x,9.3,0],hallMat);
 }
 box(hall,[64,10,.2],[0,4.5,-13],hallMat);
 const lightMat=new T.MeshBasicMaterial({color:0xf0f0e9,transparent:true});
 for(let x=-20;x<=20;x+=8)for(const z of [-6,6])box(hall,[4,.06,.7],[x,8.8,z],lightMat);
 const floorSeam=new T.MeshStandardMaterial({color:0x5c655e,roughness:1,transparent:true});
 for(let x=-30;x<=30;x+=6)box(hall,[.012,.003,50],[x,-.482,0],floorSeam);
 // Secondary web: subdued recycled stock, textured with tiny physical fiber irregularities.
 const grain=new Uint8Array(256*256*4);
 for(let i=0;i<256*256;i++){const n=(Math.imul(i,1103515245)>>>16)&15;grain[i*4]=220+n;grain[i*4+1]=216+n;grain[i*4+2]=200+n;grain[i*4+3]=255;}
 const stockTexture=new T.DataTexture(grain,256,256);stockTexture.wrapS=stockTexture.wrapT=T.RepeatWrapping;stockTexture.repeat.set(18,3);stockTexture.needsUpdate=true;
 const stock=new T.MeshStandardMaterial({color:0xbdb7a2,map:stockTexture,bumpMap:stockTexture,bumpScale:.0006,roughness:.92,side:T.DoubleSide});
 const beltTexture=stockTexture.clone();beltTexture.needsUpdate=true;beltTexture.repeat.set(12,3);
 const beltMaterial=mat.rubber.clone();beltMaterial.map=beltTexture;beltMaterial.bumpMap=beltTexture;beltMaterial.bumpScale=.001;
 root.traverse(object=>{if(object.isMesh&&object.material===mat.rubber){object.geometry.computeBoundingBox();const size=new T.Vector3();object.geometry.boundingBox.getSize(size);if(size.x>3&&size.y<.1)object.material=beltMaterial;}});
 web.material=stock;
 scraps.forEach(s=>s.visible=false);pulp.material=mat.wet;pulp.material.roughness=.58;
 if(tank){tank.material=tank.material.clone();tank.material.transparent=true;tank.material.side=T.DoubleSide;}
 const beltDrive=addBeltDrive(root,mat);
 const travel=Array(5).fill(0);
 const moduleForX=x=>x< -8.0?0:x< -3.2?1:x< -.6?2:x<5.4?3:4;
 const referenceRollers=assemblies.map(a=>rollers.reduce((best,r)=>Math.hypot(r.group.position.x-a.config.x,r.group.position.y-a.config.y)<Math.hypot((best?.group.position.x??999)-a.config.x,(best?.group.position.y??999)-a.config.y)?r:best,null));
 const labelAnchors=[new T.Vector3(),new T.Vector3()];
 return {assemblies,travel,update(p,width,height,dt=0){
  // One phase per mechanically linked module. A stopped camera never stops production.
  for(let i=0;i<5;i++){
   const s=moduleState(p,modules[i]);
   const close=Math.max(s.layers.roller,s.layers.motor);
   travel[i]+=Math.max(0,Math.min(dt,.05))*.42*(1-close*.70);
  }
  stockTexture.offset.x=travel[1]*.23;beltTexture.offset.x=travel[1]*.55;
  const cameraState=cameraAt(p);camera.position.fromArray(cameraState.position);const target=new T.Vector3(...cameraState.target);
  if(width<700)camera.position.addScaledVector(camera.position.clone().sub(target),.6);
  camera.near=.045;camera.far=180;camera.fov=36;camera.clearViewOffset();camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld();
  const hallVisibility=1;
  hallMat.opacity=lightMat.opacity=floorSeam.opacity=Math.min(1,hallVisibility);hall.visible=hallVisibility>.001;
  scene.background=new T.Color(0x454f49);scene.fog=new T.Fog(0x454f49,35,100);
  let active=-1;
  for(let i=0;i<assemblies.length;i++){
   const a=assemblies[i],s=moduleState(p,a.config);if(s.active)active=i;
   const l=s.layers;
   a.cover.rotation.y=0;a.cover.position.z=2.48+l.cover*1.35;
   a.roof.position.y=3.15+l.roof*1.25;
   a.struts.forEach(strut=>{strut.scale.y=1+l.roof*1.7;strut.position.y=2.85+l.roof*.6;});
   a.bearing.position.z=1.78+l.bearing*.30;
   a.shaft.position.z=1.98+l.shaft*.42;
   a.coupling.position.z=2.27+l.coupling*.75;
   a.motor.position.z=2.72+l.motor*1.10;
   const reference=referenceRollers[i];
   const angle=i===0?travel[0]*2:(reference?.group.position.y>1.8?1:-1)*travel[i]/(reference?.r??.5);
   a.transmission.update(angle,s.opening,s.exploded);
   if(a.pulperShaft)a.pulperShaft.rotation.z=angle;
  }
  for(const {g}of moving){
   const reveal=g.userData.reveal;if(!reveal)continue;
   const s=moduleState(p,modules[reveal.module]);
   g.position.z=reveal.direction*s.layers[reveal.role]*(reveal.role==='roller'?.65:.38);
  }
  if(tank)tank.material.opacity=1;
  for(const {group:g,r}of rollers)g.rotation.z=(g.position.y>1.8?1:-1)*travel[moduleForX(g.position.x)]/r;
  agitator.rotation.y=travel[0]*2;
  // Equal forming rollers share a common surface velocity; pulley ratio sets belt speed.
  beltDrive.update(travel[1]*beltDrive.radius/.14);
  const labels=[];
  if(active>=0){
   const a=assemblies[active],state=moduleState(p,a.config),en=typeof document!=='undefined'&&document.documentElement.lang==='en';
   if(state.q>.19&&state.q<.9){
    a.bearing.getWorldPosition(labelAnchors[0]);a.motor.getWorldPosition(labelAnchors[1]);
    if(active===0){agitator.getWorldPosition(labelAnchors[0]);}
    if(active===1){labelAnchors[0].set(-5.8,.52,1.4);root.localToWorld(labelAnchors[0]);}
    if(active===2){labelAnchors[0].set(-2.6,1.08,1.4);root.localToWorld(labelAnchors[0]);}
    if(active===4){a.coupling.getWorldPosition(labelAnchors[0]);}
    const showingTransmission=state.q>.35&&state.q<.74;
    if(showingTransmission)a.transmission.output.getWorldPosition(labelAnchors[0]);
    labels.push({text:showingTransmission?(en?'REDUCTION GEAR · 2:1':'RÉDUCTEUR · 2:1'):a.config.part[en?1:0],point:labelAnchors[0]});
    if(state.exploded>.15)labels.push({text:en?'DRIVE MOTOR':'MOTEUR D’ENTRAÎNEMENT',point:labelAnchors[1]});
   }
  }
  return {active,labels};
 }};
}
