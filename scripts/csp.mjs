// Writes the Content-Security-Policy into vercel.json: scripts only from this site, plus the exact inline
// scripts the pages carry (by sha256 hash, so an injected script cannot run). Run after any change to an inline
// <script> (apply-chrome, build-lists, build-words already stamp them): node scripts/csp.mjs
// `node scripts/csp.mjs --check` exits 1 when vercel.json is out of date (an edited inline script would be blocked).
// /widget stays embeddable anywhere (people put it in Notion); every other page can only be framed by lexfall.app.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKIP = new Set(['node_modules', 'scripts', 'data', '.git', '.vercel', 'supabase']);
const SUPABASE_FN = 'https://qfniuekmcwytlstvtszt.functions.supabase.co';

function* pages(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) yield* pages(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html')) yield path.join(dir, e.name);
  }
}

const hashes = new Set();
const rx = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
for (const f of pages(ROOT)) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(rx)) {
    if (/json/.test(m[1])) continue; // JSON-LD and data blocks are not executed
    hashes.add(`'sha256-${crypto.createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
  }
}

const policy = (ancestors) => [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_FN}`,
  "frame-src 'self'",
  `frame-ancestors ${ancestors}`,
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const PERMS = 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()';
const vpath = path.join(ROOT, 'vercel.json');
const v = JSON.parse(fs.readFileSync(vpath, 'utf8'));
const others = (v.headers || []).filter((h) => !h.headers.some((x) => x.key === 'Content-Security-Policy'));
const csp = [
  { source: '/((?!widget).*)', headers: [
    { key: 'Content-Security-Policy', value: policy("'self'") },
    { key: 'Permissions-Policy', value: PERMS },
  ] },
  { source: '/widget(.*)', headers: [
    { key: 'Content-Security-Policy', value: policy('*') },
    { key: 'Permissions-Policy', value: PERMS },
  ] },
];
const next = { ...v, headers: [...others, ...csp] };
const out = JSON.stringify(next, null, 2) + '\n';

if (process.argv.includes('--check')) {
  const same = fs.readFileSync(vpath, 'utf8') === out;
  console.log(same ? `csp ok (${hashes.size} inline scripts)` : 'csp OUT OF DATE: run node scripts/csp.mjs');
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(vpath, out);
console.log(`csp written: ${hashes.size} inline script hashes`);
