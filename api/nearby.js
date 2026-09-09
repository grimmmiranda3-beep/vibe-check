function noStore(res){res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0')}
export default async function handler(req,res){
 noStore(res); if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
 const lat=Number(req.query?.lat), lng=Number(req.query?.lng), radius=Number(req.query?.radius||5);
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||!Number.isFinite(radius)||radius<=0||radius>25)return res.status(400).json({error:'Valid location and radius are required.'});
 try{
  const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'';if(!url||!key)throw Error('Supabase is not configured.');
  const r=await fetch(`${url}/rest/v1/rpc/vibe_nearby_pulse`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_lat:lat,p_lng:lng,p_radius_miles:radius})});
  const data=await r.json();if(!r.ok)throw Error('Nearby pulse unavailable');return res.status(200).json({ok:true,places:Array.isArray(data)?data:[]});
 }catch(e){console.error(e);return res.status(500).json({error:'Unable to load nearby vibes.'})}
}
