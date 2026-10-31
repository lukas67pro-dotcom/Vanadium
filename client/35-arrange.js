// Arrange: resize panels by dragging their inner edges or the corners where two meet; move panels in arrange
// mode (Ctrl+Shift+L). Handles are always live in the Tiled layout (they sit in the gaps) and in arrange mode.
const SIZE_LIMITS = { 'size.nav': [56, 104], 'size.title': [40, 76], 'size.sidebar': [240, 560] };
const SIZE_LABEL = { 'size.nav': 'Nav', 'size.title': 'Title bar', 'size.sidebar': 'Sidebar' };
const ARRANGE_DEFAULTS = { 'pos.nav': 'left', 'pos.sidebar': 'right', 'pos.title': 'top', 'size.nav': 64, 'size.title': 48, 'size.sidebar': 300 };
const MOVES = {
  nav: { label: 'Navigation', sel: '.app-grid-navbar', key: 'pos.nav', axis: 'x' },
  title: { label: 'Title bar', sel: '.app-title-bar', key: 'pos.title', axis: 'y' },
  view: { label: 'Main view', sel: '.app-viewport', key: 'pos.sidebar', axis: 'x', invert: true }, // main view swaps sides with the sidebar
  side: { label: 'Sidebar', sel: '.app-contents.sidebar-enabled > .app-sidebar', key: 'pos.sidebar', axis: 'x' },
};

const ARRANGE_CSS = `
#vn-handles { position: fixed; inset: 0; z-index: 9000; pointer-events: none; }
#vn-handles[hidden] { display: none; }
.vn-h { position: fixed; pointer-events: auto; touch-action: none; outline: none; }
.vn-h::after { content: ""; position: absolute; inset: 0; margin: auto; border-radius: 99px; background: linear-gradient(var(--vn-a1), var(--vn-a2)); opacity: 0; transition: opacity .18s, width .18s, height .18s; }
.vn-h.x::after { width: 4px; height: min(90px, 40%); }
.vn-h.y::after { height: 4px; width: min(140px, 30%); }
.vn-h.corner::after { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 4px color-mix(in srgb, var(--vn-a1) 30%, transparent); }
.vn-h:hover::after, .vn-h.active::after, .vn-h:focus-visible::after, html.vn-arranging .vn-h::after { opacity: 1; }
.vn-h.x:hover::after, .vn-h.x.active::after { height: min(160px, 60%); }
.vn-h.y:hover::after, .vn-h.y.active::after { width: min(240px, 50%); }
html.vn-resizing, html.vn-resizing * { user-select: none !important; cursor: var(--vn-cursor) !important; }
html.vn-resizing :is(.app-grid-navbar, .app-title-bar, .app-viewport, .app-sidebar, .app-contents) { transition: none !important; animation: none !important; }
#vn-tip { position: fixed; z-index: 9600; padding: 5px 10px; border-radius: 8px; pointer-events: none; transform: translate(16px, 16px); white-space: nowrap;
  font: 600 12px ui-monospace, Consolas, monospace; color: var(--vn-t0); background: color-mix(in srgb, var(--vn-s0) 92%, transparent); border: 1px solid color-mix(in srgb, var(--vn-a1) 45%, transparent); }
#vn-arrange { position: fixed; inset: 0; z-index: 8990; }
#vn-arrange[hidden] { display: none; }
.vn-tile { position: fixed; display: grid; place-items: center; padding: 0; overflow: hidden; border-radius: var(--vn-r, 12px); cursor: grab; touch-action: none; font: inherit; color: var(--vn-t0);
  background: linear-gradient(color-mix(in srgb, var(--vn-a1) 14%, transparent), color-mix(in srgb, var(--vn-a1) 14%, transparent)), rgb(0 0 0 / .38);
  border: 2px dashed color-mix(in srgb, var(--vn-a1) 85%, transparent); transition: background .15s; }
.vn-tile:hover, .vn-tile:focus-visible { background: linear-gradient(color-mix(in srgb, var(--vn-a1) 26%, transparent), color-mix(in srgb, var(--vn-a1) 26%, transparent)), rgb(0 0 0 / .3); outline: none; }
.vn-tile > span { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 14px; border-radius: 12px; background: color-mix(in srgb, var(--vn-s0) 82%, transparent); font-size: 13px; font-weight: 700; text-align: center; }
.vn-tile small { font-size: 11.5px; font-weight: 500; color: var(--vn-t2); }
.vn-tile.thin > span { flex-direction: row; gap: 10px; padding: 4px 12px; }
.vn-tile.narrow > span { padding: 8px 4px; } .vn-tile.narrow b, .vn-tile.narrow small { display: none; }
.vn-tile.dragging { z-index: 3; cursor: grabbing; transition: none; box-shadow: 0 26px 60px -20px #000; }
.vn-zone { position: fixed; display: grid; place-items: center; border-radius: 20px; font-size: 18px; font-weight: 800; color: var(--vn-t1);
  background: color-mix(in srgb, var(--vn-s0) 35%, transparent); border: 2px dashed color-mix(in srgb, var(--vn-t0) 22%, transparent); transition: background .15s, border-color .15s, color .15s; }
.vn-zone.hot { background: color-mix(in srgb, var(--vn-a1) 24%, transparent); border-color: var(--vn-a1); color: var(--vn-t0); }
.vn-banner { position: fixed; left: 50%; bottom: 26px; z-index: 9100; display: flex; align-items: center; gap: 14px; padding: 10px 10px 10px 18px; border-radius: 16px; transform: translateX(-50%); white-space: nowrap;
  font-size: 13.5px; color: var(--vn-t1); background: color-mix(in srgb, var(--vn-s0) 90%, transparent); backdrop-filter: blur(18px); border: 1px solid color-mix(in srgb, var(--vn-a1) 35%, transparent); box-shadow: 0 20px 50px -20px #000; }
.vn-banner b { color: var(--vn-a1); }
html.vn-title-bottom .vn-banner { bottom: auto; top: 26px; }
`;

