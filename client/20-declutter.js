// Declutter: hide the news feed, ads, upsells and nav items; streamer mode.
const HIDE = {
  'hide.news': '.sidebar-default-content > div:has(a[href="https://modrinth.com/news"])',
  'hide.ads': '.ad-parent, a[href^="https://modrinth.plus"]', // the purple "Upgrade to Modrinth+" button sits on top of the ad slot
  'hide.plus': 'a[href^="https://modrinth.plus"]',
  'hide.signin': '.sidebar-default-content > div:has(span.text-brand.cursor-pointer):not(:has(h3))',
  'hide.discover': '.app-grid-navbar > a[href^="/browse"]',
  'hide.skins': '.app-grid-navbar > a[href="/skins"]',
  'hide.screenshots': '.app-grid-navbar > a[href="/screenshots"]',
  'hide.hosting': '.app-grid-navbar > a[href^="/hosting"]',
  'hide.sidebar': '.app-contents.sidebar-enabled > .app-sidebar',
};

// A "Hide" button right on the News heading, so you don't have to dig through settings.
const NEWS_CSS = `
${HIDE['hide.news']} > h3 { display: flex; align-items: center; }
.vn-news-hide { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 3px 10px; border-radius: 999px; cursor: pointer; opacity: 0;
  font: inherit; font-size: 12px; font-weight: 600; color: var(--color-text-default); background: var(--surface-3); border: 1px solid var(--surface-5); transition: opacity .15s, color .15s; }
${HIDE['hide.news']}:hover .vn-news-hide, .vn-news-hide:focus-visible { opacity: 1; }
.vn-news-hide:hover { color: var(--color-brand); }
`;
let newsBtn = null;
keep(() => (newsBtn ??= h('button', {
  class: 'vn-news-hide', 'aria-label': 'Hide news', 'data-tip': 'Hide the news feed', html: `${icon('eyeOff', 13)}<span>Hide</span>`,
  onclick: () => { set({ 'hide.news': true }); toast('News hidden', 'info', { label: 'Undo', fn: () => set({ 'hide.news': false }) }); },
})), (el) => $(`${HIDE['hide.news']} > h3`)?.append(el), () => !S['hide.news']);

const STREAMER_CSS = `
html.vn-streamer :is(.sidebar-default-content > div:first-child button, .app-grid-navbar > button:last-child img) { filter: blur(7px) saturate(.4); transition: filter .2s; }
html.vn-streamer :is(.sidebar-default-content > div:first-child button, .app-grid-navbar > button:last-child img):hover { filter: none; }
`;

// The ad is a separate native webview layered over the window, so CSS can't reach it. The app hides it with a
// hold counter (it acquires one while fullscreen); we take one hold of our own and remember it per session.
const AD_HOLD_KEY = 'vanadium:adhold';
const adHeld = () => { try { return sessionStorage.getItem(AD_HOLD_KEY) === '1'; } catch { return false; } };
// The app draws the ad at a fixed spot (bottom-right, 300px wide), so it would cover content once the sidebar moves.
const adMisplaced = () => S['hide.sidebar'] || (S.layout !== 'stock' && (S['pos.sidebar'] === 'left' || S['pos.nav'] === 'right' || S['pos.title'] === 'bottom' || S['size.sidebar'] !== 300));
const wantAdHold = () => S['hide.ads'] || adMisplaced();
let adSync = Promise.resolve();
function syncAdHold() {
  adSync = adSync.then(async () => {
    const want = wantAdHold();
    if (want === adHeld()) return;
    if (want && !$('.ad-parent')) return; // ad slot not mounted yet (or Modrinth+): retried on DOM changes
    await invoke('plugin:ads|update_ads_window_hold', { acquire: want, dpr: devicePixelRatio });
    try { want ? sessionStorage.setItem(AD_HOLD_KEY, '1') : sessionStorage.removeItem(AD_HOLD_KEY); } catch {}
  }).catch((e) => console.warn(`[${BRAND}] ad window`, e));
}

// Our full-screen settings sit under the native ad webview, so hide it while they're open.
let uiAdHold = false;
function holdAdsForUI(on) {
  if (on === uiAdHold) return;
  uiAdHold = on;
  adSync = adSync.then(() => invoke('plugin:ads|update_ads_window_hold', { acquire: on, dpr: devicePixelRatio })).catch(() => {});
}

domTicks.push(() => { if (wantAdHold() !== adHeld()) syncAdHold(); });

function applyDeclutter() {
  const rules = Object.entries(HIDE).filter(([k]) => S[k]).map(([, sel]) => `${sel} { display: none !important; }`);
  if (S['hide.sidebar']) rules.push('html:not(.vn-on) .app-contents.sidebar-enabled { grid-template-columns: minmax(0, 1fr) !important; }'); // Stock layout
  css('vn-declutter', `${rules.join('\n')}${STREAMER_CSS}${NEWS_CSS}`);
  document.documentElement.classList.toggle('vn-streamer', S.streamer);
  syncAdHold();
}
