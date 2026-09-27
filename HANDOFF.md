# Lexfall website: handoff

Internal notes. This file is excluded from the public deploy by `.vercelignore`. Updated 2026-09-27.

## Hosting and deploys
- Live: https://lexfall.app. Vercel project `lexfall-site` (team `giancarls-projects`). Repo: github.com/GiancarloPeysack/lexfall-site, branch `master`.
- `git push` to master auto-deploys (about 20 seconds). `gh` and `vercel` are already authenticated on this Mac.
- Test config safely first: `vercel deploy --yes` makes a private preview (behind a login wall). Hit it with `vercel curl /path --deployment <preview-url> -- -sI`.
- www.lexfall.app, luxfall.online and www.luxfall.online redirect to https://lexfall.app (see `vercel.json`).
- Always `git add -A` before committing. Fonts, `brand/qr-appstore.svg`, `404.html`, `robots.txt` and `sitemap.xml` are all required files.
- The local preview server (`python3 -m http.server`) does not emulate clean URLs, redirects or rewrites. Test those on a Vercel preview.

## Files
- `index.html` landing page. `blog.html` plus two articles. `partners.html`, `support.html`, `privacy.html`, `terms.html`, `google-play.html` (Android holding page), `404.html`.
- `styles.css` shared styles, linked as `styles.css?v=23`. If you change it, bump the version everywhere: `sed -i '' 's|styles.css?v=23|styles.css?v=24|g' *.html`.
- `fonts/` self-hosted Inter and Newsreader (SIL OFL, licence texts included). No third-party requests.
- `brand/qr-appstore.svg` encodes `https://apps.apple.com/app/id6786614029?ct=web_qr`. Regenerate with the `qrcode` npm package (margin 4).
- `og-image.png` is 1200x630, rendered from an HTML mock with headless Chrome. Update it when the headline or stats change.

## Routes (vercel.json)
- `/medicine`, `/healthcare`, `/law`, `/legal`, `/business` serve the homepage; JS reads the path (or `?f=medicine`) to tailor the hero and preselect the field. Use these as ad and creator landing pages.
- `/get` and `/get/<source>` redirect to the App Store with `ct=<source>` (Android goes to `/google-play`). Use for bio links, emails and creators, for example `lexfall.app/get/nurse-assoc`.

## Attribution
Store links carry campaign tokens: `web_home` (hero, nav, download), `web_qr`, `web_field_<field>`, `web_lp_<field>` (landing variants), `web_blog`, `web_other`. Apple only reports a campaign when the link also has your provider token `pt=`. When you have it, add it to every link in one command, for example: `sed -i '' 's|id6786614029?ct=|id6786614029?pt=YOURTOKEN\&ct=|g' *.html vercel.json`.

## Facts the copy relies on (re-check before changing claims)
- App Store: free to download; after a free trial a subscription (monthly or annual) unlocks every professional field. Built for iPhone, iOS 15.1 or later. Available in essentially every storefront. Android is not available.
- The listing had exactly 1 rating on 2026-09-27, so the site must not make rating or "loved by" claims.
- Widget shows a new word every few hours.

## Open items that need the owner
1. App Store Connect: subtitle ("For work and life" names no field), promo text, keywords, Custom Product Pages per field.
2. Provider token (`pt`) for attribution, and Vercel Web Analytics (enable in the dashboard). Update privacy.html if any ad pixel is added.
3. Android waitlist needs a backend or a hosted form. Until then `/google-play` only informs.
4. Support and legal contact is a personal Gmail. The `@lexfall.app` addresses are not set up. The App Store seller name (Premier Food Delights Inc) differs from the Lexfall brand. Privacy and Terms name no legal entity and do not cover website or partner-application data.
5. Partner program: define "net revenue" and how the audience's 20% code is redeemed.
6. Use Apple's official App Store badge artwork instead of the hand-drawn one.
