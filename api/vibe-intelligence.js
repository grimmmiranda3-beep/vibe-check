function config(){return{url:process.env.SUPABASE_URL||"",key:process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||""}}
function clean(s,max=300){return String(s||"").replace(/[<>]/g,"").trim().slice(0,max)}
async function rpc(name,args){const{url,key}=config();if(!url||!key)throw Error("Supabase is not configured.");const r=await fetch(`${url.replace(/\/$/,"")}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(args)});const t=await r.text();let d;try{d=t?JSON.parse(t):null}catch{d=null}if(!r.ok)throw Error(d?.message||d?.hint||"Vibe intelligence request failed.");return d}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate");
 if(req.method!=="POST"&&req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 try{
  const raw=req.method==="GET"?req.query?.placeIds:(req.body||{}).placeIds;
  const ids=(Array.isArray(raw)?raw:String(raw||"").split(",")).map(x=>clean(x,200)).filter(Boolean).slice(0,12);
  if(!ids.length)return res.status(400).json({error:"At least one placeId is required."});
  const results=await Promise.all(ids.map(async id=>({placeId:id,intelligence:await rpc("vibe_intelligence",{p_place_id:id})})));
  return res.status(200).json({results});
 }catch(e){console.error("Vibe intelligence error:",e);return res.status(200).json({results:[],error:"Live intelligence is still forming."})}
}
