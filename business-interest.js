// Vibely Check — business interest layer.
// Adds a lightweight owner CTA without requiring accounts, payments, or backend changes.
(function(){
'use strict';
function esc(v){return String(v||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function render(){
 if(document.getElementById('vibelyBusinessInterest')) return;
 const host=document.getElementById('exploreContent'); if(!host) return;
 const panel=document.createElement('section'); panel.id='vibelyBusinessInterest';
 panel.innerHTML='<div class="business-interest-card"><div><div class="business-eyebrow">FOR LOCAL BUSINESSES</div><h2>Want to manage your vibe?</h2><p>Claim your business on Vibely Check and learn what customers are saying about your vibe.</p></div><button type="button" class="business-interest-btn">I own this business</button></div>';
 host.appendChild(panel);
 const style=document.createElement('style'); style.textContent='.business-interest-card{margin:18px 0 0;padding:20px;border:1px solid var(--line);border-radius:22px;background:#fff;display:flex;justify-content:space-between;align-items:center;gap:18px;box-shadow:0 8px 28px #21142c08}.business-eyebrow{font-size:11px;font-weight:900;letter-spacing:.08em;color:var(--accent)}.business-interest-card h2{margin:5px 0;font-size:20px}.business-interest-card p{margin:0;color:var(--muted);font-size:13px;line-height:1.45}.business-interest-btn{border:0;border-radius:999px;padding:11px 16px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer;white-space:nowrap}@media(max-width:650px){.business-interest-card{flex-direction:column;align-items:stretch}.business-interest-btn{width:100%}}'; document.head.appendChild(style);
 panel.querySelector('button').addEventListener('click',()=>{const place=window.__vibelyPlaces?.[0]; const name=place?.name||''; const subject=encodeURIComponent('Vibely Check Business Interest'); const body=encodeURIComponent(`Hi Vibely Check, I own/manage ${name}. I'd like to learn about claiming my business and Vibely Check analytics.`); window.location.href=`mailto:?subject=${subject}&body=${body}`;});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render); else render();
window.setInterval(render,2000);
})();
