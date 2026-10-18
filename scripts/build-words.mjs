// Builds the public word pages (/words/<slug>), the A-Z and field indexes, and the word
// section of sitemap.xml from data/words.json.
//
// data/words.json is an export of the app's shipped corpus (SEED in ~/Downloads/Lexfall/app/data/words.ts,
// joined with WORD_LEVELS and the register overlay). Re-export it when the corpus changes, then run:
//   node scripts/build-words.mjs
// Generated output (words/ and the sitemap block) is committed; data/ and scripts/ are not deployed.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'words');
const SITE = 'https://lexfall.app';
const STORE = 'https://apps.apple.com/app/id6786614029?pt=128225052&ct=web_word';
const TODAY = new Date().toISOString().slice(0, 10);

const FIELD = {
  gen: { name: 'General English', short: 'General', hub: 'general', landing: '/' },
  med: { name: 'Medical English', short: 'Medicine', hub: 'medicine', landing: '/medicine' },
  law: { name: 'Legal English', short: 'Law', hub: 'law', landing: '/law' },
  biz: { name: 'Business English', short: 'Business', hub: 'business', landing: '/business' },
  new: { name: 'New words and slang', short: 'New words', hub: 'new-words', landing: '/' },
};
const FIELD_ORDER = ['gen', 'med', 'law', 'biz', 'new'];
const POS = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', phr: 'phrase', prep: 'preposition', conj: 'conjunction', interj: 'interjection', pron: 'pronoun', abbr: 'abbreviation', idiom: 'idiom' };
const REGISTER = { neutral: 'Neutral', formal: 'Formal', informal: 'Informal', slang: 'Slang', literary: 'Literary', technical: 'Technical' };

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const posName = (p) => POS[p] || p;
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '...');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const rarityWords = (r) => r >= 80 ? 'very rare' : r >= 60 ? 'rare' : r >= 40 ? 'uncommon' : r >= 20 ? 'fairly common' : 'common';

// ---- group the corpus into one entry per headword --------------------------------------------
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/words.json'), 'utf8'));
const bySlug = new Map();
for (const w of raw) {
  const slug = slugify(w.word);
  if (!slug || slug === 'letter' || slug === 'field') continue;
  if (!bySlug.has(slug)) bySlug.set(slug, { slug, word: w.word, senses: [] });
  const e = bySlug.get(slug);
  if (e.senses.some((s) => s.def.trim().toLowerCase() === w.def.trim().toLowerCase())) continue;
  e.senses.push(w);
}
const entries = [...bySlug.values()];
for (const e of entries) {
  e.senses.sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field));
  const p = e.senses[0];
  e.primary = p;
  e.ipa = e.senses.find((s) => s.ipa)?.ipa?.trim().replace(/^[\/\[]+|[\/\]]+$/g, '');
  e.level = e.senses.find((s) => s.level)?.level;
  const rs = e.senses.map((s) => s.rarity).filter((r) => typeof r === 'number');
  e.rarity = rs.length ? Math.max(...rs) : undefined;
  e.register = p.register;
  e.letter = /^[a-z]/.test(e.slug) ? e.slug[0] : '0';
}
entries.sort((a, b) => a.slug.localeCompare(b.slug));

// related words: neighbours in the same field + topic (wraps), so every page links out and gets linked to
const groups = new Map();
for (const e of entries) {
  const k = e.primary.field + '|' + e.primary.topic;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(e);
}
for (const list of groups.values()) {
  list.forEach((e, i) => {
    const rel = [];
    for (let d = 1; rel.length < Math.min(8, list.length - 1); d++) rel.push(list[(i + d) % list.length]);
    e.related = rel;
  });
}

