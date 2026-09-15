import * as THREE from './assets/three.module.js';

// An illustrative Fourdrinier line. Every module has a reversible assembly path.
const host = document.querySelector('#machine-viewport');
const canvas = document.querySelector('#machine-canvas');
const clamp = THREE.MathUtils.clamp;
const smooth = (x) => { x=clamp(x,0,1); return x*x*(3-2*x); };
const assembly = { progress:0, paused:matchMedia('(prefers-reduced-motion: reduce)').matches };
const chapters = [
  ['Tout commence par une base.','La structure prend place. Chaque élément trouve sa position dans la ligne.','Everything starts with a foundation.','The structure takes shape. Every component finds its place in the line.','STRUCTURE','STRUCTURE'],
  ['La fibre devient une feuille.','La pâte se répartit sur une toile en mouvement. L’eau s’évacue, les fibres se lient.','Fibre becomes a sheet.','Pulp spreads across a moving wire. Water drains away and the fibres come together.','TABLE DE FORMATION','FORMING SECTION'],
  ['Sous pression, elle prend corps.','Les rouleaux de presse se mettent en place pour extraire l’eau de la feuille humide.','Under pressure, it takes shape.','The press rolls settle into place to remove water from the wet sheet.','PRESSES','PRESS SECTION'],
  ['La chaleur fait son œuvre.','La feuille suit les cylindres de séchage. L’humidité restante s’évapore.','Heat does its work.','The sheet travels around the dryer cylinders. The remaining moisture evaporates.','CYLINDRES SÉCHEURS','DRYER CYLINDERS'],
  ['Une nouvelle vie. En mouvement.','La ligne s’anime. Le papier avance et s’enroule : une nouvelle matière est née.','A new life. In motion.','The line comes alive. Paper travels through and winds onto a reel: a new material is born.','BOBINEUSE','REELING SECTION'],
];
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'}); }
catch { host.classList.add('no-webgl'); document.querySelector('.machine-fallback').hidden=false; }

if(renderer) init();
else {
  function fallback(e){const i=Math.min(4,Math.floor((e?.detail?.progress??1)*5));updateCopy(i,e?.detail?.progress??1);}
  addEventListener('masira:machine',fallback); fallback();
}

function updateCopy(index,progress){
  const en=document.documentElement.lang==='en'; const c=chapters[index];
  document.querySelector('#machine-number').textContent=String(index+1).padStart(2,'0');
  document.querySelector('#machine-title').textContent=c[en?2:0];
  document.querySelector('#machine-copy').textContent=c[en?3:1];
  document.querySelector('#machine-part-label b').textContent=`0${index+1} — ${c[en?5:4]}`;
  document.querySelector('#machine-percent').textContent=`${Math.round(clamp(progress/.91,0,1)*100)}%`;
  document.querySelectorAll('[data-stage]').forEach((b,i)=>{
    b.classList.toggle('is-active',i===index); b.classList.toggle('is-complete',i<index);
    b.setAttribute('aria-current',i===index?'step':'false');
    b.style.setProperty('--chapter-progress',`${clamp((progress-i*.2)*5,0,1)*100}%`);
  });
}

