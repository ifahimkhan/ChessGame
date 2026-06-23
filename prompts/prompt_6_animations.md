# prompt_6_animations.md
## Domain: D4 (partial) — Move Animations
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Add smooth animations for piece movement (glide arc) and piece capture (fade out + scale down). Animations run within the Three.js render loop — no CSS, no GSAP dependency required.

---

## Context Snapshot
- `SceneManager.render()` is called each frame via `requestAnimationFrame`
- Animations are tick-based: each frame, `Animations.update(delta)` is called
- `squareToWorld(sq)` gives world `{x, z}` coordinates
- Piece groups sit at `y=0`; arc peak at `y=1.5` (over other pieces)
- `sceneManager.clock` is a `THREE.Clock` instance

---

## Tasks

### 1. Create `src/ui/Animations.js`

#### State
```js
const activeAnimations = [] // array of animation objects
```

#### `playMove(pieceGroup, fromSq, toSq, onComplete)`
Creates and pushes an animation object:
```js
{
  type: 'move',
  group: pieceGroup,
  from: squareToWorld(fromSq),
  to: squareToWorld(toSq),
  elapsed: 0,
  duration: 0.35,  // seconds
  onComplete
}
```
- Arc interpolation: use quadratic bezier with midpoint at `y=1.5`
  ```js
  // t ∈ [0,1]
  const mid = { x: (from.x+to.x)/2, y: 1.5, z: (from.z+to.z)/2 }
  // Quadratic bezier: P = (1-t)²·from + 2(1-t)t·mid + t²·to
  ```

#### `playCapture(pieceGroup, onComplete)`
Creates a capture animation:
```js
{ type: 'capture', group: pieceGroup, elapsed: 0, duration: 0.2, onComplete }
```
- Each tick: scale group from 1→0 and fade material opacity from 1→0
- On complete: call `onComplete()` (caller disposes the mesh)

#### `update(delta)`
- Iterate `activeAnimations`, advance `elapsed += delta`
- Compute `t = Math.min(elapsed / duration, 1)`
- Apply easing: `t = t < 0.5 ? 2*t*t : -1+(4-2*t)*t` (ease-in-out quad)
- Update piece group position
- On `t >= 1`: call `onComplete()`, remove from array

#### Export
```js
export const Animations = { playMove, playCapture, update }
```

### 2. Update `SceneManager.js`
In `render()`:
```js
const delta = this.clock.getDelta()
Animations.update(delta)
```
Add `this.clock = new THREE.Clock()` in constructor.

### 3. Update `MoveHandler.js`
Replace direct `pieces.movePiece(from, to)` with:
```js
// If capture: play capture anim first, then move
if (detail.captured) {
  const capturedGroup = pieces.getGroup(detail.to)
  Animations.playCapture(capturedGroup, () => pieces.removePiece(detail.to))
}
const movingGroup = pieces.getGroup(detail.from)
Animations.playMove(movingGroup, detail.from, detail.to, () => {
  pieces.movePiece(detail.from, detail.to)
})
```

---

## Output Files
- `src/ui/Animations.js` (create)
- `src/scene/SceneManager.js` (update: add clock + `Animations.update(delta)`)
- `src/game/MoveHandler.js` (update: use animated move/capture)

## Constraints
- No external animation library (no GSAP, no Tween.js)
- Keep animations non-blocking — pure frame-tick math
- Capture animation must complete before piece is disposed
- Keep under 120 lines

**Show only changed/created files.**
