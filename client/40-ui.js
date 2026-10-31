// Full-screen settings UI, opened from the logo button in the nav bar or Ctrl+Shift+M.
const PAGES = [
  { id: 'themes', label: 'Themes', icon: 'palette', sub: 'Pick a look. Every theme is a starting point you can fine-tune in Look & Feel.' },
  { id: 'look', label: 'Look & Feel', icon: 'sliders', sub: 'Layout, glass, window borders, window buttons and typography.' },
  { id: 'background', label: 'Background', icon: 'image', sub: 'An image, GIF or video behind the glass.' },
  { id: 'loading', label: 'Loading Screen', icon: 'film', sub: 'Replace the Modrinth splash with your own video, GIF or image.' },
  { id: 'music', label: 'Music', icon: 'music', sub: 'Background music from your own files or direct links.' },
  { id: 'declutter', label: 'Declutter', icon: 'eyeOff', sub: 'Hide the parts of the launcher you never use.' },
  { id: 'plugins', label: 'Plugins', icon: 'blocks', sub: 'Scripts from the plugins folder next to the loader.' },
  { id: 'css', label: 'Custom CSS', icon: 'code', sub: 'Your own styles, applied live on top of everything else.' },
  { id: 'about', label: 'Backup & About', icon: 'archive', sub: 'Export, import or reset your setup.' },
];
const ACCENT_PAIRS = [['#33ccff', '#00ff99'], ['#00ffcc', '#7c5cff'], ['#00d4a8', '#1793d1'], ['#cba6f7', '#f5c2e7'], ['#7aa2f7', '#bb9af7'], ['#ff4d8d', '#ffb020'], ['#ebbcba', '#c4a7e7'], ['#ff5f57', '#febc2e'], ['#88c0d0', '#a3be8c'], ['#1bd96a', '#1bd96a']];

