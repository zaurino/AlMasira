import assert from 'node:assert/strict';
import * as T from '../dist/assets/three.module.js';
import {sample,cameraAt,cameraKeys} from '../dist/journey-timeline.js';
import {createJourney} from '../dist/journey-world.js';
const scene=new T.Scene(),root=new T.Group();scene.add(root);
const camera=new T.PerspectiveCamera();
const mat=Object.fromEntries(['paper','rubber','steel'].map(k=>[k,new T.MeshStandardMaterial()]));
const roller=new T.Group(),agitator=new T.Group(),paperRoll=new T.Group();
const scraps=Array.from({length:22},()=>new T.Mesh(new T.BoxGeometry(),mat.paper));
const pulp=new T.Mesh(new T.CylinderGeometry(),mat.paper);
const web=new T.Mesh(new T.PlaneGeometry(2,2,3,3),mat.paper);
root.add(roller,agitator,paperRoll,pulp,web,...scraps);
const update=createJourney({scene,root,camera,mat,rollers:[{group:roller,r:1}],agitator,scraps,pulp,web,paperRoll});
const snapshot=()=>{
 const values=[];scene.traverse(o=>{values.push(...o.position,...o.rotation.toArray().slice(0,3),...o.scale);if(o.isInstancedMesh)values.push(...o.instanceMatrix.array);
 if(o.geometry?.attributes?.position)values.push(...o.geometry.attributes.position.array);
 if(o.material&&!Array.isArray(o.material)){values.push(o.material.opacity);if(o.material.color)values.push(...o.material.color);if(o.material.roughness!==undefined)values.push(o.material.roughness);}
});
 values.push(...camera.position,...camera.quaternion,...web.geometry.attributes.position.array,mat.paper.opacity,...mat.paper.color);
 assert(values.every(Number.isFinite),'Every transform is finite');return values;
};
for(const p of [0,.08,.15,.27,.34,.45,.52,.65,.77,.84,.90,.96,1]){
 update(p,1440,900);const before=snapshot();update(1-p,1440,900);update(p,1440,900);assert.deepEqual(snapshot(),before,`Reversible at ${p}`);
}
for(const [p]of cameraKeys.slice(1,-1)){
 const a=cameraAt(p-1e-7),b=cameraAt(p+1e-7);
 assert(Math.hypot(...a.position.map((x,i)=>x-b.position[i]))<.001,'Camera path has no positional cuts');
}
assert.equal(sample(0).open,0);assert.equal(sample(1).open,0);assert.equal(sample(.5).open,1);
assert.equal(sample(.3).network,0);assert.equal(sample(.7).network,1);
update(.52,390,844);snapshot();
console.log('Journey verified: 13 forward/backward world snapshots, camera continuity, panel closure, fiber formation, mobile finite transforms.');
