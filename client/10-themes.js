// Themes: palettes, presets and the layout engine (stock / flat / glass / tiled).
// s = surfaces from darkest (app background) to lightest (dividers), t = text primary / default / muted.
const PALETTES = {
  modrinth: { name: 'Modrinth', s: ['#16181c', '#1d1f23', '#27292e', '#34363c', '#42444a'], t: ['#ffffff', '#b0bac5', '#96a2b0'] },
  hypr: { name: 'Hypr Night', s: ['#0b0e14', '#121620', '#1a2030', '#252d40', '#323c52'], t: ['#eef4ff', '#b7c3d4', '#8593a8'] },
  cachy: { name: 'Cachy Teal', s: ['#0b1113', '#10191c', '#172327', '#203034', '#2c4046'], t: ['#e8f6f4', '#b1cbc8', '#7f9e9a'] },
  mocha: { name: 'Catppuccin Mocha', s: ['#181825', '#1e1e2e', '#313244', '#45475a', '#585b70'], t: ['#cdd6f4', '#bac2de', '#a6adc8'] },
  tokyo: { name: 'Tokyo Night', s: ['#16161e', '#1a1b26', '#24283b', '#2f354f', '#414868'], t: ['#c0caf5', '#a9b1d6', '#7982a9'] },
  nord: { name: 'Nord', s: ['#242933', '#2e3440', '#3b4252', '#434c5e', '#4c566a'], t: ['#eceff4', '#d8dee9', '#a3abb9'] },
  rose: { name: 'Rosé Pine', s: ['#191724', '#1f1d2e', '#26233a', '#2f2b45', '#403d52'], t: ['#e0def4', '#c5c2dc', '#908caa'] },
  amoled: { name: 'AMOLED', s: ['#000000', '#08080a', '#111114', '#1b1b1f', '#2a2a30'], t: ['#ffffff', '#bcbcbc', '#8a8a8a'] },
};

const THEMES = {
  hyprland: { name: 'Hyprland', desc: 'Tiled windows, gaps, spinning gradient borders', layout: 'tiled', palette: 'hypr', accent: '#33ccff', accent2: '#00ff99', opacity: 62, blur: 18, radius: 12, gap: 10, border: 2, animBorder: true, font: 'jetbrains', controls: 'minimal' },
  cachyos: { name: 'CachyOS', desc: 'Dark teal rice, tight gaps, crisp borders', layout: 'tiled', palette: 'cachy', accent: '#00d4a8', accent2: '#1793d1', opacity: 80, blur: 24, radius: 8, gap: 7, border: 2, animBorder: false, font: 'inter', controls: 'minimal' },
  glass: { name: 'Liquid Glass', desc: 'Frosted full-bleed panels over your wallpaper', layout: 'glass', palette: 'modrinth', accent: '#00ffcc', accent2: '#7c5cff', opacity: 55, blur: 20, radius: 16, gap: 10, border: 1, animBorder: false, font: 'default', controls: 'default' },
  mocha: { name: 'Catppuccin', desc: 'Mocha palette, soft floating windows', layout: 'tiled', palette: 'mocha', accent: '#cba6f7', accent2: '#f5c2e7', opacity: 86, blur: 20, radius: 14, gap: 9, border: 2, animBorder: false, font: 'nunito', controls: 'traffic' },
  tokyo: { name: 'Tokyo Night', desc: 'Neon blues on deep navy glass', layout: 'glass', palette: 'tokyo', accent: '#7aa2f7', accent2: '#bb9af7', opacity: 78, blur: 22, radius: 12, gap: 10, border: 1, animBorder: false, font: 'jetbrains', controls: 'minimal' },
  rose: { name: 'Rosé Pine', desc: 'Muted rose and iris, all natural pine', layout: 'tiled', palette: 'rose', accent: '#ebbcba', accent2: '#c4a7e7', opacity: 84, blur: 18, radius: 16, gap: 10, border: 2, animBorder: false, font: 'grotesk', controls: 'traffic' },
  nord: { name: 'Nord', desc: 'Arctic flat panels, no transparency', layout: 'flat', palette: 'nord', accent: '#88c0d0', accent2: '#81a1c1', opacity: 100, blur: 0, radius: 10, gap: 10, border: 1, animBorder: false, font: 'inter', controls: 'minimal' },
  amoled: { name: 'AMOLED', desc: 'True black for OLED panels', layout: 'flat', palette: 'amoled', accent: '#00ffcc', accent2: '#00ffcc', opacity: 100, blur: 0, radius: 12, gap: 10, border: 1, animBorder: false, font: 'default', controls: 'minimal' },
  auto: { name: 'Wallpaper', desc: 'Colors picked from your background, like pywal', layout: 'glass', palette: 'auto' },
  stock: { name: 'Stock', desc: 'Modrinth exactly as shipped', layout: 'stock', palette: 'modrinth', accent: '#1bd96a', accent2: '#1bd96a', controls: 'default', font: 'default' },
};
const PRESET_KEYS = ['layout', 'palette', 'accent', 'accent2', 'opacity', 'blur', 'radius', 'gap', 'border', 'animBorder', 'font', 'controls'];
function applyPreset(id) {
  if (id === 'auto') { // colors only: keep the user's layout, as long as it shows the wallpaper
    return set({ theme: 'auto', palette: 'auto', ...(['glass', 'tiled'].includes(S.layout) ? {} : { layout: 'glass' }) }); // colors are read by the palette listener in 30-media
  }
  const t = THEMES[id];
  const patch = { theme: id };
  for (const k of PRESET_KEYS) if (k in t) patch[k] = t[k];
  set(patch);
}
const currentPalette = () => (S.palette === 'auto' ? S['auto.palette'] : PALETTES[S.palette]) ?? PALETTES.modrinth;