const UI_CSS = `
#vn-ui, .vn-banner { --u-a1: var(--vn-a1); --u-a2: var(--vn-a2); --u-t0: var(--vn-t0); --u-t1: var(--vn-t1); --u-t2: var(--vn-t2);
  --u-card: color-mix(in srgb, var(--vn-t0) 4.5%, transparent); --u-line: color-mix(in srgb, var(--vn-t0) 9%, transparent); }
.vn-banner button { font: inherit; cursor: pointer; }
#vn-ui { position: fixed; inset: 0; z-index: 10000; display: flex; color: var(--u-t1); font-size: 14px; line-height: 1.4;
  background: radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--u-a1) 16%, transparent), transparent 40%),
    radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--u-a2) 12%, transparent), transparent 45%),
    color-mix(in srgb, var(--vn-s0) 84%, transparent);
  backdrop-filter: blur(30px) saturate(160%); opacity: 0; transform: scale(1.012); transition: opacity .22s ease, transform .22s ease; }
#vn-ui.open { opacity: 1; transform: none; }
#vn-ui[hidden] { display: none; }
#vn-ui *, #vn-ui *::before, #vn-ui *::after { box-sizing: border-box; }
#vn-ui button { font: inherit; color: inherit; cursor: pointer; background: none; border: 0; padding: 0; }
#vn-ui button:disabled { opacity: .35; cursor: default; }
#vn-ui :is(button, input, select, textarea, a):focus-visible { outline: 2px solid var(--u-a1); outline-offset: 2px; }
#vn-ui svg { flex: none; }

.vn-rail { width: 252px; flex: none; display: flex; flex-direction: column; gap: 3px; padding: 22px 14px 16px; background: color-mix(in srgb, var(--vn-s0) 55%, transparent); border-right: 1px solid var(--u-line); overflow-y: auto; }
.vn-brand { display: flex; align-items: center; gap: 12px; padding: 4px 10px 24px; }
.vn-brand img { width: 40px; height: 40px; filter: drop-shadow(0 6px 16px color-mix(in srgb, var(--u-a1) 50%, transparent)); }
.vn-brand b { display: block; font-size: 20px; font-weight: 800; letter-spacing: -.02em; color: var(--u-t0); }
.vn-brand small { font-size: 11.5px; color: var(--u-t2); }
.vn-nav { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px !important; border-radius: 11px; font-size: 14px; font-weight: 600; text-align: left; color: var(--u-t1) !important; transition: background .15s, color .15s; }
.vn-nav:hover { background: var(--u-card) !important; color: var(--u-t0) !important; }
.vn-nav[aria-current="page"] { background: color-mix(in srgb, var(--u-a1) 14%, transparent) !important; color: var(--u-a1) !important; }
.vn-nav[aria-current="page"]::before { content: ""; position: absolute; left: -14px; top: 9px; bottom: 9px; width: 3px; border-radius: 0 3px 3px 0; background: linear-gradient(var(--u-a1), var(--u-a2)); }
.vn-rail-foot { margin-top: auto; padding: 14px 12px 0; font-size: 12px; color: var(--u-t2); line-height: 1.6; }
#vn-ui kbd { padding: 1px 6px; border-radius: 5px; border: 1px solid var(--u-line); background: var(--u-card); font: 600 11px ui-monospace, Consolas, monospace; color: var(--u-t1); }

.vn-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.vn-head { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 28px 172px 22px 44px; border-bottom: 1px solid var(--u-line); }
.vn-head h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -.025em; color: var(--u-t0); }
.vn-head p { margin: 6px 0 0; font-size: 14px; color: var(--u-t2); }
.vn-close { width: 42px; height: 42px; flex: none; display: grid; place-items: center; border-radius: 13px; background: var(--u-card) !important; border: 1px solid var(--u-line) !important; transition: color .15s, border-color .15s; }
.vn-close:hover { color: var(--u-a1) !important; border-color: color-mix(in srgb, var(--u-a1) 50%, transparent) !important; }
.vn-scroll { flex: 1; overflow-y: auto; padding: 28px 44px 64px; }
.vn-page { max-width: 940px; display: flex; flex-direction: column; gap: 18px; animation: vn-in .32s cubic-bezier(.2, .8, .2, 1); }

.vn-card { padding: 4px 22px; border-radius: 16px; background: var(--u-card); border: 1px solid var(--u-line); }
.vn-card > h3 { margin: 16px 0 2px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--u-t2); }
.vn-row { display: flex; align-items: center; justify-content: space-between; gap: 28px; min-height: 64px; padding: 14px 0; }
.vn-card > :is(.vn-row, .vn-media, .vn-block) + :is(.vn-row, .vn-media, .vn-block) { border-top: 1px solid var(--u-line); }
.vn-row-label { font-size: 14.5px; font-weight: 650; color: var(--u-t0); }
.vn-row-desc { max-width: 470px; margin-top: 3px; font-size: 12.5px; line-height: 1.45; color: var(--u-t2); }
.vn-block { padding: 16px 0; }

.vn-switch { position: relative; width: 44px; height: 24px; flex: none; border-radius: 99px; background: color-mix(in srgb, var(--u-t0) 16%, transparent) !important; transition: background .2s; }
.vn-switch::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgb(0 0 0 / .4); transition: transform .24s cubic-bezier(.3, .7, .3, 1.3); }
.vn-switch[aria-checked="true"] { background: linear-gradient(90deg, var(--u-a1), var(--u-a2)) !important; }
.vn-switch[aria-checked="true"]::after { transform: translateX(20px); }

.vn-range-wrap { display: flex; align-items: center; gap: 14px; width: 310px; flex: none; }
.vn-range-wrap output { min-width: 50px; text-align: right; font-size: 13px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--u-t1); }
#vn-ui input[type=range] { flex: 1; height: 6px !important; min-height: 0 !important; margin: 0; padding: 0 !important; border: 0 !important; border-radius: 99px; box-shadow: none !important; cursor: pointer;
  background: linear-gradient(90deg, var(--u-a1), var(--u-a2)) 0 / var(--p, 50%) 100% no-repeat, color-mix(in srgb, var(--u-t0) 13%, transparent) !important; }
#vn-ui input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--u-a1) 30%, transparent), 0 2px 6px rgb(0 0 0 / .45); transition: box-shadow .15s; }
#vn-ui input[type=range]:hover::-webkit-slider-thumb { box-shadow: 0 0 0 6px color-mix(in srgb, var(--u-a1) 34%, transparent), 0 2px 6px rgb(0 0 0 / .45); }

.vn-seg { display: inline-flex; flex: none; gap: 3px; padding: 4px; border-radius: 12px; background: color-mix(in srgb, var(--u-t0) 6%, transparent); border: 1px solid var(--u-line); }
.vn-seg button { padding: 7px 14px !important; border-radius: 9px; font-size: 13px; font-weight: 650; color: var(--u-t1) !important; white-space: nowrap; transition: background .15s, color .15s; }
.vn-seg button:hover { color: var(--u-t0) !important; }
.vn-seg button[aria-checked="true"] { background: var(--u-a1) !important; color: var(--vn-ac) !important; box-shadow: 0 4px 14px -6px var(--u-a1); }

#vn-ui select { min-width: 210px; padding: 9px 38px 9px 12px; border-radius: 10px; border: 1px solid var(--u-line) !important; color: var(--u-t0); font: inherit; font-size: 13.5px; cursor: pointer;
  background: color-mix(in srgb, var(--u-t0) 6%, transparent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center / 14px !important; }
#vn-ui select option { background: var(--vn-s1); color: var(--u-t0); }
#vn-ui :is(input[type=text], input[type=url], textarea) { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--u-line) !important; background: color-mix(in srgb, var(--vn-s0) 65%, transparent) !important; color: var(--u-t0); font: inherit; font-size: 13.5px; outline: none; }
#vn-ui :is(input[type=text], input[type=url], textarea):focus { border-color: var(--u-a1) !important; }
#vn-ui input[type=color] { width: 44px; height: 34px; padding: 0; border-radius: 10px; border: 1px solid var(--u-line) !important; background: none; cursor: pointer; }
#vn-ui input[type=color]::-webkit-color-swatch-wrapper { padding: 4px; }
#vn-ui input[type=color]::-webkit-color-swatch { border: 0; border-radius: 6px; }
.vn-color { display: flex; align-items: center; gap: 10px; flex: none; }
.vn-color input[type=text] { width: 104px !important; font-family: ui-monospace, Consolas, monospace !important; text-transform: lowercase; }

.vn-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 15px !important; border-radius: 10px; font-size: 13.5px; font-weight: 650; white-space: nowrap;
  background: color-mix(in srgb, var(--u-t0) 8%, transparent) !important; border: 1px solid var(--u-line) !important; color: var(--u-t0) !important; transition: color .15s, border-color .15s, transform .1s; }
.vn-btn:hover:not(:disabled) { color: var(--u-a1) !important; border-color: color-mix(in srgb, var(--u-a1) 50%, transparent) !important; }
.vn-btn:active:not(:disabled) { transform: scale(.97); }
.vn-btn.primary { background: linear-gradient(135deg, var(--u-a1), var(--u-a2)) !important; border-color: transparent !important; color: var(--vn-ac) !important; }
.vn-btn.primary:hover:not(:disabled) { filter: brightness(1.08); color: var(--vn-ac) !important; }
.vn-btn.danger:hover:not(:disabled) { color: #ff6b81 !important; border-color: #ff6b8166 !important; }
.vn-btn.icon { width: 34px; height: 34px; padding: 0 !important; }
.vn-actions { display: flex; flex-wrap: wrap; gap: 8px; }

.vn-themes { display: grid; grid-template-columns: repeat(auto-fill, minmax(206px, 1fr)); gap: 14px; }
.vn-theme { padding: 10px !important; border-radius: 17px; text-align: left; background: var(--u-card) !important; border: 1px solid var(--u-line) !important; transition: transform .2s, border-color .2s, box-shadow .2s; }
.vn-theme:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--u-a1) 45%, transparent) !important; }
.vn-theme[aria-pressed="true"] { border-color: var(--u-a1) !important; box-shadow: 0 0 0 1px var(--u-a1), 0 16px 32px -18px var(--u-a1); }
.vn-theme b { display: flex; align-items: center; gap: 6px; margin: 11px 4px 2px; font-size: 14.5px; color: var(--u-t0); }
.vn-theme span { display: block; margin: 0 4px 3px; font-size: 12px; line-height: 1.4; color: var(--u-t2); }
.vn-mock { position: relative; display: grid; grid-template: 15px 1fr / 20px 1fr 46px; height: 116px; border-radius: 11px; overflow: hidden;
  background: radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--ma1) 50%, transparent), transparent 60%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--ma2) 45%, transparent), transparent 60%), var(--m0); }
.vn-mock i { display: block; background: var(--m2); }
.vn-mock .mt { grid-column: 1 / -1; }
.vn-mock .mv { display: flex; flex-direction: column; gap: 6px; padding: 9px; background: var(--m0); }
.vn-mock .mv u { display: block; height: 13px; border-radius: 4px; background: var(--m3); }
.vn-mock .mv u:first-child { width: 45%; height: 7px; background: var(--ma1); }
.vn-mock-glass i, .vn-mock-tiled i { background: color-mix(in srgb, var(--m0) 58%, transparent) !important; backdrop-filter: blur(6px); }
.vn-mock-glass .mv u, .vn-mock-tiled .mv u { background: color-mix(in srgb, var(--m3) 55%, transparent); }
.vn-mock-tiled { gap: 4px; padding: 4px; grid-template: 13px 1fr / 18px 1fr 42px; }
.vn-mock-tiled i { border-radius: 5px; border: 1.5px solid color-mix(in srgb, var(--ma1) 45%, transparent); }
.vn-mock-tiled .mv { border-image: linear-gradient(45deg, var(--ma1), var(--ma2)) 1; border-width: 1.5px; border-style: solid; border-radius: 0; }
.vn-mock-stock .mt, .vn-mock-stock .mn { background: var(--m2); }
.vn-pairs { display: flex; flex-wrap: wrap; gap: 10px; padding: 6px 0 18px; }
.vn-pair { width: 34px; height: 34px; border-radius: 50%; border: 2px solid transparent !important; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .12); transition: transform .15s; }
.vn-pair:hover { transform: scale(1.1); }
.vn-pair[aria-pressed="true"] { border-color: var(--u-t0) !important; }

.vn-media { display: flex; align-items: center; gap: 18px; padding: 18px 0; }
.vn-thumb { position: relative; width: 176px; height: 100px; flex: none; display: grid; place-items: center; overflow: hidden; border-radius: 12px; color: var(--u-t2);
  background: repeating-conic-gradient(color-mix(in srgb, var(--u-t0) 5%, transparent) 0 25%, transparent 0 50%) 0 0 / 16px 16px, color-mix(in srgb, var(--vn-s0) 70%, transparent); border: 1px dashed var(--u-line); }
.vn-thumb > :is(img, video) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.vn-media-info { flex: 1; min-width: 0; }
.vn-media-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 15px; font-weight: 700; color: var(--u-t0); }
.vn-media-meta { margin-top: 3px; font-size: 12.5px; color: var(--u-t2); }
.vn-media-info .vn-actions { margin-top: 12px; }
.vn-urlrow { display: flex; gap: 8px; margin-top: 10px; }
#vn-ui [hidden] { display: none !important; }
.vn-hint { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px; border-radius: 13px; font-size: 13px; color: var(--u-t1);
  background: color-mix(in srgb, var(--u-a1) 10%, transparent); border: 1px solid color-mix(in srgb, var(--u-a1) 28%, transparent); }

.vn-np { display: flex; align-items: center; gap: 18px; padding: 20px 0; }
.vn-np-art { width: 66px; height: 66px; flex: none; display: grid; place-items: center; border-radius: 16px; color: var(--vn-ac); background: linear-gradient(135deg, var(--u-a1), var(--u-a2)); box-shadow: 0 12px 30px -14px var(--u-a1); }
.vn-np-info { flex: 1; min-width: 0; }
.vn-np-title { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 18px; font-weight: 800; color: var(--u-t0); }
.vn-np-controls { display: flex; align-items: center; gap: 8px; }
.vn-np-play { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 50%; color: var(--vn-ac) !important; background: linear-gradient(135deg, var(--u-a1), var(--u-a2)) !important; box-shadow: 0 10px 24px -10px var(--u-a1); transition: transform .12s; }
.vn-np-play:active { transform: scale(.94); }
.vn-tracks { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; }
.vn-track { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 11px; transition: background .12s; }
.vn-track:hover { background: var(--u-card); }
.vn-track-n { width: 24px; display: inline-flex; justify-content: flex-end; font-size: 12.5px; font-variant-numeric: tabular-nums; color: var(--u-t2); }
.vn-track-main { flex: 1; min-width: 0; }
.vn-track-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 650; color: var(--u-t0); }
.vn-track.current .vn-track-name { color: var(--u-a1); }
.vn-track-src { font-size: 12px; color: var(--u-t2); }
.vn-track .vn-btn.icon { opacity: 0; }
.vn-track:hover .vn-btn.icon, .vn-track:focus-within .vn-btn.icon { opacity: 1; }
.vn-empty { padding: 28px 0; text-align: center; font-size: 13.5px; color: var(--u-t2); }
.vn-code { min-height: 420px; resize: vertical; tab-size: 2; font-family: 'JetBrains Mono', ui-monospace, Consolas, monospace !important; font-size: 13px !important; line-height: 1.6; }
.vn-about { display: flex; align-items: center; gap: 22px; padding: 22px 0; }
.vn-about img { width: 88px; height: 88px; filter: drop-shadow(0 12px 26px color-mix(in srgb, var(--u-a1) 55%, transparent)); }
.vn-about b { display: block; font-size: 28px; font-weight: 800; letter-spacing: -.02em; color: var(--u-t0); }
.vn-keys { display: grid; grid-template-columns: auto 1fr; gap: 10px 18px; padding: 16px 0; font-size: 13.5px; }

@media (max-width: 980px) {
  .vn-rail { width: 74px; } .vn-nav span, .vn-brand div, .vn-rail-foot { display: none; } .vn-brand { padding: 4px 4px 20px; }
  .vn-head { padding-left: 26px; } .vn-scroll { padding: 22px 26px 50px; } .vn-range-wrap { width: 220px; }
}
`;

