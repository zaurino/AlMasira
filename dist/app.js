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
  window.dispatchEvent(new Event('masira:language'));
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
let media;
const state = {progress:0, time:0};
function setStage(p){
  state.progress=p;
  window.dispatchEvent(new CustomEvent('masira:machine', {detail:{progress:p,paused}}));
}
function updateMotionLabel(){const b=$('#motion-toggle');b.textContent=english?(paused?'Resume motion':'Pause motion'):(paused?'Activer l’animation':'Pause animation');b.setAttribute('aria-pressed',String(paused));}
function setupMotion(){
  media?.revert();
  document.body.classList.toggle('motion-paused',paused);
  updateMotionLabel();
  if(paused||!window.gsap||!window.ScrollTrigger){setStage(1);return;}
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
  media.add('(min-width: 0px)',()=>{
    const mobile=window.innerWidth<=700;
    const tl=gsap.timeline({scrollTrigger:{id:'machine-assembly',trigger:'.machine-stage',start:'top top',end:()=>'+='+window.innerHeight*(mobile?4.5:5.5),pin:true,scrub:1.15,anticipatePin:1,invalidateOnRefresh:true}});
    tl.to(state,{progress:1,ease:'none',duration:1,onUpdate:()=>setStage(state.progress)},0);
    return ()=>{state.progress=0;};
  });
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;setupMotion();});
preference.addEventListener('change',e=>{paused=e.matches;setupMotion();});
setupMotion();
window.addEventListener('load',()=>window.ScrollTrigger?.refresh());

function goToMachine(progress){
  const trigger=window.ScrollTrigger?.getById('machine-assembly');
  if(trigger&&!paused)window.scrollTo({top:trigger.start+(trigger.end-trigger.start)*progress,behavior:preference.matches?'instant':'smooth'});
  else setStage(progress);
}
all('[data-stage]').forEach(button=>button.addEventListener('click',()=>goToMachine([.08,.28,.46,.68,.98][Number(button.dataset.stage)])));
$('#machine-replay').addEventListener('click',()=>goToMachine(0));
window.addEventListener('masira:ready',()=>setStage(paused?1:state.progress));
