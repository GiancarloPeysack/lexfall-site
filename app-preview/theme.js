// Theme switch for the preview: the shaders read their palette at start, so a change reloads the page.
const KEY = 'lx-preview-theme';
let t = null;
try { t = localStorage.getItem(KEY); } catch (e) {}
const ids = { tSys: null, tLight: 'light', tDark: 'dark' };
for (const [id, v] of Object.entries(ids)) {
  const b = document.getElementById(id);
  b.setAttribute('aria-pressed', String(v === t));
  b.addEventListener('click', () => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} location.reload(); });
}
