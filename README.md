<p align="center"><img src="assets/vanadium-logo.svg" width="112" alt="Vanadium logo"></p>

<h1 align="center">Vanadium</h1>
<p align="center">A visual overhaul and client mod for the <a href="https://modrinth.com/app">Modrinth App</a>, in the spirit of Vencord.</p>

Vanadium re-skins and rearranges the whole launcher. It adds Hyprland-style tiling, glass and wallpaper themes, your own loading screen, background video and music, and hides clutter like the news feed and ads. It runs inside the launcher at startup and **never modifies the Modrinth install**, so app updates don't break it.

> Windows only (see [Platforms](#platforms)). Not affiliated with or endorsed by Modrinth.

## Features

- **Themes:** Hyprland, CachyOS, Liquid Glass, Catppuccin, Tokyo Night, Rosé Pine, Nord, AMOLED, Wallpaper and Stock.
- **Wallpaper theme (pywal-style):** takes its accent and panel colors from your background image, GIF or video, and updates when you change it.
- **Layouts:**
  - **Tiled:** floating windows with gaps and gradient borders that light up (and can spin) on hover.
  - **Glass:** frosted panels.
  - **Flat:** solid panels.
  - **Stock:** Modrinth unchanged.
- **Look & feel:**
  - 8 color palettes, two accent colors and Google Fonts.
  - Panel opacity, blur, corner radius, gaps and border width.
  - Window buttons in Default, Minimal or Traffic-light style.
  - Animations, which respect the system's reduced-motion setting.
- **Arrange the launcher:**
  - Drag panel edges or corners to resize the nav bar, title bar and sidebar.
  - `Ctrl+Shift+L` enters arrange mode, where you drag panels to new sides.
- **Window resizing:** drag any edge or corner of the window, which Modrinth itself doesn't allow.
- **Background:** an image, GIF or video (local file or https link), with dim and sound controls.
- **Custom loading screen:** an MP4, WebM, GIF or image replaces the Modrinth splash.
- **Music:**
  - A playlist of local files or direct links, with shuffle, volume and a title-bar mini player.
  - Music and background video pause automatically while Minecraft runs.
- **Declutter:**
  - Hide the news feed (there's a Hide button right on its heading), the ad and the "Upgrade to Modrinth+" button, the sign-in prompt, nav buttons, or the whole sidebar.
  - Streamer mode blurs your account.
- **Extras:** a plugins folder, a live custom CSS editor, and settings backup/import.

## Install

Requirements: Windows 10 or 11, the [Modrinth App](https://modrinth.com/app), and [Node.js](https://nodejs.org) 22 or newer. Nothing else: no `npm install`, no build step.

1. Download the latest release ZIP from [Releases](../../releases) and unpack it somewhere permanent, for example `Documents\Vanadium`. Or clone the repo:
   ```
   git clone https://github.com/lukas67pro-dotcom/Vanadium.git
   ```
2. Create a Desktop and Start menu shortcut with the Vanadium icon, from inside that folder:
   ```
   cd Vanadium
   node modrinth-mod.mjs install
   ```
3. Start Modrinth from the **Vanadium** shortcut. If Modrinth is already open, it closes gracefully and restarts with Vanadium.

Click the Vanadium logo in the nav bar, or press `Ctrl+Shift+M`, to open the settings.

### Commands

```
node modrinth-mod.mjs              # launch Modrinth with Vanadium
node modrinth-mod.mjs install      # Desktop + Start menu shortcut "Vanadium"
node modrinth-mod.mjs uninstall    # remove the shortcuts
node modrinth-mod.mjs --watch      # re-inject and reload whenever client/ or plugins/ change (for development)
node modrinth-mod.mjs --client <path|https-url>   # use a single-file client bundle instead of client/
```

Keep the small loader window open while you use Modrinth (the shortcut starts it minimized). Closing it turns the mod off at the next reload, and window resizing stops.

### Shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl+Shift+M` | open or close the settings |
| `Ctrl+Shift+L` | arrange mode |
| `Esc` | close settings, leave arrange mode, skip the loading screen |
| Scroll over the mini player | music volume |

## How it works

```
modrinth-mod.mjs ──spawn──▶ Modrinth App.exe   (env WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333)
     └──Chrome DevTools Protocol on 127.0.0.1──▶ inject client/*.js before Modrinth's own scripts, on every load
```

The Modrinth App is a Tauri app, and its frontend is compiled into the `.exe`. Instead of patching anything, the loader starts the app with WebView2's debugging port enabled on localhost and injects the client bundle over CDP.

| Path | Job |
| --- | --- |
| `modrinth-mod.mjs` | loader: finds and starts the app, injects the bundle, creates shortcuts, resizes the window |
| `client/00-core.js` | settings store, DOM helpers, IndexedDB media library, tooltips, toasts |
| `client/10-themes.js` | palettes, presets, layout engine, Wallpaper color extraction |
| `client/20-declutter.js` | hide rules, ad window, streamer mode |
| `client/30-media.js` | background, loading screen, music |
| `client/35-arrange.js` | panel resizing and arrange mode |
| `client/36-window.js` | window edge and corner resizing |
| `client/40-ui.js` | full-screen settings |
| `client/50-boot.js` | startup, hotkeys, plugin API |
| `plugins/` | your own scripts (example: `clock.js`) |

Notes:

- **Local media** you pick is stored in the launcher's own browser storage (IndexedDB), so large videos work and nothing depends on file paths.
- **The ad** is a separate native window. Vanadium hides it through the same counter the app itself uses while in fullscreen.
- **Window resizing** is blocked by Modrinth's permissions, so the loader does it from outside with the Win32 API.

## Plugins

Every `plugins/*.js` file runs after the page loads, with `MRMod` in scope:

```js
// My plugin: the first comment line shows up as the plugin's description.
MRMod.addStyle('.app-grid-navbar { border-right: 2px solid var(--vn-a1); }');
MRMod.onChange((patch) => console.log('settings changed', patch));
```

The API is `get`, `set`, `onChange`, `addStyle`, `invoke`, `toast`, `media` and `open`. You can turn plugins on and off in the settings.

## Platforms

Windows only. macOS (WKWebView) and Linux (WebKitGTK) have no DevTools switch an outside program can turn on. On those systems you'd have to build Modrinth from source ([modrinth/code](https://github.com/modrinth/code)) with the client bundled in.

## Limits

- **Selectors can break.** Vanadium targets Modrinth's current page structure, and a Modrinth redesign can need selector updates.
- **Some links don't work.** Streaming pages (YouTube, Spotify, SoundCloud) can't be used as music or backgrounds; link to the media file itself.
- **Wallpaper colors and blocked sites.** The Wallpaper theme can't read images from websites that block cross-site pixel access. Download those and pick the file instead.

## Security

- While Modrinth runs with Vanadium, the debugging port on `127.0.0.1:9333` gives **any program on your PC** full control over the launcher page, including your logged-in Modrinth and Microsoft sessions. It isn't reachable from the network, but only use Vanadium on a PC you trust.
- Plugins, custom CSS and `--client` URLs run with the same access. Only load code you've read.

## License

[Apache License 2.0](LICENSE).