// ---------- control builders ----------
let ui = null;
let page = 'themes';
let cleanups = [];
let lastFocus = null;

const row = (label, desc, control) => h('div', { class: 'vn-row' },
  h('div', {}, h('div', { class: 'vn-row-label' }, label), desc && h('div', { class: 'vn-row-desc' }, desc)), control);
const card = (title, ...kids) => h('section', { class: 'vn-card' }, title && h('h3', {}, title), ...kids);
const btn = (label, ico, onclick, cls = '') => h('button', { class: `vn-btn ${cls}`, html: `${ico ? icon(ico, 16) : ''}${label ? `<span>${label}</span>` : ''}`, onclick });
const iconBtn = (ico, label, onclick, disabled = false) => h('button', { class: 'vn-btn icon', 'aria-label': label, 'data-tip': label, html: icon(ico, 16), onclick, disabled });

function switchEl(get, put, label) {
  const b = h('button', { class: 'vn-switch', role: 'switch', 'aria-label': label, 'aria-checked': String(!!get()) });
  b.addEventListener('click', () => { put(!get()); b.setAttribute('aria-checked', String(!!get())); });
  return b;
}
const toggle = (key, label, desc) => row(label, desc, switchEl(() => S[key], (v) => set({ [key]: v }), label));

function slider(key, label, desc, min, max, step = 1, unit = '') {
  const out = h('output', {}, `${S[key]}${unit}`);
  const inp = h('input', { type: 'range', min, max, step, value: S[key], 'aria-label': label });
  const paint = () => inp.style.setProperty('--p', `${((inp.value - min) / (max - min)) * 100}%`);
  inp.addEventListener('input', () => { set({ [key]: Number(inp.value) }); out.textContent = `${inp.value}${unit}`; paint(); });
  paint();
  return row(label, desc, h('div', { class: 'vn-range-wrap' }, inp, out));
}

