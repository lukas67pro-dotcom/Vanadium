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

// ---------- wallpaper ----------
const bgLayer = h('div', { id: 'vn-bg', 'aria-hidden': 'true' });
let bgKey = null;
let bgMedia = null;
let gameRunning = false;

function syncVideoPlayback() {
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
  if (music.audio.paused) music.audio.play().catch((e) => toast(`Playback failed: ${e.message}`, 'error'));
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
  const play = h('button', { class: 'vn-mp-btn', onclick: togglePlay });
  const title = h('button', { class: 'vn-mp-title', 'data-tip': 'Music settings · scroll to change volume', 'data-tip-side': 'bottom', onclick: () => openUI('music') });
  const eq = eqBars(false);
  let flash;
  const el = h('div', {
    class: 'vn-player', role: 'group', 'aria-label': 'Music player',
    onwheel: (e) => {
      e.preventDefault();
      set({ 'music.volume': Math.max(0, Math.min(100, S['music.volume'] + (e.deltaY < 0 ? 5 : -5))) });
      title.textContent = `Volume ${S['music.volume']}%`;
      clearTimeout(flash);
      flash = setTimeout(update, 1200);
    },
  },
  h('button', { class: 'vn-mp-btn', 'aria-label': 'Previous track', html: icon('prev', 13), onclick: prevTrack }),
  play,
  h('button', { class: 'vn-mp-btn', 'aria-label': 'Next track', html: icon('next', 13), onclick: nextTrack }),
  eq, title);
  const update = () => {
    const playing = !music.audio.paused;
    play.innerHTML = icon(playing ? 'pause' : 'play', 13);
    play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    title.textContent = currentTrack() ? trackName(currentTrack()) : music.pausedByGame ? 'Paused for game' : `${S['music.list'].length} track${S['music.list'].length === 1 ? '' : 's'}`;
    el.classList.toggle('playing', playing);
  };
  music.subs.add(update);
  update();
  return el;
}

let lastMusic = { list: null, volume: null };
function applyMedia() {
  css('vn-media', MEDIA_CSS);
  applyBackground();
  if (lastMusic.volume !== S['music.volume']) music.audio.volume = S['music.volume'] / 100;
  if (lastMusic.list !== S['music.list']) notifyMusic();
  lastMusic = { list: S['music.list'], volume: S['music.volume'] };
}

function startMedia() {
  keep(() => (miniPlayer ??= buildMiniPlayer()), (el) => $('.app-title-bar section')?.prepend(el), () => S['music.player'] && S['music.list'].length > 0);
  setInterval(pollGame, 4000);
  if (S['music.autoplay'] && S['music.list'].length) setTimeout(() => (S['music.shuffle'] ? nextTrack() : playTrack(0)), 1200);
}
