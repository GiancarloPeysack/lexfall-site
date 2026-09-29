// Supabase Edge Function: android-waitlist (public)
// Receives Android waitlist sign-ups from the marketing site (google-play page)
// and stores them in android_waitlist for the owner to email when Android ships.
//
// Deploy:  supabase functions deploy android-waitlist --no-verify-jwt
// Public by design (anyone can sign up). A honeypot field + basic validation keep
// out casual bots. Modeled on the partner-apply function.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: 'bad request' }, 400); }

  // Honeypot: real users never fill this hidden field. Pretend success for bots.
  if (typeof b.company === 'string' && b.company.trim() !== '') return json({ ok: true });

  const email = String(b.email ?? '').trim().slice(0, 200).toLowerCase();
  if (!isEmail(email)) return json({ error: 'Please add a valid email.' }, 400);

  const row = {
    email,
    name: String(b.name ?? '').trim().slice(0, 200) || null,
    country: String(b.country ?? '').trim().slice(0, 100) || null,
    source: 'web_android',
    created_at: new Date().toISOString(),
  };

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );
    // Idempotent on the unique email: a repeat sign-up is a success, not an error.
    const { error } = await admin
      .from('android_waitlist')
      .upsert(row, { onConflict: 'email', ignoreDuplicates: true });
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error('android-waitlist error', e);
    return json({ error: 'Could not submit. Please try again.' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
