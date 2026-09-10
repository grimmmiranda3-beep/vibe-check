function noStore(res){res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0')}
function clean(s,max=500){return String(s||'').replace(/[<>]/g,'').trim().slice(0,max)}
function normalizePlaces(list){return (Array.isArray(list)?list:[]).slice(0,12).map(p=>({name:clean(p.name,120),type:clean(p.type,80),address:clean(p.address,180),rating:Number(p.rating)||0,score:Number(p.score)||0,emoji:clean(p.emoji,8),tags:Array.isArray(p.tags)?p.tags.slice(0,8).map(x=>clean(x,40)):[],openNow:p.openNow,url:clean(p.url,500)})).filter(p=>p.name)}
function fallback(prompt,places){const q=prompt.toLowerCase();const scored=places.map(p=>{let s=(p.score||0)*8+(p.rating||0)*4;const text=[p.name,p.type,p.address,p.emoji,...p.tags].join(' ').toLowerCase();if(/quiet|calm|relax|coffee|work|study|conversation/.test(q)&&/quiet|calm|relax|coffee|cafe|work|study/.test(text))s+=25;if(/date|romantic|cute|couple/.test(q)&&/date|romantic|cozy|cute|wine|cocktail/.test(text))s+=25;if(/party|girls|night|fun|energetic|lively/.test(q)&&/party|music|energetic|lively|bar|night/.test(text))s+=25;if(/family|kids|child/.test(q)&&/family|kids|child/.test(text))s+=25;if(/not too loud|quiet/.test(q)&&/loud|party/.test(text))s-=10;return {...p,_s:s}}).sort((a,b)=>b._s-a._s).slice(0,3);return {message:scored.length?'I found a few places that fit what you described. ✨':'I couldn’t find local places to match yet. Try a different city or area.',recommendations:scored.map((p,i)=>({name:p.name,reason:`A ${i===0?'strong':'good'} match based on the vibe signals currently available for this place.`,match:Math.max(60,Math.min(97,Math.round(65+p._s))),address:p.address,mapsUrl:p.url}))}}
async function discoverPlaces(prompt,location,apiKey){
 if(!apiKey||!location)return [];
 const textQuery=`${prompt} in ${location}`.slice(0,800);
 const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.primaryType,places.location,places.currentOpeningHours'},body:JSON.stringify({textQuery,pageSize:10,languageCode:'en',regionCode:'US'})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error?.message||'Local place discovery failed.');
 return (data.places||[]).map(p=>({id:p.id,name:p.displayName?.text||'',type:p.primaryType||'Place',address:p.formattedAddress||'',rating:p.rating||0,score:0,openNow:p.currentOpeningHours?.openNow??null,url:p.googleMapsUri||'',website:p.websiteUri||''}));
}
export default async function handler(req,res){
 noStore(res);if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),prompt=clean(body.prompt,700),location=clean(body.location,120);if(!prompt)return res.status(400).json({error:'Tell Vibely what kind of place or vibe you want.'});
  let places=normalizePlaces(body.places);
  const key=process.env.OPENAI_API_KEY;
  if(!places.length){
   if(!location)return res.status(400).json({error:'Add a city or area so Vibely can find local places for you.'});
   const discovered=await discoverPlaces(prompt,location,process.env.GOOGLE_PLACES_API_KEY);
   places=normalizePlaces(discovered);
  }
  if(!places.length)return res.status(200).json(fallback(prompt,places));
  if(!key)return res.status(200).json(fallback(prompt,places));
  const system=`You are Vibely, a friendly local-place recommendation assistant. Help users choose places based only on the live place data supplied by the app. Be concise and conversational. Never invent live facts. Return JSON with keys message and recommendations. Recommend only supplied places.`;
  const input=`User request: ${prompt}\nLocation: ${location||'Not provided'}\nPlaces available:\n${JSON.stringify(places)}`;
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_ASK_MODEL||'gpt-5-mini',input:[{role:'system',content:system},{role:'user',content:input}],text:{format:{type:'json_object'}},max_output_tokens:900})});
  const data=await response.json().catch(()=>({}));if(!response.ok){console.error('Ask Vibely upstream error:',response.status,data);return res.status(200).json(fallback(prompt,places))}
  const text=data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';let result;try{result=JSON.parse(text)}catch{result={message:text,recommendations:[]}};if(!Array.isArray(result.recommendations)||!result.recommendations.length)return res.status(200).json(fallback(prompt,places));
  return res.status(200).json({message:clean(result.message,1000),recommendations:result.recommendations.slice(0,3).map(r=>({name:clean(r.name,120),reason:clean(r.reason,300),match:Number.isFinite(Number(r.match))?Math.max(0,Math.min(100,Number(r.match))):null,address:clean(r.address,180),mapsUrl:clean(r.mapsUrl,500)}))});
 }catch(e){console.error('Ask Vibely error:',e);return res.status(503).json({error:'Ask Vibely is temporarily unavailable.'})}
}