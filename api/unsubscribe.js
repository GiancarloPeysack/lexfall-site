// Vercel serverless function: one-click unsubscribe from Lexfall update emails.
// lexfall.app/unsubscribe?u=<user id>&t=<token> -> Supabase release-email edge function, re-served as
// real HTML (Supabase forces text/plain on its own domain). GET unsubscribes in one click; POST carries
// the RFC 8058 List-Unsubscribe=One-Click body from Gmail / Apple Mail, or the page's Subscribe again /
// Unsubscribe button. No secrets here: the HMAC token is checked by the edge function.

const UPSTREAM = 'https://qfniuekmcwytlstvtszt.functions.supabase.co/release-email';

export default async function handler(req, res) {
  try {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    if (!qs.includes('u=')) {
      res.status(302).setHeader('Location', 'https://lexfall.app/');
      return res.end();
    }
    const init = { method: req.method === 'POST' ? 'POST' : 'GET', headers: {} };
    if (init.method === 'POST') {
      init.headers['content-type'] = 'application/x-www-form-urlencoded';
      const b = req.body;
      init.body = typeof b === 'string' ? b : new URLSearchParams(b || {}).toString();
    }
    const r = await fetch(UPSTREAM + qs, init);
    const body = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', body.trimStart().startsWith('<') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.send(body);
  } catch (e) {
    res.status(502);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!doctype html><meta charset="utf-8"><p style="font:16px system-ui;padding:24px">Something went wrong. Write to gc.peysack@gmail.com and we will take you off the list.</p>');
  }
}
