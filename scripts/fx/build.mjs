// Bundles scripts/fx/fx.js into /fx (ES modules, the Paper shader split into its own lazily loaded chunk).
import { build } from 'esbuild';
import fs from 'node:fs';
const out = new URL('../../fx/', import.meta.url).pathname;
fs.rmSync(out, { recursive: true, force: true });
await build({ entryPoints: [new URL('fx.js', import.meta.url).pathname], bundle: true, splitting: true, format: 'esm',
  minify: true, target: ['safari15', 'chrome100', 'firefox100'], outdir: out, entryNames: '[name]', chunkNames: 'c-[hash]', legalComments: 'none' });
fs.writeFileSync(out + 'NOTICE.txt', `Lexfall homepage effects (/fx) build on these open-source projects:
- dashersw/liquid-glass-js (MIT): liquid glass refraction, ported to the hero word card.
- ruucm/shadergradient (MIT): plane gradient shader and its classic Perlin noise (from hughsk/glsl-noise, MIT).
- @paper-design/shaders (Apache-2.0), the liquid metal shader behind paper-design/liquid-logo.
`);
for (const f of fs.readdirSync(out)) console.log(f, fs.statSync(out + f).size);
