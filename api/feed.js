function noStore(res){res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0')}
export default async function handler(req,res){
 noStore(res); if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
 try{
  const url=(process.env.SUPABASE_URL||'').replace(/\/$/,''); const key=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'';
  if(!url||!key) return res.status(500).json({error:'Supabase is not configured.'});
  const limit=Math.min(Math.max(Number(req.query?.limit||30),1),50);
  const r=await fetch(`${url}/rest/v1/rpc/vibe_recent_feed`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_limit:limit})});
  const data=await r.json(); if(!r.ok) return res.status(500).json({error:'Unable to load the live feed.'});
  return res.status(200).json({ok:true,feed:Array.isArray(data)?data:[]});
 }catch(e){console.error('Vibe feed error:',e);return res.status(500).json({error:'Unable to load the live feed.'})}
}
