/* Masira — motion is progressive enhancement; content remains available without it. */
const $ = (s) => document.querySelector(s);
const all = (s) => [...document.querySelectorAll(s)];
let english = false;
all('[data-en]').forEach(el => el.dataset.fr = el.innerHTML);
$('#language').addEventListener('click', () => {
  english = !english;
  document.documentElement.lang = english ? 'en' : 'fr';
  all('[data-en]').forEach(el => el.innerHTML = el.dataset[english ? 'en' : 'fr']);
  $('#language').textContent = english ? 'FR' : 'EN';
  $('#language').setAttribute('aria-label', english ? 'Passer en français' : 'Switch to English');
  updateMotionLabel();
  window.ScrollTrigger?.refresh();
});
const menu = $('.menu-toggle');
menu.addEventListener('click', () => {
  const open = $('.header').classList.toggle('menu-open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
});
all('.header nav a').forEach(a => a.addEventListener('click', () => {
  $('.header').classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false');
}));
const dialog = $('#inquiry-dialog');
$('#open-inquiry').addEventListener('click', () => dialog.showModal());
$('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close(); } });
$('#inquiry-form').addEventListener('submit', e => {
  e.preventDefault(); const d = new FormData(e.target);
  const content = `MASIRA — ${english ? 'Project enquiry' : 'Demande de projet'}\n\n${d.get('name')}\n${d.get('email')}\n\n${d.get('message')}\n`;
  const url = URL.createObjectURL(new Blob([content], {type:'text/plain;charset=utf-8'}));
  const a = document.createElement('a'); a.href=url; a.download='masira-brief.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#form-status').textContent = english ? 'Your brief is ready. You can share the downloaded file with your Masira contact.' : 'Votre brief est prêt. Vous pouvez partager le fichier avec votre interlocuteur Masira.';
});
$('#year').textContent = new Date().getFullYear();
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
let media, ticker;
const state = {progress:0, time:0};
const canvas = $('#fibre-canvas'), ctx = canvas.getContext('2d');
let w=0,h=0;
let seed=17; const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const points = Array.from({length:1100}, (_,i) => {
  const angle=random()*Math.PI*2, r=Math.sqrt(random());
  const u=(i%44)/43-.5,v=Math.floor(i/44)/24-.5;
  return {x:Math.cos(angle)*r,y:Math.sin(angle)*r,u,v,z:random(),a:random()*Math.PI*2};
});
function draw(){
  if(!ctx||!w)return;
  ctx.clearRect(0,0,w,h);
  const p=state.progress, m=Math.min(p*2,1), n=Math.max(0,(p-.5)*2);
  const smooth=t=>t*t*(3-2*t), sm=smooth(m),sn=smooth(n);
  for(const q of points){
    const a=q.u*Math.PI*2+state.time*.08;
    const ringX=Math.cos(a)*(.69+q.v*.29),ringY=Math.sin(a)*(.42+q.v*.2);
    const sheetX=q.u*1.4,sheetY=q.v*.95 + Math.sin(q.u*5+state.time*.25)*.05;
    const dispersedX=q.x*.9+Math.sin(state.time*.25+q.a)*.035;
    const dispersedY=q.y*.78+Math.cos(state.time*.2+q.a)*.035;
    const x=(dispersedX*(1-sm)+sheetX*sm)*(1-sn)+ringX*sn;
    const y=(dispersedY*(1-sm)+sheetY*sm)*(1-sn)+ringY*sn;
    const shade=Math.round(180+q.z*57);
    ctx.fillStyle=`rgba(${shade},${shade+2},${Math.round(shade*.87)},${.4+q.z*.6})`;
    const size=1.1+q.z*1.7;
    ctx.save();ctx.translate(w/2+x*w*.43,h/2+y*h*.43);ctx.rotate(q.a*(1-sm)+q.u*.3+sn*a);ctx.fillRect(-size/2,-size/2,size*(2-sn*.5),size);ctx.restore();
  }
}
function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);draw();}
new ResizeObserver(resize).observe(canvas);
function setStage(p){state.progress=p;const i=Math.min(2,Math.floor(p*3));all('.step').forEach((el,j)=>el.classList.toggle('active',i===j));$('#material-state').textContent=['01 / COLLECTER','02 / TRANSFORMER','03 / RECOMMENCER'][i];draw();}
function updateMotionLabel(){const b=$('#motion-toggle');b.textContent=english?(paused?'Resume motion':'Pause motion'):(paused?'Activer l’animation':'Pause animation');b.setAttribute('aria-pressed',String(paused));}
function setupMotion(){
  media?.revert(); if(ticker&&window.gsap)gsap.ticker.remove(ticker);
  document.body.classList.toggle('motion-paused',paused);
  updateMotionLabel();
  if(paused||!window.gsap||!window.ScrollTrigger){state.progress=.5;draw();all('.step').forEach(el=>el.classList.add('active'));return;}
  gsap.registerPlugin(ScrollTrigger);media=gsap.matchMedia();
  media.add('(min-width: 0px)',()=>{
    gsap.from('.hero h1 .title-line',{yPercent:25,opacity:0,duration:1.35,stagger:.15,ease:'power3.out'});
    gsap.from('.hero-art',{scale:.87,opacity:0,duration:1.7,ease:'power2.out'});
    gsap.to('.hero-art',{yPercent:18,rotation:7,scale:1.08,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.hero h1',{y:110,opacity:.25,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.hero-orbit',{rotation:90,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.asterisk',{rotation:170,ease:'none',scrollTrigger:{trigger:'.vision',start:'top bottom',end:'bottom top',scrub:1.4}});
    gsap.from('.manifesto',{y:65,opacity:.2,scrollTrigger:{trigger:'.manifesto',start:'top 90%',end:'top 35%',scrub:1}});
    gsap.to('.marquee div',{xPercent:-35,ease:'none',scrollTrigger:{trigger:'.marquee',start:'top bottom',end:'bottom top',scrub:1.3}});
    all('.matter-notes article').forEach(el=>gsap.from(el,{y:35,opacity:.15,scrollTrigger:{trigger:el,start:'top 95%',end:'top 70%',scrub:1}}));
    gsap.from('.big-type',{xPercent:-12,ease:'none',scrollTrigger:{trigger:'.matter',start:'top bottom',end:'bottom top',scrub:1}});
    gsap.from('.contact h2',{y:70,scrollTrigger:{trigger:'.contact',start:'top bottom',end:'top 20%',scrub:1}});
    ScrollTrigger.create({start:0,end:'max',onUpdate:self=>$('.scroll-progress').style.width=`${self.progress*100}%`});
  });
  media.add('(min-width: 701px)',()=>{
    const tl=gsap.timeline({scrollTrigger:{trigger:'.cycle-stage',start:'top top',end:'+=190%',pin:true,scrub:1,anticipatePin:1,onUpdate:self=>setStage(self.progress)}});
    tl.to('.cycle-track span',{width:'100%',ease:'none',duration:1});
  });
  media.add('(max-width: 700px)',()=>{ScrollTrigger.create({trigger:'.cycle',start:'top 40%',end:'bottom 85%',onUpdate:self=>{state.progress=self.progress;draw();}});});
  ticker=(time)=>{state.time=time;if(canvas.getBoundingClientRect().bottom>0&&canvas.getBoundingClientRect().top<innerHeight)draw();};
  gsap.ticker.add(ticker);
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;setupMotion();});
preference.addEventListener('change',e=>{paused=e.matches;setupMotion();});
setupMotion();
window.addEventListener('load',()=>window.ScrollTrigger?.refresh());
