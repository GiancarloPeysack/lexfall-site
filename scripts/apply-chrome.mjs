// Stamps the shared chrome (scripts/chrome.mjs) onto every hand-written page in the site root:
// head assets, nav, footer, store badges. Idempotent: after the first run each block sits between
// <!-- chrome:x --> markers and is simply replaced. Generated pages (word lists, /words) get the same
// chrome from their own generators. Run: node scripts/apply-chrome.mjs
import fs from 'node:fs';
import path from 'node:path';
import { HEAD_ASSETS, NAV, FOOT, badges, appStoreBadge } from './chrome.mjs';
import { LISTS } from './lists-config.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const generated = new Set([...LISTS.map((l) => l.slug + '.html'), 'word-lists.html']);
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !generated.has(f));

const block = (name, body, attr = '') => `<!-- chrome:${name}${attr ? ' ' + attr : ''} -->\n${body}\n<!-- /chrome:${name} -->`;
const rx = (name) => new RegExp(`<!-- chrome:${name}( [^>]*)? -->[\\s\\S]*?<!-- /chrome:${name} -->`, 'g');

for (const f of files) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;

  // head
  if (!s.includes('<!-- chrome:head')) {
    s = s.replace(/^<link rel="preload" href="[^"]*fonts[^"]*"[^>]*>\n/gm, '')
      .replace(/^<link rel="icon"[^>]*>\n/gm, '')
      .replace(/^<link rel="apple-touch-icon"[^>]*>\n/gm, '')
      .replace(/^<link rel="stylesheet" href="\/?styles\.css[^"]*">\n/gm, '')
      .replace(/<style>[\s\S]*?<\/style>\n?/g, '')
      .replace('</head>', block('head', '') + '\n</head>');
  }
  s = s.replace(rx('head'), block('head', HEAD_ASSETS));

  // nav
  if (!s.includes('<!-- chrome:nav')) {
    const m = s.match(/<header class="nav">[\s\S]*?<\/header>/);
    const ct = (m && (m[0].match(/ct=([a-z0-9_]+)/) || [])[1]) || 'web_other';
    s = m ? s.replace(m[0], block('nav', '', `ct=${ct}`)) : s.replace(/<body>\n?/, `<body>\n${block('nav', '', 'ct=web_other')}\n`);
  }
  s = s.replace(rx('nav'), (all, attr) => block('nav', NAV((attr || '').match(/ct=([a-z0-9_]+)/)?.[1] || 'web_other'), (attr || '').trim()));

  // footer (old pages: <footer> ... </footer>)
  if (!s.includes('<!-- chrome:foot')) {
    s = /<footer>[\s\S]*?<\/footer>/.test(s)
      ? s.replace(/<footer>[\s\S]*?<\/footer>/, block('foot', ''))
      : s.replace('</main>', '</main>\n\n' + block('foot', ''));
  }
  s = s.replace(rx('foot'), block('foot', FOOT()));

  // store badges
  s = s.replace(rx('badges'), (all, attr) => {
    const ct = (attr || '').match(/ct=([a-z0-9_]+)/)?.[1] || 'web_other';
    const html = /only=ios/.test(attr || '') ? `<div class="badges">${appStoreBadge(ct)}</div>` : badges(ct);
    return block('badges', html, (attr || '').trim());
  });

  // backdrop + skip-link target
  if (!s.includes('class="ambient"')) s = s.replace(/<body>\n?/, '<body>\n<div class="ambient" aria-hidden="true"></div>\n');
  s = s.replace(/<main(?![^>]*\bid=)([^>]*)>/, '<main id="main"$1>');

  if (s !== before) { fs.writeFileSync(p, s); console.log('updated', f); }
}
