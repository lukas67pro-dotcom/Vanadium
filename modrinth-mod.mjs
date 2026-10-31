#!/usr/bin/env node
// Vanadium loader for the Modrinth App. Zero dependencies, Node >= 22 (global fetch + WebSocket).
// Launches the app with a localhost-only WebView2 DevTools port and injects client/*.js over CDP.
// Nothing inside the app install is modified, so app updates never break it.
//
//   node modrinth-mod.mjs                      launch Modrinth App with mods
//   node modrinth-mod.mjs --watch              same, and re-inject + reload whenever client/ or plugins/ change
//   node modrinth-mod.mjs --client <path|url>  use a single-file client bundle instead of client/*.js
//   node modrinth-mod.mjs install              add a "Vanadium" Start menu + Desktop shortcut with the Vanadium icon
//   node modrinth-mod.mjs uninstall            remove those shortcuts
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, watch } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 9333;
const APP_ORIGIN = 'http://tauri.localhost';

const die = (msg) => { console.error(`[vanadium] ${msg}`); process.exit(1); };
const log = (msg) => console.log(`[vanadium] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (process.platform !== 'win32') {
  // macOS (WKWebView) and Linux (WebKitGTK) have no DevTools-protocol switch an outside process can turn on.
  die('Only Windows (WebView2) is supported. On macOS/Linux, build Modrinth App from source (github.com/modrinth/code) with the client bundled into the frontend.');
}

function findExe() {
  const candidates = [
    join(process.env.LOCALAPPDATA ?? '', 'Modrinth App', 'Modrinth App.exe'), // per-user NSIS install
    join(process.env.ProgramFiles ?? '', 'Modrinth App', 'Modrinth App.exe'), // MSI install
  ];
  return candidates.find(existsSync) ?? die(`Modrinth App not found. Looked in:\n  ${candidates.join('\n  ')}`);
}

const isRunning = () => execFileSync('tasklist', ['/FI', 'IMAGENAME eq Modrinth App.exe', '/NH'], { encoding: 'utf8' }).includes('Modrinth App.exe');

async function appTarget() {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return targets.find((t) => t.type === 'page' && t.url.startsWith(APP_ORIGIN));
  } catch { return undefined; }
}

async function startApp() {
  if (await appTarget()) return log('Modrinth App already running with mod port, attaching.');
  if (isRunning()) {
    // The app is single-instance, so a running copy without the port must close first. No /F: let it close gracefully.
    log('Closing running Modrinth App so it can restart with mods...');
    try { execFileSync('taskkill', ['/IM', 'Modrinth App.exe'], { stdio: 'ignore' }); } catch {}
    for (let i = 0; i < 20 && isRunning(); i++) await sleep(250);
    if (isRunning()) die('Modrinth App did not close. Close it yourself (check for a running game), then run this again.');
  }
  spawn(findExe(), [], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${PORT}` },
  }).unref();
  log('Started Modrinth App.');
}

const jsFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.js')).sort() : []);

async function loadClient(src) {
  if (!src) return jsFiles(join(HERE, 'client')).map((f) => `// ---- ${f}\n${readFileSync(join(HERE, 'client', f), 'utf8')}`).join('\n');
  if (/^https:\/\//i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) die(`Could not fetch client ${src}: HTTP ${res.status}`);
    return res.text();
  }
  if (/^http:/i.test(src)) die('Refusing plain-http client URL; use https or a local file.');
  return readFileSync(isAbsolute(src) ? src : join(HERE, src), 'utf8');
}

// Plugins are compiled into the bundle as functions, so they run without eval.
function loadPlugins() {
  const dir = join(HERE, 'plugins');
  return `[${jsFiles(dir).flatMap((f) => {
    const code = readFileSync(join(dir, f), 'utf8');
    try { new Function('MRMod', code); } catch (e) { log(`Skipping plugin ${f}: ${e.message}`); return []; } // one bad file must not break the bundle
    const desc = code.match(/^\/\/\s*(.+)/)?.[1] ?? '';
    return [`{ name: ${JSON.stringify(f.slice(0, -3))}, desc: ${JSON.stringify(desc)}, run: function (MRMod) {\n${code}\n} }`];
  }).join(',\n')}]`;
}

// All client files share one closure; the guard stops a second injection into the same page.
const buildBundle = async (clientSrc) => `(() => {
if (window.__mrmodLoaded) return;
window.__mrmodLoaded = true;
const PLUGINS = ${loadPlugins()};
${await loadClient(clientSrc)}
})();`;

// Window resizing: Modrinth's permissions block resize/set_size from the page, so a hidden PowerShell helper does it
// with Win32 GetWindowRect / SetWindowPos on the Modrinth window. One line in, one line out.
const WIN_HOST_PS = `
Add-Type @"
using System; using System.Runtime.InteropServices;
public static class VW {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hh, uint flags);
  [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr ctx);
  public struct RECT { public int L, T, R, B; }
}
"@
[void][VW]::SetThreadDpiAwarenessContext([IntPtr](-4)) # per-monitor DPI aware, so rects are real pixels
$h = (Get-Process 'Modrinth App' | Where-Object MainWindowHandle -ne 0 | Select-Object -First 1).MainWindowHandle
[Console]::Out.WriteLine('ready')
while ($null -ne ($line = [Console]::In.ReadLine())) {
  $p = $line.Split(' ')
  if ($p[0] -eq 'rect') { $r = New-Object VW+RECT; [void][VW]::GetWindowRect($h, [ref]$r); [Console]::Out.WriteLine("$($r.L) $($r.T) $($r.R - $r.L) $($r.B - $r.T)") }
  elseif ($p[0] -eq 'set') { [void][VW]::SetWindowPos($h, [IntPtr]::Zero, [int]$p[1], [int]$p[2], [int]$p[3], [int]$p[4], 0x14) }
}`;
let winHost = null;
const winReplies = [];
function winCmd(line, expectReply) {
  if (!winHost || winHost.exitCode !== null) {
    winHost = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', WIN_HOST_PS], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
    winReplies.length = 0;
    winReplies.push(() => {}); // swallow the 'ready' line
    let buf = '';
    winHost.stdout.on('data', (d) => {
      buf += d;
      for (let i; (i = buf.indexOf('\n')) >= 0; buf = buf.slice(i + 1)) winReplies.shift()?.(buf.slice(0, i).trim());
    });
  }
  return new Promise((resolve) => {
    if (expectReply) winReplies.push(resolve); else resolve();
    winHost.stdin.write(`${line}\n`);
  });
}

