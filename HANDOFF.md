# Lexfall website — handoff

The Lexfall marketing site. Live, deployed, editable. Read this first.

## Live + hosting
- **Live URL:** https://luxfall.online (and https://www.luxfall.online)
- **Host:** Vercel project `lexfall-site` (account `gcpeysack-3589`, team `giancarls-projects`). Auto-issued HTTPS.
- **Source repo:** https://github.com/GiancarloPeysack/lexfall-site (public, branch `master`). Vercel is connected — **`git push` to master auto-deploys.**
- **Local working copy (edit here):** `/Users/giancarlopeysack/Documents/lexfall-site/`
- Domain is registered at **GoDaddy** as `luxfall.online`. DNS: apex `A @ → 76.76.21.21`; `www` CNAME → apex. Both point at Vercel.

## Files (all in the repo dir)
- `index.html` — landing page (hero, rotating word card, word-wall, proficiency curve, features, quote, download section). Contains inline `<script>` with the word data + animations.
- `privacy.html`, `terms.html`, `support.html` — legal/support pages.
- `styles.css` — all shared styling. Linked as `styles.css?v=4` (see caching note).
- `vercel.json` — `{"cleanUrls": true}` so `/privacy` works without `.html`.

## How to deploy an edit
```
cd /Users/giancarlopeysack/Documents/lexfall-site
# edit files…
git add -A && git commit -m "…" && git push        # auto-deploys via Vercel
# OR force an immediate prod deploy:
vercel --prod --yes
```
Both `gh` and the `vercel` CLI are already authenticated on this machine — no login needed.

## CACHING GOTCHA (important)
Browsers cache `styles.css`. The HTML links it as `styles.css?v=4`. **If you change `styles.css`, bump the version in ALL html files** (`?v=4` → `?v=5`) or your CSS edits won't show. Quick bump:
```
cd /Users/giancarlopeysack/Documents/lexfall-site
sed -i '' 's|styles.css?v=4|styles.css?v=5|g' *.html
```

## Design system (keep consistent — mirrors the iOS app)
- Colors (CSS vars in `:root`): bg `#100E0B`, text `#ECE5D7`, muted `#A39A88`, faint `#6E665A`, **gold accent `#C6A85C`**, surfaces `#1A1712`/`#221E18`, lines `#322C22`/`#3E372B`.
- Fonts: **Newsreader** (serif, headings/words) + **Inter** (UI). `.eyebrow` = the gold micro-caps label.
- Motion: `.rise` = fade-up on scroll; `.ink` = a gold "pencil" underline that draws itself in; `.draw` = SVG stroke draw-on (the proficiency curve). All handled by the IntersectionObserver block at the bottom of index.html.
- Wordmark: `Le<span class="x">x</span>fall` (italic gold x).

## Current state
- Framed as a **launched app**: hero + download section use an **"Download on the App Store"** button (`.appstore`). No waitlist/email capture anywhere.
- The rotating card + drifting word-wall pull from the `WORDS` array in index.html's script (34 real words from the app).

## OPEN ITEMS / TODO
1. **App Store link is a placeholder.** In `index.html`, near the bottom script: `const APP_STORE_URL="";`. Set it to the real `https://apps.apple.com/app/lexfall/idXXXXXXXX` once the app is approved, then push. Until then the buttons link to `#`.
2. **Brand vs domain:** site says **Lex**fall; domain is **lux**fall.online. Left as-is intentionally. If rebranding to "Luxfall", change the wordmark in all 4 html files + `<title>`/meta. (Owner was considering buying `lexfall.app` to match — not purchased.)
3. **Emails:** support/privacy pages list `@lexfall.app` addresses that aren't set up (owner said email not needed yet). Remove or swap to a working address before heavy promotion.
4. **Optional:** add a Google Play badge (android package exists: `com.gpeysack.lexfall`) if/when on Play; add OG share image; add real screenshots of the app.

## Related
- The iOS app itself lives at `/Users/giancarlopeysack/Documents/Vorto/app` (Expo/React Native, app name "Lexfall", bundle `com.gpeysack.lexfall` for prod / `app.vorto.mobile` for the local sim build). Separate project — see `Vorto/HANDOFF.md` and `Vorto/LEXFALL_UI_RECOMMENDATIONS.md`.
