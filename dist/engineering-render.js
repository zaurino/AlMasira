import * as T from './assets/three.module.js';
import {RoomEnvironment} from './assets/addons/environments/RoomEnvironment.js';
import {EffectComposer} from './assets/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './assets/addons/postprocessing/RenderPass.js';
import {SSAOPass} from './assets/addons/postprocessing/SSAOPass.js';
import {OutputPass} from './assets/addons/postprocessing/OutputPass.js';
export function finishMaterials(mat){
 const n=2048,normal=new Uint8Array(n*n*4),surface=new Uint8Array(n*n*4);
 let seed=17;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=(seed>>>24)/255,brush=Math.sin(y*1.79+Math.sin(x*.002)*.6);
  const i=(y*n+x)*4;
  normal[i]=128+Math.round((noise-.5)*2);normal[i+1]=128+Math.round(brush*3);normal[i+2]=255;normal[i+3]=255;
  surface[i]=255;surface[i+1]=175+Math.round(noise*22+brush*8);surface[i+2]=242+Math.round(noise*13);surface[i+3]=255;
 }
 const normalMap=new T.DataTexture(normal,n,n),roughnessMap=new T.DataTexture(surface,n,n);
 for(const texture of [normalMap,roughnessMap]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=8;texture.needsUpdate=true;}
 for(const name of ['steel','chrome','brass','frame','dark']){
  Object.assign(mat[name],{normalMap,roughnessMap,normalScale:new T.Vector2(.22,.22),envMapIntensity:1.1});mat[name].needsUpdate=true;
 }
 for(const name of ['steel','chrome','brass'])mat[name].metalnessMap=roughnessMap;
 mat.steel.color.set(0xc0c4c3);mat.steel.metalness=.96;mat.steel.roughness=.4;
 mat.chrome.color.set(0xd5d7d6);mat.chrome.metalness=1;mat.chrome.roughness=.29;
 mat.frame.color.set(0x36534a);mat.frame.metalness=.22;mat.frame.roughness=.66;
 mat.dark.color.set(0x24362f);mat.dark.metalness=.35;mat.dark.roughness=.68;
 mat.rubber.color.set(0x242726);mat.rubber.metalness=0;mat.rubber.roughness=.89;
 mat.orange.color.set(0xb6a76c);mat.orange.roughness=.65;
 mat.light.color.set(0xb7c4ac);mat.light.emissive.set(0);mat.light.emissiveIntensity=0;
 return {normalMap,roughnessMap};
}
export function createRendering(renderer,scene,camera){
 renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();
 const environment=pmrem.fromScene(room,.035);scene.environment=environment.texture;scene.environmentIntensity=.85;
 room.dispose();pmrem.dispose();
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:Math.min(4,renderer.capabilities.maxSamples)});
 const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
 const ao=new SSAOPass(scene,camera,1,1,16);ao.kernelRadius=.28;ao.minDistance=.003;ao.maxDistance=.12;composer.addPass(ao);composer.addPass(new OutputPass());
 return {render:()=>composer.render(),resize:(w,h)=>{composer.setSize(w,h);ao.setSize(Math.round(w*Math.min(devicePixelRatio,2)),Math.round(h*Math.min(devicePixelRatio,2)));}};
}