const handleLayer = h('div', { id: 'vn-handles', hidden: true });
const arrangeLayer = h('div', { id: 'vn-arrange', hidden: true });
let arranging = false;
let tip = null;

const rect = (sel) => $(sel)?.getBoundingClientRect();
const clampSize = (key, v) => Math.round(Math.max(SIZE_LIMITS[key][0], Math.min(SIZE_LIMITS[key][1], v)));

// One handle per inner edge, plus a corner where the title bar meets the nav and the sidebar.
function handleDefs() {
  const nav = rect('.app-grid-navbar'), title = rect('.app-title-bar'), side = rect(MOVES.side.sel);
  if (!nav || !title) return [];
  const g = S.layout === 'tiled' ? S.gap : 0;
  const T = Math.max(10, g);
  const navL = S['pos.nav'] !== 'right', titleT = S['pos.title'] !== 'bottom', sideR = S['pos.sidebar'] !== 'left';
  const navX = navL ? nav.right + g / 2 : nav.left - g / 2;
  const titleY = titleT ? title.bottom + g / 2 : title.top - g / 2;
  const kNav = { key: 'size.nav', axis: 'x', sign: navL ? 1 : -1 };
  const kTitle = { key: 'size.title', axis: 'y', sign: titleT ? 1 : -1 };
  const defs = [
    { id: 'nav', keys: [kNav], x: navX - T / 2, y: nav.top, w: T, h: nav.height },
    { id: 'title', keys: [kTitle], x: title.left, y: titleY - T / 2, w: title.width, h: T },
    { id: 'nav-title', keys: [kNav, kTitle], corner: true, x: navX - 9, y: titleY - 9, w: 18, h: 18 },
  ];
  if (side?.width) { // zero-size when the sidebar is hidden
    const sideX = sideR ? side.left - g / 2 : side.right + g / 2;
    const kSide = { key: 'size.sidebar', axis: 'x', sign: sideR ? -1 : 1 };
    defs.push(
      { id: 'side', keys: [kSide], x: sideX - T / 2, y: side.top, w: T, h: side.height },
      { id: 'side-title', keys: [kSide, kTitle], corner: true, x: sideX - 9, y: titleY - 9, w: 18, h: 18 });
  }
  return defs;
}

const cursorFor = (d) => (d.corner ? (d.keys[0].sign * d.keys[1].sign > 0 ? 'nwse-resize' : 'nesw-resize') : d.keys[0].axis === 'x' ? 'col-resize' : 'row-resize');
const tipText = (keys) => keys.map((k) => `${SIZE_LABEL[k.key]} ${S[k.key]}px`).join(' · ');

