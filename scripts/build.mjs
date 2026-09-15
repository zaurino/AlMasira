import {readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
const html=await readFile('dist/index.html','utf8');
for(const [,ref]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|data:)/.test(ref))await access(join('dist',ref));}
for(const file of ['dist/app.js','dist/assets/gsap.min.js','dist/assets/ScrollTrigger.min.js']){new Function(await readFile(file,'utf8'));}
console.log('Build verified: HTML entrypoint, local assets and JavaScript syntax.');
