// Builds the programmatic word-list pages (one per exam / topic in lists-config.mjs), the
// /word-lists hub, and the lists section of sitemap.xml, from data/corpus.json.
//
// data/corpus.json is an export of the app's shipped corpus (SEED + WORD_LEVELS + register +
// exam tags from data/word-exams.ts in ~/Downloads/Lexfall/app). Re-export it when the corpus
// changes, then run:
//   node scripts/build-lists.mjs
// Page chrome (head assets, nav, footer, store badges) comes from scripts/chrome.mjs, shared with
// build-words.mjs and apply-chrome.mjs, so every page has the same nav and footer.
import fs from 'node:fs';
import path from 'node:path';
import { LISTS, EXISTING } from './lists-config.mjs';
import { HEAD_ASSETS, NAV, FOOT as FOOTER, STORE as STORE_URL, badges } from './chrome.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://lexfall.app';
const STORE = STORE_URL;
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
const PER_PAGE = 40;

const POS = { n: 'noun', noun: 'noun', 'n.': 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', phr: 'phrase', phrase: 'phrase', prep: 'preposition', conj: 'conjunction', idiom: 'idiom' };
const POS_GROUP = { verb: 'Verbs', noun: 'Nouns', adjective: 'Adjectives', adverb: 'Adverbs and connectors', preposition: 'Adverbs and connectors', conjunction: 'Adverbs and connectors', phrase: 'Phrases and idioms', idiom: 'Phrases and idioms' };
const POS_ORDER = ['Verbs', 'Nouns', 'Adjectives', 'Adverbs and connectors', 'Phrases and idioms'];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const posName = (p) => POS[p] || p;

// ---- data ---------------------------------------------------------------------------------------
const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/corpus.json'), 'utf8'));
const wordPages = new Set(fs.readdirSync(path.join(ROOT, 'words')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)));

// Stable pseudo-random order, so the same corpus always builds the same pages.
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

