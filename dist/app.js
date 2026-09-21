/* Masira — motion is progressive enhancement; content remains available without it. */
const $ = (s) => document.querySelector(s);
const all = (s) => [...document.querySelectorAll(s)];
const legalFooter=$('.footer-legal');
if(legalFooter)legalFooter.innerHTML='© 2026 <a href="https://www.zaurinowebdesign.it/" target="_blank" rel="noreferrer">zaurinoweb</a> · All rights reserved · Special offer for MASIRA';
let language = 'en';
const arabic = {
  'A NEW PERSPECTIVE ON PAPER':'رؤية جديدة للورق', 'Paper has a future.':'للورق مستقبل.',
  'SCROLL TO DISCOVER':'مرر لاكتشاف المزيد', 'THE ART OF TRANSFORMATION':'فن التحوّل',
  'Precision.<br><em>In motion.</em>':'دقة.<br><em>في حركة.</em>', 'ONE MATERIAL. INFINITE POSSIBILITIES.':'مادة واحدة. إمكانات لا محدودة.',
  'The future of paper<br><em>made tangible.</em>':'مستقبل الورق<br><em>أصبح ملموساً.</em>', 'Sustainable investment':'استثمار مستدام',
  'Tons per year':'طن سنوياً', 'Recycled fibre':'ألياف معاد تدويرها', 'Morocco’s next<br><em>paper mill.</em>':'مصنع الورق<br><em>القادم في المغرب.</em>',
  'Boards made<br><em>for what’s next.</em>':'ألواح مصممة<br><em>لما هو قادم.</em>', 'Waste becomes<br><em>possibility.</em>':'النفايات تصبح<br><em>إمكانات.</em>',
  'Nothing is lost.':'لا شيء يضيع.', 'Everything begins again.':'كل شيء يبدأ من جديد.', 'A new chapter.':'فصل جديد.',
  '<span class="reveal-line"><span>Nothing is lost.</span></span><span class="reveal-line"><span><em>Everything begins again.</em></span></span>':'<span class="reveal-line"><span>لا شيء يضيع.</span></span><span class="reveal-line"><span><em>كل شيء يبدأ من جديد.</em></span></span>',
  'For every fibre.':'لكل ليف.', 'The future':'المستقبل', 'starts here.':'يبدأ هنا.', 'Start a conversation ↗':'ابدأ محادثة ↗', 'Discover MASIRA ↗':'اكتشف MASIRA ↗',
  'Download my brief ↗':'تنزيل ملخص المشروع ↗',
  'About us':'من نحن', 'Products':'المنتجات', 'Sustainabilité':'الاستدامة', 'Discover MASIRA ↗':'اكتشف مصيرة ↗',
  '02 / OUR VISION':'02 / رؤيتنا', '03 / PRODUCTS':'03 / المنتجات',
  'We give paper a new life. With care, precision and a clear vision of tomorrow.':'نمنح الورق حياة جديدة، بعناية ودقة ورؤية واضحة للغد.',
  'Recycled boards<br><em>for what’s next.</em>':'ألواح معاد تدويرها<br><em>لما هو قادم.</em>',
  'High-performance boards for modern packaging, made with recycled fibre.':'ألواح عالية الأداء للتغليف العصري، مصنوعة من ألياف معاد تدويرها.',
  'LET’S BUILD WHAT COMES NEXT':'نبني معاً ما يأتي بعد ذلك',
  'LET\'S START HERE':'لنبدأ من هنا', 'Your next<br><em>chapter.</em>':'فصلك<br><em>القادم.</em>',
  'Prepare your brief to share with the Masira team. Downloading it does not send a message.':'جهّز موجزك لمشاركته مع فريق مصيرة. تنزيل الملف لا يرسل أي رسالة.',
  'Your name / Company':'اسمك / الشركة', 'Your email':'بريدك الإلكتروني', 'Your project':'مشروعك'
};
// English is the source language in the markup; fr/ar live in data attributes.
all('[data-fr],[data-ar]').forEach(el => el.dataset.en = el.innerHTML);
// The inner pages carry their own data-en / data-ar attributes, so only the
// document title still needs to be set per language here.
const innerTitles={
  en:{'about.html':'About us — Masira','products.html':'Products — Masira','sustainability.html':'Sustainability — Masira'},
  ar:{'about.html':'من نحن — مصيرة','products.html':'المنتجات — مصيرة','sustainability.html':'الاستدامة — مصيرة'},
  fr:{'about.html':'À propos — Masira','products.html':'Produits — Masira','sustainability.html':'Durabilité — Masira'}
};
function applyInnerTitle(){
  if(!document.body.classList.contains('inner-page')) return;
  const page=location.pathname.split('/').pop();
  const title=(innerTitles[language]||innerTitles.fr)[page];
  if(title) document.title=title;
}
function setupProductImages(){
  const cards=document.querySelectorAll('.product-list article');
  if(!cards.length)return;
  const images=['assets/products/testliner.png','assets/products/fluting-paper.png'];
  cards.forEach((card,index)=>{
    if(index>1||card.querySelector('.product-image'))return;
    const image=document.createElement('img');
    image.className='product-image'; image.src=images[index]; image.alt=index===0?'Testliner recycled liner board':'Fluting paper structural layer';
    card.prepend(image);
  });
}
function applyLanguage(next){
  language=next;
  const isArabic=language==='ar';
  document.documentElement.lang=language;
  document.documentElement.dir=isArabic?'rtl':'ltr';
  all('[data-fr],[data-ar]').forEach(el=>{
    el.innerHTML=language==='fr'?(el.dataset.fr||el.dataset.en):(isArabic?(el.dataset.ar||arabic[el.dataset.en]||el.dataset.en):el.dataset.en);
  });
  applyInnerTitle();
  try{localStorage.setItem('masira-language',language)}catch{}
  all('#language .lang-opt, .mnav-lang button').forEach(b => b.classList.toggle('is-active', b.dataset.lang === language));
  const languageButton = $('#language');
  if(languageButton) languageButton.setAttribute('aria-label', 'Select language: ' + language.toUpperCase());
  if(!document.body.classList.contains('inner-page')) document.title=language==='fr'?'Masira — Le papier a un avenir.':language==='ar'?'مصيرة — للورق مستقبل.':'Masira — Paper has a future.';
  updateMotionLabel();
  if(typeof menu !== 'undefined') menu?.setAttribute('aria-label', (menuLabels[language]||menuLabels.en)[menuIsOpen()?1:0]);
  window.dispatchEvent(new Event('masira:language'));
  window.ScrollTrigger?.refresh();
}
all('#language .lang-opt, .mnav-lang button').forEach(b => b.addEventListener('click', () => applyLanguage(b.dataset.lang)));
/* ---------------------------------------------------------------- Mobile menu
   A full-screen panel. While it is open the rest of the document is made
   inert, so focus and screen readers stay inside the menu. */
