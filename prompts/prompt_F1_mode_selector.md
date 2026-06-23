# prompt_F1_mode_selector.md
## Feature: Multiplayer Mode Selector UI
## Domain: D4 — UI / Screens
**Read CLAUDE.md (and CLAUDE_addendum_boardflip.md) first before touching any file.**

---

## Goal
Add a full-screen mode selection overlay that appears before the game starts (and again after restart). The player chooses "vs Human" or "vs AI". The choice is passed to `GameState` and determines whether the board flips after each move.

---

## Context Snapshot
- `GameState` already accepts `mode` in constructor: `new GameState('pvp')` or `new GameState('ai')`
- `gameState.reset()` resets game state without reconstructing — safe to call on restart
- `index.html` already has `<div id="hud">` — add a sibling `<div id="mode-selector">`
- `src/main.js` currently initialises everything at load — must be deferred until mode is chosen
- `ModeSelector` resolves a Promise with the chosen mode — clean async init pattern

---

## Tasks

### 1. Update `index.html`
Add before `<div id="hud">`:
```html
<div id="mode-selector">
  <div class="mode-card">
    <h1>♟ Chess</h1>
    <p class="subtitle">Choose your game mode</p>
    <div class="mode-buttons">
      <button class="mode-btn" data-mode="pvp">
        <span class="mode-icon">👥</span>
        <span class="mode-label">vs Human</span>
        <span class="mode-desc">Pass &amp; play — board flips after each move</span>
      </button>
      <button class="mode-btn" data-mode="ai">
        <span class="mode-icon">🤖</span>
        <span class="mode-label">vs AI</span>
        <span class="mode-desc">Play white against the computer</span>
      </button>
    </div>
    <div class="difficulty-row" id="difficulty-row" style="display:none">
      <label>AI difficulty:</label>
      <select id="difficulty-select">
        <option value="easy">Easy (random)</option>
        <option value="medium">Medium (minimax)</option>
      </select>
    </div>
  </div>
</div>
```

### 2. Add CSS for mode selector (inside `<style>` in `index.html`)
```css
#mode-selector {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10, 10, 30, 0.92);
  backdrop-filter: blur(6px);
  transition: opacity 0.4s ease;
}
#mode-selector.hidden { opacity: 0; pointer-events: none; }

.mode-card {
  text-align: center; color: #fff;
  font-family: 'Segoe UI', sans-serif;
}
.mode-card h1 { font-size: 3rem; margin: 0 0 8px; letter-spacing: 2px; }
.subtitle { color: #aaa; font-size: 1rem; margin-bottom: 32px; }

.mode-buttons { display: flex; gap: 20px; justify-content: center; }

.mode-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.15);
  color: #fff; border-radius: 16px; padding: 28px 36px;
  cursor: pointer; transition: background 0.2s, border-color 0.2s, transform 0.15s;
  width: 180px;
}
.mode-btn:hover {
  background: rgba(255,255,255,0.14); border-color: #4a90d9;
  transform: translateY(-3px);
}
.mode-icon { font-size: 2.5rem; }
.mode-label { font-size: 1.1rem; font-weight: 600; }
.mode-desc { font-size: 0.75rem; color: #aaa; line-height: 1.4; }

.difficulty-row {
  margin-top: 20px; color: #ccc; font-size: 0.9rem;
  display: flex; align-items: center; gap: 10px; justify-content: center;
}
.difficulty-row select {
  padding: 6px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; font-size: 0.9rem;
}
```

### 3. Create `src/ui/ModeSelector.js`
```js
export class ModeSelector {
  /**
   * Returns a Promise that resolves with { mode, difficulty }
   * when the player makes a selection.
   */
  static show() {
    return new Promise((resolve) => {
      const overlay = document.getElementById('mode-selector')
      const diffRow = document.getElementById('difficulty-row')
      const diffSelect = document.getElementById('difficulty-select')

      // Show difficulty selector only when AI is hovered
      overlay.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          diffRow.style.display = btn.dataset.mode === 'ai' ? 'flex' : 'none'
        })
      })

      overlay.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.mode
          const difficulty = mode === 'ai' ? (diffSelect.value || 'easy') : null
          // Fade out
          overlay.classList.add('hidden')
          setTimeout(() => {
            overlay.style.display = 'none'
            resolve({ mode, difficulty })
          }, 400)
        })
      })
    })
  }

  /**
   * Re-show the selector (called on game restart).
   * Returns same Promise shape.
   */
  static reshowAfterGame() {
    const overlay = document.getElementById('mode-selector')
    overlay.style.display = 'flex'
    // Trigger reflow before removing class
    overlay.offsetHeight
    overlay.classList.remove('hidden')
    return ModeSelector.show()
  }
}
```

### 4. Update `src/main.js`
Wrap the game initialisation in an async function and defer until mode resolves:

```js
import { ModeSelector } from './ui/ModeSelector.js'
// ... other imports ...

async function init() {
  // 1. Show mode selector — wait for player choice
  const { mode, difficulty } = await ModeSelector.show()

  // 2. Init game state with chosen mode
  const gameState = new GameState(mode)

  // 3. Init scene, board, pieces (SceneManager already started its loop)
  const board = new Board(sceneManager.scene)
  const pieces = new Pieces(sceneManager.scene)
  pieces.syncWithFen(gameState.getFen())

  // 4. Wire interactions
  const cameraFlip = new CameraFlip(sceneManager, gameState)   // prompt_F2
  const moveHandler = new MoveHandler(sceneManager.renderer, sceneManager.camera, board, pieces, gameState, cameraFlip)
  const hud = new HUD(gameState)

  // 5. Wire AI if needed
  if (mode === 'ai') {
    const { AI } = await import('./game/AI.js')
    new AI(gameState, difficulty || 'easy')
  }

  // 6. On restart: re-show mode selector
  gameState.addEventListener('game:reset', async () => {
    pieces.syncWithFen(gameState.getFen())
    board.clearAllHighlights()
    const next = await ModeSelector.reshowAfterGame()
    // Re-init with new mode if changed
    if (next.mode !== gameState.mode) {
      gameState.mode = next.mode
      // Re-attach AI if switching to AI mode
    }
    gameState.reset()
    pieces.syncWithFen(gameState.getFen())
  })
}

sceneManager.start()
init()
```

---

## Output Files
- `index.html` (update: add `#mode-selector` markup + CSS)
- `src/ui/ModeSelector.js` (create)
- `src/main.js` (update: async init wrapping all game setup)

## Constraints
- Do NOT change `GameState`, `Board`, `Pieces`, `MoveHandler`, or `SceneManager` in this prompt
- Mode selector must be removed from DOM view (display:none) before game starts — not just hidden
- SceneManager can start its render loop before mode is selected — that's fine (renders empty scene)
- `CameraFlip` is imported but implemented in `prompt_F2` — add the import but handle gracefully if not yet present

**Show only changed/created files.**