let dragging = false;
function layoutHandles() {
  const live = S.layout !== 'stock' && (arranging || (S.layout === 'tiled' && S.gap >= 6));
  handleLayer.hidden = !live;
  if (!live || dragging) return;
  const defs = handleDefs();
  const els = handleLayer.children;
  while (els.length > defs.length) els[els.length - 1].remove();
  defs.forEach((d, i) => {
    let el = els[i];
    if (!el) {
      el = h('div', { class: 'vn-h', tabindex: '0', role: 'separator' });
      el.addEventListener('pointerdown', (e) => startResize(e, el));
      el.addEventListener('dblclick', () => set(Object.fromEntries(el.def.keys.map((k) => [k.key, ARRANGE_DEFAULTS[k.key]]))));
      el.addEventListener('keydown', (e) => keyResize(e, el));
      handleLayer.append(el);
    }
    el.def = d;
    el.className = `vn-h ${d.corner ? 'corner' : d.keys[0].axis}`;
    el.style.cssText = `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px;cursor:${cursorFor(d)}`;
    el.dataset.tip = `Drag to resize ${d.keys.map((k) => SIZE_LABEL[k.key].toLowerCase()).join(' and ')} · double-click to reset`;
    el.setAttribute('aria-label', `Resize ${d.keys.map((k) => SIZE_LABEL[k.key]).join(' and ')}`);
    if (!d.corner) {
      el.setAttribute('aria-orientation', d.keys[0].axis === 'x' ? 'vertical' : 'horizontal');
      el.setAttribute('aria-valuenow', String(S[d.keys[0].key]));
    }
  });
}

function startResize(e, el) {
  if (e.button !== 0) return;
  e.preventDefault();
  const { keys } = el.def;
  const start = { x: e.clientX, y: e.clientY, vals: keys.map((k) => S[k.key]) };
  el.setPointerCapture(e.pointerId);
  el.classList.add('active');
  dragging = true;
  const root = document.documentElement;
  root.style.setProperty('--vn-cursor', cursorFor(el.def));
  root.classList.add('vn-resizing');
  tip = h('div', { id: 'vn-tip' });
  document.body.append(tip);
  let pending = null;
  const move = (ev) => {
    const patch = {};
    keys.forEach((k, i) => { patch[k.key] = clampSize(k.key, start.vals[i] + ((k.axis === 'x' ? ev.clientX - start.x : ev.clientY - start.y) * k.sign)); });
    tip.style.left = `${ev.clientX}px`;
    tip.style.top = `${ev.clientY}px`;
    if (!pending) requestAnimationFrame(() => { set(pending); tip.textContent = tipText(keys); pending = null; });
    pending = patch;
  };
  const up = () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    el.classList.remove('active');
    root.classList.remove('vn-resizing');
    tip.remove();
    dragging = false;
    requestAnimationFrame(layoutHandles);
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  move(e);
}

function keyResize(e, el) {
  const step = e.shiftKey ? 32 : 8;
  const dir = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', -1], ArrowDown: ['y', 1] }[e.key];
  if (!dir) return;
  const patch = {};
  for (const k of el.def.keys) if (k.axis === dir[0]) patch[k.key] = clampSize(k.key, S[k.key] + dir[1] * k.sign * step);
  if (!Object.keys(patch).length) return;
  e.preventDefault();
  set(patch);
}

