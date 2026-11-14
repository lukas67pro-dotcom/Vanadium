// Media: wallpaper (image / GIF / video), custom loading screen, background music with a title-bar mini player.
const MEDIA_CSS = `
#vn-loading { position: fixed; inset: 0; z-index: 10001; background: #000; cursor: pointer; transition: opacity .5s ease; }
#vn-loading.out { opacity: 0; pointer-events: none; }
#vn-loading > :is(img, video) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: var(--vn-fit, cover); }
#vn-loading > .vn-skip { position: absolute; right: 24px; bottom: 20px; padding: 6px 12px; border-radius: 99px; background: rgb(0 0 0 / .45); color: rgb(255 255 255 / .7); font: 600 12px system-ui, sans-serif; letter-spacing: .03em; }
html.vn-custom-loading .splash-screen { display: none !important; }

.vn-player { display: flex; align-items: center; gap: 1px; height: 32px; margin-right: 10px; padding: 0 12px 0 3px; max-width: 290px; border-radius: 999px;
  background: color-mix(in srgb, var(--color-text-primary) 6%, transparent); border: 1px solid color-mix(in srgb, var(--color-text-primary) 9%, transparent); }
.vn-player.playing { border-color: color-mix(in srgb, var(--vn-a1) 45%, transparent); }
.vn-mp-btn { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; color: var(--color-text-default); background: none; border: 0; cursor: pointer; transition: background .15s, color .15s; }
.vn-mp-btn:hover { color: var(--vn-a1); background: color-mix(in srgb, var(--vn-a1) 15%, transparent); }
.vn-mp-title { min-width: 0; max-width: 160px; margin-left: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 12.5px; font-weight: 600; color: var(--color-text-default); background: none; border: 0; cursor: pointer; }
.vn-mp-title:hover { color: var(--color-text-primary); }
.vn-eq { display: inline-flex; gap: 2px; align-items: flex-end; height: 12px; margin-left: 6px; flex: none; }
.vn-eq i { width: 3px; height: 25%; border-radius: 1px; background: var(--vn-a1); }
.playing .vn-eq i, .vn-eq.on i { animation: vn-eq .8s ease-in-out infinite alternate; }
.vn-eq i:nth-child(2) { animation-delay: -.3s !important; } .vn-eq i:nth-child(3) { animation-delay: -.55s !important; }
@keyframes vn-eq { to { height: 100%; } }
.vn-player { position: relative; overflow: hidden; }
.vn-eq[hidden] { display: none; }
.vn-mp-art { width: 22px; height: 22px; flex: none; margin-left: 6px; border-radius: 5px; object-fit: cover; background: color-mix(in srgb, var(--color-text-primary) 10%, transparent); }
.vn-mp-art[hidden] { display: none; }
.vn-mp-progress { position: absolute; left: 14px; right: 14px; bottom: 2px; height: 2px; border-radius: 2px; pointer-events: none;
  background: linear-gradient(90deg, var(--vn-a1), var(--vn-a2)) 0 / var(--p, 0%) 100% no-repeat; }
.vn-mp-progress[hidden] { display: none; }
`;
const eqBars = (on) => h('span', { class: `vn-eq${on ? ' on' : ''}`, 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
const trackName = (t) => t.name.replace(/\.[a-z0-9]{2,5}$/i, '');

// ---------- loading screen ----------
function startLoadingScreen({ preview = false } = {}) {
  const src = S['load.src'];
  if (!src || $('#vn-loading')) return;
  const kind = mediaKind(src);
  const root = document.documentElement;
  const ov = h('div', { id: 'vn-loading', style: { '--vn-fit': S['load.fit'] } });
  root.append(ov);
  root.classList.add('vn-custom-loading');
  const t0 = performance.now();
  let el = null;
  let mediaDone = !(kind === 'video' && S['load.mode'] === 'full');
  let sawSplash = false;
  let finished = false;
  const onKey = (e) => { if (e.key === 'Escape') finish(); };
  function finish() {
    if (finished) return;
    finished = true;
    removeEventListener('keydown', onKey, true);
    ov.classList.add('out');
    root.classList.remove('vn-custom-loading');
    setTimeout(() => { el?.pause?.(); ov.remove(); }, 520);
  }
  addEventListener('keydown', onKey, true);
  ov.addEventListener('click', finish);
  media.url(src).then((url) => {
    if (finished) return;
    if (kind === 'video') {
      el = h('video', { src: url, autoplay: true, playsInline: true, loop: S['load.mode'] !== 'full', muted: S['load.volume'] === 0 });
      el.volume = S['load.volume'] / 100;
      el.addEventListener('ended', () => { mediaDone = true; });
      el.addEventListener('error', () => { mediaDone = true; });
    } else {
      el = h('img', { src: url, alt: '' });
    }
    ov.append(el, h('div', { class: 'vn-skip' }, 'Click or press Esc to skip'));
  }).catch((e) => { console.warn(`[${BRAND}] loading screen`, e); finish(); });

  (function tick() {
    if (finished) return;
    const splash = $('.splash-screen');
    if (splash) sawSplash = true;
    const elapsed = (performance.now() - t0) / 1000;
    // Ready = Modrinth's own splash has come and gone (or never showed, e.g. when injected into a loaded page).
    const ready = preview || (sawSplash ? !splash : !!$('.app-grid-layout') && elapsed > 1.5);
    if ((ready && mediaDone && elapsed >= (preview ? 4 : S['load.min'])) || elapsed > 60) return finish(); // 60s: never trap the user
    setTimeout(tick, 120);
  })();
}

// ---------- starry sky (StarryNight theme, or the "Starry sky" toggle on any theme) ----------
const SKY_CSS = `
#vn-sky { position: absolute; inset: 0; display: none; overflow: hidden; background: linear-gradient(to bottom, #000000 0%, #07101c 45%, #142b44 100%); }
html.vn-sky #vn-sky { display: block; }
html.vn-sky #vn-bg > :is(img, video) { display: none; } /* the sky replaces the wallpaper while it's on */
html.vn-sky #vn-bg::after { display: none; }
#vn-sky .vn-stars { position: absolute; left: 0; top: 0; border-radius: 50%; background: transparent; animation: vn-twinkle 7s steps(7) infinite alternate; }
#vn-sky .vn-stars.s1 { width: 1px; height: 1px; }
#vn-sky .vn-stars.s2 { width: 2px; height: 2px; animation-duration: 11s; animation-delay: -4s; }
#vn-sky .vn-stars.s3 { width: 2px; height: 2px; animation-duration: 15s; animation-delay: -9s; }
#vn-sky .vn-shoot { position: absolute; width: 170px; height: 2px; border-radius: 2px; opacity: 0;
  background: linear-gradient(90deg, #ffffff, rgb(255 255 255 / .35) 30%, transparent); filter: drop-shadow(0 0 5px #fff);
  animation: vn-shoot var(--d, 11s) linear infinite; animation-delay: var(--delay, 0s); }
@keyframes vn-twinkle { 0% { opacity: 1; } 40% { opacity: .5; } 70% { opacity: .85; } 100% { opacity: .65; } }
@keyframes vn-shoot {
  0% { opacity: 0; transform: rotate(-32deg) translateX(0); }
  1.5% { opacity: 1; }
  8% { opacity: 0; transform: rotate(-32deg) translateX(-560px); }
  100% { opacity: 0; transform: rotate(-32deg) translateX(-560px); }
}
html.vn-sky-paused #vn-sky * { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) { #vn-sky .vn-shoot { display: none; } #vn-sky .vn-stars { animation: none; } }
`;
function buildSky() {
  let seed = 23; // fixed seed: the same sky every launch
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const stars = (n, glow) => Array.from({ length: n }, () => `${(rand() * 100).toFixed(2)}vw ${(rand() * 100).toFixed(2)}vh ${glow} rgb(255 255 255 / ${(0.55 + rand() * 0.45).toFixed(2)})`).join(',');
  const layer = (cls, n, glow) => h('i', { class: `vn-stars ${cls}`, style: { boxShadow: stars(n, glow) } });
  const shooting = [[8, 62, 11, 0], [22, 88, 14, 5.5], [3, 40, 17, 9], [30, 75, 13, 12]].map(([top, left, d, delay]) =>
    h('i', { class: 'vn-shoot', style: { top: `${top}%`, left: `${left}%`, '--d': `${d}s`, '--delay': `${delay}s` } }));
  return h('div', { id: 'vn-sky' }, layer('s1', 260, '0 0'), layer('s2', 90, '0 0'), layer('s3', 28, '3px 1px'), shooting);
}

// ---------- wallpaper ----------
const bgLayer = h('div', { id: 'vn-bg', 'aria-hidden': 'true' }, buildSky());
let bgKey = null;
let bgMedia = null;
let gameRunning = false;

function syncVideoPlayback() {
  // The sky animates under blurred glass, so it pauses with the video: hidden window or Minecraft running.
  document.documentElement.classList.toggle('vn-sky-paused', document.hidden || (gameRunning && S['game.pause']));
  if (bgMedia?.tagName !== 'VIDEO') return;
  const play = ['glass', 'tiled'].includes(S.layout) && !document.hidden && !(gameRunning && S['game.pause']);
  play ? bgMedia.play().catch(() => {}) : bgMedia.pause();
}
document.addEventListener('visibilitychange', syncVideoPlayback);

async function applyBackground() {
  if (!bgLayer.isConnected) document.documentElement.prepend(bgLayer);
  const src = S['bg.src'];
  const key = src ? src.id ?? src.url : '';
  if (key !== bgKey) {
    bgKey = key;
    bgMedia?.remove();
    bgMedia = null;
    if (src) {
      try {
        const url = await media.url(src);
        if (bgKey !== key) return; // changed again while loading
        bgMedia = mediaKind(src) === 'video'
          ? h('video', { src: url, autoplay: true, loop: true, playsInline: true, muted: true })
          : h('img', { src: url, alt: '', decoding: 'async' });
        bgMedia.addEventListener('error', () => toast(`Background "${src.name}" failed to load`, 'error'), { once: true });
        const el = bgMedia;
        el.addEventListener(el.tagName === 'VIDEO' ? 'loadeddata' : 'load', () => { bgReady = el; if (S.palette === 'auto') computeAutoTheme(); }, { once: true });
        bgLayer.prepend(bgMedia);
      } catch (e) { toast(`Background: ${e.message}`, 'error'); }
    }
  }
  if (bgMedia?.tagName === 'VIDEO') {
    bgMedia.volume = S['bg.volume'] / 100;
    bgMedia.muted = S['bg.volume'] === 0;
    syncVideoPlayback();
  }
}

// ---------- Wallpaper theme ----------
let bgReady = null; // the background element once its first frame is decoded
const wallpaperUrl = () => (bgReady?.tagName === 'IMG' && bgReady === bgMedia ? bgReady.src : null);

function autoTheme() {
  if (!S['bg.src']) return toast('The Wallpaper theme takes its colors from your background. Set one first.', 'info', { label: 'Choose background', fn: () => openUI('background') });
  if (bgReady && bgReady === bgMedia) computeAutoTheme(); // otherwise it runs when the background finishes loading
}

// Picking the Wallpaper theme or the 'From wallpaper' palette reads the colors.
onChange((patch) => { if (patch.palette === 'auto' && !('auto.palette' in patch)) autoTheme(); });

async function computeAutoTheme() {
  const src = S['bg.src'];
  let result;
  try {
    result = extractPalette(bgMedia);
  } catch (e) {
    if (e.name !== 'SecurityError' || src?.kind !== 'url') return toast(`Couldn't read colors: ${e.message}`, 'error');
    // A remote image taints the canvas unless its server allows CORS: retry with a CORS request.
    try {
      const img = h('img', { crossOrigin: 'anonymous', src: src.url });
      await img.decode();
      result = extractPalette(img);
    } catch {
      return toast('That site doesn\'t let pages read its image colors. Download the file and choose it instead.', 'error');
    }
  }
  if (S.palette !== 'auto') return; // switched away while reading
  set({ 'auto.palette': result.palette, accent: result.accent, accent2: result.accent2, palette: 'auto' });
  toast('Colors matched to your background');
  if (ui && !ui.hidden) render();
}

// ---------- music ----------
const music = { audio: new Audio(), index: -1, pausedByGame: false, errors: 0, subs: new Set() };
music.audio.preload = 'auto';
const notifyMusic = () => music.subs.forEach((fn) => fn());
const currentTrack = () => S['music.list'][music.index] ?? null;

async function playTrack(i) {
  const list = S['music.list'];
  if (!list.length) return;
  music.index = ((i % list.length) + list.length) % list.length;
  music.pausedByGame = false;
  notifyMusic();
  try {
    music.audio.src = await media.url(list[music.index]);
    music.audio.volume = S['music.volume'] / 100;
    pauseExternal();
    await music.audio.play();
    music.errors = 0;
  } catch (e) {
    if (e.name === 'AbortError' || e.name === 'NotSupportedError') return; // superseded, or reported by the 'error' event
    toast(`Can't play "${list[music.index]?.name}": ${e.message}`, 'error');
  }
}
function nextTrack() {
  const n = S['music.list'].length;
  if (!n) return;
  if (S['music.shuffle'] && n > 1) {
    let j;
    do j = Math.floor(Math.random() * n); while (j === music.index);
    return playTrack(j);
  }
  return playTrack(music.index + 1);
}
function prevTrack() {
  if (music.audio.currentTime > 3) { music.audio.currentTime = 0; return; }
  playTrack(music.index - 1);
}
function togglePlay() {
  if (music.index < 0 || !music.audio.src) return playTrack(S['music.shuffle'] ? Math.floor(Math.random() * S['music.list'].length) : 0);
  music.pausedByGame = false;
  if (music.audio.paused) { pauseExternal(); music.audio.play().catch((e) => toast(`Playback failed: ${e.message}`, 'error')); }
  else music.audio.pause();
}
music.audio.addEventListener('ended', nextTrack);
music.audio.addEventListener('play', notifyMusic);
music.audio.addEventListener('pause', notifyMusic);
music.audio.addEventListener('error', () => {
  if (!music.audio.getAttribute('src')) return;
  const t = currentTrack();
  toast(`Can't play "${t?.name ?? 'track'}" (unsupported or unreachable)`, 'error');
  if (++music.errors < S['music.list'].length) nextTrack(); // skip, but stop once every track has failed
});

function addTracks(srcs) { set({ 'music.list': [...S['music.list'], ...srcs] }); notifyMusic(); }
async function removeTrack(i) {
  const list = [...S['music.list']];
  const [t] = list.splice(i, 1);
  if (i === music.index) { music.audio.pause(); music.audio.removeAttribute('src'); music.audio.load(); music.index = -1; }
  else if (i < music.index) music.index--;
  set({ 'music.list': list });
  await media.remove(t);
  notifyMusic();
}
function moveTrack(i, d) {
  const list = [...S['music.list']];
  const j = i + d;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  if (music.index === i) music.index = j; else if (music.index === j) music.index = i;
  set({ 'music.list': list });
  notifyMusic();
}

// ---------- Spotify / Spicetify in the title bar ----------
// Read through Windows' system media controls by the loader (see vanadiumHost), so no Spotify login is needed.
// Spicetify is a modded Spotify client, so it shows up the same way. "Any app" also follows browsers and other players.
const ext = { state: null, art: null, artKey: '', busy: false };
const extFilter = () => (S['spotify.mode'] === 'any' ? 'any' : 'spotify');
const extActive = () => S['spotify.mode'] !== 'off' && !!ext.state;
const extApp = (id = '') => (/spotify/i.test(id) ? 'Spotify' : id.split('!').pop().replace(/\.exe$/i, '') || 'media player');
// Vanadium's own playlist wins while it plays; otherwise Spotify; otherwise the idle playlist.
const playerSource = () => (music.audio.paused && extActive() ? 'ext' : 'playlist');
const extPosition = () => {
  const st = ext.state;
  if (!st?.dur) return 0;
  return Math.min(st.dur, st.playing ? st.pos + (Date.now() - st.at) / 1000 : st.pos) / st.dur;
};

async function pollExternal() {
  if (S['spotify.mode'] === 'off') { if (ext.state) { ext.state = null; notifyMusic(); } return; }
  if (document.hidden || ext.busy || typeof window.vanadiumHost !== 'function') return;
  ext.busy = true;
  try {
    let st = await host('media', { filter: extFilter() });
    if (st && ext.expect) { // keep a just-clicked play/pause until Windows reports it (or 3 s pass)
      if (Date.now() < ext.expect.until && st.playing !== ext.expect.playing) st = { ...st, playing: ext.expect.playing };
      else ext.expect = null;
    }
    const key = st ? `${st.title}\u0000${st.artist}` : '';
    if (key !== ext.artKey) { // new track: fetch its cover once
      ext.artKey = key;
      ext.art = null;
      if (st) host('art', { filter: extFilter() }).then((a) => { if (ext.artKey === key) { ext.art = a; notifyMusic(); } }).catch(() => {});
    }
    const changed = JSON.stringify(st) !== JSON.stringify(ext.state);
    ext.state = st;
    if (changed) notifyMusic();
  } catch {} finally { ext.busy = false; }
}
async function extCmd(action) {
  // Spotify reports its new state a second or two later, so flip the button right away; the next poll confirms it.
  if (ext.state && (action === 'toggle' || action === 'pause')) {
    const playing = action === 'pause' ? false : !ext.state.playing;
    ext.expect = { playing, until: Date.now() + 3000 };
    ext.state = { ...ext.state, playing, pos: ext.state.pos + (ext.state.playing ? (Date.now() - ext.state.at) / 1000 : 0), at: Date.now() };
    notifyMusic();
  }
  try { await host('mcmd', { action, filter: extFilter() }); } catch (e) { return toast(e.message, 'error'); }
  for (const ms of [400, 1200, 2500]) setTimeout(pollExternal, ms);
}
const pauseExternal = () => { if (ext.state?.playing) extCmd('pause'); }; // never let both play at once

// Pause music and the background video while Minecraft runs (the same process list the app shows in its title bar).
async function pollGame() {
  let running;
  try { running = ((await invoke('plugin:process|process_get_all')) ?? []).length > 0; } catch { return; }
  if (running === gameRunning) return;
  gameRunning = running;
  if (S['game.pause']) {
    if (running && !music.audio.paused) { music.audio.pause(); music.pausedByGame = true; }
    else if (!running && music.pausedByGame) { music.pausedByGame = false; music.audio.play().catch(() => {}); }
  }
  syncVideoPlayback();
  notifyMusic();
}

let miniPlayer = null;
function buildMiniPlayer() {
  const isExt = () => playerSource() === 'ext';
  const play = h('button', { class: 'vn-mp-btn', onclick: () => (isExt() ? extCmd('toggle') : togglePlay()) });
  const title = h('button', { class: 'vn-mp-title', 'data-tip-side': 'bottom', onclick: () => openUI('music') });
  const eq = eqBars(false);
  const art = h('img', { class: 'vn-mp-art', alt: '', hidden: true });
  const progress = h('i', { class: 'vn-mp-progress', hidden: true });
  let flash;
  const el = h('div', {
    class: 'vn-player', role: 'group', 'aria-label': 'Music player',
    onwheel: (e) => {
      if (isExt()) return; // Spotify's volume isn't exposed to other apps
      e.preventDefault();
      set({ 'music.volume': Math.max(0, Math.min(100, S['music.volume'] + (e.deltaY < 0 ? 5 : -5))) });
      title.textContent = `Volume ${S['music.volume']}%`;
      clearTimeout(flash);
      flash = setTimeout(update, 1200);
    },
  },
  h('button', { class: 'vn-mp-btn', 'aria-label': 'Previous track', html: icon('prev', 13), onclick: () => (isExt() ? extCmd('prev') : prevTrack()) }),
  play,
  h('button', { class: 'vn-mp-btn', 'aria-label': 'Next track', html: icon('next', 13), onclick: () => (isExt() ? extCmd('next') : nextTrack()) }),
  eq, art, title, progress);
  const update = () => {
    const ext_ = isExt();
    const st = ext.state;
    const playing = ext_ ? st.playing : !music.audio.paused;
    play.innerHTML = icon(playing ? 'pause' : 'play', 13);
    play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if (ext_) {
      const line = [st.title, st.artist].filter(Boolean).join(' – ') || `Nothing playing in ${extApp(st.app)}`;
      title.textContent = line;
      title.dataset.tip = `${extApp(st.app)} · ${line}`;
      if (ext.art) art.src = ext.art;
      art.hidden = !ext.art;
    } else {
      title.textContent = currentTrack() ? trackName(currentTrack()) : music.pausedByGame ? 'Paused for game' : `${S['music.list'].length} track${S['music.list'].length === 1 ? '' : 's'}`;
      title.dataset.tip = 'Music settings · scroll to change volume';
      art.hidden = true;
    }
    eq.hidden = ext_;
    progress.hidden = !ext_ || !st.dur;
    el.classList.toggle('playing', playing);
  };
  setInterval(() => { if (!progress.hidden) progress.style.setProperty('--p', `${extPosition() * 100}%`); }, 500);
  music.subs.add(update);
  update();
  return el;
}

let lastMusic = { list: null, volume: null };
function applyMedia() {
  css('vn-media', MEDIA_CSS + SKY_CSS);
  document.documentElement.classList.toggle('vn-sky', !!S.sky);
  syncVideoPlayback();
  applyBackground();
  if (lastMusic.volume !== S['music.volume']) music.audio.volume = S['music.volume'] / 100;
  if (lastMusic.list !== S['music.list']) notifyMusic();
  lastMusic = { list: S['music.list'], volume: S['music.volume'] };
}

function startMedia() {
  keep(() => (miniPlayer ??= buildMiniPlayer()), (el) => $('.app-title-bar section')?.prepend(el), () => S['music.player'] && (S['music.list'].length > 0 || extActive()));
  setInterval(pollGame, 4000);
  setInterval(pollExternal, 1500);
  pollExternal();
  onChange((patch) => { if ('spotify.mode' in patch) { ext.artKey = ''; pollExternal(); } });
  if (S['music.autoplay'] && S['music.list'].length) setTimeout(() => (S['music.shuffle'] ? nextTrack() : playTrack(0)), 1200);
}
