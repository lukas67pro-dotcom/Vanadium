// Core: settings store, DOM helpers, icons, media library, Tauri bridge.
// The loader wraps every client/*.js file (in name order) in one closure, so these are shared by the other files.
const BRAND = 'Vanadium';
const VERSION = '2.0.0';
const STORE_KEY = 'vanadium:settings';

const DEFAULTS = {
  theme: 'hyprland',
  layout: 'tiled', palette: 'hypr', accent: '#33ccff', accent2: '#00ff99', 'auto.palette': null,
  opacity: 62, blur: 18, radius: 12, gap: 10, border: 2, animBorder: true,
  font: 'jetbrains', controls: 'minimal', float: true, motion: true, streamer: false,
  'pos.nav': 'left', 'pos.sidebar': 'right', 'pos.title': 'top', 'size.nav': 64, 'size.title': 48, 'size.sidebar': 300,
  'bg.src': null, 'bg.dim': 25, 'bg.volume': 0,
  'load.src': null, 'load.mode': 'ready', 'load.fit': 'cover', 'load.min': 2, 'load.volume': 50,
  'music.list': [], 'music.volume': 35, 'music.shuffle': false, 'music.autoplay': false, 'music.player': true,
  'game.pause': true,
  'window.resize': true,
  'hide.news': false, 'hide.ads': false, 'hide.plus': false, 'hide.signin': false, 'hide.sidebar': false,
  'hide.discover': false, 'hide.skins': false, 'hide.screenshots': false, 'hide.hosting': false,
  css: '', plugins: {},
};

let S = { ...DEFAULTS };
try { Object.assign(S, JSON.parse(localStorage.getItem(STORE_KEY) ?? localStorage.getItem('rinthium:settings'))); } catch {} // carries settings over from the old name
const listeners = new Set();
function set(patch) {
  Object.assign(S, patch);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch {}
  for (const fn of listeners) { try { fn(patch); } catch (e) { console.error(`[${BRAND}]`, e); } }
}
const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// ---- DOM ----
const $ = (sel, root = document) => root.querySelector(sel);
const whenRoot = (fn) => document.documentElement ? fn()
  : new MutationObserver((_, o) => { if (document.documentElement) { o.disconnect(); fn(); } }).observe(document, { childList: true });
