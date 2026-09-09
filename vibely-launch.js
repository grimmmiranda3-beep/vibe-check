// Vibely Check launch modules loader.
(function(){
'use strict';
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
async function start(){
 const files=['share-vibe.js','trending.js','business-interest.js','business-claim.js'];
 for(const file of files){try{await load(file);}catch(e){console.warn('Vibely module failed to load:',file,e);}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
