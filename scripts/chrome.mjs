// Shared page chrome for every page on lexfall.app: head assets, nav, footer, store badges.
// One source of truth. Used by build-words.mjs, build-lists.mjs and apply-chrome.mjs (hand-written pages).
// Change it here, then run:  node scripts/apply-chrome.mjs && node scripts/build-lists.mjs && node scripts/build-words.mjs

export const CSS_VERSION = 33;
export const APP_ID = '6786614029';
export const PT = '128225052'; // App Store provider token: every store link must carry it (attribution)
export const STORE = (ct) => `https://apps.apple.com/app/id${APP_ID}?pt=${PT}&ct=${ct}`;

// Google Play. Until launch the badge points at the waitlist page. On launch day set live: true,
// re-run the three scripts above, and point the Android rule in vercel.json (/get) at PLAY.url.
export const PLAY = {
  live: false,
  url: 'https://play.google.com/store/apps/details?id=com.gpeysack.lexfall',
  waitlist: '/google-play',
};

export const HEAD_ASSETS = `<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#F4F0E8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#100E0B" media="(prefers-color-scheme: dark)">
<link rel="preload" href="/fonts/newsreader-500.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
<link rel="stylesheet" href="/styles.css?v=${CSS_VERSION}">`;

const APPLE = '<svg class="badge-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.02-3.76-2.05-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.92-.03-.01-2.7-1.04-2.73-4.13zM14.53 4.6c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.65.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z"/></svg>';
const GPLAY = '<svg class="badge-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 1.8 13.4 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" fill="#34A853"/><path d="m16.8 8.6-3.4 3.4-9.8-10.2c.2-.1.5-.2.8-.2.3 0 .5.1.8.2l11.6 6.8z" fill="#4285F4"/><path d="m16.8 15.4-11.6 6.8c-.3.1-.5.2-.8.2-.3 0-.6-.1-.8-.2L13.4 12l3.4 3.4z" fill="#EA4335"/><path d="m21 12c0 .5-.3 1-.7 1.2l-3.5 2.2-3.4-3.4 3.4-3.4 3.5 2.2c.4.2.7.7.7 1.2z" fill="#FBBC04"/></svg>';

export const appStoreBadge = (ct) => `<a class="badge" href="${STORE(ct)}" aria-label="Download on the App Store">${APPLE}<span><small>Download on the</small><b>App Store</b></span></a>`;
export const playBadge = () => PLAY.live
  ? `<a class="badge" href="${PLAY.url}" aria-label="Get it on Google Play">${GPLAY}<span><small>Get it on</small><b>Google Play</b></span></a>`
  : `<a class="badge badge-soon" href="${PLAY.waitlist}" aria-label="Android: join the Google Play waitlist">${GPLAY}<span><small>Coming soon to</small><b>Google Play</b></span></a>`;
export const badges = (ct) => `<div class="badges">${appStoreBadge(ct)}${playBadge()}</div>`;

const LINKS = [
  ['/word-lists', 'Word lists'],
  ['/words', 'Dictionary'],
  ['/creators', 'Creators'],
  ['/partners', 'Partners'],
  ['/blog', 'Blog'],
  ['/support', 'Support'],
];

export const NAV = (ct) => `<a class="skip" href="#main">Skip to content</a>
<header class="nav">
  <div class="wrap nav-inner">
    <a href="/" class="wordmark" aria-label="Lexfall home"><img class="mark" src="/brand/icon-64.png" alt="" width="32" height="32"><span>Lexfall</span></a>
    <nav class="nav-links" aria-label="Primary">
      ${LINKS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('\n      ')}
    </nav>
    <details class="menu">
      <summary aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg></summary>
      <nav class="menu-panel" aria-label="Menu">
        ${LINKS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('\n        ')}
        <a href="${PLAY.live ? PLAY.url : PLAY.waitlist}">Android</a>
      </nav>
    </details>
    <a href="${STORE(ct)}" class="btn btn-primary nav-cta">Download</a>
  </div>
</header>`;

export const FOOT = () => `<footer class="site-foot">
  <div class="ridge" aria-hidden="true"><picture><source type="image/avif" srcset="/art/ridge-1280.avif 1280w, /art/ridge-2880.avif 2880w" sizes="100vw"><img src="/art/ridge-1280.webp" srcset="/art/ridge-1280.webp 1280w, /art/ridge-2880.webp 2880w" sizes="100vw" alt="" width="1280" height="172" loading="lazy" decoding="async"></picture></div>
  <div class="foot-body">
    <div class="wrap foot-grid">
      <div class="foot-brand">
        <a href="/" class="wordmark" aria-label="Lexfall home"><img class="mark" src="/brand/icon-64.png" alt="" width="32" height="32" loading="lazy"><span>Lexfall</span></a>
        <p>Advanced English words for work, study and 15 exams. One short lesson a day.</p>
        ${badges('web_foot')}
      </div>
      <nav class="foot-col" aria-label="Learn"><b>Learn</b><a href="/word-lists">Word lists</a><a href="/words">Dictionary</a><a href="/blog">Blog</a><a href="/#how">How it works</a></nav>
      <nav class="foot-col" aria-label="Work with us"><b>Work with us</b><a href="/creators">Creators</a><a href="/partners">Partners</a><a href="${PLAY.live ? PLAY.url : PLAY.waitlist}">Android</a><a href="/support">Support</a></nav>
      <nav class="foot-col" aria-label="Legal"><b>Legal</b><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
    </div>
    <div class="wrap foot-copy">© 2026 Lexfall. All rights reserved. Apple, iPhone and App Store are trademarks of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC.</div>
  </div>
</footer>
<script>
(function(){
  var ua=navigator.userAgent, mobile=/Android|iPhone|iPad|iPod/i.test(ua);
  if(matchMedia('(hover:hover) and (pointer:fine)').matches && !mobile){
    document.querySelectorAll('a[href^="https://apps.apple.com"]').forEach(function(a){a.target='_blank';a.rel='noopener';});
    var n=document.querySelector('.nav-cta'), g=document.getElementById('get')||document.getElementById('download');
    if(n&&g){n.href='#'+g.id;n.removeAttribute('target');n.removeAttribute('rel');}
  }
  document.querySelectorAll('.menu-panel a').forEach(function(a){a.addEventListener('click',function(){var d=a.closest('details');if(d)d.open=false;});});
})();
</script>`;
