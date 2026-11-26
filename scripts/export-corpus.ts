// Exports the app's shipped corpus to data/words.json (input of build-words.mjs).
// Run with bun, pointing at the app checkout that matches the live OTA (read-only):
//   bun scripts/export-corpus.ts ~/Downloads/Lexfall-hotfix/app
// Joins SEED with WORD_LEVELS (level, rarity) and WORD_REGISTER (register). Not deployed.
import fs from 'node:fs';
import path from 'node:path';

const app = path.resolve(process.argv[2] || '');
if (!fs.existsSync(path.join(app, 'data/words.ts'))) throw new Error('usage: bun scripts/export-corpus.ts <app dir>');
const { SEED } = await import(path.join(app, 'data/words.ts'));
const { WORD_LEVELS } = await import(path.join(app, 'data/word-levels.ts'));
const { WORD_REGISTER } = await import(path.join(app, 'data/word-register.ts'));

const KEYS = ['id', 'field', 'word', 'pos', 'ipa', 'cefr', 'def', 'ex', 'topic', 'syn', 'etymology', 'visual'];
const out = SEED.map((w: Record<string, unknown>) => {
  const r: Record<string, unknown> = {};
  for (const k of KEYS) if (w[k] !== undefined) r[k] = w[k];
  const lv = WORD_LEVELS[w.id as string];
  if (lv) { r.level = lv.level; r.rarity = lv.rarity; }
  const reg = WORD_REGISTER[w.id as string];
  if (reg) r.register = reg;
  return r;
});
const dest = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'words.json');
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`${out.length} words -> ${dest}`);
