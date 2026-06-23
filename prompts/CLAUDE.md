# CLAUDE.md — Three.js Chess Game
> Load this file first at the start of every Claude Code session.

---

## What We're Building
A fully playable 3D chess game in the browser using Three.js. Single-player (vs basic AI) or two-player local mode. No backend required — pure frontend.

---

## Stack
- **Renderer**: Three.js (r168+)
- **Chess Logic**: chess.js (handles rules, legal moves, check/checkmate)
- **Build Tool**: Vite (fast dev server + bundler)
- **Language**: JavaScript (ES modules, no TypeScript)
- **Package Manager**: npm
- **No framework** — vanilla JS + Three.js only

---

## File Structure
```
chess-threejs/
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js              # Entry point, bootstraps app
│   ├── scene/
│   │   ├── SceneManager.js  # Three.js scene, camera, renderer, lights
│   │   ├── Board.js         # 3D board geometry and materials
│   │   └── Pieces.js        # 3D piece geometries (per piece type)
│   ├── game/
│   │   ├── GameState.js     # chess.js wrapper, game logic
│   │   ├── MoveHandler.js   # Click → raycast → legal move execution
│   │   └── AI.js            # Simple AI (random or minimax depth-2)
│   ├── ui/
│   │   ├── HUD.js           # Overlay: turn indicator, captured pieces, status
│   │   └── Animations.js    # Move animations (piece glide, capture fade)
│   └── utils/
│       ├── colors.js        # Theme palette constants
│       └── coords.js        # Algebraic notation ↔ 3D world coords
├── public/
│   └── textures/            # Board wood texture, piece normal maps (optional)
└── README.md
```

---

## Architecture Rules
- **SceneManager** owns the Three.js renderer loop — nothing else calls `renderer.render()`
- **GameState** is the single source of truth for board position — always derived from chess.js FEN
- **MoveHandler** translates user input (raycasts) into chess.js moves; it does NOT mutate 3D objects directly — it fires events
- **Board.js** and **Pieces.js** listen to game events and update 3D scene accordingly
- No global variables — use ES module imports/exports
- All 3D world coordinates computed via `coords.js` helpers; never hardcode board positions

---

## Coordinate System
- Board centered at origin (0, 0, 0)
- Each square = 1 unit × 1 unit
- Board spans from (-4, 0, -4) to (4, 0, 4)
- Column a=0 → x=-3.5, column h=7 → x=3.5
- Row 1=0 → z=3.5, Row 8=7 → z=-3.5
- Pieces sit at y=0 on their square center
- `coords.js` exports: `squareToWorld(sq)` and `worldToSquare(x, z)`

---

## Naming Conventions
- Files: PascalCase for classes, camelCase for utilities
- Classes: PascalCase (`SceneManager`, `GameState`)
- Event names: `'move:made'`, `'game:over'`, `'piece:selected'` (kebab-case, namespaced)
- Chess square notation: standard algebraic (`e4`, `d7`, etc.) — always use chess.js format

---

## Do Rules
- Always use `chess.js` for ALL move validation — never hand-roll rules
- Always dispose Three.js geometries and materials when pieces are captured
- Always use `requestAnimationFrame` via SceneManager's render loop
- Camera: OrbitControls with polar angle limits (don't let camera go below board)

---

## Don't Rules
- Don't put game logic in scene files
- Don't put rendering code in game files
- Don't hardcode board square positions — use `coords.js`
- Don't block the render loop with synchronous AI computation > 16ms
- Don't use `eval()` or dynamic imports for chess logic

---

## Dependencies
```json
{
  "three": "^0.168.0",
  "chess.js": "^1.1.0"
}
```
Dev: `vite`

---

## Domain Ownership
| Domain | File(s) |
|--------|---------|
| Scene setup | `SceneManager.js` |
| Board rendering | `Board.js` |
| Piece rendering | `Pieces.js` |
| Game logic | `GameState.js` |
| Input / interaction | `MoveHandler.js` |
| AI | `AI.js` |
| UI overlay | `HUD.js` |
| Animations | `Animations.js` |
| Shared math | `coords.js`, `colors.js` |

---

## Game Modes
- `mode: 'pvp'` — two humans alternate, same screen
- `mode: 'ai'` — human plays white, AI plays black
- Mode selected at startup; stored on `GameState.mode`

## AI Behaviour
- Difficulty: `easy` (random legal move), `medium` (minimax depth 2)
- AI runs via `setTimeout(0)` after human move to avoid blocking render
