// Vibely Check — anonymous Vibe Passport
(function(){
  'use strict';
  const KEY='vibely_vibe_passport_v1';
  const MAX=100;
  const VIBE_WORDS={'😍':'Loved','😊':'Chill','🔥':'Energetic','😌':'Relaxed','🥳':'Party','😕':'Not my vibe'};
  const ENERGY={'😍':65,'😊':35,'🔥':90,'😌':20,'🥳':100,'😕':50};
  const SOCIAL={'😍':55,'😊':35,'🔥':80,'😌':20,'🥳':95,'😕':40};
  const MOOD_NAMES=[
    [85,'Social Spark','You tend to look for energy, people and places with a pulse.'],
    [68,'Easygoing Explorer','You like a little energy, but you still want the experience to feel comfortable.'],
    [48,'Balanced Viber','You move between lively and laid-back depending on the moment.'],
    [28,'Calm Curator','You naturally lean toward relaxed places where the atmosphere does not overwhelm you.'],
    [0,'Low-Key Seeker','You tend to choose calmer, more comfortable experiences over high-energy rooms.']
  ];
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&Array.isArray(v.checkins)?v:{checkins:[]}}catch{return{checkins:[]}}}
  function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
  function record(item){
    const state=read();
    const clean={placeId:String(item.placeId||''),placeName:String(item.placeName||'Local place').slice(0,120),type:String(item.type||'Place').slice(0,80),address:String(item.address||'').slice(0,180),vibe:String(item.vibe||'😌'),tags:Array.isArray(item.tags)?item.tags.slice(0,8).map(String):[],at:new Date().toISOString()};
    state.checkins.unshift(clean);state.checkins=state.checkins.slice(0,MAX);write(state);return clean;
  }
  function derive(){
    const items=read().checkins;const vibeCounts={},tagCounts={},typeCounts={};let energy=0,social=0;
    items.forEach(x=>{vibeCounts[x.vibe]=(vibeCounts[x.vibe]||0)+1;energy+=ENERGY[x.vibe]??50;social+=SOCIAL[x.vibe]??50;(x.tags||[]).forEach(t=>tagCounts[t]=(tagCounts[t]||0)+1);const t=x.type||'Place';typeCounts[t]=(typeCounts[t]||0)+1});
    const avg=n=>items.length?Math.round(n/items.length):null;
    const energyScore=avg(energy),socialScore=avg(social);
    const mood=Mood(energyScore);
    return {items,count:items.length,vibeCounts,tagCounts,typeCounts,energy:energyScore,social:socialScore,moodName:mood[1],moodDescription:mood[2],favoriteVibes:Object.entries(vibeCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>({emoji:x[0],label:VIBE_WORDS[x[0]]||'Vibe',count:x[1]})),favoriteTags:Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>({label:x[0],count:x[1]}))};
  }
  function Mood(score){if(score==null)return [null,'Still discovering','Add a few anonymous check-ins and Vibely will start learning your taste.'];for(const row of MOOD_NAMES)if(score>=row[0])return row;return MOOD_NAMES[MOOD_NAMES.length-1]}
  function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function initMain(){
    if(window.__vibelyPassportMain)return;window.__vibelyPassportMain=true;
    const original=window.saveVibe;
    if(typeof original!=='function')return;
    window.saveVibe=function(){
      const place=window.currentPlace||null;const vibe=window.selectedEmoji;
      original.apply(this,arguments);
      setTimeout(()=>{const toast=document.getElementById('toast');const text=toast?.textContent||'';if(place&&vibe&&/added|updated/i.test(text)){record({placeId:place.id,placeName:place.name,type:place.type,address:place.address,vibe,tags:place.tags||[]});window.dispatchEvent(new CustomEvent('vibely:passport-updated'));}},700);
    };
    window.VibelyPassport={read,record,derive};
  }
  function renderProfile(){
    if(document.getElementById('vibelyPassportCard'))return;
    const profileCard=document.getElementById('profileCard');if(!profileCard)return;
    const card=document.createElement('section');card.className='card';card.id='vibelyPassportCard';card.innerHTML=`<div class="section-title">🧬 My Vibe Passport</div><div class="vp-privacy">Built from your anonymous check-ins on this device. No name or account is required.</div><div class="vp-identity"><div class="vp-orb">✦</div><div><div class="vp-mood" id="vpMood">Still discovering</div><div class="vp-desc" id="vpDesc">Add a few check-ins and Vibely will start learning your taste.</div></div></div><div class="vp-meters"><div><div class="vp-meter-label"><span>⚡ Energy</span><b id="vpEnergy">—</b></div><div class="vp-track"><i id="vpEnergyBar"></i></div></div><div><div class="vp-meter-label"><span>👯 Social</span><b id="vpSocial">—</b></div><div class="vp-track"><i id="vpSocialBar"></i></div></div></div><div class="vp-label">Your strongest signals</div><div class="vp-chips" id="vpChips"></div><div class="vp-note">Vibely can use this passport to personalize Ask Vibely without exposing your identity.</div>`;
    profileCard.insertAdjacentElement('afterend',card);
    const style=document.createElement('style');style.textContent=`#vibelyPassportCard .vp-privacy{font-size:12px;color:#77727b;line-height:1.45;margin:-5px 0 14px}.vp-identity{display:flex;gap:12px;align-items:center;padding:14px;border-radius:17px;background:linear-gradient(135deg,#f7f1ff,#fff0f8);border:1px solid #eadcff}.vp-orb{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:#fff;font-size:22px;color:#7c3aed}.vp-mood{font-size:17px;font-weight:950}.vp-desc{font-size:12px;color:#625d65;line-height:1.4;margin-top:3px}.vp-meters{display:grid;gap:12px;margin-top:15px}.vp-meter-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px}.vp-track{height:8px;border-radius:999px;background:#eee8f1;overflow:hidden}.vp-track i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7c3aed,#ec4899);border-radius:999px;transition:width .35s}.vp-label{font-size:12px;font-weight:900;margin-top:16px}.vp-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.vp-chip{background:#f5f1f7;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:800}.vp-note{font-size:11px;color:#77727b;line-height:1.45;margin-top:12px}`;document.head.appendChild(style);
    const paint=()=>{const d=derive();document.getElementById('vpMood').textContent=d.moodName;document.getElementById('vpDesc').textContent=d.moodDescription;document.getElementById('vpEnergy').textContent=d.energy==null?'—':d.energy+'%';document.getElementById('vpSocial').textContent=d.social==null?'—':d.social+'%';document.getElementById('vpEnergyBar').style.width=(d.energy||0)+'%';document.getElementById('vpSocialBar').style.width=(d.social||0)+'%';const chips=[...d.favoriteVibes.map(x=>`${x.emoji} ${x.label}`),...d.favoriteTags.slice(0,3).map(x=>`#${x.label}`)];document.getElementById('vpChips').innerHTML=chips.length?chips.map(x=>`<span class="vp-chip">${escapeHtml(x)}</span>`).join(''):'<span class="vp-chip">✨ Your patterns will appear here</span>'};paint();window.addEventListener('storage',paint);window.addEventListener('vibely:passport-updated',paint);
  }
  function init(){if(location.pathname.endsWith('/profile.html'))renderProfile();else initMain()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.VibelyPassport={read,record,derive};
})();
