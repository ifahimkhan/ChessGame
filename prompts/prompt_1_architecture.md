# prompt_1_architecture.md
## Domain: D0 — Architecture & Project Scaffold
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Bootstrap the Three.js chess project: Vite config, folder structure, entry point, and a working blank 3D scene that renders in the browser.

---

## Context Snapshot
- Stack: Three.js r168+, chess.js 1.x, Vite, vanilla JS (ES modules)
- No framework, no TypeScript
- All source lives in `src/`; see CLAUDE.md for full file tree
- Entry point: `src/main.js` → bootstraps SceneManager and GameState

---

## Tasks

### 1. Initialise the project
```
npm create vite@latest chess-threejs -- --template vanilla
cd chess-threejs
npm install three chess.js
```

### 2. Create `vite.config.js`
```js
export default {
  base: './',
  server: { open: true }
}
```

### 3. Create `index.html`
- Single `<canvas id="chess-canvas">` element
- Load `src/main.js` as `type="module"`
- Basic CSS: `body { margin:0; background:#1a1a2e; overflow:hidden; }`
- Include a `<div id="hud">` overlay (empty for now, styled absolute top-left)

### 4. Create `src/utils/colors.js`
Export a frozen object `COLORS` with:
- `boardLight: '#f0d9b5'`, `boardDark: '#b58863'`
- `highlight: '#f6f669'`, `selected: '#baca2b'`, `legalMove: '#cdd16e'`
- `pieceWhite: '#fefefe'`, `pieceBlack: '#2c2c2c'`
- `ambientLight: '#ffffff'`, `directionalLight: '#fff8e7'`

### 5. Create `src/utils/coords.js`
Export two functions:
```js
export function squareToWorld(square) {
  // 'e4' → { x, z }
  // col a=0..h=7 → x = col - 3.5
  // row 1=0..8=7 → z = 3.5 - row
}

export function worldToSquare(x, z) {
  // { x, z } → 'e4' or null if out of bounds
}
```
Include unit-test-style comments showing example inputs/outputs.

### 6. Create `src/scene/SceneManager.js`
A class with:
- `constructor(canvasId)` — creates renderer, scene, camera (PerspectiveCamera fov=45)
- `initLights()` — AmbientLight + DirectionalLight (casts shadows)
- `initCamera()` — position at (0, 8, 8), look at origin; attach OrbitControls
  - Limit: `minPolarAngle=0.2`, `maxPolarAngle=Math.PI/2.2` (no going underground)
- `start()` — begins `requestAnimationFrame` loop calling `this.render()`
- `render()` — updates OrbitControls, renders scene
- Exports a singleton: `export const sceneManager = new SceneManager('chess-canvas')`

### 7. Create `src/main.js`
```js
import { sceneManager } from './scene/SceneManager.js'
sceneManager.start()
// (other imports added in later prompts)
```

### 8. Verify
Running `npm run dev` should open a browser showing a dark background with a lit empty scene. No errors in console.

---

## Output Files (create or modify)
- `index.html`
- `vite.config.js`
- `package.json` (already created by Vite scaffold)
- `src/main.js`
- `src/utils/colors.js`
- `src/utils/coords.js`
- `src/scene/SceneManager.js`

## Constraints
- Do NOT implement board or pieces yet (those are prompt_2 and prompt_3)
- Do NOT add any game logic
- Keep SceneManager under 120 lines

**Show only changed/created files.**