const header = $('.header');
const menu = $('.menu-toggle');
const mobileMenu = $('#mobile-menu');
const menuLabels = {en:['Open menu','Close menu'],fr:['Ouvrir le menu','Fermer le menu'],ar:['افتح القائمة','أغلق القائمة']};
let menuReturnFocus = null;

function outsideMenu(){
  return all('main, footer, .site-footer, .footer-info, .footer-legal, .footer-brand-bottom, .film-stories');
}
function setMenu(open){
  if(!mobileMenu || !header) return;
  header.classList.toggle('menu-open', open);
  mobileMenu.classList.toggle('is-open', open);
  mobileMenu.inert = !open;
  document.documentElement.classList.toggle('menu-locked', open);
  outsideMenu().forEach(el => { el.inert = open; });
  menu?.setAttribute('aria-expanded', String(open));
  menu?.setAttribute('aria-label', (menuLabels[language]||menuLabels.en)[open?1:0]);
  if(open){
    menuReturnFocus = document.activeElement;
    // Wait for the pointer event to finish settling focus on the toggle, and
    // for the panel to actually become visible — a hidden element cannot take focus.
    setTimeout(() => {
      if(menuIsOpen()) mobileMenu.querySelector('a, button')?.focus({preventScroll:true});
    }, 60);
  }else{
    (menuReturnFocus === mobileMenu || mobileMenu.contains(menuReturnFocus) ? menu : menuReturnFocus || menu)?.focus?.({preventScroll:true});
    menuReturnFocus = null;
  }
}
function menuIsOpen(){ return !!header?.classList.contains('menu-open'); }

