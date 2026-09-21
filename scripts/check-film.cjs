const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let top=0,cardTop=100,dim=0;const queue=[],events={},draws=[];
const titleLines=Array.from({length:2},()=>({style:{}}));
const card={style:{setProperty(){}},querySelectorAll:()=>titleLines,children:['SPAN','H2','P'].map(tagName=>({tagName,style:{}})),parentElement:{getBoundingClientRect:()=>({top:cardTop,bottom:cardTop+1900,height:1900})}};
const nodes={'.film-stage':{clientHeight:1000,dataset:{}},'.film-section':{style:{setProperty(name,value){if(name==='--story-dim')dim=Number(value)}},offsetHeight:8000,getBoundingClientRect:()=>({top})},'#film-canvas':{clientWidth:1440,clientHeight:1000,style:{},getContext:()=>({fillRect(){},createLinearGradient(){return{addColorStop(){}}},drawImage(img,x,y,w,h){draws.push({src:img.src,x,y,w,h})}})},'.film-counter':{},'.film-track i':{style:{}},'.film-heading':{style:{}},'.scroll-progress':{style:{}}};
class Image{width=1920;height=1080;set src(value){this._src=value;queue.push(()=>this.onload())}get src(){return this._src}}
const context={document:{querySelector:s=>nodes[s],querySelectorAll:()=>[card],documentElement:{scrollHeight:9000}},getComputedStyle:()=>({textAlign:'left'}),matchMedia:()=>({matches:false}),innerHeight:1000,innerWidth:1440,devicePixelRatio:2,scrollY:0,Image,requestAnimationFrame:fn=>(queue.push(fn),queue.length),addEventListener:(name,fn)=>events[name]=fn};
vm.runInNewContext(fs.readFileSync('dist/film.js','utf8'),context);
function settle(){let n=0;while(queue.length&&n++<3000)queue.shift()();assert(n<3000,'Animation must settle')}
settle();assert(draws.at(-1).src.includes('machine-v7/frame-0001'));assert(draws.at(-1).w<2880);
top=-7000;events.scroll();settle();assert(draws.at(-1).src.includes('0419.webp'));
top=-3500;events.scroll();settle();assert(draws.at(-1).src.includes('0210.webp'));
events['masira:motion']({detail:{paused:true}});top=0;events.scroll();settle();assert(draws.at(-1).src.includes('0210.webp'));
events['masira:motion']({detail:{paused:false}});settle();assert(draws.at(-1).src.includes('0001.webp'));
cardTop=1000;events.scroll();settle();assert.equal(card.style.visibility,'hidden');assert.equal(dim,0,'Unobstructed film between chapters');
cardTop=550;events.scroll();settle();assert.equal(card.style.visibility,'visible');assert(+card.children[0].style.opacity>+card.children[2].style.opacity,'Copy reveals in sequence');assert.notEqual(titleLines[0].style.transform,titleLines[1].style.transform,'Title lines stagger');
cardTop=0;events.scroll();settle();assert.equal(+card.children[2].style.opacity,1);assert.equal(dim,0,'Film stays visible behind readable text');assert(titleLines.every(line=>line.style.transform.includes('0%,0)')),'Titles fully readable during hold');
const held=titleLines.map(line=>line.style.transform);cardTop=-500;events.scroll();settle();assert.deepEqual(titleLines.map(line=>line.style.transform),held,'Reading plateau');
cardTop=550;events.scroll();settle();assert.notDeepEqual(titleLines.map(line=>line.style.transform),held,'Title reveal reverses');
context.innerWidth=390;nodes['#film-canvas'].clientWidth=390;events.resize();settle();assert(draws.at(-1).w<=390*1.5*1.28);
assert.equal(nodes['#film-canvas'].width,585,'Mobile DPR is capped');
console.log('Passed: 419-frame journey, reverse scroll, pause/resume, staggered reveal, hidden offscreen blocks and mobile sizing.');

// A fresh phone visit must request only the lightweight sequence.
context.innerHeight=844;
nodes['.film-stage'].clientHeight=844;
nodes['#film-canvas'].clientHeight=844;
top=0;
vm.runInNewContext(fs.readFileSync('dist/film.js','utf8'),context);
settle();
assert(draws.at(-1).src.includes('machine-mobile/frame-0001'));
assert(draws.at(-1).y>844*1.5*.45,'Picture sits below the mobile reading area');
top=-(8000-844);events.scroll();settle();
assert(draws.at(-1).src.includes('machine-mobile/frame-0419'),'Stable stage height reaches the final frame');
console.log('Passed: mobile sources, portrait composition and final frame.');
