// Example plugin: a clock in the title bar.
// Every .js file in this folder runs after the page loads, with MRMod = { settings, addStyle(css) }.
const el = document.createElement('span');
el.style.cssText = 'margin-right:12px;opacity:.7;font-variant-numeric:tabular-nums';
const tick = () => { el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
tick();
setInterval(tick, 10000);
const mount = () => document.querySelector('.app-title-bar section')?.prepend(el);
new MutationObserver(() => el.isConnected || mount()).observe(document.body, { childList: true, subtree: true });
mount();
