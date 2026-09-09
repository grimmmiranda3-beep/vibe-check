// Vibe Check — one-tap check-in UI.
(function(){
  'use strict';
  function addButtons(){
    const cards=document.querySelectorAll('.place');
    cards.forEach((card,index)=>{
      const actions=card.querySelector('.place-actions');
      if(!actions || actions.querySelector('.checkin-btn')) return;
      const button=document.createElement('button');
      button.type='button';
      button.className='small-btn checkin-btn';
      button.textContent='💜 Check in';
      button.addEventListener('click',function(){
        if(typeof window.openModal==='function') window.openModal(index);
      });
      actions.appendChild(button);
    });
  }
  function init(){
    addButtons();
    const target=document.getElementById('places');
    if(target) new MutationObserver(addButtons).observe(target,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