menu?.addEventListener('click', () => setMenu(!menuIsOpen()));
mobileMenu?.querySelectorAll('a[href]').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if(e.key === 'Escape' && menuIsOpen()) setMenu(false); });
// Closing on resize avoids a panel stranded open behind the desktop header.
matchMedia('(min-width:861px)').addEventListener('change', e => { if(e.matches && menuIsOpen()) setMenu(false); });

const dialog = $('#inquiry-dialog');
function openInquiry(event){
  if(event) event.preventDefault();
  if(!dialog) return;
  if(menuIsOpen()) setMenu(false);
  if(!dialog.open) dialog.showModal();
  dialog.querySelector('input[name="name"]')?.focus();
}
// Every call to action on every page opens the same request form.
all('[data-inquiry]').forEach(el => el.addEventListener('click', openInquiry));
$('#open-inquiry')?.addEventListener('click', openInquiry);
if(location.hash === '#devis') addEventListener('DOMContentLoaded', () => openInquiry());
$('.close-dialog')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close(); } });
const formCopy={
  fr:{
    sending:'Envoi en cours…',
    ok:'Merci — votre demande est partie. Nous revenons vers vous sous deux jours ouvrés.',
    fail:'L\u2019envoi a échoué. Écrivez-nous directement à info@masirapapermill.com.',
    key:'Formulaire non configuré : renseignez la clé Web3Forms dans le champ access_key.'
  },
  en:{
    sending:'Sending…',
    ok:'Thank you — your request is on its way. We reply within two business days.',
    fail:'Sending failed. Please email us directly at info@masirapapermill.com.',
    key:'Form not configured: add your Web3Forms key to the access_key field.'
  },
  ar:{
    sending:'جارٍ الإرسال…',
    ok:'شكراً — تم إرسال طلبك. نردّ خلال يومَي عمل.',
    fail:'فشل الإرسال. راسلنا مباشرة على info@masirapapermill.com.',
    key:'النموذج غير مُهيَّأ: أضف مفتاح Web3Forms في الحقل access_key.'
  }
};
const inquiryForm = $('#inquiry-form');
inquiryForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const copy = formCopy[language] || formCopy.fr;
  const status = $('#form-status');
  const button = inquiryForm.querySelector('.submit-button');
  const key = inquiryForm.elements.access_key?.value || '';
  const setStatus = (text, state) => { status.textContent = text; status.dataset.state = state || ''; };
  if(!key || key.startsWith('REMPLACER')){ setStatus(copy.key,'error'); return; }
  button.disabled = true;
  setStatus(copy.sending);
  try{
    const response = await fetch('https://api.web3forms.com/submit',{
      method:'POST',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify(Object.fromEntries(new FormData(inquiryForm)))
    });
    const data = await response.json();
    if(!data.success) throw new Error(data.message || 'rejected');
    inquiryForm.reset();
    setStatus(copy.ok);
  }catch{
    setStatus(copy.fail,'error');
  }finally{
    button.disabled = false;
  }
});
if($('#year')) $('#year').textContent = new Date().getFullYear();
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
const state={progress:0};
function updateMotionLabel(){const b=$('#motion-toggle');if(!b)return;b.textContent=language==='en'?(paused?'Resume journey':'Pause journey'):language==='ar'?(paused?'استئناف الرحلة':'إيقاف الحركة'):(paused?'Reprendre le parcours':'Pause du parcours');b.setAttribute('aria-pressed',String(paused));}
function broadcastMotion(){document.documentElement.classList.toggle('motion-paused',paused);dispatchEvent(new CustomEvent('masira:motion',{detail:{paused}}));}
$('#motion-toggle')?.addEventListener('click',()=>{paused=!paused;updateMotionLabel();broadcastMotion();});
$('#footer-motion')?.addEventListener('click',()=>$('#motion-toggle')?.click());
preference.addEventListener('change',e=>{paused=e.matches;updateMotionLabel();broadcastMotion();});
let initialLanguage='en';   // English is the site's primary language
try{initialLanguage=localStorage.getItem('masira-language')||'en'}catch{}
applyLanguage(initialLanguage);
setupProductImages();
updateMotionLabel();
broadcastMotion();
