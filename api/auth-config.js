function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

export default function handler(req, res) {
  noStore(res);
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

  if (!url || !anonKey) {
    return res.status(200).json({ configured: false });
  }

  // The Supabase publishable/anon key is intentionally safe to expose to the browser.
  // Never expose SUPABASE_SERVICE_ROLE_KEY or any OAuth client secret here.
  return res.status(200).json({ configured: true, url, anonKey });
}
