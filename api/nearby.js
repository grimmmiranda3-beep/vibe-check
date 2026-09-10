function noStore(res){res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0')}
async function enrichPlaces(places){
 const apiKey=process.env.GOOGLE_PLACES_API_KEY;
 if(!apiKey||!Array.isArray(places)||!places.length)return places;
 return Promise.all(places.map(async p=>{
  if(p?.place_name)return p;
  const placeId=p?.place_id||p?.placeId||p?.id;
  if(!placeId)return p;
  try{
   const r=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,{headers:{'X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':'id,displayName,formattedAddress,location'}});
   if(!r.ok)return p;
   const g=await r.json();
   return {...p,place_name:g.displayName?.text||p.place_name||'Local place',place_address:g.formattedAddress||p.place_address||'',latitude:p.latitude??g.location?.latitude??null,longitude:p.longitude??g.location?.longitude??null};
  }catch(e){return p}
 }));
}
export default async function handler(req,res){
 noStore(res); if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
 const lat=Number(req.query?.lat), lng=Number(req.query?.lng), radius=Number(req.query?.radius||5);
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||!Number.isFinite(radius)||radius<=0||radius>50)return res.status(400).json({error:'Valid location and radius (1–50 miles) are required.'});
 try{
  const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'';if(!url||!key)throw Error('Supabase is not configured.');
  const r=await fetch(`${url}/rest/v1/rpc/vibe_nearby_pulse`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_lat:lat,p_lng:lng,p_radius_miles:radius})});
  const data=await r.json();if(!r.ok)throw Error('Nearby pulse unavailable');
  const places=await enrichPlaces(Array.isArray(data)?data:[]);
  return res.status(200).json({ok:true,places});
 }catch(e){console.error(e);return res.status(500).json({error:'Unable to load nearby vibes.'})}
}
