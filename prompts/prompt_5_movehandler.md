# prompt_5_movehandler.md
## Domain: D5 — User Input / Raycasting / Move Interaction
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Wire up mouse click → raycast → square detection → GameState interaction → Board highlights + Piece movement. This is the glue layer between the 3D scene and the game logic.

---

## Context Snapshot
- Raycasting: `THREE.Raycaster` against `board.squareMeshes` (flat square planes)
- `worldToSquare(x, z)` from `coords.js` to convert hit point → chess square
- Listen on `GameState` events (`'piece:selected'`, `'move:made'`, `'game:over'`)
- `board.highlight(sq, type)` and `board.clearHighlights(types)` for visual feedback
- `pieces.movePiece(from, to)` and `pieces.removePiece(sq)` to update 3D scene
- Animations: `Animations.playMove(pieceGroup, from, to)` (added in prompt_6)

---

## Tasks

### 1. Create `src/game/MoveHandler.js`

```js
export class MoveHandler {
  constructor(renderer, camera, board, pieces, gameState) {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    // store refs...
    this._bindEvents()
    this._listenGameState()
  }
```

#### `_bindEvents()`
- Listen to `'click'` on `renderer.domElement`
- On click: call `this._onCanvasClick(event)`

#### `_onCanvasClick(event)`
1. Convert mouse position to NDC: `mouse.x = (event.clientX / window.innerWidth) * 2 - 1`
2. `raycaster.setFromCamera(mouse, camera)`
3. Cast against `Object.values(board.squareMeshes)` (array of plane meshes)
4. If hit: extract `hit.object.name` → that's the chess square (e.g. `'e4'`)
5. Forward to `gameState.selectSquare(square)`

#### `_listenGameState()`
Listen to events on `gameState`:

**`'piece:selected'`**
- `board.clearHighlights(['selected', 'legalMove'])`
- `board.highlight(detail.square, 'selected')`
- For each sq in `detail.legalMoves`: `board.highlight(sq, 'legalMove')`

**`'piece:deselected'`**
- `board.clearHighlights(['selected', 'legalMove'])`

**`'move:made'`**
- `board.clearAllHighlights()`
- `board.highlight(detail.from, 'lastMove')`
- `board.highlight(detail.to, 'lastMove')`
- If `detail.captured`: `pieces.removePiece(detail.to)` (before moving)
  - Actually: remove first, then move (order matters — captured piece is on `to` square)
- `pieces.movePiece(detail.from, detail.to)`
- (Animations hook: wrap `movePiece` with animation call in prompt_6)

**`'move:illegal'`**
- Brief red flash on `detail.from` (optional: setTimeout 300ms to clear)

**`'game:over'`**
- Disable further clicks: `this.disabled = true`
- Delegate to HUD (HUD listens to same event)

#### `_squareFromHit(hit)` → chess square string
Use `hit.object.name` (set in Board.js as the square name).

---

### 2. Update `src/main.js`
```js
import { MoveHandler } from './game/MoveHandler.js'
const moveHandler = new MoveHandler(
  sceneManager.renderer,
  sceneManager.camera,
  board,
  pieces,
  gameState
)
```

---

## Output Files
- `src/game/MoveHandler.js` (create)
- `src/main.js` (update)

## Constraints
- MoveHandler does NOT own any game logic — it only calls `gameState.selectSquare()`
- MoveHandler does NOT compute legal moves — those come from `GameState` events
- Do NOT add AI calls here (AI is in `AI.js` and triggered by `'move:made'` event)
- Keep under 130 lines

**Show only changed/created files.**
