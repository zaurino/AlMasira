import assert from 'node:assert/strict';
import * as T from '../dist/assets/three.module.js';
import {modules,moduleState,heroState,cameraAt,cameraKeys} from '../dist/engineering-timeline.js';
import {createEngineering} from '../dist/engineering-world.js';
const scene=new T.Scene(),root=new T.Group(),camera=new T.PerspectiveCamera();scene.add(root);
const mat=Object.fromEntries(['frame','steel','chrome','rubber','dark','wet'].map(k=>[k,new T.MeshStandardMaterial()]));
const rollers=modules.slice(1).map((m,i)=>{const group=new T.Group();group.position.set(m.x,m.y,0);root.add(group);return{group,r:[.14,.49,.67,.91][i]};});
const agitator=new T.Group(),pulp=new T.Mesh(new T.CylinderGeometry(),mat.wet),web=new T.Mesh(new T.PlaneGeometry(),mat.wet),tank=new T.Mesh(new T.CylinderGeometry(),mat.steel);root.add(agitator,pulp,web,tank);
const moving=Array.from({length:4},(_,i)=>{const g=new T.Group();g.userData.reveal={module:i<2?2:3,role:i%2?'support':'roller',direction:i%2?-1:1};root.add(g);return{g};});
const engine=createEngineering({scene,root,camera,mat,rollers,agitator,scraps:[],pulp,web,tank,moving});
function snapshot(){const data=[];scene.traverse(o=>{data.push(...o.position,...o.rotation.toArray().slice(0,3),...o.scale,Number(o.visible));if(o.material)data.push(o.material.opacity);});data.push(...camera.position,...camera.quaternion);assert(data.every(Number.isFinite));return data;}
for(const p of [0,.15,.22,.30,.35,.40,.435,.465,.48,.56,.63,.68,.72,.76,.80,.88,.92,.96,.97,.98,.99,1]){
 engine.update(p,1440,900);const before=snapshot();engine.update(1-p,1440,900);engine.update(p,1440,900);assert.deepEqual(snapshot(),before,`Reverse reveal mismatch at ${p}`);
}
for(let i=0;i<1760;i++){const p=i/2000;assert(modules.filter(m=>moduleState(p,m).opening>.001).length<=1,'More than one local module opens before hero');}
assert(modules.filter(m=>moduleState(.94,m).opening>.9).length===5,'Hero must reveal the major modules together');
for(const p of [0,1]){
 engine.update(p,1440,900);
 for(const a of engine.assemblies){assert.equal(a.cover.position.z,2.48);assert.equal(a.roof.position.y,3.15);assert.equal(a.motor.position.z,2.72);assert.equal(a.coupling.position.z,2.27);assert.equal(a.bearing.position.z,1.78);}
 for(const {g}of moving)assert.equal(Math.abs(g.position.z),0,'Original roller/support groups return exactly');
}
for(const m of modules.filter(m=>m.solo)){
 const p=m.start+(m.end-m.start)*.87,l=moduleState(p,m).layers;
 assert.equal(l.shaft,0,'Shaft seats before the final protective closure');assert(l.cover>.99);assert(l.roof>.99);
}
assert.equal(heroState(.973).shaft,0);assert(heroState(.973).cover>.99,'Hero closes inside out');
const direction=new T.Vector3(-10,7,24).normalize();
for(let i=0;i<=4000;i++){
 const shot=cameraAt(i/4000),d=new T.Vector3(...shot.position).sub(new T.Vector3(...shot.target)).normalize();
 assert([...shot.position,...shot.target].every(Number.isFinite));assert(d.angleTo(direction)<1e-6,'Camera must retain its 3/4 viewing direction');
 assert(shot.position[2]>20,'No close fly-through camera positions');
}
for(const [p]of cameraKeys.slice(1,-1)){const a=cameraAt(p-1e-7),b=cameraAt(p+1e-7);assert(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))<.001);}
engine.update(.35,1440,900);const before=engine.travel[2];for(let i=0;i<120;i++)engine.update(.35,1440,900,1/60);assert(engine.travel[2]>before);
for(const [i,a]of engine.assemblies.entries()){
 assert(Math.abs(a.transmission.input.rotation.z+2*a.transmission.output.rotation.z)<1e-10);
 assert.equal(a.coupling.rotation.z,a.transmission.input.rotation.z);assert.equal(a.shaft.rotation.z,a.transmission.output.rotation.z);
 if(i>0)assert.equal(rollers[i-1].group.rotation.z,a.transmission.output.rotation.z,'Visible roller is synchronized with its own drive');
}
const frozen=snapshot();engine.update(.35,1440,900,0);assert.deepEqual(snapshot(),frozen);
engine.update(.94,390,844);snapshot();
console.log('Passed: reversible layered transforms, two isolated module sequences, five-group hero, exact final seating, inside-out closure, fixed 3/4 camera direction, continuous synchronized operation and pause.');
