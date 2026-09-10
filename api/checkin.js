const ALLOWED = ["😍", "😊", "🔥", "😌", "🥳", "😕"];
function noStore(res){res.setHeader("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate");res.setHeader("Pragma","no-cache");res.setHeader("Expires","0")}
function config(){return{url:process.env.SUPABASE_URL||"",key:process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||""}}
function authHeader(req){const v=req.headers?.authorization||"";return /^Bearer\s+\S+/i.test(v)?v:""}
async function rpc(name,args,req){const{url,key}=config();if(!url||!key)throw Error("Supabase is not configured.");const r=await fetch(`${url.replace(/\/$/,"")}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:key,Authorization:authHeader(req)||`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(args)});const t=await r.text();let d;try{d=t?JSON.parse(t):null}catch{d=null}if(!r.ok)throw Error(d?.message||d?.hint||"Supabase request failed.");return d}
function getCookie(req){const raw=req.headers?.cookie||"";const m=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith("vibe_visitor="));return m?decodeURIComponent(m.slice("vibe_visitor=".length)):""}
function visitor(){return`v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`}
function setCookie(res,v){res.setHeader("Set-Cookie",`vibe_visitor=${encodeURIComponent(v)}; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax; Secure`)}
function live(d){return{available:true,counts:d?.counts||{},total:Number(d?.total||0),dominant:d?.dominant||null,windowMinutes:Number(d?.windowMinutes||180),community:d?.community||{available:false,total:0,average:null,dominant:null,dominantPercent:0,influencePercent:0,windowMinutes:180}}}
async function resolvePlace(placeId){
 const apiKey=process.env.GOOGLE_PLACES_API_KEY;
 if(!apiKey||!placeId)return null;
 try{
  const r=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,{headers:{"X-Goog-Api-Key":apiKey,"X-Goog-FieldMask":"id,displayName,formattedAddress,location"}});
  if(!r.ok)return null;
  const p=await r.json();
  return {name:p.displayName?.text||null,address:p.formattedAddress||null,latitude:Number(p.location?.latitude),longitude:Number(p.location?.longitude)};
 }catch(e){console.error("Place coordinate lookup failed:",e);return null}
}
export default async function handler(req,res){
 noStore(res);if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  if(req.method==="GET"&&String(req.query?.history||"")==="1"){
   if(!authHeader(req))return res.status(401).json({error:"Sign in to view your check-ins."});
   const d=await rpc("vibe_my_checkins",{p_limit:Math.min(Math.max(Number(req.query?.limit||20),1),50)},req);
   return res.status(200).json({ok:true,checkins:Array.isArray(d)?d:[]});
  }
  const placeId=req.method==="GET"?req.query?.placeId:(req.body||{}).placeId;
  if(typeof placeId!=="string"||!placeId.trim()||placeId.length>500)return res.status(400).json({error:"A valid placeId is required."});
  if(req.method==="GET")return res.status(200).json(live(await rpc("vibe_live_checkins",{p_place_id:placeId.trim()},req)));
  const{vibe,placeName,placeAddress,latitude,longitude}=req.body||{};
  if(!ALLOWED.includes(vibe))return res.status(400).json({error:"A valid vibe is required."});
  let visitorId=getCookie(req);if(!visitorId){visitorId=visitor();setCookie(res,visitorId)}
  let lat=Number(latitude),lng=Number(longitude),resolvedName=typeof placeName==="string"?placeName.slice(0,300):null,resolvedAddress=typeof placeAddress==="string"?placeAddress.slice(0,500):null;
  if(!(Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lng)&&Math.abs(lng)<=180)){
   const place=await resolvePlace(placeId.trim());
   if(place){
    lat=place.latitude;lng=place.longitude;
    if(!resolvedName)resolvedName=place.name;
    if(!resolvedAddress)resolvedAddress=place.address;
   }
  }
  const d=await rpc("vibe_submit_checkin",{p_place_id:placeId.trim(),p_visitor_id:visitorId,p_vibe:vibe,p_place_name:resolvedName,p_place_address:resolvedAddress,p_latitude:Number.isFinite(lat)&&Math.abs(lat)<=90?lat:null,p_longitude:Number.isFinite(lng)&&Math.abs(lng)<=180?lng:null},req);
  const s=Array.isArray(d)?d[0]||{}:d||{};
  return res.status(200).json({ok:true,alreadyCheckedIn:Boolean(s.already_checked_in),updatedVibe:Boolean(s.updated_vibe),placeId:placeId.trim(),vibe,recordedAt:new Date().toISOString(),...live(await rpc("vibe_live_checkins",{p_place_id:placeId.trim()},req))});
 }catch(e){console.error("Vibe check-in error:",e);return res.status(500).json({error:"Unable to record vibe right now."})}
}