function segment(key, label, desc, options) {
  const wrap = h('div', { class: 'vn-seg', role: 'radiogroup', 'aria-label': label });
  for (const [v, l] of options) {
    wrap.append(h('button', {
      role: 'radio', 'aria-checked': String(S[key] === v), 'data-v': v,
      onclick: () => { set({ [key]: v }); for (const b of wrap.children) b.setAttribute('aria-checked', String(b.dataset.v === v)); },
    }, l));
  }
  return row(label, desc, wrap);
}

function select(key, label, desc, options) {
  const s = h('select', { 'aria-label': label, onchange: () => set({ [key]: s.value }) },
    options.map(([v, l]) => h('option', { value: v, selected: S[key] === v }, l)));
  return row(label, desc, s);
}

function colorRow(key, label, desc) {
  const pick = h('input', { type: 'color', value: S[key], 'aria-label': label });
  const text = h('input', { type: 'text', value: S[key], spellcheck: 'false', 'aria-label': `${label} hex`, maxlength: 7 });
  pick.addEventListener('input', () => { set({ [key]: pick.value }); text.value = pick.value; });
  text.addEventListener('change', () => {
    if (/^#[0-9a-f]{6}$/i.test(text.value)) { set({ [key]: text.value.toLowerCase() }); pick.value = text.value; }
    else { toast('Use a 6-digit hex color like #33ccff', 'error'); text.value = S[key]; }
  });
  return row(label, desc, h('div', { class: 'vn-color' }, pick, text));
}

function mediaPicker(key, { label, accept, kinds }) {
  const box = h('div', { class: 'vn-media' });
  const replace = async (next) => {
    const old = S[key];
    set({ [key]: next });
    if (old && old.id !== next?.id) await media.remove(old);
    draw();
    toast(next ? `${label}: ${next.name}` : `${label} removed`);
  };
  const choose = async () => {
    const [f] = await pickFiles(accept);
    if (!f) return;
    if (!kinds.includes(mediaKind(f))) return toast(`That file isn't a supported ${kinds.join(' or ')}`, 'error');
    toast(`Importing ${f.name} (${fmtSize(f.size)})…`);
    try { await replace(await media.add(f)); } catch (e) { toast(`Import failed: ${e.message}`, 'error'); }
  };
  async function draw() {
    const src = S[key];
    const thumb = h('div', { class: 'vn-thumb', html: src ? '' : icon('upload', 26) });
    if (src) {
      media.url(src).then((url) => thumb.append(mediaKind(src) === 'video'
        ? h('video', { src: url, muted: true, autoplay: true, loop: true, playsInline: true })
        : h('img', { src: url, alt: '' }))).catch(() => { thumb.innerHTML = icon('x', 24); });
    }
    const urlInput = h('input', { type: 'url', placeholder: 'https://example.com/clip.mp4', 'aria-label': `${label} link` });
    const urlRow = h('form', {
      class: 'vn-urlrow', hidden: true,
      onsubmit: (e) => {
        e.preventDefault();
        try {
          const s = urlSource(urlInput.value);
          if (!kinds.includes(mediaKind(s))) throw new Error(`Link must point to a ${kinds.join(' or ')} file`);
          replace(s);
        } catch (err) { toast(err.message, 'error'); }
      },
    }, urlInput, h('button', { class: 'vn-btn primary', type: 'submit' }, 'Use link'));
    const meta = src
      ? `${mediaKind(src)} · ${src.kind === 'file' ? `local file · ${fmtSize(src.size ?? 0)}` : new URL(src.url).host}`
      : `Choose a file or paste a direct link (${kinds.join(', ')}).`;
    box.replaceChildren(thumb, h('div', { class: 'vn-media-info' },
      h('div', { class: 'vn-media-name' }, src ? src.name : `No ${label.toLowerCase()} set`),
      h('div', { class: 'vn-media-meta' }, meta),
      h('div', { class: 'vn-actions' },
        btn('Choose file', 'upload', choose, 'primary'),
        btn('Use link', 'link', () => { urlRow.hidden = !urlRow.hidden; if (!urlRow.hidden) urlInput.focus(); }),
        src && btn('Remove', 'trash', () => replace(null), 'danger')),
      urlRow));
  }
  draw();
  return box;
}

function themeMock(t) {
  const auto = t.palette === 'auto'; // previews your actual wallpaper and the colors taken from it
  const p = (auto ? S['auto.palette'] : PALETTES[t.palette]) ?? PALETTES.modrinth;
  const a1 = auto ? (S['auto.palette'] ? S.accent : '#c792ea') : t.accent;
  const a2 = auto ? (S['auto.palette'] ? S.accent2 : '#82aaff') : t.accent2;
  const wall = auto && wallpaperUrl();
  return h('div', {
    class: `vn-mock vn-mock-${auto && S.layout === 'tiled' ? 'tiled' : t.layout}`, 'aria-hidden': 'true',
    style: { '--m0': p.s[0], '--m2': p.s[2], '--m3': p.s[3], '--ma1': a1, '--ma2': a2, ...(wall && { background: `center / cover url("${wall}")` }) },
  }, h('i', { class: 'mt' }), h('i', { class: 'mn' }), h('i', { class: 'mv' }, h('u'), h('u'), h('u'), h('u')), h('i', { class: 'ms' }));
}

// ---------- pages ----------
const PAGE_RENDER = {
  themes() {
    const pairs = h('div', { class: 'vn-pairs', role: 'group', 'aria-label': 'Accent presets' }, ACCENT_PAIRS.map(([a, b]) => h('button', {
      class: 'vn-pair', style: { background: `linear-gradient(135deg, ${a} 0 50%, ${b} 50% 100%)` }, 'aria-label': `Accent ${a} and ${b}`, 'data-tip': `${a} · ${b}`,
      'aria-pressed': String(S.accent === a && S.accent2 === b), onclick: () => { set({ accent: a, accent2: b }); render(); },
    })));
    return [
      h('div', { class: 'vn-themes' }, Object.entries(THEMES).map(([id, t]) => h('button', {
        class: 'vn-theme', 'aria-pressed': String(S.theme === id), onclick: () => { applyPreset(id); render(); toast(`${t.name} applied`); },
      }, themeMock(t), h('b', {}, t.name), h('span', {}, t.desc)))),
      card('Accent colors',
        colorRow('accent', 'Primary accent', 'Buttons, links, highlights and the active window border.'),
        colorRow('accent2', 'Secondary accent', 'Second stop of every gradient.'),
        pairs),
    ];
  },
  look() {
    return [
      card('Layout',
        segment('layout', 'Layout', 'Tiled floats every panel as its own window. Glass frosts them edge to edge. Flat keeps them solid.', [['stock', 'Stock'], ['flat', 'Flat'], ['glass', 'Glass'], ['tiled', 'Tiled']]),
        select('palette', 'Color palette', 'Surface and text colors used everywhere, including menus and dialogs.', [...Object.entries(PALETTES).map(([k, p]) => [k, p.name]), ['auto', 'From wallpaper']])),
      card('Glass & windows',
        slider('opacity', 'Panel opacity', 'Lower shows more of your background.', 15, 100, 1, '%'),
        slider('blur', 'Blur', 'How frosted the glass is.', 0, 40, 1, 'px'),
        slider('radius', 'Corner radius', 'Roundness of windows and panels.', 0, 28, 1, 'px'),
        slider('gap', 'Window gaps', 'Space between tiled windows.', 0, 24, 1, 'px'),
        slider('border', 'Border width', 'Gradient border around tiled windows. 0 turns it off.', 0, 5, 1, 'px'),
        toggle('animBorder', 'Animated borders', 'The hovered window\'s gradient border spins, like Hyprland\'s borderangle animation.')),
      card('Arrangement',
        row('Arrange layout', 'Drag windows to move them and drag edges or corners to resize. In Tiled, edges are always draggable in the gaps. Shortcut: Ctrl+Shift+L.',
          btn('Arrange', 'blocks', () => { closeUI(); setTimeout(enterArrange, 240); }, 'primary')),
        segment('pos.nav', 'Navigation bar', 'Side of the window the nav bar sits on.', [['left', 'Left'], ['right', 'Right']]),
        segment('pos.title', 'Title bar', 'Top or bottom of the window.', [['top', 'Top'], ['bottom', 'Bottom']]),
        segment('pos.sidebar', 'Sidebar', 'Side of the main view the sidebar sits on.', [['left', 'Left'], ['right', 'Right']]),
        slider('size.sidebar', 'Sidebar width', 'Moving or resizing the sidebar also hides the sidebar ad, since Modrinth draws it at a fixed spot on the window.', 240, 560, 4, 'px'),
        slider('size.nav', 'Nav bar width', '', 56, 104, 2, 'px'),
        slider('size.title', 'Title bar height', '', 40, 76, 2, 'px'),
        row('Reset arrangement', 'Back to Modrinth\'s positions and sizes.', btn('Reset', 'refresh', () => { set({ ...ARRANGE_DEFAULTS }); settlePanels(); render(); }))),
      card('Window',
        segment('controls', 'Window buttons', 'Style of minimize, maximize and close.', [['default', 'Default'], ['minimal', 'Minimal'], ['traffic', 'Traffic lights']]),
        toggle('window.resize', 'Resize from edges', 'Drag any window edge or corner to resize Modrinth. The app blocks this itself, so the loader does it.')),
      card('Typography & motion',
        select('font', 'Font', 'Loaded from Google Fonts on first use.', Object.entries(FONTS).map(([k, [n]]) => [k, n])),
        toggle('motion', 'Window animations', 'Windows pop in at launch and pages slide in when you navigate.'),
        toggle('float', 'Floating cards', 'Instance cards drift and glow in your accent on hover.')),
    ];
  },
  background() {
    const out = [];
    if (!['glass', 'tiled'].includes(S.layout)) {
      out.push(h('div', { class: 'vn-hint' }, h('span', {}, 'Backgrounds show through the Glass and Tiled layouts.'),
        btn('Switch to Glass', null, () => { set({ layout: 'glass' }); render(); }, 'primary')));
    }
    out.push(card(null,
      mediaPicker('bg.src', { label: 'Background', accept: 'image/*,video/*,.gif,.webp,.mp4,.webm', kinds: ['image', 'video'] }),
      slider('bg.dim', 'Dim', 'Darkens the background so text stays readable.', 0, 85, 1, '%'),
      slider('bg.volume', 'Video sound', 'Background videos stay muted at 0.', 0, 100, 1, '%'),
      toggle('game.pause', 'Pause while playing', 'Stops background video and music while Minecraft is running, to save performance.')));
    return out;
  },
  loading() {
    return [card(null,
      mediaPicker('load.src', { label: 'Loading screen', accept: 'image/*,video/*,.gif,.mp4,.webm', kinds: ['image', 'video'] }),
      segment('load.mode', 'Duration', 'Keep it up until Modrinth finishes loading, or let a video play to the end.', [['ready', 'Until ready'], ['full', 'Whole video']]),
      segment('load.fit', 'Fit', 'Fill crops to the window, Fit shows the whole frame.', [['cover', 'Fill'], ['contain', 'Fit']]),
      slider('load.min', 'Minimum time', 'Stays at least this long, even when the app is ready sooner.', 0, 15, 0.5, 's'),
      slider('load.volume', 'Video sound', '0 plays the video muted.', 0, 100, 1, '%'),
      row('Preview', 'Shows the loading screen now. Click or press Esc to dismiss.',
        h('button', { class: 'vn-btn', html: `${icon('eye', 16)}<span>Preview</span>`, disabled: !S['load.src'], onclick: () => { closeUI(); setTimeout(() => startLoadingScreen({ preview: true }), 260); } })))];
  },
  music() {
    const np = h('div', { class: 'vn-np' });
    const drawNp = () => {
      const t = currentTrack();
      const playing = !music.audio.paused;
      const status = music.pausedByGame ? 'Paused while Minecraft is running' : t ? (playing ? 'Now playing' : 'Paused') : S['music.list'].length ? 'Press play to start' : 'Add some tracks below';
      np.replaceChildren(
        h('div', { class: 'vn-np-art', html: icon('music', 28) }),
        h('div', { class: 'vn-np-info' }, h('div', { class: 'vn-np-title' }, t ? trackName(t) : 'Nothing playing'), h('div', { class: 'vn-row-desc' }, status)),
        h('div', { class: 'vn-np-controls' },
          iconBtn('prev', 'Previous track', prevTrack, !S['music.list'].length),
          h('button', { class: 'vn-np-play', 'aria-label': playing ? 'Pause' : 'Play', html: icon(playing ? 'pause' : 'play', 20), onclick: togglePlay, disabled: !S['music.list'].length }),
          iconBtn('next', 'Next track', nextTrack, !S['music.list'].length)));
    };
    const list = h('div', { class: 'vn-tracks' });
    const drawList = () => {
      const L = S['music.list'];
      list.replaceChildren(...(L.length ? L.map((t, i) => h('div', { class: `vn-track${i === music.index ? ' current' : ''}` },
        h('span', { class: 'vn-track-n' }, i === music.index && !music.audio.paused ? eqBars(true) : String(i + 1)),
        h('div', { class: 'vn-track-main' }, h('div', { class: 'vn-track-name' }, trackName(t)),
          h('div', { class: 'vn-track-src' }, t.kind === 'file' ? `Local file · ${fmtSize(t.size ?? 0)}` : new URL(t.url).host)),
        iconBtn('play', `Play ${t.name}`, () => playTrack(i)),
        iconBtn('up', 'Move up', () => moveTrack(i, -1), i === 0),
        iconBtn('down', 'Move down', () => moveTrack(i, 1), i === L.length - 1),
        iconBtn('trash', `Remove ${t.name}`, () => removeTrack(i))))
        : [h('div', { class: 'vn-empty' }, 'No tracks yet. Add MP3s, other audio, MP4s or direct links.')]));
    };
    const redraw = () => { drawNp(); drawList(); };
    music.subs.add(redraw);
    cleanups.push(() => music.subs.delete(redraw));
    redraw();

    const urlInput = h('input', { type: 'url', placeholder: 'https://example.com/track.mp3', 'aria-label': 'Track link' });
    const urlRow = h('form', {
      class: 'vn-urlrow', hidden: true,
      onsubmit: (e) => {
        e.preventDefault();
        try { const s = urlSource(urlInput.value); addTracks([s]); urlInput.value = ''; toast(`Added ${s.name}`); } catch (err) { toast(err.message, 'error'); }
      },
    }, urlInput, h('button', { class: 'vn-btn primary', type: 'submit' }, 'Add'));
    const addFiles = async () => {
      const files = (await pickFiles('audio/*,video/mp4,video/webm,.mp3,.ogg,.wav,.flac,.m4a,.opus,.mp4', true)).filter((f) => ['audio', 'video'].includes(mediaKind(f)));
      if (!files.length) return;
      toast(`Importing ${files.length} file${files.length > 1 ? 's' : ''}…`);
      try { addTracks(await Promise.all(files.map((f) => media.add(f)))); } catch (e) { toast(`Import failed: ${e.message}`, 'error'); }
    };
    return [
      card('Now playing', np, slider('music.volume', 'Volume', 'Scroll over the mini player in the title bar to change it from anywhere.', 0, 100, 1, '%')),
      card('Playlist', list, h('div', { class: 'vn-block' }, h('div', { class: 'vn-actions' },
        btn('Add files', 'upload', addFiles, 'primary'), btn('Add link', 'link', () => { urlRow.hidden = !urlRow.hidden; if (!urlRow.hidden) urlInput.focus(); })), urlRow)),
      card('Playback',
        toggle('music.shuffle', 'Shuffle', 'Pick the next track at random.'),
        toggle('music.autoplay', 'Play on launch', 'Start the playlist when the launcher opens.'),
        toggle('music.player', 'Mini player', 'Controls and the current track in the title bar.'),
        toggle('game.pause', 'Pause while playing', 'Pauses music while Minecraft is running and resumes when you quit.')),
    ];
  },
  declutter() {
    return [
      card('Sidebar',
        toggle('hide.news', 'Hide news', 'Removes the News feed from the right sidebar.'),
        toggle('hide.ads', 'Hide ad', 'Hides the ad square, the purple "Upgrade to Modrinth+" button above it, and the separate ad window the app draws over the sidebar.'),
        toggle('hide.plus', 'Hide Modrinth+ upsell', 'Removes the "Upgrade to Modrinth+" link.'),
        toggle('hide.signin', 'Hide sign-in prompt', 'Removes the "Sign in to a Modrinth account" box.'),
        toggle('hide.sidebar', 'Hide the whole sidebar', 'Removes the right panel and gives the space to the main view. Also hides the ad.')),
      card('Navigation bar',
        toggle('hide.discover', 'Hide Discover', 'The browse-content button.'),
        toggle('hide.skins', 'Hide Skins', 'The skin manager button.'),
        toggle('hide.screenshots', 'Hide Screenshots', 'The screenshots button.'),
        toggle('hide.hosting', 'Hide Hosting', 'The Modrinth server-hosting button.')),
      card('Privacy',
        toggle('streamer', 'Streamer mode', 'Blurs your Minecraft account name and avatar until you hover them.')),
    ];
  },
  plugins() {
    const rows = PLUGINS.map((p) => row(p.name, p.desc || 'No description.',
      switchEl(() => S.plugins[p.name] !== false, (v) => set({ plugins: { ...S.plugins, [p.name]: v } }), p.name)));
    return [
      h('div', { class: 'vn-hint' }, h('span', {}, 'Plugins load when the app starts. Turning one on or off applies after a reload.'), btn('Reload app', 'refresh', () => location.reload(), 'primary')),
      card('Installed', ...(rows.length ? rows : [h('div', { class: 'vn-empty' }, 'No plugins yet. Drop .js files into the plugins folder next to the loader.')])),
      card('Writing a plugin', h('div', { class: 'vn-block vn-row-desc', style: { maxWidth: 'none' } },
        'Each plugins/*.js file runs after the page loads with MRMod in scope: get(key), set(patch), onChange(fn), addStyle(css), invoke(command, args), toast(message), open(page). Run the loader with --watch to reload on save.')),
    ];
  },
  css() {
    let t;
    const ta = h('textarea', { class: 'vn-code', spellcheck: 'false', 'aria-label': 'Custom CSS', placeholder: '/* Applied live. Example: */\n.app-grid-navbar { border-right: 2px solid var(--vn-a1); }' });
    ta.value = S.css;
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => set({ css: ta.value }), 250); });
    ta.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    });
    return [card(null, h('div', { class: 'vn-block' }, ta)),
      card('Useful variables', h('div', { class: 'vn-block vn-row-desc', style: { maxWidth: 'none' } },
        '--vn-a1 / --vn-a2 accents, --vn-s0…s4 surfaces, --vn-t0…t2 text, --vn-r radius, --vn-gap gaps. App panels: .app-grid-navbar, .app-title-bar, .app-viewport, .app-sidebar.'))];
  },
  about() {
    const io = h('textarea', { class: 'vn-code', style: { minHeight: '150px' }, spellcheck: 'false', 'aria-label': 'Settings JSON', placeholder: 'Paste exported settings here, then press Import.' });
    let armed = false;
    const reset = btn('Reset everything', 'trash', async () => {
      if (!armed) { armed = true; reset.querySelector('span').textContent = 'Click again to confirm'; return; }
      for (const src of [S['bg.src'], S['load.src'], ...S['music.list']]) await media.remove(src);
      music.audio.pause();
      set({ ...DEFAULTS });
      toast('Everything reset to defaults');
      render();
    }, 'danger');
    return [
      card(null, h('div', { class: 'vn-about' }, h('img', { src: LOGO_URL, alt: '' }),
        h('div', {}, h('b', {}, BRAND), h('div', { class: 'vn-row-desc' }, `Version ${VERSION} · a client mod for the Modrinth App. Runs inside the launcher, never touches your files or the app install.`)))),
      card('Shortcuts', h('div', { class: 'vn-keys' },
        h('kbd', {}, 'Ctrl+Shift+M'), h('span', {}, 'Open or close these settings'),
        h('kbd', {}, 'Esc'), h('span', {}, 'Close settings, skip the loading screen'),
        h('kbd', {}, 'Scroll'), h('span', {}, 'Over the mini player: change music volume'))),
      card('Backup',
        h('div', { class: 'vn-block' }, io, h('div', { class: 'vn-actions', style: { marginTop: '12px' } },
          btn('Copy settings', 'archive', async () => {
            const json = JSON.stringify(S, null, 2);
            io.value = json;
            try { await navigator.clipboard.writeText(json); toast('Settings copied to the clipboard'); } catch { io.select(); toast('Copy the selected text'); }
          }),
          btn('Import', 'upload', () => {
            try {
              const data = JSON.parse(io.value);
              if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not a settings object');
              const patch = Object.fromEntries(Object.entries(data).filter(([k]) => k in DEFAULTS));
              set(patch);
              toast(`Imported ${Object.keys(patch).length} settings`);
              render();
            } catch (e) { toast(`Import failed: ${e.message}`, 'error'); }
          }, 'primary')),
        h('div', { class: 'vn-row-desc', style: { marginTop: '10px' } }, 'Local media files stay on this PC and aren\'t part of the export; links are.')),
        row('Reset', 'Restores every setting and deletes imported media files.', reset)),
    ];
  },
};