function pick(list) {
  const { exams, topics } = list.pool;
  const ex = new Set(exams || []);
  const tp = new Set((topics || []).map(([f, t]) => f + '|' + t));
  const levels = list.allowB2 ? ['C2', 'C1', 'B2'] : ['C2', 'C1'];
  const seen = new Set();
  const pool = corpus.filter((w) => {
    const inPool = (w.exams || []).some((t) => ex.has(t)) || tp.has(w.field + '|' + w.topic);
    if (!inPool || !levels.includes(w.level) || !w.def || !w.ex) return false;
    if (w.word.length > 32 || w.ex.length > 190 || /—/.test(w.def + w.ex)) return false;
    const s = slugify(w.word);
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
  // Words named in the intro copy go first, so the article never mentions a word it does not list.
  const named = new Set([...list.intro.join(' ').matchAll(/<em>([^<]+)<\/em>/g)].map((m) => slugify(m[1])));
  const score = (w) => (named.has(slugify(w.word)) ? -1e9 : 0)
    + (w.level === 'B2' ? 2e8 : 0)                     // B2 only fills gaps
    + Math.abs((w.rarity ?? 50) - 55) * 1e6            // useful-but-advanced beats obscure or basic
    + (hash(list.slug + w.id) % 1e6);
  const chosen = pool.sort((a, b) => score(a) - score(b)).slice(0, PER_PAGE);
  const missing = [...named].filter((n) => !chosen.some((w) => slugify(w.word) === n));
  if (missing.length) console.warn(`  ${list.slug}: intro names words not in its list: ${missing.join(', ')}`);
  return { chosen, poolSize: pool.length };
}

function groups(list, words) {
  const m = new Map();
  for (const w of words) {
    const g = list.group === 'pos' ? (POS_GROUP[posName(w.pos)] || 'Other words') : w.topic;
    if (!m.has(g)) m.set(g, []);
    m.get(g).push(w);
  }
  let out = [...m.entries()];
  if (list.group === 'pos') out.sort((a, b) => POS_ORDER.indexOf(a[0]) - POS_ORDER.indexOf(b[0]));
  else {
    // fold tiny topic groups into "More terms" so sections are not one word long
    const big = out.filter(([, ws]) => ws.length >= 3).sort((a, b) => b[1].length - a[1].length);
    const rest = out.filter(([, ws]) => ws.length < 3).flatMap(([, ws]) => ws);
    out = rest.length ? [...big, ['More terms', rest]] : big;
  }
  for (const [, ws] of out) ws.sort((a, b) => a.word.localeCompare(b.word));
  return out;
}

// ---- shared site chrome (scripts/chrome.mjs) ----------------------------------------------------
const STYLE = `<!-- chrome:head -->\n${HEAD_ASSETS}\n<!-- /chrome:head -->`;
const navWith = (ct) => `<div class="ambient" aria-hidden="true"></div>\n<!-- chrome:nav ct=${ct} -->\n${NAV(ct)}\n<!-- /chrome:nav -->`;
const FOOT = `<!-- chrome:foot -->\n${FOOTER()}\n<!-- /chrome:foot -->\n</body>\n</html>\n`;

const head = ({ title, desc, url, jsonld }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Lexfall</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="apple-itunes-app" content="app-id=6786614029, app-argument=${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Lexfall: Expand your vocabulary beyond average">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/og-image.png">
<script type="application/ld+json">
${JSON.stringify(jsonld)}
</script>
${STYLE}
</head>
<body>

`;

const org = { '@type': 'Organization', name: 'Lexfall', url: SITE };
const cta = (text, ct) => `    <div class="cta" id="get">
      <p>${text}</p>
      ${badges(ct)}
      <small>Free to download. After a free trial, a subscription unlocks every field. Built for iPhone, iOS 15.1 or later.</small>
      <div class="qr"><img src="/brand/qr-appstore.svg" alt="QR code that opens Lexfall on the App Store" width="104" height="104" loading="lazy"><div><b>On a computer?</b><span>Scan with your iPhone camera.</span></div></div>
    </div>`;

// ---- list pages ---------------------------------------------------------------------------------
const built = [];
for (const list of LISTS) {
  const { chosen, poolSize } = pick(list);
  const url = `${SITE}/${list.slug}`;
  const jsonld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Article', headline: list.h1, description: list.desc, datePublished: list.published || TODAY, dateModified: TODAY,
        image: `${SITE}/og-image.png`, articleSection: 'Language', author: org,
        publisher: { ...org, logo: { '@type': 'ImageObject', url: `${SITE}/brand/apple-touch-icon.png` } }, mainEntityOfPage: url },
      { '@type': 'DefinedTermSet', name: list.h1, url, hasDefinedTerm: chosen.map((w) => ({ '@type': 'DefinedTerm', name: w.word, description: w.def })) },
    ],
  };
  const sections = groups(list, chosen).map(([g, ws]) => `      <h3>${esc(g)}</h3>\n` + ws.map((w) => {
    const s = slugify(w.word);
    const word = wordPages.has(s) ? `<a class="word" href="/words/${s}">${esc(w.word)}</a>` : `<span class="word">${esc(w.word)}</span>`;
    return `      <div class="term">
        <p class="word-line">${word} <span class="pos">${esc(posName(w.pos))}</span><span class="meta">${esc(w.level)}</span></p>
        <p class="wdef">${esc(w.def)}</p>
        <p class="wex">${esc(w.ex)}</p>
      </div>`;
  }).join('\n')).join('\n');

  const related = [...LISTS.filter((l) => l !== list).map((l) => ({ slug: l.slug, name: l.h1.split(':')[0] })), ...EXISTING]
    .sort((a, b) => hash(list.slug + a.slug) - hash(list.slug + b.slug)).slice(0, 5);

  const html = head({ title: list.title, desc: list.desc, url, jsonld }) + navWith(list.ct) + `

<main id="main">
  <article class="wrap post">
    <span class="eyebrow">${esc(list.eyebrow)}</span>
    <h1>${esc(list.h1)}</h1>
    <p class="lede">${list.lede}</p>
    <p class="byline">By the Lexfall team · Updated ${MONTH}</p>
    <p class="inline-cta"><a href="${STORE(list.ct)}">Get Lexfall on the App Store</a> · Free to download. Subscription after a free trial.</p>

${list.intro.map((p) => `    <p>${p}</p>`).join('\n\n')}

    <h2>${chosen.length} words to know</h2>
    <div class="wordlist">
${sections}
    </div>

    <h2>Learning the list, not just reading it</h2>
    <p>Reading a list once does not make the words yours. Lexfall is a vocabulary app that teaches words like these a few at a time, then brings each one back with spaced review just before you would forget it. This page shows ${chosen.length} of the ${poolSize.toLocaleString('en-US')} words on this list in the app.</p>
    <p>It does not coach the exam or mark your work. It builds the vocabulary those things draw on.</p>
${list.owner ? `\n    <p class="disclaimer">This article is about vocabulary, not exam coaching. ${list.owner} Lexfall is not affiliated with or endorsed by it.</p>\n` : ''}
${cta(list.cta, list.ct)}

    <p class="more">More: ${related.map((r) => `<a href="/${r.slug}">${esc(r.name)}</a>`).join(' · ')} · <a href="/word-lists">All word lists</a></p>
  </article>
</main>

` + FOOT;
  fs.writeFileSync(path.join(ROOT, list.slug + '.html'), html);
  built.push({ ...list, count: chosen.length, poolSize });
  console.log(`${list.slug}: ${chosen.length} words (pool ${poolSize})`);
}

// ---- hub ----------------------------------------------------------------------------------------
const hubItems = (kind) => [
  ...built.filter((l) => (l.pool.exams ? 'exam' : 'topic') === kind).map((l) => ({ slug: l.slug, name: l.h1.split(':')[0], blurb: l.desc })),
  ...EXISTING.filter((e) => e.kind === kind).map((e) => ({ slug: e.slug, name: e.name, blurb: fs.readFileSync(path.join(ROOT, e.slug + '.html'), 'utf8').match(/<meta name="description" content="([^"]*)"/)[1].replace(/&amp;/g, '&') })),
].sort((a, b) => a.name.localeCompare(b.name));
const hubUrl = `${SITE}/word-lists`;
const hubDesc = 'Free English vocabulary lists for exams (TOEFL, TOEIC, IELTS, OET, PLAB, TOLES, Cambridge, PTE) and professions (nursing, law, finance), with examples.';
const hub = head({ title: 'English Vocabulary Word Lists for Exams and Work', desc: hubDesc, url: hubUrl,
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'English Vocabulary Word Lists', description: hubDesc, url: hubUrl, publisher: org } })
  + navWith('web_lists') + `

<main id="main">
  <article class="wrap post">
    <picture><source type="image/avif" srcset="/art/obj-lists-240.avif 1x, /art/obj-lists-480.avif 2x"><img class="post-spot" src="/art/obj-lists-240.webp" srcset="/art/obj-lists-240.webp 1x, /art/obj-lists-480.webp 2x" width="130" height="114" alt="" decoding="async"></picture>
    <span class="eyebrow">Word lists</span>
    <h1>English Vocabulary Word Lists for Exams and Work</h1>
    <p class="lede">Free vocabulary lists for English exams and professional fields. Every word has a definition and a real example sentence.</p>

    <h2>Exam vocabulary</h2>
    <ul class="hub-list">
${hubItems('exam').map((i) => `      <li><a href="/${i.slug}">${esc(i.name)}</a><p>${esc(i.blurb)}</p></li>`).join('\n')}
    </ul>

    <h2>Vocabulary for your field</h2>
    <ul class="hub-list">
${hubItems('topic').map((i) => `      <li><a href="/${i.slug}">${esc(i.name)}</a><p>${esc(i.blurb)}</p></li>`).join('\n')}
    </ul>

    <p>Looking for one word? Browse the <a href="/words">Lexfall dictionary</a>.</p>

${cta('Learn the words on these lists a few at a time, with spaced review.', 'web_lists')}
  </article>
</main>

` + FOOT;
fs.writeFileSync(path.join(ROOT, 'word-lists.html'), hub);

// ---- sitemap ------------------------------------------------------------------------------------
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const block = ['  <!-- lists:start -->', `  <url><loc>${hubUrl}</loc><lastmod>${TODAY}</lastmod><priority>0.8</priority></url>`,
  ...built.map((l) => `  <url><loc>${SITE}/${l.slug}</loc><lastmod>${TODAY}</lastmod><priority>0.8</priority></url>`), '  <!-- lists:end -->'].join('\n');
sm = sm.includes('<!-- lists:start -->')
  ? sm.replace(/  <!-- lists:start -->[\s\S]*?<!-- lists:end -->/, block)
  : sm.replace('  <!-- words:start -->', block + '\n  <!-- words:start -->');
fs.writeFileSync(smPath, sm);
console.log(`hub + sitemap: ${built.length} lists`);
