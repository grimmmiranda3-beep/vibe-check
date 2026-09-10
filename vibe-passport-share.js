// Vibely Check — shareable Vibe Passport card
(function(){
  'use strict';
  function init(){
    if(!location.pathname.endsWith('/profile.html')||document.getElementById('vpShareBtn'))return;
    const card=document.getElementById('vibelyPassportCard');
    if(!card||!window.VibelyPassport?.derive){setTimeout(init,300);return}
    const style=document.createElement('style');style.textContent='.vp-share{width:100%;margin-top:12px;border:0;border-radius:13px;padding:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:900;cursor:pointer}.vp-share-status{text-align:center;font-size:11px;color:#77727b;margin-top:7px;min-height:16px}';document.head.appendChild(style);
    const btn=document.createElement('button');btn.id='vpShareBtn';btn.className='vp-share';btn.type='button';btn.textContent='✨ Share My Vibe';
    const status=document.createElement('div');status.className='vp-share-status';status.setAttribute('aria-live','polite');
    card.appendChild(btn);card.appendChild(status);
    btn.onclick=async()=>{
      const d=window.VibelyPassport.derive();
      const top=d.favoriteVibes?.[0];
      const tags=(d.favoriteTags||[]).slice(0,2).map(x=>`#${x.label}`).join(' ');
      const text=`My Vibely Vibe ✨\n${d.moodName}\nEnergy ${d.energy??'—'}% · Social ${d.social??'—'}%${top?`\n${top.emoji} ${top.label}`:''}${tags?`\n${tags}`:''}\n\nFind your vibe on Vibely Check.`;
      try{if(navigator.share){await navigator.share({title:'My Vibely Vibe',text,url:location.origin});status.textContent='Shared! ✨';return}if(navigator.clipboard)await navigator.clipboard.writeText(text+'\n'+location.origin);else throw new Error('clipboard');status.textContent='Vibe card copied — share it anywhere! ✨'}catch(e){if(e?.name==='AbortError')return;status.textContent='Could not share right now. Try again.'}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