async function onHostCall({ payload, executionContextId }, send) {
  let req;
  try { req = JSON.parse(payload); } catch { return; }
  const int = (v) => Number.isInteger(v) && Math.abs(v) < 100000;
  let result = null;
  if (req.op === 'rect') {
    const [x, y, w, h] = (await winCmd('rect', true)).split(' ').map(Number);
    result = { x, y, w, h };
  } else if (req.op === 'set' && [req.x, req.y, req.w, req.h].every(int)) {
    await winCmd(`set ${req.x} ${req.y} ${Math.max(640, req.w)} ${Math.max(400, req.h)}`, false); // never smaller than a usable window
  } else return;
  if (req.id) send('Runtime.evaluate', { expression: `window.__vanadiumHostCb?.(${JSON.stringify(req.id)}, ${JSON.stringify(result)})`, contextId: executionContextId }).catch(() => {});
}

async function inject(bundle, watchMode, clientSrc) {
  let target;
  for (let i = 0; i < 120 && !(target = await appTarget()); i++) await sleep(250);
  if (!target) die(`Modrinth App webview did not open port ${PORT} within 30s.`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('DevTools connection failed')); });
  let nextId = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.bindingCalled' && msg.params.name === 'vanadiumHost') return onHostCall(msg.params, send);
    if (!msg.id) return;
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? p?.reject(new Error(msg.error.message)) : p?.resolve(msg.result);
  };
  ws.onclose = () => { log('Modrinth App closed.'); winHost?.kill(); process.exit(0); };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Runtime.addBinding', { name: 'vanadiumHost' }); // page -> loader: window resizing the app's own permissions block
  await send('Page.setBypassCSP', { enabled: true }); // client styles, Google Fonts and remote https media aren't blocked
  let { identifier } = await send('Page.addScriptToEvaluateOnNewDocument', { source: bundle }); // every future reload
  await send('Runtime.evaluate', { expression: bundle }); // the page that is already open
  log('Mods injected. Keep this window open (minimized is fine); closing it removes mods on next reload.');

  if (!watchMode) return;
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const next = await buildBundle(clientSrc);
        new Function(next); // keep the last good bundle when a file is saved mid-edit with a syntax error
        await send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
        ({ identifier } = await send('Page.addScriptToEvaluateOnNewDocument', { source: next }));
        await send('Page.reload');
        log('Change detected: re-injected and reloaded.');
      } catch (e) { log(`Re-inject failed: ${e.message}`); }
    }, 200);
  };
  for (const d of ['client', 'plugins']) if (existsSync(join(HERE, d))) watch(join(HERE, d), rebuild);
  log('Watching client/ and plugins/ for changes.');
}

function shortcuts(action) {
  // Ask Windows for the real folders: the Desktop is often redirected (e.g. to OneDrive).
  const dirs = execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetFolderPath('Programs'); [Environment]::GetFolderPath('Desktop')"], { encoding: 'utf8' })
    .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const links = dirs.filter(existsSync).map((d) => join(d, 'Vanadium.lnk'));
  if (action === 'uninstall') {
    links.forEach((l) => rmSync(l, { force: true }));
    return log('Shortcuts removed. Nothing else to undo: the app itself was never modified.');
  }
  if (!links.length) die('Found neither a Start menu nor a Desktop folder.');
  const ico = join(HERE, 'assets', 'vanadium.ico');
  const icon = existsSync(ico) ? ico : findExe(); // fall back to Modrinth's own icon
  const ps = links.map((l) => `$s = $w.CreateShortcut('${l.replaceAll("'", "''")}');
$s.TargetPath = '${process.execPath.replaceAll("'", "''")}';
$s.Arguments = '"${fileURLToPath(import.meta.url).replaceAll("'", "''")}"';
$s.WorkingDirectory = '${HERE.replaceAll("'", "''")}';
$s.IconLocation = '${icon.replaceAll("'", "''")},0';
$s.Description = 'Modrinth App with Vanadium';
$s.WindowStyle = 7;
$s.Save();`).join('\n');
  execFileSync('powershell', ['-NoProfile', '-Command', `$w = New-Object -ComObject WScript.Shell\n${ps}`], { stdio: 'inherit' });
  log(`Created:\n  ${links.join('\n  ')}`);
}

const args = process.argv.slice(2);
if (args[0] === 'install' || args[0] === 'uninstall') {
  shortcuts(args[0]);
} else {
  const ci = args.indexOf('--client');
  const clientSrc = ci >= 0 ? args[ci + 1] ?? die('--client needs a path or URL') : null;
  const bundle = await buildBundle(clientSrc);
  try { new Function(bundle); } catch (e) { die(`Client bundle has a syntax error: ${e.message}`); }
  await startApp();
  await inject(bundle, args.includes('--watch'), clientSrc);
}
