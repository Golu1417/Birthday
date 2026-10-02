/* Birthday app core — includes a persistent music player and seamless in-app navigation. */
const target = new Date(2026,9,25,0,0,0);

function countdown(){
  const d=Math.max(0,target-new Date()), s=1000,m=s*60,h=m*60,day=h*24;
  const el=id=>document.getElementById(id);
  if(!el('days')) return;
  if(d<=0){['days','hours','minutes','seconds'].forEach(x=>el(x).textContent='00'); if(el('countMsg')) el('countMsg').textContent='Today is your day, my love! 🎂✨'; return;}
  el('days').textContent=Math.floor(d/day);
  el('hours').textContent=String(Math.floor(d%day/h)).padStart(2,'0');
  el('minutes').textContent=String(Math.floor(d%h/m)).padStart(2,'0');
  el('seconds').textContent=String(Math.floor(d%m/s)).padStart(2,'0');
}
let countdownTimer;
function startCountdown(){ countdown(); clearInterval(countdownTimer); countdownTimer=setInterval(countdown,1000); }

function hearts(n=14){
  for(let i=0;i<n;i++){
    const x=document.createElement('span'); x.className='heart'; x.textContent=['💗','💕','💖','💘','🌸'][Math.floor(Math.random()*5)];
    x.style.left=(10+Math.random()*80)+'vw'; x.style.top=(55+Math.random()*35)+'vh';
    x.style.animationDelay=(Math.random()*.45)+'s'; document.body.appendChild(x);
    setTimeout(()=>x.remove(),2600);
  }
}

function bindPageInteractions(){
  document.querySelectorAll('[data-hearts]').forEach(b=>b.addEventListener('click',()=>hearts(20)));
  const reveal=document.getElementById('reveal');
  if(reveal) reveal.addEventListener('click',()=>{
    document.getElementById('secret').classList.remove('hidden');
    document.getElementById('secret').classList.add('reveal');
    hearts(30); reveal.textContent='💗 You found it!';
  });
  document.querySelectorAll('.photo img').forEach(img=>img.addEventListener('click',()=>hearts(8)));
  bindInstallButton();
  startCountdown();
}

// Persistent audio: the audio element is deliberately kept alive while page content changes.
let loveMusic = null;
let musicButton = null;
let musicPrompt = null;

function ensureMusic(){
  if(loveMusic && document.body.contains(loveMusic)) return;

  loveMusic = document.createElement('audio');
  loveMusic.id='loveMusic';
  loveMusic.src='./assets/jeene-laga-hoon.mp3';
  loveMusic.loop=true;
  loveMusic.preload='auto';
  loveMusic.volume=0.22;
  loveMusic.setAttribute('aria-label','Jeene Laga Hoon background music');
  document.body.appendChild(loveMusic);

  musicButton=document.createElement('button');
  musicButton.id='musicToggle';
  musicButton.className='music-toggle';
  musicButton.type='button';
  musicButton.textContent='♫ Music';
  musicButton.setAttribute('aria-label','Play or pause Jeene Laga Hoon');
  document.body.appendChild(musicButton);

  musicPrompt=document.createElement('button');
  musicPrompt.id='musicPrompt';
  musicPrompt.className='music-prompt';
  musicPrompt.type='button';
  musicPrompt.innerHTML='🎵 Tap once to start our song ❤️';
  document.body.appendChild(musicPrompt);

  function updateMusicUI(){
    const playing=!loveMusic.paused;
    musicButton.classList.toggle('playing',playing);
    musicButton.setAttribute('aria-label',playing?'Pause Jeene Laga Hoon':'Play Jeene Laga Hoon');
    musicButton.title=playing?'Pause music':'Play music';
    musicPrompt.style.display=playing?'none':'flex';
  }
  async function startMusic(){
    try { await loveMusic.play(); } catch(_) {}
    updateMusicUI();
  }
  musicButton.addEventListener('click',async e=>{ e.stopPropagation(); if(loveMusic.paused) await startMusic(); else loveMusic.pause(); updateMusicUI(); });
  musicPrompt.addEventListener('click',async e=>{ e.stopPropagation(); await startMusic(); });
  loveMusic.addEventListener('play',updateMusicUI);
  loveMusic.addEventListener('pause',updateMusicUI);
  loveMusic.addEventListener('ended',()=>{loveMusic.currentTime=0; startMusic();});

  // Try audible autoplay. Chrome may block this on a first visit; the prompt is the fallback.
  startMusic();
  const unlock=()=>{ if(loveMusic.paused) startMusic(); };
  ['pointerdown','touchstart','keydown','click'].forEach(type=>document.addEventListener(type,unlock,{once:true,passive:true}));
  updateMusicUI();
}

function bindInstallButton(){
  const btn=document.getElementById('installApp');
  if(btn){ btn.style.display=deferredInstallPrompt?'inline-flex':'none'; }
  if(btn && !btn.dataset.bound){
    btn.dataset.bound='1';
    btn.addEventListener('click',async()=>{
      if(!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt=null;
      btn.style.display='none';
    });
  }
}
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;bindInstallButton();});

// Seamless navigation: load the next HTML document into the current page instead of
// reloading the browser document. Because the audio element remains alive, the song
// keeps playing at the exact same position while moving between pages.
async function navigate(url, push=true){
  try{
    const response=await fetch(url,{cache:'no-cache'});
    if(!response.ok) throw new Error('Navigation failed');
    const html=await response.text();
    const parsed=new DOMParser().parseFromString(html,'text/html');
    const oldMusic=loveMusic, oldButton=musicButton, oldPrompt=musicPrompt;
    const newNodes=Array.from(parsed.body.childNodes).filter(n=>{
      if(n.nodeType!==1) return true;
      const tag=n.tagName.toLowerCase();
      return tag!=='script';
    });
    document.body.innerHTML='';
    newNodes.forEach(n=>document.body.appendChild(n));
    if(oldMusic) document.body.appendChild(oldMusic);
    if(oldButton) document.body.appendChild(oldButton);
    if(oldPrompt) document.body.appendChild(oldPrompt);
    if(push) history.pushState({url},'',url);
    document.title=parsed.title || document.title;
    bindPageInteractions();
    updateActiveNav(url);
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(err){ window.location.href=url; }
}
function updateActiveNav(url){
  const current=new URL(url,location.href).pathname.split('/').pop()||'index.html';
  document.querySelectorAll('nav a[href]').forEach(a=>{
    const link=new URL(a.getAttribute('href'),location.href).pathname.split('/').pop()||'index.html';
    a.classList.toggle('active',link===current);
  });
}
function bindNavigation(){
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a || a.target==='_blank' || a.hasAttribute('download')) return;
    const href=a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const u=new URL(href,location.href);
    if(u.origin!==location.origin || !u.pathname.endsWith('.html')) return;
    e.preventDefault();
    navigate(u.pathname+u.search+u.hash,true);
  });
  window.addEventListener('popstate',()=>navigate(location.pathname+location.search+location.hash,false));
}

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{})); }

ensureMusic();
bindNavigation();
bindPageInteractions();
