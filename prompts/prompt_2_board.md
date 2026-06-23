# prompt_2_board.md
## Domain: D4 (partial) — 3D Board Rendering
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Render a beautiful 3D chessboard with 64 alternating squares, a border frame, and square highlight support (selected, legal move, last move).

---

## Context Snapshot
- Board centered at origin; each square = 1 unit
- Light squares: `COLORS.boardLight`, dark squares: `COLORS.boardDark`
- Use `squareToWorld(sq)` from `coords.js` for all positioning
- SceneManager scene object: `sceneManager.scene`
- Highlights are separate overlay planes slightly above (y=0.01) the square

---

## Tasks

### 1. Create `src/scene/Board.js`

**Class `Board`:**

#### `constructor(scene)`
- Store ref to scene
- Call `this.buildSquares()` and `this.buildBorder()`
- Init `this.highlights = {}` (map: square → Mesh)

#### `buildSquares()`
- Loop all 64 squares (a1–h8)
- For each: create `PlaneGeometry(1, 1)` rotated to lie flat (rotate X by -π/2)
- Material: `MeshLambertMaterial({ color })` — light or dark based on square color
- Position using `squareToWorld(sq)` at y=0
- Name each mesh: `mesh.name = sq` (e.g. `'e4'`)
- Add to scene; store in `this.squareMeshes = {}`

#### `buildBorder()`
- Create a slightly larger `BoxGeometry(8.4, 0.15, 8.4)` platform
- Material: dark wood color `#5c3d1e`
- Position at y=-0.08 (just below the squares)
- Add coordinates label (optional): rank numbers 1–8 on left edge, file letters a–h on bottom edge using `TextGeometry` or canvas sprites (skip if complex — mark as TODO)

#### `highlight(square, type)`
- `type`: `'selected'` | `'legalMove'` | `'lastMove'`
- Creates a `PlaneGeometry(0.95, 0.95)` at y=0.01 above the square
- Material: `MeshBasicMaterial({ color: COLORS[type], transparent: true, opacity: 0.6 })`
- Stores in `this.highlights[square]`; removes old highlight for same square first

#### `clearHighlights(types)`
- `types`: array of types to clear e.g. `['selected', 'legalMove']`
- Disposes geometry + material, removes from scene, deletes from `this.highlights`

#### `clearAllHighlights()`
- Calls `clearHighlights` for all highlight types

### 2. Update `src/main.js`
```js
import { Board } from './scene/Board.js'
const board = new Board(sceneManager.scene)
```
Verify board renders correctly in browser.

---

## Output Files
- `src/scene/Board.js` (create)
- `src/main.js` (update import)

## Constraints
- Do NOT add piece meshes here
- Do NOT add click interaction here (that's MoveHandler)
- Always dispose old highlight meshes before creating new ones
- Keep under 150 lines

**Show only changed/created files.**
