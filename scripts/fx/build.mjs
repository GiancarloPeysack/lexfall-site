// Bundles scripts/fx/fx.js into /fx (ES modules, the Paper shader split into its own lazily loaded chunk).
import { build } from 'esbuild';
import fs from 'node:fs';
const out = new URL('../../fx/', import.meta.url).pathname;
fs.rmSync(out, { recursive: true, force: true });
await build({ entryPoints: [new URL('fx.js', import.meta.url).pathname], bundle: true, splitting: true, format: 'esm',
  minify: true, target: ['safari15', 'chrome100', 'firefox100'], outdir: out, entryNames: '[name]', chunkNames: 'c-[hash]', legalComments: 'none' });
fs.writeFileSync(out + 'NOTICE.txt', `Lexfall homepage effects (/fx) build on these open-source projects:
- dashersw/liquid-glass-js (MIT): liquid glass refraction, ported to the hero word card.
  Copyright (c) 2025 Armagan Amcalar.
- ruucm/shadergradient (MIT): plane gradient shader. Copyright (c) ruucm, stone-skipper.
  Its classic Perlin noise (via hughsk/glsl-noise, MIT): Copyright (C) 2011 by Ashima Arts (Simplex noise),
  Copyright (C) 2011 by Stefan Gustavson (Classic noise).
- @paper-design/shaders (Apache-2.0): the liquid metal shader behind paper-design/liquid-logo.
  Powered by Paper Shaders, https://shaders.paper.design. License: https://www.apache.org/licenses/LICENSE-2.0

MIT License (for the MIT projects above):
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
`);
for (const f of fs.readdirSync(out)) console.log(f, fs.statSync(out + f).size);