// ---------- Wallpaper theme: derive accents and a tinted palette from an image or video frame ----------
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function hslHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}`;
}
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Throws a SecurityError when the source is a cross-origin image without CORS (canvas gets tainted).
function extractPalette(source) {
  const N = 48;
  const c = h('canvas', { width: N, height: N });
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(source, 0, 0, N, N);
  const px = g.getImageData(0, 0, N, N).data;
  const buckets = new Map();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const [hh, ss, ll] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
    const key = `${Math.round(hh / 15)}|${Math.round(ss * 4)}|${Math.round(ll * 5)}`;
    const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += px[i]; b.g += px[i + 1]; b.b += px[i + 2];
    buckets.set(key, b);
  }
  const colors = [...buckets.values()].map((b) => { const [hh, ss, ll] = rgbToHsl(b.r / b.n, b.g / b.n, b.b / b.n); return { h: hh, s: ss, l: ll, n: b.n }; });
  if (!colors.length) throw new Error('The background has no visible pixels');
  // Accents: frequent and vivid, not too dark or washed out. Surfaces: tinted by the most common color.
  const vivid = (x) => Math.sqrt(x.n) * x.s * (1 - Math.abs(x.l - 0.58) * 1.5);
  const ranked = colors.filter((x) => x.s > 0.22 && x.l > 0.2 && x.l < 0.88).sort((a, b) => vivid(b) - vivid(a));
  const dominant = colors.reduce((a, b) => (b.n > a.n ? b : a));
  const a1 = ranked[0];
  const a2 = a1 && (ranked.find((x) => hueDist(x.h, a1.h) > 35) ?? { h: (a1.h + 40) % 360, s: a1.s });
  const accent = a1 ? hslHex(a1.h, clamp(a1.s, 0.55, 0.95), 0.64) : '#c8d0dc'; // grayscale art gets neutral accents
  const accent2 = a2 ? hslHex(a2.h, clamp(a2.s, 0.55, 0.95), 0.62) : '#8a96a8';
  const baseHue = dominant.s > 0.08 ? dominant.h : a1?.h ?? 220;
  const baseSat = dominant.s > 0.08 ? clamp(dominant.s * 0.45, 0.08, 0.32) : 0.06;
  return {
    accent, accent2,
    palette: { name: 'Wallpaper', s: [0.06, 0.09, 0.13, 0.18, 0.25].map((l) => hslHex(baseHue, baseSat, l)), t: [hslHex(baseHue, 0.3, 0.95), hslHex(baseHue, 0.16, 0.78), hslHex(baseHue, 0.12, 0.62)] },
  };
}

const FONTS = {
  default: ['App default', null],
  inter: ['Inter', 'Inter:wght@400;500;600;700'],
  jetbrains: ['JetBrains Mono', 'JetBrains+Mono:wght@400;500;600;700'],
  grotesk: ['Space Grotesk', 'Space+Grotesk:wght@400;500;600;700'],
  nunito: ['Nunito', 'Nunito:wght@400;600;700;800'],
  outfit: ['Outfit', 'Outfit:wght@400;500;600;700'],
  pixel: ['Pixelify Sans', 'Pixelify+Sans:wght@400;500;600;700'],
};

const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(v) ? v : fallback);
function contrastText(color) {
  const n = parseInt(color.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#000000' : '#ffffff';
}

const THEME_CSS = `
@property --vn-angle { syntax: '<angle>'; inherits: true; initial-value: 45deg; }
@keyframes vn-spin { from { --vn-angle: 0deg; } to { --vn-angle: 360deg; } }
@keyframes vn-pop { from { opacity: 0; transform: scale(.975) translateY(8px); } }
@keyframes vn-in { from { opacity: 0; transform: translateY(12px); } }
@keyframes vn-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

