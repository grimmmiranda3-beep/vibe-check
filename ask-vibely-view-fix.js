// Makes Ask Vibely's "View Vibe" work for places discovered directly by Ask Vibely.
// The main app's openModal() uses its private visiblePlaces array, so an Ask result
// that was not part of the last main search needs to be routed through the normal
// search flow first.
(function(){
'use strict';
function run(){
 document.addEventListener('click',async function(e){
  const button=e.target.closest?.('.ask-view');
  if(!button)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const name=button.dataset.name||'';
  const panel=document.getElementById('askVibelyPanel');
  const location=panel?.querySelector('.ask-location')?.value?.trim()||'';
  const search=document.getElementById('search');
  if(!name||!search||typeof window.searchPlaces!=='function'||typeof window.openModal!=='function')return;
  const original=search.value;
  search.value=location?`${name} ${location}`:name;
  button.disabled=true;
  button.textContent='Opening…';
  try{
   if(panel)panel.classList.remove('show');
   await window.searchPlaces();
   const cards=[...document.querySelectorAll('#places .place')];
   const index=cards.findIndex(card=>(card.querySelector('h3')?.textContent||'').trim().toLowerCase()===name.trim().toLowerCase());
   window.openModal(index>=0?index:0);
  }catch(err){
   console.error('Ask Vibely View Vibe error:',err);
   search.value=original;
   if(panel)panel.classList.add('show');
  }finally{
   button.disabled=false;
   button.textContent='View Vibe';
  }
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
// Keep production deployment in sync with the launch-module attachment.
