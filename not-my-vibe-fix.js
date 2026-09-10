// Vibe Check — reliable "Not my vibe" check-in option.
(function(){
  'use strict';
  const EMOJI='😕';
  const LABEL='Not my vibe';

  function addStyles(){
    if(document.getElementById('not-my-vibe-fix-styles')) return;
    const style=document.createElement('style');
    style.id='not-my-vibe-fix-styles';
    style.textContent=`
      .not-my-vibe-fix{border-color:#e7dce9!important;background:#fff!important;color:#4b4650!important}
      .not-my-vibe-fix.selected{border:2px solid #7c3aed!important;background:#f7f1ff!important;color:#5b21b6!important}
    `;
    document.head.appendChild(style);
  }

  function ensureOption(){
    document.querySelectorAll('.emoji-row').forEach(row=>{
      if(row.querySelector('.not-my-vibe-fix')) return;
      const button=document.createElement('button');
      button.type='button';
      button.className='emoji not-my-vibe-fix';
      button.textContent=EMOJI;
      button.title=LABEL;
      button.setAttribute('aria-label',LABEL);
      button.addEventListener('click',function(){
        if(typeof window.selectEmoji==='function') window.selectEmoji(EMOJI,button);
        else {
          row.querySelectorAll('.emoji').forEach(x=>x.classList.remove('selected'));
          button.classList.add('selected');
        }
      });
      row.appendChild(button);
    });
  }

  function init(){
    addStyles();
    ensureOption();
    const modal=document.getElementById('modal');
    if(modal) new MutationObserver(ensureOption).observe(modal,{childList:true,subtree:true});
    if(typeof window.openModal==='function' && !window.__vcNotMyVibeOpenWrapped){
      const original=window.openModal;
      window.openModal=async function(){
        const result=await original.apply(this,arguments);
        setTimeout(ensureOption,0);
        setTimeout(ensureOption,100);
        return result;
      };
      window.__vcNotMyVibeOpenWrapped=true;
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