// ---------- shell ----------
function buildUI() {
  css('vn-ui-css', UI_CSS);
  const rail = h('nav', { class: 'vn-rail', 'aria-label': `${BRAND} sections` },
    h('div', { class: 'vn-brand' }, h('img', { src: LOGO_URL, alt: '' }), h('div', {}, h('b', {}, BRAND), h('small', {}, `v${VERSION} · Modrinth mod`))),
    PAGES.map((p) => h('button', { class: 'vn-nav', 'data-page': p.id, html: `${icon(p.icon, 18)}<span>${p.label}</span>`, onclick: () => { page = p.id; render(); } })),
    h('div', { class: 'vn-rail-foot', html: '<kbd>Ctrl+Shift+M</kbd> toggles this screen' }));
  const main = h('div', { class: 'vn-main' },
    h('header', { class: 'vn-head', 'data-tauri-drag-region': '' },
      h('div', { 'data-tauri-drag-region': '' }, h('h1', {}), h('p', {})),
      h('button', { class: 'vn-close', 'aria-label': 'Close settings', html: icon('x', 20), onclick: closeUI })),
    h('div', { class: 'vn-scroll' }));
  ui = h('div', { id: 'vn-ui', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${BRAND} settings`, hidden: true }, rail, main);
  ui.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeUI(); }
    if (e.key !== 'Tab') return;
    const f = [...ui.querySelectorAll('button:not(:disabled), input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });
  document.body.append(ui);
}

function render() {
  if (!ui) return;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  const p = PAGES.find((x) => x.id === page) ?? PAGES[0];
  ui.querySelectorAll('.vn-nav').forEach((b) => (b.dataset.page === p.id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  $('.vn-head h1', ui).textContent = p.label;
  $('.vn-head p', ui).textContent = p.sub;
  const scroll = $('.vn-scroll', ui);
  const top = scroll.dataset.page === p.id ? scroll.scrollTop : 0; // keep position when re-rendering the same page
  scroll.replaceChildren(h('div', { class: 'vn-page' }, PAGE_RENDER[p.id]()));
  scroll.dataset.page = p.id;
  scroll.scrollTop = top;
}

function openUI(p) {
  if (!ui) buildUI();
  if (p) page = p;
  render();
  if (!ui.hidden) return;
  lastFocus = document.activeElement;
  ui.hidden = false;
  holdAdsForUI(true);
  requestAnimationFrame(() => { ui.classList.add('open'); $('.vn-nav[aria-current]', ui)?.focus(); });
}
function closeUI() {
  if (!ui || ui.hidden) return;
  ui.classList.remove('open');
  cleanups.forEach((fn) => fn());
  cleanups = [];
  holdAdsForUI(false);
  setTimeout(() => { ui.hidden = true; }, 220);
  lastFocus?.focus?.();
}
const toggleUI = () => (ui && !ui.hidden ? closeUI() : openUI());

// The logo button in the app's nav bar: a clone of a real nav button keeps the app's scoped (data-v-*) styles.
let navBtn = null;
function navButton() {
  if (navBtn) return navBtn;
  const ref = $('.app-grid-navbar > button.nav-button');
  if (!ref) return null;
  navBtn = ref.cloneNode(false);
  navBtn.id = 'vn-navbtn';
  navBtn.type = 'button';
  navBtn.dataset.tip = `${BRAND} settings`;
  navBtn.dataset.tipKey = 'Ctrl+Shift+M';
  navBtn.setAttribute('aria-label', `${BRAND} settings`);
  navBtn.replaceChildren(h('img', { src: LOGO_URL, alt: '' }));
  navBtn.addEventListener('click', () => openUI());
  return navBtn;
}
