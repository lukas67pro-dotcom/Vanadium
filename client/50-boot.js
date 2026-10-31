// Boot: apply everything as early as possible, then mount UI, media and plugins once the page exists.
const MRMod = {
  brand: BRAND, version: VERSION,
  get: (k) => S[k], set, onChange, toast, invoke, media, open: (p) => openUI(p),
  addStyle(text) { const s = h('style', {}, text); document.head.append(s); return s; },
};
window.Vanadium = MRMod;

function applyAll() {
  applyTheme();
  applyDeclutter();
  applyMedia();
}

whenRoot(() => {
  applyAll();
  startLoadingScreen(); // before the app's own splash paints
});
onChange(applyAll);

whenBody(() => {
  keep(navButton, (el) => $('.app-grid-navbar > button.nav-button:not(#vn-navbtn)')?.before(el));
  startMedia();
  startArrange();
  startWindowResize();
  addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyM') { e.preventDefault(); toggleUI(); }
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') { e.preventDefault(); toggleArrange(); }
  });
  for (const p of PLUGINS) {
    if (S.plugins[p.name] === false) continue;
    try { p.run(MRMod); } catch (e) { console.error(`[${BRAND}] plugin ${p.name} failed`, e); }
  }
  console.log(`[${BRAND}] v${VERSION} loaded, ${PLUGINS.length} plugin(s)`);
});
