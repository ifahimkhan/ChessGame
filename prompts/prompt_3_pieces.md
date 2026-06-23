# prompt_3_pieces.md
## Domain: D4 (partial) — 3D Chess Piece Rendering
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Render all 32 chess pieces as distinct 3D geometries. Each piece type (pawn, rook, knight, bishop, queen, king) has a recognisable silhouette built from primitive Three.js geometries.

---

## Context Snapshot
- `squareToWorld(sq)` returns `{ x, z }` — piece sits at `(x, 0, z)` (y=0 base, body extends up)
- White pieces: `COLORS.pieceWhite`, black pieces: `COLORS.pieceBlack`
- Pieces cast and receive shadows (renderer has `shadowMap.enabled = true`)
- Each piece mesh group: `mesh.userData = { square, color, type }` (e.g. `{ square:'e2', color:'w', type:'p' }`)
- Chess.js piece types: `'p','r','n','b','q','k'`

---

## Tasks

### 1. Create `src/scene/Pieces.js`

#### Geometry factory functions (one per type)
Build each piece from stacked/merged primitives using `THREE.Group`:

| Piece | Geometry recipe |
|-------|----------------|
| **Pawn** (`p`) | `CylinderGeometry` base (r=0.3, h=0.1) + tapered cylinder body (r=0.2→0.15, h=0.5) + sphere head (r=0.2) |
| **Rook** (`r`) | Cylinder base (r=0.35, h=0.1) + cylinder tower (r=0.25, h=0.7) + flat cylinder top (r=0.3, h=0.15) |
| **Knight** (`n`) | Cylinder base + box body (0.3×0.5×0.25) + box head at angle (simulate horse head; tilt 20°) |
| **Bishop** (`b`) | Cylinder base + tapered body + small sphere + spike (`ConeGeometry` r=0.07, h=0.25) |
| **Queen** (`q`) | Wide cylinder base + tapered body + sphere + small crown ring (torus r=0.2, tube=0.05) |
| **King** (`k`) | Like queen but taller + cross on top (two thin boxes intersecting) |

Each factory: `function createPiece(type, color)` → returns `THREE.Group`
- Apply `MeshPhongMaterial` (specular highlight looks good for chess pieces)
- Set `castShadow = true` on all child meshes
- White pieces: white material with slight grey shininess; Black pieces: near-black with subtle sheen

#### `class Pieces`

##### `constructor(scene)`
- `this.scene = scene`
- `this.meshes = {}` (map: square → Group)
- Does NOT place pieces on init — wait for `syncWithFen()`

##### `syncWithFen(fen)`
- Parse FEN using `chess.js`: `new Chess(fen).board()` returns 8×8 array
- Diff against `this.meshes` — remove captured pieces, add new pieces
- For each piece on the board: if not already in `this.meshes[sq]`, create and add
- Use `squareToWorld(sq)` to position
- Dispose meshes for squares that are now empty

##### `movePiece(from, to)`
- Immediately teleport (no animation — animations in `Animations.js`)
- Update `this.meshes` mapping

##### `removePiece(square)`
- Dispose geometry + materials, remove from scene, delete from `this.meshes`

##### `getGroup(square)` → returns Group or null

### 2. Initial board setup
Standard starting FEN:
`'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'`

### 3. Update `src/main.js`
```js
import { Pieces } from './scene/Pieces.js'
const pieces = new Pieces(sceneManager.scene)
pieces.syncWithFen(STARTING_FEN)
```

---

## Output Files
- `src/scene/Pieces.js` (create)
- `src/main.js` (update)

## Constraints
- No animation logic here (that belongs in `Animations.js`)
- No click/interaction here
- Dispose every removed geometry and material — no memory leaks
- Knight doesn't need to look perfect — readable silhouette is sufficient

**Show only changed/created files.**
