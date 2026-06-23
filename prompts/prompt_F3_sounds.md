# prompt_F3_sounds.md
## Feature: Sound Effects (move, capture, check)
## Domain: D4 — Audio / UI
**Read CLAUDE.md (and any addendum files) first before touching any file.**

---

## Goal
Play a distinct sound for every piece move, capture, and check using Lichess's open-source audio files
(AGPLv3, free to use). Sounds are preloaded at startup. A mute toggle is shown in the HUD.

---

## Sound Source — Lichess "standard" set (AGPLv3)
Download these three files from the Lichess lila repository and place them in `public/sounds/`:

| Event | File to download | Save as |
|-------|-----------------|---------|
| Move  | `https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Move.mp3` | `public/sounds/move.mp3` |
| Capture | `https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Capture.mp3` | `public/sounds/capture.mp3` |
| Check / notify | `https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/GenericNotify.mp3` | `public/sounds/check.mp3` |

Download command (run once from project root):
```bash
mkdir -p public/sounds
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Move.mp3"          -o public/sounds/move.mp3
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Capture.mp3"       -o public/sounds/capture.mp3
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/GenericNotify.mp3" -o public/sounds/check.mp3
```

---

## Context Snapshot
- `GameState` fires `'move:made'` with `{ captured, fen }` — use `captured` (truthy) to pick capture vs move sound
- `chess.js` exposes `chess.isCheck()` after a move — check if the resulting position has check
- `GameState.chess` is the live `Chess` instance — read `gameState.chess.isCheck()` after move
- `Web Audio API` (`AudioContext`) gives volume control and avoids browser autoplay restrictions
- All sounds must be preloaded before first move (no latency on first play)
- Mute state persists in `localStorage` key `'chess-muted'`

---

## Tasks

### 1. Create `src/ui/SoundManager.js`

```js
export class SoundManager {
  constructor() {
    this._muted = localStorage.getItem('chess-muted') === 'true'
    this._ctx = null      // AudioContext — created on first user gesture
    this._buffers = {}    // { move, capture, check }
    this._loaded = false
  }
```

#### `async preload()`
Load all three sounds via `fetch` + `AudioContext.decodeAudioData`:
```js
async preload() {
  // Create AudioContext lazily (requires user gesture in some browsers — ok here
  // because preload is called from the mode selector button click handler)
  this._ctx = new (window.AudioContext || window.webkitAudioContext)()

  const files = {
    move:    '/sounds/move.mp3',
    capture: '/sounds/capture.mp3',
    check:   '/sounds/check.mp3',
  }

  await Promise.all(
    Object.entries(files).map(async ([name, path]) => {
      const res = await fetch(path)
      const arrayBuffer = await res.arrayBuffer()
      this._buffers[name] = await this._ctx.decodeAudioData(arrayBuffer)
    })
  )
  this._loaded = true
}
```

#### `play(name)`
`name`: `'move'` | `'capture'` | `'check'`
```js
play(name) {
  if (this._muted || !this._loaded || !this._buffers[name]) return
  const source = this._ctx.createBufferSource()
  source.buffer = this._buffers[name]
  source.connect(this._ctx.destination)
  source.start(0)
}
```

#### `playForMove(detail, chess)`
Convenience — called from the `'move:made'` listener:
```js
playForMove(detail, chess) {
  // Check takes priority — plays instead of (not in addition to) move/capture
  if (chess.isCheck()) {
    this.play('check')
  } else if (detail.captured) {
    this.play('capture')
  } else {
    this.play('move')
  }
}
```

#### `toggleMute()`
```js
toggleMute() {
  this._muted = !this._muted
  localStorage.setItem('chess-muted', this._muted)
  return this._muted
}

isMuted() { return this._muted }
```

---

### 2. Update `src/ui/HUD.js`
Add a mute button to the HUD:

In `constructor`, after existing setup:
```js
this._soundManager = soundManager  // passed in as constructor param
this._renderMuteButton()
```

#### `_renderMuteButton()`
Append to the `#hud` div:
```js
_renderMuteButton() {
  const btn = document.createElement('button')
  btn.id = 'mute-btn'
  btn.textContent = this._soundManager.isMuted() ? '🔇' : '🔊'
  btn.title = 'Toggle sound'
  btn.addEventListener('click', () => {
    const muted = this._soundManager.toggleMute()
    btn.textContent = muted ? '🔇' : '🔊'
  })
  document.getElementById('hud').appendChild(btn)
}
```

Add CSS in `index.html`:
```css
#mute-btn {
  display: block; margin-top: 10px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; font-size: 1.2rem; padding: 6px 10px; border-radius: 8px;
  cursor: pointer; pointer-events: all;
  transition: background 0.15s;
}
#mute-btn:hover { background: rgba(255,255,255,0.2); }
```

Update HUD constructor signature:
```js
export class HUD {
  constructor(gameState, soundManager) {   // <-- add soundManager param
```

Listen for `'move:made'` to trigger sound (centralised here, not in MoveHandler):
```js
gameState.addEventListener('move:made', (e) => {
  soundManager.playForMove(e.detail, gameState.chess)
  // ... existing move:made logic (turn indicator, history, captured pieces)
})
```

---

### 3. Update `src/main.js`

#### Preload sounds after mode selection (inside async `init()`):
```js
import { SoundManager } from './ui/SoundManager.js'

async function init() {
  const { mode, difficulty } = await ModeSelector.show()

  // Preload sounds right after first user gesture (button click = valid gesture)
  const soundManager = new SoundManager()
  soundManager.preload().catch(err => console.warn('Sound load failed:', err))

  // Pass soundManager into HUD
  const hud = new HUD(gameState, soundManager)

  // ... rest of init unchanged
}
```

> `preload()` is fire-and-forget with a catch — if sounds fail to load (e.g. files missing),
> the game still works silently. No blocking on sound load.

---

### 4. Verify sound file download worked
Add a one-time check in `SoundManager.preload()`:
```js
// If any fetch fails, log a helpful message
.catch(err => {
  console.warn(`[SoundManager] Failed to load ${name}:`, err)
  console.warn('Run the curl commands in prompt_F3_sounds.md to download the audio files.')
})
```

---

## Output Files
- `src/ui/SoundManager.js` (create)
- `src/ui/HUD.js` (update: add soundManager param + mute button + move sound trigger)
- `src/main.js` (update: import SoundManager, preload, pass to HUD)
- `index.html` (update: mute button CSS)
- `public/sounds/move.mp3`, `capture.mp3`, `check.mp3` (download via curl, not code)

## Constraints
- Do NOT put sound logic in `MoveHandler` or `GameState` — only in `HUD` and `SoundManager`
- Do NOT block game init on sound loading — fire-and-forget with catch
- `AudioContext` must be created after a user gesture — the mode selector button click is that gesture
- Check sound plays INSTEAD of move/capture sound, not in addition (matches Lichess behaviour)
- Mute toggle persists across page refreshes via `localStorage`
- Do NOT change `Board`, `Pieces`, `SceneManager`, `AI`, or `CameraFlip`

**Show only changed/created files.**
