function noStore(res){res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0')}
export default async function handler(req,res){
 noStore(res); if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
 try{
  const url=(process.env.SUPABASE_URL||'').replace(/\/$/,''); const key=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'';
  if(!url||!key) return res.status(503).json({error:'Live feed is temporarily unavailable. Please try again later.'});
  const requested=Number(req.query?.limit||30); const limit=Number.isFinite(requested)?Math.min(Math.max(Math.trunc(requested),1),50):30;
  const r=await fetch(`${url}/rest/v1/rpc/vibe_recent_feed`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_limit:limit})});
  const data=await r.json().catch(()=>[]); if(!r.ok){console.error('Vibe feed upstream error:',r.status,data);return res.status(r.status>=500||r.status===429?503:502).json({error:'Unable to load the live feed right now.'});}
  return res.status(200).json({ok:true,feed:Array.isArray(data)?data:[]});
 }catch(e){console.error('Vibe feed error:',e);return res.status(503).json({error:'Unable to load the live feed right now.'})}
}