/* ---------- palette + accent (any layout except stock) ---------- */
html.vn-on {
  --surface-1: var(--vn-s0) !important; --surface-1-5: color-mix(in srgb, var(--vn-s0), var(--vn-s1)) !important;
  --surface-2: var(--vn-s1) !important; --surface-2-5: color-mix(in srgb, var(--vn-s1), var(--vn-s2)) !important;
  --surface-3: var(--vn-s2) !important; --surface-4: var(--vn-s3) !important; --surface-5: var(--vn-s4) !important;
  --color-text-primary: var(--vn-t0) !important; --color-text-default: var(--vn-t1) !important; --color-text-tertiary: var(--vn-t2) !important;
  --color-brand: var(--vn-a1) !important;
  --color-brand-highlight: color-mix(in srgb, var(--vn-a1) 22%, transparent) !important;
  --color-brand-shadow: color-mix(in srgb, var(--vn-a1) 65%, transparent) !important;
  --color-accent-contrast: var(--vn-ac) !important;
  --brand-gradient-border: color-mix(in srgb, var(--vn-a1) 14%, transparent) !important;
  --brand-gradient-bg: linear-gradient(0deg, transparent, color-mix(in srgb, var(--vn-a1) 7%, transparent)) !important;
  --vn-panel: color-mix(in srgb, var(--vn-s0) var(--vn-op), transparent);
  --vn-line: color-mix(in srgb, var(--vn-t0) 9%, transparent);
}
html.vn-on ::selection { background: color-mix(in srgb, var(--vn-a1) 40%, transparent); }
html.vn-font :is(body, button, input, select, textarea) { font-family: var(--vn-font), system-ui, sans-serif !important; }

/* ---------- wallpaper layer (glass + tiled) ---------- */
#vn-bg { position: fixed; inset: 0; z-index: -1; display: none; overflow: hidden; pointer-events: none;
  background: radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--vn-a1) 30%, transparent), transparent 55%),
    radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--vn-a2) 26%, transparent), transparent 55%), var(--vn-s0); }
html:is(.vn-glass, .vn-tiled) #vn-bg { display: block; }
#vn-bg > :is(img, video) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
#vn-bg::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / var(--vn-dim)); }

/* ---------- glass + tiled: translucent panels ---------- */
html:is(.vn-glass, .vn-tiled) :is(body, .app-grid-layout, .app-contents) { background: transparent !important; }
html:is(.vn-glass, .vn-tiled) :is(.app-grid-navbar, .app-title-bar, .app-sidebar, .app-viewport) {
  background: var(--vn-panel) !important; backdrop-filter: blur(var(--vn-blur)) saturate(170%);
}
html:is(.vn-glass, .vn-tiled) :is(.app-viewport, .app-sidebar) {
  --surface-2: color-mix(in srgb, var(--vn-s1) 40%, transparent); --surface-2-5: color-mix(in srgb, var(--vn-s2) 42%, transparent);
  --surface-3: color-mix(in srgb, var(--vn-s2) 50%, transparent); --surface-4: color-mix(in srgb, var(--vn-s3) 62%, transparent);
  --color-raised-bg: var(--surface-3); --color-button-bg: var(--surface-4);
}
html.vn-glass:not(.vn-custom-pos) .app-viewport { border-top-left-radius: var(--vn-r); }
html.vn-glass .app-title-bar { box-shadow: inset 0 -1px var(--vn-line); }
html.vn-glass .app-grid-navbar { box-shadow: inset -1px 0 var(--vn-line); }
html.vn-glass .app-sidebar { box-shadow: inset 1px 0 var(--vn-line); }

