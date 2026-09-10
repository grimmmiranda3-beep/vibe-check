// Vibely Check launch modules loader.
(function(){
'use strict';
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src+'?v=20260910-feed';s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
async function start(){
 const files=['share-vibe.js','trending.js','vibe-wow.js','business-interest.js','business-claim.js','business-landing.js','mobile-business-polish.js','mobile-launch-polish.js','desktop-nav.js','live-vibe-map.js','checkin-polish.js','not-my-vibe-fix.js','nearby-home.js','nearby-checkin.js','checkin-location.js','live-pulse-sync.js','ask-vibely-safe.js','ask-vibely-ui.js','ask-vibely-view-fix.js','vibe-passport.js','score-explainer.js','launch-onboarding.js','feed-polish.js'];
 for(const file of files){try{await load(file);}catch(e){console.warn('Vibely module failed to load:',file,e);}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
