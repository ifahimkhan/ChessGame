# prompt_8_hud.md
## Domain: D4 (partial) — HUD / 2D UI Overlay
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Build the HTML overlay showing: whose turn it is, check warning, captured pieces, move history, and game-over screen. Pure HTML/CSS — no Three.js.

---

## Context Snapshot
- HUD mounts into `<div id="hud">` (already in `index.html`)
- Listens to `GameState` events: `'move:made'`, `'piece:selected'`, `'game:over'`, `'game:reset'`
- Captured pieces shown as unicode chess symbols
- Move history shown as scrollable list of SAN notation
- Check state: `gameState.chess.isCheck()` checked after each move

---

## Tasks

### 1. Update `index.html`
Add inside `<div id="hud">`:
```html
<div id="turn-indicator">White's Turn ♙</div>
<div id="check-warning" class="hidden">⚠️ CHECK!</div>
<div id="captured-pieces">
  <div id="captured-white"></div>
  <div id="captured-black"></div>
</div>
<div id="move-history"></div>
<div id="game-over-screen" class="hidden">
  <h2 id="game-over-title"></h2>
  <button id="restart-btn">Play Again</button>
</div>
```

### 2. Add CSS (inline in `<style>` in index.html or separate `src/ui/hud.css`)
```css
#hud {
  position: fixed; top: 16px; left: 16px;
  color: #fff; font-family: 'Segoe UI', sans-serif;
  pointer-events: none; /* allow clicks to pass through to canvas */
  z-index: 10;
}
#turn-indicator { font-size: 1.2rem; background: rgba(0,0,0,0.5); padding: 8px 14px; border-radius: 8px; }
#check-warning { color: #ff4444; font-weight: bold; font-size: 1rem; margin-top: 6px; }
.hidden { display: none; }
#move-history {
  margin-top: 12px; max-height: 240px; overflow-y: auto;
  background: rgba(0,0,0,0.45); padding: 8px; border-radius: 8px;
  font-size: 0.85rem; line-height: 1.6;
}
#game-over-screen {
  position: fixed; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: rgba(0,0,0,0.75); pointer-events: all;
}
#game-over-screen h2 { color: #ffd700; font-size: 2.5rem; }
#restart-btn { margin-top: 16px; padding: 12px 32px; font-size: 1rem; cursor: pointer; border-radius: 8px; border: none; background: #4a90d9; color: #fff; }
```

### 3. Create `src/ui/HUD.js`

#### Unicode piece symbols
```js
const SYMBOLS = { w: { p:'♙', r:'♖', n:'♘', b:'♗', q:'♕', k:'♔' },
                  b: { p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚' } }
```

#### `class HUD`
```js
export class HUD {
  constructor(gameState) {
    this.gameState = gameState
    this.capturedByWhite = []  // pieces white has captured
    this.capturedByBlack = []  // pieces black has captured
    this.moveNumber = 1
    this._listen()
    this._updateTurnIndicator()
  }
```

#### `_listen()`
- `'move:made'` → 
  - If `detail.captured`: push to appropriate captured array, `_renderCaptured()`
  - Append to `#move-history` (pair SAN moves: `"1. e4 e5"`)
  - `_updateTurnIndicator()`
  - Toggle `#check-warning` visibility: `gameState.chess.isCheck()`
- `'game:over'` → show `#game-over-screen`, set title text
- `'game:reset'` → reset all state, re-render

#### `_updateTurnIndicator()`
```js
const turn = this.gameState.currentTurn()
el.textContent = turn === 'w' ? "White's Turn ♙" : "Black's Turn ♟"
```

#### `_renderCaptured()`
- Render arrays as unicode symbols into `#captured-white` and `#captured-black`

#### Restart button
```js
document.getElementById('restart-btn').addEventListener('click', () => {
  gameState.reset()
  pieces.syncWithFen(gameState.getFen())
  board.clearAllHighlights()
})
```
(Restart button needs `pointer-events: all` override on the game-over screen)

### 4. Update `src/main.js`
```js
import { HUD } from './ui/HUD.js'
const hud = new HUD(gameState)
```

---

## Output Files
- `index.html` (update: add HUD markup + styles)
- `src/ui/HUD.js` (create)
- `src/main.js` (update)

## Constraints
- HUD.js must not import Three.js
- `pointer-events: none` on `#hud` except game-over screen (so clicks reach canvas)
- Move history: only append, never re-render the full list (performance)

**Show only changed/created files.**