// Panels briefly settle into their new slot after a move.
function settlePanels() {
  if (!S.motion) return;
  requestAnimationFrame(() => document.querySelectorAll('.app-grid-navbar, .app-title-bar, .app-viewport, .app-sidebar').forEach((el) =>
    el.animate([{ opacity: 0.35, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2, .8, .2, 1)' })));
}

function movePanel(id, side) {
  const m = MOVES[id];
  const value = m.invert ? (side === 'left' ? 'right' : 'left') : side;
  if (S[m.key] === value) return;
  set({ [m.key]: value });
  settlePanels();
}

// ---------- arrange mode ----------
function drawArrange() {
  if (!arranging) return;
  const banner = h('div', { class: 'vn-banner', role: 'toolbar', 'aria-label': 'Arrange layout' },
    h('span', { html: '<b>Arrange</b> · drag a window to move it · drag edges and corners to resize' }),
    btn('Reset layout', 'refresh', () => { set({ ...ARRANGE_DEFAULTS }); settlePanels(); requestAnimationFrame(drawArrange); }),
    btn('Done', 'check', exitArrange, 'primary'));
  const tiles = Object.entries(MOVES).flatMap(([id, m]) => {
    const r = rect(m.sel);
    if (!r?.width) return [];
    const other = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
    const cur = m.invert ? other[S[m.key]] : S[m.key];
    const tile = h('button', {
      class: `vn-tile${r.height < 70 ? ' thin' : ''}${r.width < 90 ? ' narrow' : ''}`, 'aria-label': `${m.label}: on the ${cur}. Press Enter to move it to the ${other[cur]}, or drag it.`,
      style: { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` },
      onclick: (e) => { if (e.detail === 0) { movePanel(id, other[cur]); requestAnimationFrame(drawArrange); } }, // keyboard activation
    }, h('span', {}, h('i', { html: icon('blocks', 16) }), h('b', {}, m.label), h('small', {}, `drag to move · ${cur}`)));
    tile.addEventListener('pointerdown', (e) => startMove(e, tile, id, r));
    return [tile];
  });
  arrangeLayer.replaceChildren(...tiles, banner);
}

function startMove(e, tile, id, r) {
  if (e.button !== 0) return;
  e.preventDefault();
  const m = MOVES[id];
  const W = innerWidth, H = innerHeight, pad = 16;
  const opts = m.axis === 'x' ? ['left', 'right'] : ['top', 'bottom'];
  const zones = opts.map((side, i) => h('div', {
    class: 'vn-zone',
    style: m.axis === 'x'
      ? { left: `${i ? W / 2 + pad / 2 : pad}px`, top: `${pad}px`, width: `${W / 2 - pad * 1.5}px`, height: `${H - pad * 2}px` }
      : { left: `${pad}px`, top: `${i ? H / 2 + pad / 2 : pad}px`, width: `${W - pad * 2}px`, height: `${H / 2 - pad * 1.5}px` },
  }, `${m.label} → ${side}`));
  arrangeLayer.prepend(...zones);
  tile.setPointerCapture(e.pointerId);
  tile.classList.add('dragging');
  let hot = null;
  const move = (ev) => {
    tile.style.transform = `translate(${ev.clientX - e.clientX}px, ${ev.clientY - e.clientY}px) scale(.96)`;
    hot = (m.axis === 'x' ? ev.clientX > W / 2 : ev.clientY > H / 2) ? 1 : 0;
    zones.forEach((z, i) => z.classList.toggle('hot', i === hot));
  };
  const up = () => {
    tile.removeEventListener('pointermove', move);
    tile.removeEventListener('pointerup', up);
    tile.removeEventListener('pointercancel', up);
    if (hot !== null) movePanel(id, opts[hot]);
    requestAnimationFrame(() => requestAnimationFrame(drawArrange)); // after the layout has applied
  };
  tile.addEventListener('pointermove', move);
  tile.addEventListener('pointerup', up);
  tile.addEventListener('pointercancel', up);
}

const onArrangeKey = (e) => { if (e.key === 'Escape' && arranging) { e.stopPropagation(); exitArrange(); } };
function enterArrange() {
  if (S.layout === 'stock') return toast('Pick a theme first: the Stock layout can\'t be rearranged', 'error');
  css('vn-ui-css', UI_CSS); // shared button styles
  arranging = true;
  document.documentElement.classList.add('vn-arranging');
  arrangeLayer.hidden = false;
  addEventListener('keydown', onArrangeKey, true);
  layoutHandles();
  drawArrange();
  $('.vn-tile', arrangeLayer)?.focus();
}
function exitArrange() {
  arranging = false;
  document.documentElement.classList.remove('vn-arranging');
  arrangeLayer.hidden = true;
  arrangeLayer.replaceChildren();
  removeEventListener('keydown', onArrangeKey, true);
  layoutHandles();
}
const toggleArrange = () => (arranging ? exitArrange() : enterArrange());

function startArrange() {
  css('vn-arrange-css', ARRANGE_CSS);
  document.body.append(handleLayer, arrangeLayer);
  addEventListener('resize', () => { layoutHandles(); drawArrange(); });
  domTicks.push(layoutHandles);
  onChange(() => requestAnimationFrame(layoutHandles));
  layoutHandles();
}
