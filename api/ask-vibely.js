function noStore(res){res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0')}
function clean(s,max=500){return String(s||'').replace(/[<>]/g,'').trim().slice(0,max)}
export default async function handler(req,res){
 noStore(res); if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}), prompt=clean(body.prompt,700), location=clean(body.location,120);
  if(!prompt) return res.status(400).json({error:'Tell Vibely what kind of place or vibe you want.'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(503).json({error:'Ask Vibely is temporarily unavailable.'});
  const system=`You are Vibely, a friendly local-place recommendation assistant. Help users choose places based on the live place data supplied by the app. Be concise, conversational, and useful. Never claim a place is currently busy, open, or has a specific live vibe unless that fact is present in the supplied data. If live data is unavailable, say so. Return JSON with keys: message (string), recommendations (array of objects with name, reason, match, address, mapsUrl). Recommend only from the supplied places.`;
  const context=Array.isArray(body.places)?body.places.slice(0,12).map(p=>({name:clean(p.name,120),type:clean(p.type,80),address:clean(p.address,180),rating:p.rating,score:p.score,emoji:p.emoji,tags:Array.isArray(p.tags)?p.tags.slice(0,8):[],openNow:p.openNow,url:clean(p.url,500)})):[];
  const input=`User request: ${prompt}\nLocation: ${location||'Not provided'}\nPlaces available:\n${JSON.stringify(context)}`;
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_ASK_MODEL||'gpt-5-mini',input:[{role:'system',content:system},{role:'user',content:input}],text:{format:{type:'json_object'}},max_output_tokens:900})});
  const data=await response.json().catch(()=>({})); if(!response.ok){console.error('Ask Vibely upstream error:',response.status,data);return res.status(response.status===429||response.status>=500?503:502).json({error:'Ask Vibely is temporarily unavailable.'})}
  const text=data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||''; let result;try{result=JSON.parse(text)}catch{result={message:text,recommendations:[]}}
  return res.status(200).json({message:clean(result.message,1000),recommendations:Array.isArray(result.recommendations)?result.recommendations.slice(0,3).map(r=>({name:clean(r.name,120),reason:clean(r.reason,300),match:Number.isFinite(Number(r.match))?Math.max(0,Math.min(100,Number(r.match))):null,address:clean(r.address,180),mapsUrl:clean(r.mapsUrl,500)})):[]});
 }catch(e){console.error('Ask Vibely error:',e);return res.status(503).json({error:'Ask Vibely is temporarily unavailable.'})}
}
