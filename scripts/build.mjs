import {readFile,access} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {property, textureStore} from "three/tsl";
const html=await readFile('dist/index.html','utf8');
for(const page of ['dist/about.html','dist/products.html','dist/sustainability.html']){
  const pageHtml=await readFile(page,'utf8');
  for(const [,ref]of pageHtml.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|mailto:|data:)/.test(ref))await access(join('dist',ref.split('?')[0]));}
}

for(const [,ref]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|mailto:|data:)/.test(ref))await access(join('dist',ref.split('?')[0]));}
for(const file of ['dist/app.js','dist/film.js','dist/assets/gsap.min.js','dist/assets/ScrollTrigger.min.js']){new Function(await readFile(file,'utf8'));}
const checked=new Set();
async function checkModules(file){
  file=resolve(file);
  if(checked.has(file))return;
  checked.add(file);
  const source=await readFile(file,'utf8');
  for(const [,ref]of source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)){
    if(ref.startsWith('.'))await checkModules(resolve(dirname(file),ref));
  }
}
await checkModules('dist/machine.js');
console.log(`Build verified: HTML, local assets, JavaScript syntax and ${checked.size} linked 3D modules.`);


for(let i=1;i<=419;i++)await access(`dist/assets/machine-v7/frame-${String(i).padStart(4,'0')}.webp`);
console.log('Scroll film verified: 419 frames.');


for(let i=1;i<=419;i++)await access(`dist/assets/machine-mobile/frame-${String(i).padStart(4,'0')}.webp`);
console.log('Mobile scroll film verified: 419 frames.');
await access('dist/assets/products/testliner.png');
await access('dist/assets/products/fluting-paper.png');
console.log('Product images verified: Testliner and Fluting Paper.');