const whenBody = (fn) => document.body ? fn() : document.addEventListener('DOMContentLoaded', fn, { once: true });

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) el.style.setProperty(p.startsWith('--') ? p : p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`), val);
    else if (typeof v !== 'string' && k in el) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...kids.flat(Infinity).filter((c) => c != null && c !== false));
  return el;
}

function css(id, text) {
  let s = document.getElementById(id);
  if (!s) { s = document.createElement('style'); s.id = id; document.documentElement.append(s); }
  if (s.textContent !== text) s.textContent = text;
}

// Elements we add to the app's DOM get re-added whenever Vue re-renders their parent away.
const mounts = [];
function keep(el, place, want = () => true) { mounts.push({ el, place, want }); syncMounts(); }
function syncMounts() {
  for (const m of mounts) {
    const el = typeof m.el === 'function' ? m.el() : m.el;
    if (!el) continue;
    if (!m.want()) { el.remove(); continue; }
    if (!el.isConnected) m.place(el);
  }
}
const domTicks = []; // run (throttled to one frame) after any DOM change
let mountQueued = false;
whenBody(() => new MutationObserver(() => {
  if (mountQueued) return;
  mountQueued = true;
  requestAnimationFrame(() => { mountQueued = false; syncMounts(); domTicks.forEach((fn) => fn()); });
}).observe(document.body, { childList: true, subtree: true }));

// ---- icons (Lucide-style, 24px grid) ----
const ICONS = {
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  next: '<path d="M5 5v14l10-7z" fill="currentColor"/><path d="M19 5v14"/>',
  prev: '<path d="M19 5v14L9 12z" fill="currentColor"/><path d="M5 5v14"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.3"/><circle cx="17.5" cy="10.5" r="1.3"/><circle cx="8.5" cy="7.5" r="1.3"/><circle cx="6.5" cy="12.5" r="1.3"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  film: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 9h5M2 15h5M17 9h5M17 15h5"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6A13 13 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20"/>',
  blocks: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  eye: '<path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>',
};
const icon = (name, size = 18) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// The Vanadium logo (assets/vanadium-logo.svg): a V of violet blocks with a mint keystone.
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><g id="bc"><path d="M0 -13 13 -6.5 0 0 -13 -6.5Z" style="fill:var(--t)"/><path d="M-13 -6.5 0 0V15L-13 8.5Z" style="fill:var(--l)"/><path d="M0 0 13 -6.5V8.5L0 15Z" style="fill:var(--r)"/></g></defs><g style="--t:#d6c8ff;--l:#8b5cf6;--r:#5b21b6"><use href="#bc" x="22" y="26"/><use href="#bc" x="106" y="26"/><use href="#bc" x="33" y="47"/><use href="#bc" x="95" y="47"/><use href="#bc" x="44" y="68"/><use href="#bc" x="84" y="68"/><use href="#bc" x="54" y="89"/><use href="#bc" x="74" y="89"/></g><g style="--t:#b9fff0;--l:#00d4a8;--r:#00806a"><use href="#bc" x="64" y="109"/></g></svg>';
const LOGO_URL = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`; // <img> keeps the app's global svg CSS off the logo

// ---- Tauri bridge (the same IPC the app's own frontend uses) ----
const invoke = (cmd, args) => window.__TAURI_INTERNALS__
  ? window.__TAURI_INTERNALS__.invoke(cmd, args)
  : Promise.reject(new Error('Tauri bridge unavailable'));

// ---- media library: picked files live in this origin's IndexedDB, so they survive restarts without file paths ----
const MEDIA_EXT = { video: /\.(mp4|webm|mov|m4v|mkv)(\?|#|$)/i, audio: /\.(mp3|ogg|oga|wav|flac|m4a|aac|opus)(\?|#|$)/i };
function mediaKind(src) {
  const t = src?.type ?? '';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (t.startsWith('image/')) return 'image';
  const name = src?.url ?? src?.name ?? '';
  return MEDIA_EXT.video.test(name) ? 'video' : MEDIA_EXT.audio.test(name) ? 'audio' : 'image';
}
const media = (() => {
  let dbp;
  const db = () => dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open('vanadium-media', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const tx = async (mode, fn) => {
    const store = (await db()).transaction('files', mode).objectStore('files');
    return new Promise((resolve, reject) => { const req = fn(store); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
  };
  const urls = new Map();
  return {
    async add(file) {
      if (!file.size) throw new Error(`"${file.name}" is empty or couldn't be read`);
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      await tx('readwrite', (s) => s.put(file, id));
      return { kind: 'file', id, name: file.name, type: file.type, size: file.size };
    },
    async remove(src) {
      if (src?.kind !== 'file') return;
      await tx('readwrite', (s) => s.delete(src.id)).catch(() => {});
      if (urls.has(src.id)) { URL.revokeObjectURL(urls.get(src.id)); urls.delete(src.id); }
    },
    async url(src) {
      if (!src) return null;
      if (src.kind === 'url') return src.url;
      if (urls.has(src.id)) return urls.get(src.id);
      const blob = await tx('readonly', (s) => s.get(src.id));
      if (!blob) throw new Error(`"${src.name}" is no longer in the media library`);
      const u = URL.createObjectURL(blob);
      urls.set(src.id, u);
      return u;
    },
  };
})();

function urlSource(raw) {
  const url = raw.trim();
  if (!/^https:\/\/\S+$/i.test(url)) throw new Error('Use a full https:// link to the file');
  if (/youtu\.?be|spotify\.com|soundcloud\.com/i.test(url)) throw new Error('Streaming pages can\'t be played directly; link to the media file itself (.mp3, .mp4, …)');
  return { kind: 'url', url, name: decodeURIComponent(new URL(url).pathname.split('/').pop() || url) };
}

const pickFiles = (accept, multiple = false) => new Promise((resolve) => {
  const input = h('input', { type: 'file', accept, multiple, style: { display: 'none' } });
  const done = (files) => { input.remove(); resolve(files); };
  input.addEventListener('change', () => done([...input.files]));
  input.addEventListener('cancel', () => done([]));
  document.body.append(input);
  input.click();
});

// ---- toasts ----
function toast(msg, kind = 'info', action = null) {
  let host = $('#vn-toasts');
  if (!host) { host = h('div', { id: 'vn-toasts', 'aria-live': 'polite' }); document.body.append(host); }
  const t = h('div', { class: `vn-toast vn-toast-${kind}` }, msg,
    action && h('button', { class: 'vn-toast-action', onclick: () => { action.fn(); t.remove(); } }, action.label));
  host.append(t);
  const life = action ? 6000 : 3400; // give time to reach the button
  setTimeout(() => t.classList.add('out'), life);
  setTimeout(() => t.remove(), life + 400);
}

const fmtSize = (b) => (b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

// ---- tooltips: [data-tip] (+ optional data-tip-key, data-tip-side) styled like the app's own tooltips.
// A native `title` would show a plain Windows box instead.
const TIP_CSS = `
#vn-tip { position: fixed; left: 0; top: 0; z-index: 10003; pointer-events: none; padding: 6px 12px; border-radius: 8px; white-space: nowrap;
  font-size: 14px; font-weight: 500; line-height: 1.4; color: var(--color-contrast, #fff); background: var(--surface-3, #27292e);
  border: 1px solid var(--surface-5, #42444a); box-shadow: 0 6px 18px rgb(0 0 0 / .35); opacity: 0; transition: opacity .12s ease, translate .12s ease; }
#vn-tip.show { opacity: 1; translate: 0 0 !important; }
#vn-tip kbd { margin-left: 8px; padding: 1px 6px; border-radius: 5px; font: 600 11px ui-monospace, Consolas, monospace; color: var(--color-text-tertiary, #96a2b0);
  background: color-mix(in srgb, var(--color-text-primary, #fff) 9%, transparent); }
#vn-tip::before { content: ""; position: absolute; width: 8px; height: 8px; background: inherit; border: inherit; border-width: 0 0 1px 1px; border-radius: 0 0 0 2px; }
#vn-tip[data-side=right] { translate: -4px 0; } #vn-tip[data-side=right]::before { left: -5px; top: calc(50% - 4px); transform: rotate(45deg); }
#vn-tip[data-side=left] { translate: 4px 0; } #vn-tip[data-side=left]::before { right: -5px; top: calc(50% - 4px); transform: rotate(-135deg); }
#vn-tip[data-side=top] { translate: 0 4px; } #vn-tip[data-side=top]::before { bottom: -5px; left: calc(50% - 4px); transform: rotate(-45deg); }
#vn-tip[data-side=bottom] { translate: 0 -4px; } #vn-tip[data-side=bottom]::before { top: -5px; left: calc(50% - 4px); transform: rotate(135deg); }

#vn-navbtn img { width: 26px; height: 26px; filter: drop-shadow(0 3px 8px color-mix(in srgb, var(--vn-a1) 45%, transparent)); transition: transform .3s cubic-bezier(.2, .8, .2, 1); }
#vn-navbtn:hover img { transform: rotate(-8deg) scale(1.08); }
#vn-toasts { position: fixed; left: 50%; bottom: 24px; z-index: 10002; display: flex; flex-direction: column; align-items: center; gap: 8px; transform: translateX(-50%); pointer-events: none; }
.vn-toast { display: flex; align-items: center; gap: 14px; max-width: 560px; padding: 10px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 600; color: var(--vn-t0, #fff);
  background: color-mix(in srgb, var(--vn-s1, #1d1f23) 92%, transparent); backdrop-filter: blur(16px); border: 1px solid color-mix(in srgb, var(--vn-a1, #1bd96a) 32%, transparent);
  box-shadow: 0 14px 32px -14px #000; transition: opacity .35s, transform .35s; }
.vn-toast-error { border-color: #ff5f5770; }
.vn-toast.out { opacity: 0; transform: translateY(8px); }
.vn-toast-action { pointer-events: auto; padding: 4px 12px; border: 0; border-radius: 8px; font: inherit; font-size: 12.5px; cursor: pointer; color: var(--vn-ac, #000); background: var(--vn-a1, #1bd96a); }
`;
whenBody(() => {
  css('vn-tip-css', TIP_CSS);
  const tip = h('div', { id: 'vn-tip', role: 'tooltip', 'aria-hidden': 'true' });
  document.body.append(tip);
  let target = null;
  let timer = 0;
  const hide = () => { clearTimeout(timer); target = null; tip.classList.remove('show'); };
  const show = (el) => {
    tip.replaceChildren(el.dataset.tip, el.dataset.tipKey ? h('kbd', {}, el.dataset.tipKey) : '');
    // Nav buttons point away from the window edge, like the app's; everything else prefers above, flipping when clipped.
    let side = el.closest('.app-grid-navbar') ? (S['pos.nav'] === 'right' ? 'left' : 'right') : el.dataset.tipSide || 'top';
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const gap = 10;
    if (side === 'top' && r.top - gap - t.height < 4) side = 'bottom';
    if (side === 'bottom' && r.bottom + gap + t.height > innerHeight - 4) side = 'top';
    const x = side === 'right' ? r.right + gap : side === 'left' ? r.left - gap - t.width : r.left + r.width / 2 - t.width / 2;
    const y = side === 'top' ? r.top - gap - t.height : side === 'bottom' ? r.bottom + gap : r.top + r.height / 2 - t.height / 2;
    tip.dataset.side = side;
    tip.style.left = `${Math.round(Math.max(6, Math.min(innerWidth - t.width - 6, x)))}px`;
    tip.style.top = `${Math.round(Math.max(6, Math.min(innerHeight - t.height - 6, y)))}px`;
    tip.classList.add('show');
  };
  const arm = (el, delay) => {
    if (el === target) return;
    hide();
    if (!el?.dataset.tip) return;
    target = el;
    timer = setTimeout(() => show(el), delay);
  };
  document.addEventListener('pointerover', (e) => arm(e.target.closest?.('[data-tip]'), 280), true);
  document.addEventListener('focusin', (e) => { if (e.target.matches?.(':focus-visible')) arm(e.target.closest('[data-tip]'), 0); }, true);
  for (const ev of ['pointerdown', 'scroll', 'focusout', 'keydown']) document.addEventListener(ev, hide, true);
  addEventListener('blur', hide);
});
