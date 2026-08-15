// Vercel serverless function: owner payout-admin proxy.
// Forwards GET (the page, re-served as real HTML) and POST (approve/mark-sent
// actions, JSON) to the Supabase admin-payouts edge function. Reached at
// luxfall.online/admin?key=<ADMIN_KEY>. No secrets live here — the key travels
// from the owner's browser through to the edge function, which validates it.

const UPSTREAM = 'https://qfniuekmcwytlstvtszt.functions.supabase.co/admin-payouts';

export default async function handler(req, res) {
  try {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const target = UPSTREAM + qs;

    const init = { method: req.method, headers: {} };
    if (req.method === 'POST') {
      init.headers['content-type'] = 'application/json';
      if (req.headers['x-admin-key']) init.headers['x-admin-key'] = req.headers['x-admin-key'];
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }

    const r = await fetch(target, init);
    const body = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.send(body);
  } catch (e) {
    res.status(502);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!doctype html><meta charset="utf-8"><p style="font:16px system-ui;padding:24px">Admin is temporarily unavailable.</p>');
  }
}
