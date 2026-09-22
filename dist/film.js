/* A bounded decoded-frame cache keeps the scroll film light on mobile memory. */
(() => {
  const section = document.querySelector('.film-section');
  const canvas = document.querySelector('#film-canvas');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d', {alpha:false});
  if (!ctx) return;
  const count = 419, cache = new Map(), pending = new Set(), failed = new Set();
  const mobile = () => innerWidth <= 700;
  // Keep the source fixed for this visit, including orientation changes.
  const frameFolder = mobile() ? 'machine-mobile' : 'machine-v7';
  const cacheLimit = mobile() ? 24 : 80;
  const concurrent = mobile() ? 5 : 12;
  let target = 0, current = 0, drawn = -1, raf = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counter = document.querySelector('.film-counter');
  const track = document.querySelector('.film-track i');
  const cards = [...document.querySelectorAll('.film-card')];
  const heading = document.querySelector('.film-heading');
  const stage = document.querySelector('.film-stage');
  const footerYear=document.querySelector('#footer-year');
  if(footerYear)footerYear.textContent=new Date().getFullYear();
  const clamp = v => Math.max(0, Math.min(1,v));
  function requestFrame(index) {
    if(index<0 || index>=count || cache.has(index) || pending.has(index) || failed.has(index) || pending.size>=concurrent) return;
    pending.add(index);
    const img = new Image(); img.decoding='async';
    img.onload=()=>{
      pending.delete(index); cache.set(index,img);
      if(cache.size>cacheLimit) {
        const keys=[...cache.keys()].sort((a,b)=>Math.abs(b-current)-Math.abs(a-current));
        while(cache.size>cacheLimit)cache.delete(keys.shift());
      }
      schedule();
    };
    img.onerror=()=>{pending.delete(index);failed.add(index);schedule();};
    img.src=`assets/${frameFolder}/frame-${String(index+1).padStart(4,'0')}.webp?v=7`;
  }
  function draw(index) {
    let best=index;
    if(!cache.has(best))best=[...cache.keys()].sort((a,b)=>Math.abs(a-index)-Math.abs(b-index))[0];
    if(best===undefined || best===drawn)return;
    const img=cache.get(best),w=canvas.width,h=canvas.height;
    // Keep the entire machine visible on portrait screens.
    const portrait=mobile() && h>w;
    const progress=index/(count-1);
    // Gently open out to the full production line at the beginning and end.
    const zoom=portrait ? 1+Math.sin(progress*Math.PI)*.28 : .86;
    const scale=portrait ? Math.min(w/img.width*zoom,h*.54/img.height) : Math.min(w/img.width,h/img.height)*.86;
    const iw=img.width*scale,ih=img.height*scale;
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#050a0b';ctx.fillRect(0,0,w,h);
    const x=(w-iw)/2,y=portrait ? h*.66-ih/2 : (h-ih)/2;
    ctx.drawImage(img,x,y,iw,ih);
    // Blend the actual image bounds, not just the viewport edges.
    const edge=Math.min(iw,ih)*.12;
    for(const [x0,y0,x1,y1,rx,ry,rw,rh] of [
      [x,y,x+edge,y,x,y,edge,ih],
      [x+iw,y,x+iw-edge,y,x+iw-edge,y,edge,ih],
      [x,y,x,y+edge,x,y,iw,edge],
      [x,y+ih,x,y+ih-edge,x,y+ih-edge,iw,edge]
    ]){
      const fade=ctx.createLinearGradient(x0,y0,x1,y1);
      fade.addColorStop(0,'#050a0b');fade.addColorStop(1,'rgba(5,10,11,0)');
      ctx.fillStyle=fade;ctx.fillRect(rx,ry,rw,rh);
    }
    drawn=best;canvas.style.opacity='1';
    counter.textContent=`${String(best+1).padStart(3,'0')} / ${count}`;
  }
  function tick() {
    raf=0;
    if(!paused)current+=(target-current)*(mobile()?.22:.10);
    if(Math.abs(target-current)<.15 && !paused)current=target;
    const index=Math.round(current);
    requestFrame(index);draw(index);
    const direction=target>=current?1:-1;
    for(let i=1;i<=(paused?0:mobile()?6:20);i++)requestFrame(index+i*direction);
    for(let i=1;i<=(paused?0:mobile()?3:8);i++)requestFrame(index-i*direction);
    track.style.transform=`scaleX(${current/(count-1)})`;
    if(!paused && Math.abs(target-current)>.15)schedule();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(tick);}
  function update(){
    const rect=section.getBoundingClientRect();
    const p=clamp(-rect.top/Math.max(1,section.offsetHeight-stage.clientHeight));
    target=p*(count-1);
    heading.style.opacity=String(1-clamp(p*7));
    cards.forEach(card=>{
      const r=card.parentElement.getBoundingClientRect();
      const enter=clamp((innerHeight*.85-r.top)/(innerHeight*.6));
      const leave=clamp((r.bottom-innerHeight*.3)/(innerHeight*.45));
      const smooth=v=>v*v*(3-2*v);
      const reveal=smooth(enter)*smooth(leave);
      // A slow entrance, a quiet reading plateau, then a shorter upward exit.
      const exit=1-smooth(leave);
      const entrance=1-smooth(clamp(enter/.72));
      const fromRight=getComputedStyle(card).textAlign==='right';
      card.style.opacity=String(smooth(enter)*smooth(leave));
      card.style.transform=paused?'none':`translate3d(${(fromRight?1:-1)*entrance*48}px,${-exit*42}px,0) scale(${1-exit*.018})`;
      card.style.visibility=reveal<=0?'hidden':'visible';
      card.style.setProperty('--chapter-rule',String(smooth(clamp(enter/.5))));
      [...card.children].forEach((child,i)=>{
        const isTitle=child.tagName==='H2';
        const delay=i===0?0:.44;
        const progress=paused||isTitle?1:smooth(clamp((enter-delay)/.5));
        child.style.opacity=String(progress);
        child.style.transform=paused||isTitle?'none':`translate3d(0,${(1-progress)*18}px,0)`;
        child.style.filter='none';
      });
      [...card.querySelectorAll('.reveal-line > span')].forEach((line,i)=>{
        const progress=paused?1:smooth(clamp((enter-.1-i*.14)/.62));
        line.style.transform=`translate3d(0,${(1-progress)*108}%,0) rotate(${(1-progress)*1.5}deg)`;
        line.style.opacity=String(clamp(progress*3));
      });
    });
    const activeCard=cards.find(card=>card.style.visibility==='visible'&&Number(card.style.opacity)>.45);
    if(activeCard)stage.dataset.textSide=getComputedStyle(activeCard).textAlign==='right'?'right':'left';
    // The film remains fully visible while each chapter animates independently.
    // A global shade would flatten the scene and make the scroll feel heavy.
    document.querySelector('.scroll-progress').style.width=`${clamp(scrollY/(document.documentElement.scrollHeight-innerHeight))*100}%`;
    schedule();
  }
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,mobile()?1.5:3);
    canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr);drawn=-1;update();
  }
  let scrollRaf=0;
  addEventListener('scroll',()=>{if(!scrollRaf)scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;update();});},{passive:true});addEventListener('resize',resize,{passive:true});
  addEventListener('masira:motion',e=>{paused=e.detail.paused;update();});
  addEventListener('masira:language',update);
  addEventListener('pageshow',update);requestFrame(0);resize();
})();
