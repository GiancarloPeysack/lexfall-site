// Vercel serverless function: partner dashboard proxy.
//
// The Supabase edge function renders correct HTML, but Supabase serves it as
// text/plain + nosniff on the shared *.functions.supabase.co domain (anti-abuse),
// so a browser shows source. This proxy fetches that HTML and re-serves it as
// real text/html from luxfall.online, so a partner link just works.
//
// Reached via the /partner-dashboard rewrite in vercel.json, e.g.
//   https://luxfall.online/partner-dashboard?t=<signed-token>

const UPSTREAM = 'https://qfniuekmcwytlstvtszt.functions.supabase.co/partner-dashboard';

export default async function handler(req, res) {
  const token = typeof req.query?.t === 'string' ? req.query.t : '';
  try {
    const r = await fetch(`${UPSTREAM}?t=${encodeURIComponent(token)}`, {
      headers: { 'Accept': 'text/html' },
    });
    const body = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.send(body);
  } catch (e) {
    res.status(502);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!doctype html><meta charset="utf-8"><p style="font:16px system-ui;padding:24px">Dashboard is temporarily unavailable. Please try again shortly.</p>');
  }
}