/* ---------- flat: solid palette, rounded content ---------- */
html.vn-flat:not(.vn-custom-pos) .app-contents { border-top-left-radius: var(--vn-r) !important; }

/* ---------- arrangement: panel positions and sizes (all themed layouts; values computed in applyTheme) ---------- */
html.vn-on .app-grid-layout { grid-template: var(--vn-gt) !important; }
html.vn-on .app-grid-navbar { width: var(--vn-nw); align-items: center; }
html.vn-on .app-title-bar { height: var(--vn-th); min-height: 0; }
html.vn-on .app-contents { left: var(--vn-cl) !important; right: var(--vn-cr) !important; top: var(--vn-ct) !important; width: auto !important; height: var(--vn-ch) !important; }
html.vn-on .app-contents.sidebar-enabled { grid-template-columns: var(--vn-cols) !important; }
html.vn-on .app-sidebar { width: var(--vn-sw) !important; height: auto !important; margin: 0 !important; }
html.vn-side-left .app-sidebar { order: -1; }
html.vn-on body > section.fixed.top-0.right-0 { height: var(--vn-th); }
html.vn-title-bottom body > section.fixed.top-0.right-0 { top: auto !important; bottom: var(--vn-g); }
html.vn-glass.vn-side-left .app-sidebar { box-shadow: inset -1px 0 var(--vn-line); }
html.vn-glass.vn-nav-right .app-grid-navbar { box-shadow: inset 1px 0 var(--vn-line); }
html.vn-glass.vn-title-bottom .app-title-bar { box-shadow: inset 0 1px var(--vn-line); }

/* ---------- tiled: every panel is a floating window (Hyprland / CachyOS) ---------- */
html.vn-tiled .app-title-bar { margin: var(--vn-tm); border-radius: var(--vn-r); }
html.vn-tiled .app-grid-navbar { margin: var(--vn-nm); border-radius: var(--vn-r); padding-top: 8px !important; }
html.vn-tiled .app-contents { border-radius: 0 !important; column-gap: var(--vn-gap); grid-template-rows: minmax(0, 1fr) !important; }
html.vn-tiled :is(.app-viewport, .app-sidebar) { border-radius: var(--vn-r); }
html.vn-tiled .app-sidebar { overflow: hidden; }
html.vn-tiled body > section.fixed.top-0.right-0 { top: var(--vn-gap) !important; right: var(--vn-gap) !important; background: transparent !important; border-radius: 0 var(--vn-r) 0 0 !important; }
html.vn-tiled.vn-title-bottom body > section.fixed.top-0.right-0 { top: auto !important; border-radius: 0 0 var(--vn-r) 0 !important; }
/* window borders: masked rings drawn over each window (the viewport scrolls, so its ring lives on .app-contents) */
html.vn-tiled :is(.app-title-bar, .app-grid-navbar)::after,
html.vn-tiled .app-contents::before, html.vn-tiled .app-contents.sidebar-enabled::after {
  content: ""; position: absolute; inset: 0; z-index: 20; pointer-events: none; border-radius: var(--vn-r); padding: var(--vn-bw);
  background: linear-gradient(var(--vn-angle), var(--vn-a1), var(--vn-a2)); opacity: .38; transition: opacity .25s ease;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
}
html.vn-tiled .app-contents.sidebar-enabled::before { right: calc(var(--vn-sw) + var(--vn-gap)); }
html.vn-tiled .app-contents.sidebar-enabled::after { left: calc(100% - var(--vn-sw)); }
html.vn-tiled.vn-side-left .app-contents.sidebar-enabled::before { left: calc(var(--vn-sw) + var(--vn-gap)); right: 0; }
html.vn-tiled.vn-side-left .app-contents.sidebar-enabled::after { left: 0; right: calc(100% - var(--vn-sw)); }
html.vn-no-sidebar .app-contents::after { display: none !important; }
html.vn-tiled.vn-no-sidebar .app-contents.sidebar-enabled::before { left: 0; right: 0; }
html.vn-tiled :is(.app-title-bar:hover, .app-grid-navbar:hover)::after,
html.vn-tiled .app-contents:has(> .app-viewport:hover)::before,
html.vn-tiled .app-contents:has(> .app-sidebar:hover)::after { opacity: 1; }
html.vn-tiled.vn-anim :is(.app-title-bar:hover, .app-grid-navbar:hover)::after,
html.vn-tiled.vn-anim .app-contents:has(> .app-viewport:hover)::before,
html.vn-tiled.vn-anim .app-contents:has(> .app-sidebar:hover)::after {
  background: conic-gradient(from var(--vn-angle), var(--vn-a1), var(--vn-a2), var(--vn-a1)); animation: vn-spin 3.5s linear infinite;
}
html.vn-tiled :is(.app-viewport, .app-sidebar, .app-grid-navbar, .app-title-bar) { box-shadow: 0 18px 40px -22px rgb(0 0 0 / .8); }

