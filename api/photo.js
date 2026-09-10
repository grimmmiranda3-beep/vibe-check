function noStore(res){res.setHeader("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate");res.setHeader("Pragma","no-cache");res.setHeader("Expires","0")}
export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const name=String(req.query?.name||"").trim(), apiKey=process.env.GOOGLE_PLACES_API_KEY;
  if(!name)return res.status(400).json({error:"Photo name is required."});
  if(!apiKey)return res.status(503).json({error:"Place photos are temporarily unavailable."});
  if(/^https:\/\//i.test(name)){
    try{const parsed=new URL(name);if(!parsed.hostname.endsWith("googleusercontent.com"))return res.status(400).json({error:"Invalid photo URL."});res.setHeader("Cache-Control","public, max-age=300, s-maxage=300");return res.redirect(302,parsed.href)}catch{return res.status(400).json({error:"Invalid photo URL."})}
  }
  if(!name.startsWith("places/")||!name.includes("/photos/"))return res.status(400).json({error:"Invalid photo name."});
  try{
    const url=`https://places.googleapis.com/v1/${name}/media?maxWidthPx=900&maxHeightPx=650&skipHttpRedirect=false&key=${encodeURIComponent(apiKey)}`;
    const response=await fetch(url);
    if(!response.ok){const data=await response.text().catch(()=>"");console.error("Google Place Photo error:",response.status,data);return res.status(response.status>=500||response.status===429?503:502).json({error:"Unable to load this place photo right now."})}
    const location=response.headers.get("location");
    if(!location)return res.status(502).json({error:"Unable to load this place photo right now."});
    if(!/^https:\/\//i.test(location))return res.status(502).json({error:"Unable to load this place photo right now."});
    res.setHeader("Cache-Control","public, max-age=300, s-maxage=300");return res.redirect(302,location);
  }catch(error){console.error("Google Place Photo proxy error:",error);return res.status(503).json({error:"Unable to load this place photo right now."})}
}
