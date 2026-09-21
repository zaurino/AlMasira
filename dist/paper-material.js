import * as T from './assets/three.module.js';
import {ramp,cameraAt} from './journey-timeline.js';
const random=(i,k=0)=>{const x=Math.sin(i*127.1+k*311.7)*43758.5453;return x-Math.floor(x);};
const mix=(a,b,t)=>a+(b-a)*t;
// No simulation clock: deformations and trajectories can be evaluated in either direction.
export function createPaperProcess({group,web,paperRoll,scraps}){
 const materialRoot=new T.Group();materialRoot.name='physical-paper-process';group.add(materialRoot);
 const add=(geo,mat)=>{const m=new T.Mesh(geo,mat);materialRoot.add(m);return m;};
 const loader=typeof document!=='undefined'?new T.TextureLoader():null;
 const print=loader?.load('./assets/process/waste-print.png',()=>dispatchEvent(new Event('masira:ready')));
 if(print){print.colorSpace=T.SRGBColorSpace;print.anisotropy=8;}
 // Fine multiscale fiber grain; data textures also work in the deterministic node checks.
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const n=random(x+y*size,2),streak=Math.sin(x*.3+Math.sin(y*.05)*5)*Math.sin(y*.7+x*.05);
  const v=185+n*40+streak*19,idx=(y*size+x)*4;
  data[idx]=v;data[idx+1]=v;data[idx+2]=v;data[idx+3]=255;
 }
 const grain=new T.DataTexture(data,size,size);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(3,5);grain.needsUpdate=true;
 const dryColors=[0xd5cdb8,0xb18a55,0xe0d8c8,0xb5a18a,0xd7d0bc];
 const papers=[];
 // Each sheet is a unique irregular, creased mesh. The very same printed UV surface tears apart.
 for(let i=0;i<24;i++){
  const printed=i%5!==1&&i%5!==3,w=.19+random(i,1)*.2,h=.23+random(i,2)*.22;
  const geo=new T.PlaneGeometry(w,h,12,14).toNonIndexed(),pos=geo.attributes.position,uv=geo.attributes.uv;
  const source=new Float32Array(pos.array.length);
  for(let j=0;j<pos.count;j++){
   const u=uv.getX(j),v=uv.getY(j),x=pos.getX(j),y=pos.getY(j);
   const edge=Math.pow(Math.abs(u-.5)*2,12)+Math.pow(Math.abs(v-.5)*2,12);
   source[j*3]=x+edge*Math.sin(v*133+i*7)*.005;
   source[j*3+1]=y+edge*Math.sin(u*157+i*3)*.005;
   source[j*3+2]=Math.sin(u*12+i)*.017+Math.sin(v*18+i*2)*.010+Math.abs(u-.42)*.09;
   uv.setXY(j,u*(.55+random(i,3)*.4)+random(i,4)*.05,v*(.7+random(i,5)*.25));
  }
  pos.array.set(source);geo.computeVertexNormals();
  const m=new T.MeshPhysicalMaterial({color:dryColors[i%5],map:printed?(print??null):null,bumpMap:grain,bumpScale:.0012,roughness:.92,side:T.DoubleSide,transparent:true,depthWrite:true,clearcoat:0,clearcoatRoughness:.2});
  const sheet=add(geo,m);sheet.name=i===0?'recognizable-printed-reference-sheet':`waste-paper-${i}`;sheet.castShadow=sheet.receiveShadow=true;
  papers.push({sheet,source,i,w,h,baseColor:new T.Color(dryColors[i%5])});
 }
 scraps.forEach(m=>m.visible=false);
 // Uneven wet fibers with varying diameters, flattened lumens and fine split fibrils.
 function fiberGeometry(seed){
  const points=Array.from({length:9},(_,j)=>new T.Vector3((j/8-.5)*.032,Math.sin(j*.8+seed)*.0025,Math.sin(j*1.6+seed)*.001));
  const geo=new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.00062,6,false);
  const a=geo.attributes.position;
  for(let j=0;j<a.count;j++){const x=a.getX(j),taper=.25+.75*Math.sin(Math.PI*Math.min(1,Math.max(0,(x+.019)/.038)));
   a.setXYZ(j,x,a.getY(j)*(1+random(j,seed)*.12),a.getZ(j)*(.48+random(j,seed+2)*.2)*taper);
  }geo.computeVertexNormals();return geo;
 }
 const fiberMats=Array.from({length:8},(_,i)=>new T.MeshPhysicalMaterial({color:new T.Color(0xcfc7ad).lerp(new T.Color(0xe2dec9),i/9),roughness:.68,metalness:0,transparent:true,opacity:1,clearcoat:.28,clearcoatRoughness:.3,bumpMap:grain,bumpScale:.00009,side:T.DoubleSide}));
 const fiberSets=fiberMats.map((m,i)=>{const obj=new T.InstancedMesh(fiberGeometry(i),m,450);obj.name=`cellulose-fiber-variation-${i}`;obj.frustumCulled=false;materialRoot.add(obj);return obj;});
 const fibrils=new T.InstancedMesh(new T.CylinderGeometry(.000045,.0001,.004,4),fiberMats[0],1200);materialRoot.add(fibrils);fibrils.frustumCulled=false;
 const guide=add(fiberGeometry(4),fiberMats[4]);guide.name='reference-cellulose-fiber';guide.scale.set(1.5,1,1);
 // Water is a rippled volume surface with an incoming stream, not an opaque white liquid.
 const waterMat=new T.MeshPhysicalMaterial({color:0x7c8f79,roughness:.17,transparent:true,opacity:.35,metalness:.05,clearcoat:1,side:T.DoubleSide,depthWrite:false});
 const basin=add(new T.CircleGeometry(1.06,100),waterMat);basin.rotation.x=-Math.PI/2;basin.position.set(-10.6,2.025,0);
 const stream=add(new T.CylinderGeometry(.033,.055,.72,16,12,true),waterMat);stream.position.set(-10.99,2.38,-.5);
 const surfaceBase=basin.geometry.attributes.position.array.slice();
 const clumpMat=new T.MeshPhysicalMaterial({color:0xb6b39b,roughness:.55,bumpMap:grain,bumpScale:.0025,clearcoat:.35,transparent:true,opacity:.82});
 const clumpGeo=new T.IcosahedronGeometry(.021,2),cp=clumpGeo.attributes.position;
 for(let i=0;i<cp.count;i++){const v=new T.Vector3().fromBufferAttribute(cp,i);v.multiplyScalar(.7+random(i,4)*.65);cp.setXYZ(i,v.x,v.y*.42,v.z);}clumpGeo.computeVertexNormals();
 const pulpClumps=new T.InstancedMesh(clumpGeo,clumpMat,1200);materialRoot.add(pulpClumps);pulpClumps.frustumCulled=false;
 // A woven forming fabric becomes visible between the first deposited fibers.
 const wireMat=new T.MeshStandardMaterial({color:0x747d72,metalness:.6,roughness:.6});
 const wire=new T.Group();wire.position.set(-7.1,1.49,0);materialRoot.add(wire);
 for(let i=0;i<90;i++){
  const m=new T.Mesh(new T.CylinderGeometry(.00017,.00017,.38,4),wireMat);m.rotation.z=Math.PI/2;m.position.z=(i-45)*.003;wire.add(m);
 }
 for(let i=0;i<110;i++){
  const m=new T.Mesh(new T.CylinderGeometry(.00017,.00017,.27,4),wireMat);m.rotation.x=Math.PI/2;m.position.x=(i-55)*.003;wire.add(m);
 }
 // Recognizable contaminants: bent staples and thin packaging fragments.
 const contaminants=[];
 const stapleMat=new T.MeshStandardMaterial({color:0x89938d,metalness:.85,roughness:.3});
 const plasticMat=new T.MeshPhysicalMaterial({color:0x7c9d9a,roughness:.3,transparent:true,opacity:.65,side:T.DoubleSide});
 for(let i=0;i<28;i++){
  let geo;
  if(i%2===0){const curve=new T.CatmullRomCurve3([[-.003,-.002,0],[-.003,.002,0],[.003,.002,0],[.003,-.002,.001]].map(v=>new T.Vector3(...v)));geo=new T.TubeGeometry(curve,10,.00024,5,false);}
  else {geo=new T.PlaneGeometry(.007,.004,4,3);const a=geo.attributes.position;for(let j=0;j<a.count;j++)a.setZ(j,Math.sin(j*1.7)*.0007);geo.computeVertexNormals();}
  const object=add(geo,i%2===0?stapleMat:plasticMat);contaminants.push(object);
 }
 const clock={value:0},dry={value:0},press={value:0},formation={value:1};
 // Shader links material moisture, density and microtexture to actual position on the web.
 const webMat=new T.MeshPhysicalMaterial({color:0xe6dfcc,side:T.DoubleSide,bumpMap:grain,bumpScale:.001,roughness:.7,clearcoat:.3,clearcoatRoughness:.25});
 webMat.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{paperClock:clock,paperDry:dry,paperPress:press,paperFormation:formation});
  shader.vertexShader='varying vec3 paperLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaperLocal=position;');
  shader.fragmentShader='varying vec3 paperLocal;uniform float paperClock;uniform float paperDry;uniform float paperPress;uniform float paperFormation;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float n=fract(sin(dot(floor(paperLocal.xz*1600.),vec2(12.9898,78.233)))*43758.5453);
 float localDry=smoothstep(-.6,5.7,paperLocal.x)*paperDry;
 float grainValue=.94+.06*n;
 diffuseColor.rgb*=mix(vec3(.59,.64,.55),vec3(1.),localDry)*grainValue;
 if(paperLocal.x< -6.8 && n>paperFormation)discard;
 `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=mix(.35,.91,smoothstep(-.6,5.7,paperLocal.x)*paperDry);
 `);
 };
 web.material=webMat;const webSource=web.geometry.attributes.position.array.slice();
 const reelMat=new T.MeshStandardMaterial({color:0xe5deca,roughness:.94,bumpMap:grain,bumpScale:.0008});
 paperRoll.traverse(o=>{if(o.isMesh&&o.material.color?.getHex()===0xf4edcf)o.material=reelMat;});
 // Colorless drainage droplets follow downward trajectories from the wire and nip.
 const drops=new T.InstancedMesh(new T.SphereGeometry(.004,6,5),new T.MeshPhysicalMaterial({color:0xb8c8be,roughness:.07,transparent:true,opacity:.48,clearcoat:1}),450);materialRoot.add(drops);drops.frustumCulled=false;
 const dummy=new T.Object3D(),target=new T.Vector3(),origin=new T.Vector3();
 return function updatePaper(p){
  const shot=cameraAt(p),wet=ramp(p,.22,.275),tear=ramp(p,.265,.34),network=ramp(p,.63,.70),pressed=ramp(p,.75,.80),dried=ramp(p,.81,.865);
  clock.value=p*95;dry.value=dried;press.value=pressed;formation.value=network;
  for(const {sheet,source,i,baseColor}of papers){
   const entry=ramp(p,.18+i*.0005,.25+i*.0005),damage=ramp(p,.265+i*.00065,.34+i*.00065);
   const angle=i*2.399+p*48,radius=.20+(i%4)*.18;
   // Inlet spacing and separate radial lanes avoid coincident sheets before soaking.
   sheet.position.set(mix(-12.55+(i%4)*.16,-10.6+Math.cos(angle)*radius,entry),mix(2.62+Math.floor(i/4)*.024,2.075-(i%3)*.012,entry),mix((i%5-2)*.19,Math.sin(angle)*radius,entry));
   if(i===0&&p>.275){const follow=ramp(p,.275,.303);target.set(-10.6,2.055,0);sheet.position.lerp(target,follow);}
   sheet.rotation.set(-Math.PI/2+Math.sin(angle)*wet*.16,Math.sin(angle*.7)*wet*.12,angle*.18);
   const pos=sheet.geometry.attributes.position;
   for(let j=0;j<pos.count;j++){
    const fragment=Math.floor(j/3),delay=random(fragment,i)*.30,breakage=Math.max(0,(damage-delay)/(1-delay));
    const sx=source[j*3],sy=source[j*3+1],sz=source[j*3+2];
    const drift=breakage*breakage;
    pos.setXYZ(j,sx+Math.sin(fragment*1.7+i)*drift*.12,sy+Math.cos(fragment*2.1+i)*drift*.1,sz*(1-wet*.6)+Math.sin(sx*40+sy*31+p*50)*wet*.008-drift*(.03+random(fragment,8)*.2));
   }
   pos.needsUpdate=true;sheet.geometry.computeVertexNormals();
   sheet.material.color.copy(baseColor).multiplyScalar(1-wet*.23);
   sheet.material.roughness=.93-wet*.43;sheet.material.clearcoat=wet*.42;
   sheet.material.opacity=1-ramp(p,.327+i*.0005,.358+i*.0005);sheet.visible=sheet.material.opacity>.002;
  }
  // Resolve soft-sheet center contacts in a fixed iteration order, reproducible on reverse scroll.
  // This is a contact approximation, not a cloth or fluid solver.
  if(p>.21&&p<.31)for(let iteration=0;iteration<3;iteration++)for(let i=1;i<papers.length;i++)for(let j=0;j<i;j++){
   const a=papers[i].sheet.position,b=papers[j].sheet.position;
   const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz),gap=.075*(1-wet*.35);
   if(d<gap&&Math.abs(a.y-b.y)<.035){const push=(gap-d)*.5;a.x+=(dx/(d||1))*push;a.z+=(dz/(d||1))*push;a.y+=.001;}
  }
  const surface=basin.geometry.attributes.position;
  for(let j=0;j<surface.count;j++){const x=surfaceBase[j*3],y=surfaceBase[j*3+1];surface.setZ(j,Math.sin(x*22+p*95)*Math.cos(y*19-p*65)*.009*wet);}
  surface.needsUpdate=true;basin.geometry.computeVertexNormals();stream.scale.y=.05+ramp(p,.215,.235)*.95;
  stream.visible=p>.20&&p<.36;basin.visible=p<.36;
  for(let i=0;i<1200;i++){
   const a=random(i,1)*Math.PI*2+p*25,r=Math.sqrt(random(i,2))*.98;
   dummy.position.set(-10.6+Math.cos(a)*r,2.035-random(i,3)*.08,Math.sin(a)*r);dummy.rotation.set(i,p*14,i*.7);
   dummy.scale.setScalar((.2+random(i,6))*ramp(p,.265+random(i,5)*.04,.35));dummy.updateMatrix();pulpClumps.setMatrixAt(i,dummy.matrix);
  }pulpClumps.instanceMatrix.needsUpdate=true;pulpClumps.visible=p>.265&&p<.37;
  const micro=ramp(p,.305,.342)*(1-ramp(p,.70,.735));origin.fromArray(shot.target);
  if(p<.34)origin.set(-10.6,2.055,0);
  for(let i=0;i<contaminants.length;i++){
   const object=contaminants[i],removed=ramp(p,.443,.49);
   object.position.set(origin.x+(random(i,5)-.5)*.11,origin.y+(random(i,3)-.5)*.07-removed*.17,origin.z+(random(i,4)-.5)*.08+removed*.07);
   object.rotation.set(i,p*17,i*.3);object.visible=p>.325&&p<.515;
  }
  guide.position.copy(origin);guide.rotation.set(.1,0,Math.sin(p*15)*.1);guide.visible=micro>.05;
  fiberMats.forEach(m=>{m.opacity=micro;m.clearcoat=.38*(1-dried);});
  for(let batch=0;batch<fiberSets.length;batch++){
   const set=fiberSets[batch];
   for(let j=0;j<450;j++){
    const i=batch*450+j,a=random(i,1)*Math.PI*2+p*9,r=Math.sqrt(random(i,2))*.062;
    target.set(origin.x+(random(i,3)-.5)*.30,origin.y+Math.cos(a)*r,origin.z+Math.sin(a)*r);
    dummy.position.set(mix(target.x,origin.x+(random(i,4)-.5)*.35,network),mix(target.y,1.496+random(i,5)*.0018,network),mix(target.z,(random(i,6)-.5)*.24,network));
    dummy.rotation.set((1-network)*a,random(i,7)*6.28,(1-network)*Math.sin(a));
    dummy.scale.set(.35+random(i,8)*1.65,(.45+random(i,9))*(1-network*.55),.6+random(i,10)*.7);dummy.updateMatrix();set.setMatrixAt(j,dummy.matrix);
    if(i<1200){dummy.scale.multiplyScalar(.8);dummy.position.x+=.012;dummy.rotation.z+=.65;dummy.updateMatrix();fibrils.setMatrixAt(i,dummy.matrix);}
   }set.instanceMatrix.needsUpdate=true;
  }fibrils.instanceMatrix.needsUpdate=true;wire.visible=p>.61&&p<.74;
  const wp=web.geometry.attributes.position;
  for(let j=0;j<wp.count;j++){
   const x=webSource[j*3],y=webSource[j*3+1];
   const ripple=x< -3.2?Math.sin(x*16+p*95)*.003*(1-pressed):0;
   wp.setY(j,y+ripple); // preserve existing nip path; material roughness conveys consolidation.
  }wp.needsUpdate=true;
  for(let i=0;i<450;i++){
   const inPress=i>220,phase=(p*32+random(i,1))%1;
   dummy.position.set(inPress?-2.6+(i%2)*1.1:-7.45+random(i,2)*3.3,(inPress?1.575:1.48)-phase*.8, (random(i,3)-.5)*2.55);
   dummy.scale.set(.45,1.8+phase*2,.45);dummy.rotation.set(0,0,0);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
  }drops.instanceMatrix.needsUpdate=true;drops.visible=p>.63&&p<.805;
 };
}
