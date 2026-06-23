# prompt_9_polish.md
## Domain: D9 — Polish & Special Moves
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Handle special chess moves correctly (castling, en passant, pawn promotion) and add visual polish (piece hover effect, camera flip for black's turn in PvP, board label sprites).

---

## Context Snapshot
- `chess.js` handles all special move validation automatically — just call `chess.move({ from, to })`
- After `chess.move()`, FEN changes and `pieces.syncWithFen(fen)` can re-sync the full board
- Castling: king moves 2 squares — `chess.js` moves the rook internally; a FEN sync will fix positions
- En passant: captured pawn is on a different square than `to` — FEN sync handles removal
- `pieces.syncWithFen(fen)` is the safest approach for special moves (re-diffs the whole board)

---

## Tasks

### 1. Fix special move rendering in `MoveHandler.js`

Instead of calling `pieces.movePiece(from, to)` directly in the `'move:made'` handler, switch to FEN sync after animation:
```js
Animations.playMove(movingGroup, detail.from, detail.to, () => {
  // Re-sync all pieces from FEN to handle castling/en-passant/promotion correctly
  pieces.syncWithFen(detail.fen)
})
```
This replaces the direct `pieces.movePiece(from, to)` call. Remove it.

Update `pieces.syncWithFen()` to diff properly:
- Parse FEN board state
- For each square: if piece expected but not present → create it
- For each square in `this.meshes`: if piece not in FEN → remove it
- For pieces that moved: teleport group to new position (they were already animated)

### 2. Piece hover effect in `MoveHandler.js`

Add `'mousemove'` listener on canvas:
```js
renderer.domElement.addEventListener('mousemove', (e) => {
  // raycast same as click
  const hit = this._raycast(e)
  const sq = hit ? hit.object.name : null
  // If sq has a piece of current player's color: scale group to 1.08
  // Otherwise: reset to 1.0
  // Track last hovered square to reset it
})
```
Scale: `group.scale.set(1.08, 1.08, 1.08)` on hover, `set(1, 1, 1)` on leave.

### 3. Camera flip for PvP (optional but nice)

In `MoveHandler._listenGameState()`, on `'move:made'` when mode is `'pvp'`:
```js
const turn = gameState.currentTurn()
const targetZ = turn === 'w' ? 8 : -8
// Animate camera Z smoothly — add to Animations or do a simple lerp in SceneManager.render()
sceneManager.camera.position.z = targetZ
sceneManager.camera.position.x = 0
sceneManager.controls.target.set(0, 0, 0)
sceneManager.controls.update()
```
Only flip if game mode is `'pvp'`. Skip for AI games.

### 4. Pawn promotion dialog (minimal)

When `chess.js` returns a move that needs promotion (check `detail.flags.includes('p')`), show a simple prompt:
```js
const promo = prompt("Promote pawn to: q (Queen), r (Rook), b (Bishop), n (Knight)")
```
Map to `'q'|'r'|'b'|'n'` and pass to `gameState.makeMove(from, to, promo)`.
In AI mode, auto-promote to queen.

### 5. Add FPS counter (dev mode)
In `SceneManager.render()`:
```js
if (import.meta.env.DEV) {
  this._frames = (this._frames || 0) + 1
  const now = performance.now()
  if (now - (this._lastFpsTime || 0) > 1000) {
    document.title = `Chess — ${this._frames} FPS`
    this._frames = 0
    this._lastFpsTime = now
  }
}
```

### 6. Mobile touch support
In `MoveHandler._bindEvents()`, also listen to `'touchend'`:
```js
renderer.domElement.addEventListener('touchend', (e) => {
  e.preventDefault()
  const touch = e.changedTouches[0]
  this._onCanvasClick({ clientX: touch.clientX, clientY: touch.clientY })
})
```

---

## Output Files
- `src/game/MoveHandler.js` (update: FEN sync, hover, touch)
- `src/scene/Pieces.js` (update: `syncWithFen` diff fix)
- `src/scene/SceneManager.js` (update: FPS counter)

## Constraints
- Do NOT rewrite working files — only the specific methods mentioned above
- Do NOT add a complex promotion UI — `prompt()` is acceptable for v1
- Camera flip only in PvP mode

**Show only changed/created files.**
