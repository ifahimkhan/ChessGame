# ♟️ 3D Chess

A browser-based 3D chess game built with **Three.js**. Play against a friend (PvP)
or a built-in AI, with lathe-turned wooden pieces, animated moves, captured-piece
tracking, and move history.

---

## 📸 Screenshots & Demo

> Drop your images and video into the `docs/` folder, then the links below will render.

### Gameplay
<!-- Replace with your own screenshot: save it as docs/screenshot-1.png -->
![Gameplay screenshot](docs/screenshot-1.png)

### Wooden pieces close-up
<!-- save as docs/screenshot-2.png -->
![Wooden pieces](docs/screenshot-2.png)

### Video demo
<!-- GitHub renders an uploaded .mp4 inline. Either: -->
<!-- 1. Drag-drop a video into a GitHub issue/PR and paste the generated URL here, or -->
<!-- 2. Commit docs/demo.mp4 and link it: -->

https://user-images.githubusercontent.com/...  <!-- paste GitHub video URL here -->

<!-- Or a linked thumbnail fallback: -->
<!-- [![Watch the demo](docs/screenshot-1.png)](docs/demo.mp4) -->

---

## ✨ Features

- **3D board & pieces** rendered with Three.js, orbit-controllable camera
- **Wooden pieces** — lathe-turned silhouettes with procedural wood-grain
  textures and a lacquered (clearcoat) finish; boxwood for white, walnut for black
- **Two modes** — local Player vs Player, or Player vs AI
- **AI opponent** — `easy` (random) and `medium` (alpha-beta minimax)
- **Animated moves** — arc glide for moves, scale-and-fade for captures
- **HUD overlay** — turn indicator, check warning, captured pieces, move history
- **Game over screen** with a working **Play Again** button (no refresh needed)
- Full rules via [chess.js](https://github.com/jhlywa/chess.js): castling, en
  passant, promotion, check/checkmate/stalemate/draw detection

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+

### Install & run
```bash
npm install
npm run dev      # starts Vite dev server and opens the browser
```

### Build for production
```bash
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

---

## 🎮 How to Play

- **Click** a piece to select it; legal destination squares are highlighted.
- **Click** a highlighted square to move. Click the piece again to deselect.
- Promotions prompt for the target piece (queen / rook / bishop / knight).
- **Drag** with the mouse to orbit the camera; scroll to zoom.

### Game modes (URL parameters)

| URL | Mode |
|-----|------|
| `/` or `?mode=ai` | Player (white) vs AI (black) — default |
| `?mode=pvp` | Local two-player |
| `?mode=ai&diff=easy` | AI plays random moves |
| `?mode=ai&diff=medium` | AI uses minimax search |

Example: `http://localhost:5173/?mode=ai&diff=medium`

---

## 🛠️ Tech Stack

- **[Three.js](https://threejs.org/)** — 3D rendering, lighting, shadows, IBL
- **[chess.js](https://github.com/jhlywa/chess.js)** — move generation & rules
- **[Vite](https://vitejs.dev/)** — dev server & bundler
- Vanilla JavaScript (ES modules), no UI framework

---

## 📁 Project Structure

```
src/
├── main.js               # wires everything together
├── game/
│   ├── GameState.js      # single source of truth; wraps chess.js, emits events
│   ├── MoveHandler.js    # mouse/raycast -> square -> GameState
│   └── AI.js             # minimax / random move AI
├── scene/
│   ├── SceneManager.js   # renderer, camera, lights, environment loop
│   ├── Board.js          # board squares + highlights
│   └── Pieces.js         # lathe-turned wooden piece meshes
├── ui/
│   ├── HUD.js            # 2D HTML overlay (turn, history, game-over)
│   └── Animations.js     # frame-tick move/capture animations
└── utils/                # colors, coordinate helpers
```

### Architecture notes
- `GameState` extends `EventTarget` and is the **only** place game rules live
  (no Three.js, no DOM). It emits `move:made`, `game:over`, `game:reset`, etc.
- The scene, HUD, and AI are **listeners** — they react to events and never own
  game logic. This keeps rendering, input, and rules decoupled.
- Piece materials are per-instance (so the capture fade stays isolated) while the
  wood-grain texture is shared per color.
