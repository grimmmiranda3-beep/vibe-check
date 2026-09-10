// Vibe Check — turn the live map into a privacy-safe local vibe radar.
// Uses the same device-location nearby feed; no location is stored by this module.
(function(){
  'use strict';
  const ID='vcLiveVibeMap';
  const RADII=[1,5,10,25,50];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const words={'😍':'Loved','😊':'Chill','🔥':'Energetic','😌':'Relaxed','🥳':'Party','😕':'Not my vibe'};
  let position=null, places=[];

  function radius(){
    try{const n=Number(localStorage.getItem('vc_nearby_radius'));return RADII.includes(n)?n:5}catch(e){return 5}
  }

  function styles(){
    if(document.getElementById(ID+'Styles')) return;
    const s=document.createElement('style');s.id=ID+'Styles';s.textContent=`
      #map.vc-map-live{background-color:#e9e4eb;position:relative}
      #map.vc-map-live .vc-map-badge{position:absolute;right:20px;top:20px;z-index:6;background:rgba(255,255,255,.94);border:1px solid #e9e1f0;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:900;color:#6d28d9;box-shadow:0 6px 18px rgba(25,18,35,.08)}
      #map.vc-map-live .vc-map-center{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px;border-radius:50%;background:#7c3aed;border:4px solid #fff;box-shadow:0 0 0 8px rgba(124,58,237,.14);z-index:4}
      #map.vc-map-live .vc-map-ring{position:absolute;left:50%;top:50%;width:54%;height:54%;margin:-27%;border:1px dashed rgba(124,58,237,.28);border-radius:50%;z-index:1;pointer-events:none}
      #map.vc-map-live .vc-map-ring-label{position:absolute;left:50%;top:22%;transform:translateX(-50%);z-index:2;background:rgba(255,255,255,.8);border-radius:999px;padding:4px 8px;font-size:9px;color:#77727b;font-weight:800;pointer-events:none}
      #map.vc-map-live .vc-map-pin{position:absolute;transform:translate(-50%,-50%);z-index:5;border:1px solid #fff;border-radius:999px;background:#fff;box-shadow:0 7px 20px rgba(49,36,61,.18);padding:7px 9px;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis}
      #map.vc-map-live .vc-map-pin.hot{background:#17151a;color:#fff}
      #map.vc-map-live .vc-map-tooltip{position:absolute;display:none;z-index:10;width:min(260px,70%);padding:12px 13px;background:#fff;border:1px solid #eadcff;border-radius:15px;box-shadow:0 18px 40px rgba(18,10,28,.2);font-size:11px}
      #map.vc-map-live .vc-map-tooltip.show{display:block}
      .vc-map-tooltip-name{font-weight:900;font-size:13px;color:#17151a}.vc-map-tooltip-vibe{margin-top:4px;font-weight:850;color:#6d28d9}.vc-map-tooltip-meta{margin-top:4px;color:#77727b;line-height:1.4}
      .vc-map-empty{position:absolute;inset:0;display:grid;place-items:center;z-index:3;pointer-events:none}.vc-map-empty>div{background:rgba(255,255,255,.9);border:1px dashed #dcd2e6;border-radius:17px;padding:15px 18px;text-align:center;color:#77727b;font-size:11px;max-width:260px}.vc-map-empty b{display:block;color:#17151a;font-size:13px;margin-bottom:4px}
    `;document.head.appendChild(s);
  }

  function haversineBearing(a,b){
    const toRad=x=>x*Math.PI/180;const lat1=toRad(a.latitude),lat2=toRad(b.latitude),dlon=toRad(b.longitude-a.longitude);
    const y=Math.sin(dlon)*Math.cos(lat2);const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dlon);
    return Math.atan2(y,x)*180/Math.PI;
  }

  function clearMap(){const map=document.getElementById('map');if(!map)return;map.classList.add('vc-map-live');map.querySelectorAll('.vc-map-extra').forEach(x=>x.remove())}

  function showEmpty(message){const map=document.getElementById('map');if(!map)return;clearMap();const empty=document.createElement('div');empty.className='vc-map-empty vc-map-extra';empty.innerHTML=`<div><b>Live Vibe Map</b>${esc(message)}</div>`;map.appendChild(empty)}

  function render(){
    const map=document.getElementById('map');if(!map)return;clearMap();
    if(!position){showEmpty('Turn on Nearby location to see live places around you.');return}
    const active=places.filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))).slice(0,12);
    if(!active.length){showEmpty('No live check-ins in this radius yet. Be the first to set the pulse.');return}
    const r=radius();
    const badge=document.createElement('div');badge.className='vc-map-badge vc-map-extra';badge.textContent=`LIVE · ${r} MI`;map.appendChild(badge);
    const ring=document.createElement('div');ring.className='vc-map-ring vc-map-extra';map.appendChild(ring);
    const ringLabel=document.createElement('div');ringLabel.className='vc-map-ring-label vc-map-extra';ringLabel.textContent=`${r} mile pulse`;map.appendChild(ringLabel);
    const center=document.createElement('div');center.className='vc-map-center vc-map-extra';center.title='Your approximate location';map.appendChild(center);
    const tooltip=document.createElement('div');tooltip.className='vc-map-tooltip vc-map-extra';map.appendChild(tooltip);
    active.forEach((p,i)=>{
      const d=Math.max(0.05,Math.min(r,Number(p.distance_miles)||0));const bearing=haversineBearing(position,{latitude:Number(p.latitude),longitude:Number(p.longitude)});const angle=bearing*Math.PI/180;const radial=7+(d/r)*39;
      const x=Math.max(8,Math.min(92,50+Math.sin(angle)*radial));const y=Math.max(10,Math.min(90,50-Math.cos(angle)*radial));const vibe=p.dominant||'💜';
      const pin=document.createElement('button');pin.type='button';pin.className=`vc-map-pin vc-map-extra${i===0?' hot':''}`;pin.style.left=`${x}%`;pin.style.top=`${y}%`;pin.textContent=`${vibe} ${p.place_name||'Local place'}`;pin.title=`${p.place_name||'Local place'} · ${words[vibe]||'Live vibe'} · ${d.toFixed(1)} mi`;
      pin.addEventListener('click',e=>{e.stopPropagation();tooltip.style.left=`${Math.min(76,Math.max(8,x-8))}%`;tooltip.style.top=`${Math.min(76,Math.max(8,y+5))}%`;tooltip.innerHTML=`<div class="vc-map-tooltip-name">${esc(p.place_name||'Local place')}</div><div class="vc-map-tooltip-vibe">${esc(vibe)} ${esc(words[vibe]||'Live vibe')}</div><div class="vc-map-tooltip-meta">${Number(p.total||0)} live check-in${Number(p.total||0)===1?'':'s'} · ${d.toFixed(1)} mi away<br>Live signal from the last 3 hours.</div>`;tooltip.classList.add('show')});
      map.appendChild(pin);
    });
    map.onclick=()=>tooltip.classList.remove('show');
  }

  function patchNearbyFetch(){
    if(window.__vcLiveMapFetchPatched)return;const original=window.fetch.bind(window);
    window.fetch=async function(input,init){const response=await original(input,init);try{const url=typeof input==='string'?input:(input?.url||'');if(url.includes('/api/nearby?')){const copy=response.clone();copy.json().then(data=>{if(Array.isArray(data?.places)){places=data.places;render()}}).catch(()=>{})}}catch(e){}return response};
    window.__vcLiveMapFetchPatched=true;
  }

  function patchLocation(){
    if(window.__vcLiveMapGeoPatched)return;const original=navigator.geolocation?.getCurrentPosition?.bind(navigator.geolocation);if(!original)return;
    navigator.geolocation.getCurrentPosition=function(success,error,options){return original(p=>{position={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy};if(typeof success==='function')success(p);render()},error,options)};
    window.__vcLiveMapGeoPatched=true;
  }

  function init(){
    styles();patchNearbyFetch();patchLocation();render();window.addEventListener('storage',e=>{if(e.key==='vc_nearby_radius')render()});window.addEventListener('vc:checkin-complete',()=>setTimeout(render,600));setInterval(()=>{if(position&&places.length)render()},30000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