/* ---------- motion ---------- */
html.vn-on.vn-motion :is(.app-title-bar, .app-grid-navbar, .app-viewport, .app-sidebar) { animation: vn-pop .6s cubic-bezier(.2, .8, .2, 1) backwards; }
html.vn-on.vn-motion .app-grid-navbar { animation-delay: .05s; }
html.vn-on.vn-motion .app-viewport { animation-delay: .1s; }
html.vn-on.vn-motion .app-sidebar { animation-delay: .16s; }
html.vn-on.vn-motion .app-viewport > :not(.loading-indicator-container):not(#background-teleport-target) { animation: vn-in .42s cubic-bezier(.2, .8, .2, 1) backwards; }
html.vn-on .nav-button svg { transition: transform .35s cubic-bezier(.2, .8, .2, 1); }
html.vn-on.vn-motion .nav-button:hover svg { transform: translateY(-2px) scale(1.08); }
html.vn-float .app-viewport :is(.clickable-card, .bg-surface-3.select-none) { transition: box-shadow .35s ease, border-color .35s ease; }
html.vn-float .app-viewport :is(.clickable-card, .bg-surface-3.select-none):hover {
  animation: vn-float 3.2s ease-in-out infinite;
  border-color: color-mix(in srgb, var(--vn-a1) 45%, transparent) !important;
  box-shadow: 0 16px 36px -18px color-mix(in srgb, var(--vn-a1) 60%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  html.vn-on *, html.vn-on *::before, html.vn-on *::after { animation: none !important; }
}

/* ---------- window controls ---------- */
html.vn-ctl-traffic body > section.fixed.top-0.right-0 { gap: 9px; padding: 0 16px !important; align-items: center; }
html.vn-ctl-traffic body > section.fixed.top-0.right-0 button { width: 14px !important; height: 14px !important; min-width: 0 !important; min-height: 0 !important; padding: 0 !important; border-radius: 50% !important; box-shadow: inset 0 0 0 .5px rgb(0 0 0 / .25); }
html.vn-ctl-traffic body > section.fixed.top-0.right-0 button svg { width: 9px !important; height: 9px !important; color: rgb(0 0 0 / .65); opacity: 0; transition: opacity .15s; }
html.vn-ctl-traffic body > section.fixed.top-0.right-0:hover button svg { opacity: 1; }
html.vn-ctl-traffic body > section.fixed.top-0.right-0 button:nth-last-child(3) { background: #febc2e !important; }
html.vn-ctl-traffic body > section.fixed.top-0.right-0 button:nth-last-child(2) { background: #28c840 !important; }
html.vn-ctl-traffic body > section.fixed.top-0.right-0 button:last-child { background: #ff5f57 !important; }
html.vn-ctl-minimal body > section.fixed.top-0.right-0 { gap: 4px; padding: 0 10px !important; align-items: center; }
html.vn-ctl-minimal body > section.fixed.top-0.right-0 button { width: 32px !important; height: 30px !important; border-radius: 9px !important; background: transparent !important; color: var(--color-text-default) !important; transition: background .15s, color .15s; }
html.vn-ctl-minimal body > section.fixed.top-0.right-0 button svg { width: 15px !important; height: 15px !important; }
html.vn-ctl-minimal body > section.fixed.top-0.right-0 button:hover { background: color-mix(in srgb, var(--vn-a1) 18%, transparent) !important; color: var(--vn-a1) !important; }
html.vn-ctl-minimal body > section.fixed.top-0.right-0 button:last-child:hover { background: #ff5f57 !important; color: #fff !important; }
`;

let fontLink = null;
function applyTheme() {
  const r = document.documentElement;
  const pal = currentPalette();
  const a1 = hex(S.accent, '#1bd96a');
  const a2 = hex(S.accent2, a1);
  const font = FONTS[S.font] ?? FONTS.default;
  const classes = {
    'vn-on': S.layout !== 'stock', 'vn-flat': S.layout === 'flat', 'vn-glass': S.layout === 'glass', 'vn-tiled': S.layout === 'tiled',
    'vn-anim': S.animBorder, 'vn-float': S.float && S.layout !== 'stock', 'vn-motion': S.motion, 'vn-font': !!font[1] && S.layout !== 'stock',
    'vn-ctl-traffic': S.controls === 'traffic', 'vn-ctl-minimal': S.controls === 'minimal',
  };
  // Arrangement: panel sides and sizes. The app positions .app-contents absolutely, so we compute its box here.
  const on = S.layout !== 'stock';
  const g = S.layout === 'tiled' ? S.gap : 0;
  const nw = S['size.nav'], th = S['size.title'], sw = S['size.sidebar'];
  const navL = S['pos.nav'] !== 'right', titleT = S['pos.title'] !== 'bottom', sideR = S['pos.sidebar'] !== 'left';
  Object.assign(classes, {
    'vn-nav-right': on && !navL, 'vn-title-bottom': on && !titleT, 'vn-side-left': on && !sideR,
    'vn-custom-pos': on && (!navL || !titleT || !sideR), 'vn-no-sidebar': S['hide.sidebar'],
  });
  for (const [c, enabled] of Object.entries(classes)) r.classList.toggle(c, enabled);
  const navRow = navL ? 'nav dummy' : 'dummy nav';
  const cols = navL ? 'auto 1fr' : '1fr auto';
  const vars = {
    '--vn-gt': titleT ? `"status status" auto "${navRow}" minmax(0, 1fr) / ${cols}` : `"${navRow}" minmax(0, 1fr) "status status" auto / ${cols}`,
    '--vn-g': `${g}px`, '--vn-nw': `${nw}px`, '--vn-th': `${th}px`, '--vn-sw': `${sw}px`,
    '--vn-cl': `${navL ? nw + 2 * g : g}px`, '--vn-cr': `${navL ? g : nw + 2 * g}px`,
    '--vn-ct': `${titleT ? th + 2 * g : g}px`, '--vn-ch': `calc(100vh - ${th + 3 * g}px)`,
    '--vn-cols': S['hide.sidebar'] ? 'minmax(0, 1fr)' : sideR ? `minmax(0, 1fr) ${sw}px` : `${sw}px minmax(0, 1fr)`,
    '--vn-nm': navL ? `${g}px 0 ${g}px ${g}px` : `${g}px ${g}px ${g}px 0`,
    '--vn-tm': titleT ? `${g}px ${g}px 0` : `0 ${g}px ${g}px`,
    '--vn-a1': a1, '--vn-a2': a2, '--vn-ac': contrastText(a1), '--vn-op': `${S.opacity}%`, '--vn-blur': `${S.blur}px`,
    '--vn-r': `${S.radius}px`, '--vn-gap': `${S.gap}px`, '--vn-bw': `${S.border}px`, '--vn-dim': S['bg.dim'] / 100,
    '--vn-font': font[1] ? `'${font[0]}'` : 'inherit',
  };
  pal.s.forEach((c, i) => { vars[`--vn-s${i}`] = c; });
  pal.t.forEach((c, i) => { vars[`--vn-t${i}`] = c; });
  for (const [k, v] of Object.entries(vars)) r.style.setProperty(k, v);
  css('vn-theme', THEME_CSS);
  css('vn-custom', S.css);
  if (font[1] && fontLink?.dataset.font !== font[1]) {
    fontLink?.remove();
    fontLink = h('link', { rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=${font[1]}&display=swap`, 'data-font': font[1] });
    document.documentElement.append(fontLink);
  }
}
