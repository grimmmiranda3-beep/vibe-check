// Mobile UX fix: keep Ask Vibely clear of the fixed bottom navigation.
(function(){
  'use strict';
  function apply(){
    if(window.innerWidth>700)return;
    const style=document.getElementById('askVibelyMobileFix');
    if(style)return;
    const s=document.createElement('style');
    s.id='askVibelyMobileFix';
    s.textContent=`
      @media(max-width:700px){
        #askVibelyLauncher{
          bottom:calc(154px + env(safe-area-inset-bottom)) !important;
          right:14px !important;
        }
        #askVibelyPanel{
          bottom:calc(215px + env(safe-area-inset-bottom)) !important;
          max-height:calc(100dvh - 245px) !important;
        }
      }
    `;
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
  setTimeout(apply,300);
})();