function init(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.35;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(33,1,.1,160);
  const root=new THREE.Group(); scene.add(root);
  const ambient=new THREE.HemisphereLight(0xe4f2ec,0x35594c,3);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffead0,5);key.position.set(-6,13,10);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:45});key.shadow.bias=-.001;key.shadow.normalBias=.035;scene.add(key);
  const rim=new THREE.DirectionalLight(0xbaffdf,4);rim.position.set(4,7,-9);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xffffff,2);fill.position.set(10,3,4);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.3}));floor.rotation.x=-Math.PI/2;floor.position.y=-.48;floor.receiveShadow=true;scene.add(floor);
  const mat={
    frame:new THREE.MeshStandardMaterial({color:0x397769,metalness:.65,roughness:.35}),
    dark:new THREE.MeshStandardMaterial({color:0x1a3731,metalness:.55,roughness:.45}),
    steel:new THREE.MeshStandardMaterial({color:0xd4ded8,metalness:.77,roughness:.27}),
    chrome:new THREE.MeshStandardMaterial({color:0xedf1e9,metalness:.85,roughness:.19}),
    rubber:new THREE.MeshStandardMaterial({color:0x283833,metalness:.1,roughness:.8}),
    brass:new THREE.MeshStandardMaterial({color:0xce9463,metalness:.65,roughness:.3}),
    paper:new THREE.MeshStandardMaterial({color:0xf4edcf,metalness:0,roughness:.9,side:THREE.DoubleSide}),
    wet:new THREE.MeshStandardMaterial({color:0xafbaa5,metalness:.05,roughness:.78,side:THREE.DoubleSide}),
    orange:new THREE.MeshStandardMaterial({color:0xe47a42,metalness:.28,roughness:.35}),
    light:new THREE.MeshStandardMaterial({color:0xd6e99b,emissive:0xa7d86e,emissiveIntensity:.8}),
  };
  const moving=[],rollers=[];
  function box(g,x,y,z,sx,sy,sz,m){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function cylinder(g,x,y,z,r,len,m,segments=40){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,segments),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function pipe(g,coords,r,m){const curve=new THREE.CatmullRomCurve3(coords.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,40,r,8,false),m);g.add(o);o.castShadow=true;return o;}
  function part(start,duration,flight=[0,7,0],turn=[0,0,0]){const g=new THREE.Group();root.add(g);moving.push({g,start,duration,flight:new THREE.Vector3(...flight),turn:new THREE.Vector3(...turn)});return g;}
  function roller(g,x,y,r,m,len=2.8){
    const group=new THREE.Group();group.position.set(x,y,0);g.add(group);
    cylinder(group,0,0,0,r,len,m);
    cylinder(group,0,0,0,.1,len+.8,mat.chrome,20);
    for(const z of [-1,1]){
      cylinder(group,0,0,z*(len/2+.04),r*.82,.065,mat.dark);
      cylinder(group,0,0,z*(len/2+.085),r*.59,.035,m);
      cylinder(group,0,0,z*(len/2+.12),r*.18,.06,mat.chrome,20);
      for(let i=0;i<6;i++){const a=i*Math.PI/3;cylinder(group,Math.cos(a)*r*.68,Math.sin(a)*r*.68,z*(len/2+.09),.025,.05,mat.chrome,6);}
      box(group,r*.26,0,z*(len/2+.115),r*.37,.04,.015,mat.chrome);
    }
    rollers.push({group,r});return group;
  }
  function bearing(g,x,y,z){box(g,x,y-.12,z,.48,.48,.23,mat.frame);cylinder(g,x,y,z,.17,.3,mat.chrome,24);}
  function rail(g,x1,x2,y,z){box(g,(x1+x2)/2,y,z,x2-x1,.055,.055,mat.orange);for(let x=x1;x<x2+.1;x+=.85)box(g,x,y-.43,z,.045,.86,.045,mat.orange);}

  // 01 — structural steel, cross members, feet and maintenance walkways.
  const base=part(-.06,.18,[0,-2.5,0]);
  box(base,0,-.14,0,19.5,.28,4.3,mat.dark);
  for(const z of [-1.62,1.62])box(base,0,.55,z,18.6,.28,.23,mat.frame);
  for(let x=-8.5;x<=8.5;x+=1.7){
    const g=part(.005+(x+8.5)*.006,.14,[x*.2,3,-3],[0,0,.15]);
    box(g,x,.32,0,.18,.25,3.5,mat.steel);
    for(const z of [-1.6,1.6]){box(g,x,.17,z,.2,1.0,.2,mat.frame);box(g,x,-.32,z,.5,.12,.45,mat.steel);for(const dx of [-.15,.15])cylinder(g,x+dx,-.23,z,.036,.035,mat.chrome,6);}
  }
  const walkway=part(.13,.18,[0,0,5]);box(walkway,0,.62,2.0,18.5,.08,.58,mat.steel);
  for(let x=-9;x<=9;x+=.25)box(walkway,x,.672,2,.035,.012,.53,mat.dark);
  rail(walkway,-9,9,1.65,2.3);
  for(let i=0;i<4;i++)box(walkway,-9.2-i*.22,.48-i*.18,2,.32,.08,.7,mat.steel);

  // 02 — headbox, drainage table, wire loop and supporting rollers.
  const head=part(.18,.16,[-5,4,-3],[0,-.5,0]);
  box(head,-8.15,1.7,0,1.2,1.2,3,mat.steel);box(head,-7.48,1.57,0,.28,.18,2.7,mat.chrome);
  box(head,-8.15,2.34,0,1.28,.08,3.12,mat.frame);
  for(let z=-1.2;z<=1.2;z+=.3)box(head,-8.1,2.41,z,.85,.09,.025,mat.chrome);
  pipe(head,[[-9.1,.4,-1],[-9.1,1.4,-1],[-8.75,1.7,-1]],.2,mat.steel);
  const bed=part(.2,.18,[-4,3,0],[0,0,-.12]);
  box(bed,-5.8,1.02,0,4.8,.22,3.2,mat.frame);
  for(let x=-7.6;x<=-3.7;x+=.43)roller(bed,x,1.24,.14,mat.chrome);
  for(const z of [-1.5,1.5]){box(bed,-5.8,1.29,z,4.6,.21,.12,mat.steel);}
  roller(bed,-7.8,1.17,.27,mat.rubber);roller(bed,-3.7,1.17,.27,mat.rubber);
  box(bed,-5.75,1.455,0,4.16,.025,2.8,mat.rubber);box(bed,-5.75,.89,0,4.16,.025,2.8,mat.rubber);
  for(let x=-7.5;x<=-3.8;x+=.7)pipe(bed,[[x,.9,0],[x,.3,0],[x,.3,-2]],.065,mat.steel);

  // 03 — paired press nips, bearing housings and the calender frame.
  for(let i=0;i<2;i++){
    const x=-2.6+i*1.1;
    const frame=part(.37+i*.02,.16,[0,5,i?-4:4],[0,0,.13]);
    for(const z of [-1.7,1.7]){box(frame,x,1.75,z,.24,2.6,.27,mat.frame);box(frame,x,3.03,z,.7,.17,.45,mat.steel);box(frame,x,2.77,z,.15,.3,.17,mat.chrome);bearing(frame,x,1.1,z);bearing(frame,x,2.12,z);}
    const lower=part(.39+i*.025,.15,[0,-.8,5],[.35,0,0]);roller(lower,x,1.08,.49,mat.rubber);
    const upper=part(.43+i*.025,.16,[0,6,-1],[.7,0,0]);roller(upper,x,2.08,.49,mat.chrome);
  }

  // 04 — staggered steam-heated dryer cylinders and service piping.
  for(let i=0;i<5;i++){
    const x=.15+i*1.1,y=i%2?2.38:1.2;
    const supports=part(.53+i*.027,.15,[0,3,-5],[0,.2,0]);
    for(const z of [-1.68,1.68]){box(supports,x,(y+.4)/2,z,.24,y-.4,.22,mat.frame);bearing(supports,x,y,z);}
    const roll=part(.55+i*.028,.17,[(i-2)*.8,6+(i%2),i%2?-3:3],[.5,0,.1]);roller(roll,x,y,.67,mat.steel);
    pipe(supports,[[x,y,-1.9],[x,y,-2.1],[x,.7,-2.1]],.07,mat.brass);
  }
  const ducts=part(.68,.16,[2,5,-4],[0,.2,0]);
  pipe(ducts,[[-.2,.7,-2.1],[2.1,.7,-2.1],[5,.7,-2.1],[5,.25,-2.1]],.12,mat.brass);
  for(let x=0;x<=4.5;x+=1.1){cylinder(ducts,x,.71,-2.13,.14,.045,mat.orange,20);}

  // 05 — reel stand, driving drum, finished paper reel and motor.
  const reelFrame=part(.76,.15,[5,0,-4],[0,-.4,0]);
  for(const z of [-1.65,1.65]){box(reelFrame,7.15,1.28,z,.27,1.6,.35,mat.frame);box(reelFrame,7.1,2.0,z,2,.14,.35,mat.steel);bearing(reelFrame,7.2,2.04,z);}
  roller(reelFrame,6,1.2,.55,mat.chrome);
  const reel=part(.81,.13,[3,7,1],[.5,.1,0]);
  const paperRoll=roller(reel,7.25,2.13,.91,mat.paper,2.75);
  for(const z of [-1.39,1.39]){
    // Concentric end-grain rings make the reel read as rolled paper.
    for(let i=0;i<20;i++){const radius=.18+i*.035;const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.004,4,72),mat.wet);ring.position.set(0,0,z);paperRoll.add(ring);}
    cylinder(paperRoll,0,0,z,.15,.04,mat.brass,24);
  }
  const motor=part(.82,.13,[5,1,4]);
  cylinder(motor,7.25,.9,2.12,.32,.7,mat.frame);
  for(let z=1.82;z<2.49;z+=.08)cylinder(motor,7.25,.9,z,.35,.025,mat.dark);
  box(motor,7.25,.52,2.12,.85,.15,.8,mat.steel);
  const control=part(.79,.14,[-1,4,5]);box(control,5.6,1.0,2.7,.13,.8,.13,mat.steel);box(control,5.6,1.55,2.7,.64,.5,.25,mat.paper);box(control,5.6,1.57,2.835,.4,.24,.02,mat.dark);box(control,5.6,1.57,2.85,.32,.15,.015,mat.light);cylinder(control,5.82,1.42,2.84,.045,.025,mat.orange,16);

  // The paper web follows a continuous centreline through the assembled line.
  const route=[[-7.55,1.49],[-3.72,1.49],[-3.15,1.58],[-2.6,1.58],[-1.5,1.58],[-.72,1.76]];
  // Alternating arcs follow the outside of the dryer cylinders.
  for(let i=0;i<5;i++){
    const x=.15+i*1.1,y=i%2?2.38:1.2;
    for(let j=0;j<=12;j++){const a=i%2?Math.PI+j*Math.PI/12:Math.PI-j*Math.PI/12;route.push([x+Math.cos(a)*.69,y+Math.sin(a)*.69]);}
  }
  route.push([5.55,1.77],[6,1.77],[6.4,1.92],[7.2,3.06]);
  const vertices=[],uv=[],indices=[];
  route.forEach(([x,y],i)=>{vertices.push(x,y,-1.32,x,y,1.32);uv.push(i/route.length,0,i/route.length,1);if(i){const a=(i-1)*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}});
  const paperGeo=new THREE.BufferGeometry();paperGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));paperGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));paperGeo.setIndex(indices);paperGeo.computeVertexNormals();
  const web=new THREE.Mesh(paperGeo,mat.paper);root.add(web);web.castShadow=true;web.receiveShadow=true;
  // Translucent lines travelling on the wire convey a running material flow.
  const flow=new THREE.Group();root.add(flow);
  for(let i=0;i<16;i++){const line=box(flow,-7.5+i*.25,1.473,0,.015,.007,2.62,mat.wet);line.userData.offset=i/16;}

  const plate=part(.15,.18,[0,0,4]);box(plate,-5.8,.78,1.765,1.9,.31,.025,mat.paper);
  // Canvas texture is a functional equipment nameplate, not an image asset.
  const sign=document.createElement('canvas');sign.width=512;sign.height=96;const ink=sign.getContext('2d');ink.fillStyle='#edeada';ink.fillRect(0,0,512,96);ink.fillStyle='#173e32';ink.font='bold 56px sans-serif';ink.fillText('MASIRA',22,66);ink.font='16px monospace';ink.fillText('PAPER / M—01',290,57);
  const texture=new THREE.CanvasTexture(sign);texture.colorSpace=THREE.SRGBColorSpace;
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.27),new THREE.MeshBasicMaterial({map:texture}));plaque.position.set(-5.8,.79,1.781);plate.add(plaque);

  let visible=false,dirty=true,last=0,time=0,width=1,height=1,dragging=false,dragX=0,orbit=0,tilt=0;
  const focus=new THREE.Vector3(0,1.15,0);
  const label=document.querySelector('#machine-part-label');
  const labelPositions=[new THREE.Vector3(-5,.5,1.8),new THREE.Vector3(-5.8,1.5,0),new THREE.Vector3(-2,2.5,0),new THREE.Vector3(2.4,3,0),new THREE.Vector3(7.2,3,0)];
  function resize(){width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;dirty=true;},{rootMargin:'100px'}).observe(host);
  canvas.addEventListener('pointerdown',e=>{dragging=true;dragX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(dragging){orbit=clamp(orbit+(e.clientX-dragX)*.004,-.75,.75);dragX=e.clientX;dirty=true;}});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.add('no-webgl');document.querySelector('.machine-fallback').hidden=false;});
  canvas.addEventListener('webglcontextrestored',()=>{host.classList.remove('no-webgl');document.querySelector('.machine-fallback').hidden=true;dirty=true;});
  addEventListener('masira:machine',e=>{Object.assign(assembly,e.detail);dirty=true;});
  addEventListener('masira:language',()=>{dirty=true;});
  document.addEventListener('visibilitychange',()=>{last=0;dirty=true;});
  function render(stamp){
    requestAnimationFrame(render);
    if(document.hidden||!visible){last=stamp;return;}
    const dt=Math.min((stamp-last)/1000,.05)||0;last=stamp;
    if(!assembly.paused)time+=dt;
    if(!dirty&&assembly.paused)return;dirty=false;
    const p=assembly.progress,index=Math.min(4,Math.floor(p*5));
    updateCopy(index,p);
    for(const {g,start,duration,flight,turn} of moving){
      const t=smooth((p-start)/duration);g.visible=t>.005;
      const remaining=1-t;g.position.copy(flight).multiplyScalar(remaining);g.rotation.set(turn.x*remaining,turn.y*remaining,turn.z*remaining);
      g.scale.setScalar(.86+.14*t);
    }
    // Wide establishing view gradually becomes a close, low three-quarter view.
    const cameraPhase=smooth(p);const azimuth=.20+.31*cameraPhase+orbit;
    const distance=(width<700?39:32)+(1-cameraPhase)*3;
    camera.position.set(Math.sin(azimuth)*distance,14-cameraPhase*3.3,Math.cos(azimuth)*distance);
    camera.lookAt(focus);camera.updateMatrixWorld();
    root.rotation.y=-.07;
    const running=smooth((p-.88)/.12);
    for(const {group,r} of rollers){if(!assembly.paused)group.rotation.z-=dt*running*.8/r;}
    web.visible=p>.32;paperGeo.setDrawRange(0,Math.floor(clamp((p-.3)/.6,0,1)*(route.length-1))*6);
    flow.visible=p>.92;
    for(const strip of flow.children){strip.position.x=-7.55+((strip.userData.offset+time*.15)%1)*3.8;}
    const point=labelPositions[index].clone();root.localToWorld(point);point.project(camera);
    label.style.left=`${clamp((point.x*.5+.5)*width,65,width-175)}px`;
    label.style.top=`${clamp((-point.y*.5+.5)*height-64,25,height-90)}px`;
    renderer.render(scene,camera);
  }
  resize();requestAnimationFrame(render);dispatchEvent(new Event('masira:ready'));
}
