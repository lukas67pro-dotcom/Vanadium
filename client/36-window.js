// Window resizing from the edges and corners. Modrinth's permissions block resizing from the page,
// so the loader does it (see vanadiumHost in modrinth-mod.mjs); here we only track the drag.
const WIN_CSS = `
#vn-winresize > div { position: fixed; z-index: 10005; touch-action: none; }
#vn-winresize[hidden] { display: none; }
`;
const EDGE = 5, CORNER = 12;
const WIN_HANDLES = {
  n: { cursor: 'ns-resize', css: `top:0;left:${CORNER}px;right:${CORNER}px;height:${EDGE}px` },
  s: { cursor: 'ns-resize', css: `bottom:0;left:${CORNER}px;right:${CORNER}px;height:${EDGE}px` },
  w: { cursor: 'ew-resize', css: `left:0;top:${CORNER}px;bottom:${CORNER}px;width:${EDGE}px` },
  e: { cursor: 'ew-resize', css: `right:0;top:${CORNER}px;bottom:${CORNER}px;width:${EDGE}px` },
  nw: { cursor: 'nwse-resize', css: `left:0;top:0;width:${CORNER}px;height:${CORNER}px` },
  se: { cursor: 'nwse-resize', css: `right:0;bottom:0;width:${CORNER}px;height:${CORNER}px` },
  ne: { cursor: 'nesw-resize', css: `right:0;top:0;width:${CORNER}px;height:${CORNER}px` },
  sw: { cursor: 'nesw-resize', css: `left:0;bottom:0;width:${CORNER}px;height:${CORNER}px` },
};

const hostCbs = new Map();
let hostSeq = 0;
window.__vanadiumHostCb = (id, value) => { hostCbs.get(id)?.(value); hostCbs.delete(id); };
const host = (op, data = {}) => new Promise((resolve, reject) => {
  if (typeof window.vanadiumHost !== 'function') return reject(new Error('Restart the Vanadium loader to enable window resizing'));
  const id = ++hostSeq;
  hostCbs.set(id, resolve);
  window.vanadiumHost(JSON.stringify({ id, op, ...data }));
  setTimeout(() => { if (hostCbs.delete(id)) reject(new Error('Loader did not answer')); }, 4000);
});

const winLayer = h('div', { id: 'vn-winresize', hidden: true });
const MIN_W = 640, MIN_H = 400;

async function startWinResize(e, dir) {
  if (e.button !== 0) return;
  e.preventDefault();
  const el = e.currentTarget;
  el.setPointerCapture(e.pointerId);
  let start;
  try { start = await host('rect'); } catch (err) { toast(err.message, 'error'); return; }
  const dpr = devicePixelRatio;
  const sx = e.screenX, sy = e.screenY;
  let pending = null;
  const move = (ev) => {
    const dx = Math.round((ev.screenX - sx) * dpr), dy = Math.round((ev.screenY - sy) * dpr);
    let { x, y, w, h: ht } = start;
    if (dir.includes('e')) w = Math.max(MIN_W, start.w + dx);
    if (dir.includes('s')) ht = Math.max(MIN_H, start.h + dy);
    if (dir.includes('w')) { w = Math.max(MIN_W, start.w - dx); x = start.x + start.w - w; } // keep the right edge put
    if (dir.includes('n')) { ht = Math.max(MIN_H, start.h - dy); y = start.y + start.h - ht; }
    if (!pending) requestAnimationFrame(() => { host('set', pending).catch(() => {}); pending = null; });
    pending = { x, y, w, h: ht };
  };
  const up = () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}

// No resize handles while maximized (Windows doesn't offer them either) or when the loader can't resize.
let maxCheck = 0;
function syncWinHandles() {
  clearTimeout(maxCheck);
  maxCheck = setTimeout(async () => {
    let maximized = false;
    try { maximized = await invoke('plugin:window|is_maximized', { label: 'main' }); } catch {}
    winLayer.hidden = !S['window.resize'] || maximized || typeof window.vanadiumHost !== 'function';
  }, 120);
}

function startWindowResize() {
  css('vn-win-css', WIN_CSS);
  for (const [dir, d] of Object.entries(WIN_HANDLES)) {
    const el = h('div', { 'data-dir': dir });
    el.style.cssText = `${d.css};cursor:${d.cursor}`;
    el.addEventListener('pointerdown', (e) => startWinResize(e, dir));
    winLayer.append(el);
  }
  document.body.append(winLayer);
  addEventListener('resize', syncWinHandles);
  onChange(syncWinHandles);
  syncWinHandles();
}