// ---- shared page chrome -------------------------------------------------------------------------
const head = ({ title, desc, url, jsonld }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="apple-itunes-app" content="app-id=6786614029">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.png">
${jsonld ? `<script type="application/ld+json">\n${JSON.stringify(jsonld)}\n</script>\n` : ''}<link rel="preload" href="/fonts/newsreader-500.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
<link rel="stylesheet" href="/styles.css?v=23">
<link rel="stylesheet" href="/words/words.css?v=1">
</head>
<body>

<header class="nav">
  <div class="wrap nav-inner">
    <a href="/" class="wordmark" aria-label="Lexfall home"><img class="mark" src="/brand/icon-64.png" alt="" width="30" height="30"><span>LEXFALL<span class="dot">.</span></span></a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/#screens">See it</a>
      <a href="/#features">Features</a>
      <a href="/partners">Partners</a>
      <a href="/creators">Creators</a>
      <a href="/blog">Blog</a>
      <a href="/support">Support</a>
      <a href="${STORE}" class="btn btn-primary">Download</a>
    </nav>
  </div>
</header>
`;

const cta = (line) => `
    <div class="cta" id="get">
      <p>${line}</p>
      <a class="btn btn-primary" href="${STORE}">Download on the App Store</a>
      <small>Lexfall puts a new word on your home and lock screen through widgets, so you learn without opening an app. Free to download. After a free trial, a subscription unlocks every field. Built for iPhone, iOS 15.1 or later.</small>
      <div class="qr"><img src="/brand/qr-appstore.svg" alt="QR code that opens Lexfall on the App Store" width="104" height="104" loading="lazy"><div><b>On a computer?</b><span>Scan with your iPhone camera.</span></div></div>
    </div>
`;

const foot = `
<footer>
  <div class="wrap foot-inner">
    <div>
      <a href="/" class="wordmark" aria-label="Lexfall home"><img class="mark" src="/brand/icon-64.png" alt="" width="30" height="30"><span>LEXFALL<span class="dot">.</span></span></a>
      <div class="foot-copy" style="margin-top:8px">An advanced vocabulary app for life and work.</div>
    </div>
    <nav class="foot-links" aria-label="Footer">
      <a href="/#features">Features</a>
      <a href="/words">Words</a>
      <a href="/partners">Partners</a>
      <a href="/creators">Creators</a>
      <a href="/blog">Blog</a>
      <a href="/support">Support</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </nav>
  </div>
  <div class="wrap" style="margin-top:24px"><div class="foot-copy">© 2026 Lexfall. All rights reserved. Apple, iPhone and App Store are trademarks of Apple Inc.</div></div>
</footer>
<script>
(function(){
  var ua=navigator.userAgent, mobile=/Android|iPhone|iPad|iPod/i.test(ua);
  if(matchMedia('(hover:hover) and (pointer:fine)').matches && !mobile){
    document.querySelectorAll('a[href^="https://apps.apple.com"]').forEach(function(a){a.target='_blank';a.rel='noopener';});
    var n=document.querySelector('.nav-links .btn'); if(n){n.href='#get';n.removeAttribute('target');n.removeAttribute('rel');}
  }
})();
</script>
</body>
</html>
`;

const letters = [...'abcdefghijklmnopqrstuvwxyz'];
const letterNav = (active) => `<nav class="az" aria-label="Browse by letter">${letters.map((l) => l === active ? `<span>${l.toUpperCase()}</span>` : `<a href="/words/letter/${l}">${l.toUpperCase()}</a>`).join('')}</nav>`;

// ---- word page ----------------------------------------------------------------------------------
function wordPage(e) {
  const p = e.primary;
  const url = `${SITE}/words/${e.slug}`;
  const multi = e.senses.length > 1;
  const title = `${cap(e.word)}: Meaning, Definition and Example | Lexfall`;
  const desc = clip(`${cap(e.word)} (${posName(p.pos)}): ${p.def} Example: "${p.ex}"`, 158);
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: e.word,
    description: p.def,
    url,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Lexfall vocabulary', url: `${SITE}/words` },
  };
  const senses = e.senses.map((s) => `
      <section class="sense">
        ${multi ? `<h2 class="sense-field">${esc(FIELD[s.field].short)} <span class="pos">${esc(posName(s.pos))}</span></h2>` : ''}
        <p class="def">${esc(s.def)}</p>
        <p class="ex">${esc(s.ex)}</p>
        ${s.syn?.length ? `<p class="meta-line"><b>Similar:</b> ${s.syn.map(esc).join(', ')}</p>` : ''}
        ${s.etymology ? `<p class="meta-line"><b>Origin:</b> ${esc(s.etymology)}</p>` : ''}
        <p class="meta-line"><b>Topic:</b> <a href="/words/field/${FIELD[s.field].hub}#${slugify(s.topic)}">${esc(s.topic)}</a> in ${esc(FIELD[s.field].name)}</p>
      </section>`).join('');
  const stats = [
    e.level && `<div><b>${e.level}</b><span>CEFR level</span></div>`,
    typeof e.rarity === 'number' && `<div><b>${e.rarity}<small>/100</small></b><span>Rarity: ${rarityWords(e.rarity)}</span></div>`,
    e.register && `<div><b>${REGISTER[e.register] || e.register}</b><span>Register</span></div>`,
  ].filter(Boolean).join('');
  const rel = e.related?.length ? `
    <h2 class="h-sub">More ${esc(FIELD[p.field].short.toLowerCase())} words: ${esc(p.topic)}</h2>
    <ul class="related">${e.related.map((r) => `<li><a href="/words/${r.slug}">${esc(r.word)}</a></li>`).join('')}</ul>` : '';
  return head({ title, desc, url, jsonld }) + `
<main>
  <article class="wrap word-page">
    <p class="crumbs"><a href="/words">Words</a> / <a href="/words/letter/${e.letter === '0' ? 'a' : e.letter}">${e.letter === '0' ? '#' : e.letter.toUpperCase()}</a> / <a href="/words/field/${FIELD[p.field].hub}">${esc(FIELD[p.field].short)}</a></p>
    <h1>${esc(e.word)}</h1>
    <p class="headline-meta">${!multi ? `<span class="pos">${esc(posName(p.pos))}</span>` : ''}${e.ipa ? `<span class="ipa">/${esc(e.ipa)}/</span>` : ''}</p>
    ${stats ? `<div class="stats">${stats}</div>` : ''}
    ${senses}
    ${typeof e.rarity === 'number' ? `<p class="note">Rarity runs from 0 (a word everyone knows) to 100 (almost never seen outside specialist or literary writing). Level is the word's real difficulty on the CEFR scale, from A1 to C2.</p>` : ''}
    ${cta(`Get words like <em>${esc(e.word)}</em> on your lock screen, a few a day, with review that makes them stick.`)}
    ${rel}
    ${letterNav(null)}
  </article>
</main>
` + foot;
}

// ---- index pages ----------------------------------------------------------------------------------
const listItems = (list) => list.map((e) => `<li><a href="/words/${e.slug}">${esc(e.word)}</a> <span>${esc(clip(e.primary.def, 90))}</span></li>`).join('');

function letterPage(l) {
  const list = entries.filter((e) => e.letter === l || (l === 'a' && e.letter === '0'));
  const url = `${SITE}/words/letter/${l}`;
  return head({ title: `Advanced English words starting with ${l.toUpperCase()} | Lexfall`, desc: `${list.length.toLocaleString('en-US')} advanced English words starting with ${l.toUpperCase()}, each with a clear definition, a real example sentence, its CEFR level and a rarity score.`, url }) + `
<main>
  <article class="wrap word-index">
    <p class="crumbs"><a href="/words">Words</a> / ${l.toUpperCase()}</p>
    <h1>Words starting with ${l.toUpperCase()}</h1>
    <p class="lede">${list.length.toLocaleString('en-US')} words from the Lexfall vocabulary, each with a definition and an example sentence.</p>
    ${letterNav(l)}
    <ul class="index-list">${listItems(list)}</ul>
    ${cta('Learn these words without opening an app: Lexfall puts them on your home and lock screen.')}
  </article>
</main>
` + foot;
}

function fieldPage(f) {
  const list = entries.filter((e) => e.senses.some((s) => s.field === f));
  const topics = new Map();
  for (const e of list) {
    const s = e.senses.find((x) => x.field === f);
    if (!topics.has(s.topic)) topics.set(s.topic, []);
    topics.get(s.topic).push(e);
  }
  const tlist = [...topics.entries()].sort((a, b) => b[1].length - a[1].length);
  const F = FIELD[f];
  const url = `${SITE}/words/field/${F.hub}`;
  return head({ title: `${F.name} vocabulary list: ${list.length.toLocaleString('en-US')} words | Lexfall`, desc: `${list.length.toLocaleString('en-US')} ${F.name.toLowerCase()} words grouped by topic, each with a clear definition, a real example sentence, its CEFR level and a rarity score.`, url }) + `
<main>
  <article class="wrap word-index">
    <p class="crumbs"><a href="/words">Words</a> / ${esc(F.short)}</p>
    <h1>${esc(F.name)} vocabulary</h1>
    <p class="lede">${list.length.toLocaleString('en-US')} words grouped into ${tlist.length} topics. Tap any word for its definition, an example sentence, its level and how rare it is.</p>
    <nav class="topics" aria-label="Topics">${tlist.map(([t, l]) => `<a href="#${slugify(t)}">${esc(t)} <span>${l.length}</span></a>`).join('')}</nav>
    ${tlist.map(([t, l]) => `<h2 class="h-sub" id="${slugify(t)}">${esc(t)}</h2><ul class="chips">${l.map((e) => `<li><a href="/words/${e.slug}">${esc(e.word)}</a></li>`).join('')}</ul>`).join('\n    ')}
    ${cta(`Learn ${esc(F.name.toLowerCase())} a few words a day, right on your lock screen.`)}
  </article>
</main>
` + foot;
}

function hubPage() {
  const counts = Object.fromEntries(FIELD_ORDER.map((f) => [f, entries.filter((e) => e.senses.some((s) => s.field === f)).length]));
  const featured = ['sonder', 'petrichor', 'sedulous', 'laconic', 'palliative', 'estoppel', 'fiduciary', 'lucrative', 'ostensible', 'brainrot']
    .map((s) => bySlug.get(s)).filter(Boolean);
  return head({ title: 'Advanced English vocabulary: definitions and examples | Lexfall', desc: `${entries.length.toLocaleString('en-US')} advanced English words for life and work, from general vocabulary to medical, legal and business English. Each has a definition, an example sentence, a level and a rarity score.`, url: `${SITE}/words` }) + `
<main>
  <article class="wrap word-index">
    <span class="eyebrow">Word list</span>
    <h1>Advanced English vocabulary</h1>
    <p class="lede">${entries.length.toLocaleString('en-US')} words from the Lexfall app, each with a clear definition, a real example sentence, its CEFR level and a rarity score from 0 to 100.</p>
    <h2 class="h-sub">Browse by letter</h2>
    ${letterNav(null)}
    <h2 class="h-sub">Browse by field</h2>
    <ul class="fields">${FIELD_ORDER.map((f) => `<li><a href="/words/field/${FIELD[f].hub}"><b>${esc(FIELD[f].name)}</b><span>${counts[f].toLocaleString('en-US')} words</span></a></li>`).join('')}</ul>
    <h2 class="h-sub">A few to start with</h2>
    <ul class="index-list">${listItems(featured)}</ul>
    ${cta('Learn a few of these a day without opening an app: Lexfall puts them on your home and lock screen.')}
  </article>
</main>
` + foot;
}

// ---- write ----------------------------------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'letter'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'field'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'scripts/words.css'), path.join(OUT, 'words.css'));
for (const e of entries) fs.writeFileSync(path.join(OUT, `${e.slug}.html`), wordPage(e));
for (const l of letters) fs.writeFileSync(path.join(OUT, 'letter', `${l}.html`), letterPage(l));
for (const f of FIELD_ORDER) fs.writeFileSync(path.join(OUT, 'field', `${FIELD[f].hub}.html`), fieldPage(f));
fs.writeFileSync(path.join(OUT, 'index.html'), hubPage());

// sitemap: replace everything between the markers (or insert before </urlset>)
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8').replace(/\n?  <!-- words:start -->[\s\S]*<!-- words:end -->/, '');
const urls = [`${SITE}/words`, ...letters.map((l) => `${SITE}/words/letter/${l}`), ...FIELD_ORDER.map((f) => `${SITE}/words/field/${FIELD[f].hub}`), ...entries.map((e) => `${SITE}/words/${e.slug}`)];
const block = `\n  <!-- words:start -->\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n  <!-- words:end -->`;
sm = sm.replace('\n</urlset>', block + '\n</urlset>');
fs.writeFileSync(smPath, sm);

console.log(`${entries.length} word pages, ${letters.length} letter pages, ${FIELD_ORDER.length} field pages, ${urls.length} sitemap urls`);
