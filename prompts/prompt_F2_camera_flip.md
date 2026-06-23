# prompt_F2_camera_flip.md
## Feature: Board Camera Flip (180° rotation after each PvP move)
## Domain: D4 — Scene / Animation
**Read CLAUDE.md (and CLAUDE_addendum_boardflip.md) first before touching any file.**

---

## Goal
After every move in PvP mode, smoothly rotate the camera 180° around the board's Y-axis so the next player sees the board from their side. Input is locked during the animation. The board and pieces do NOT move — only the camera orbits.

---

## Context Snapshot
- `SceneManager` exposes: `sceneManager.camera` (PerspectiveCamera), `sceneManager.controls` (OrbitControls), `sceneManager.clock` (THREE.Clock)
- `Animations.update(delta)` is already called each frame in `SceneManager.render()`
- Camera starts at approximately `(0, 8, 8)` looking at origin — azimuth ~45° from Z
- After flip: camera should be at `(0, 8, -8)` — exactly the opposite side, same height
- `OrbitControls` must be disabled during the flip (otherwise it fights the animation)
- `MoveHandler` has a `this.disabled` flag — set it true during flip, false after

---

## Tasks

### 1. Create `src/scene/CameraFlip.js`

```js
import * as THREE from 'three'

export class CameraFlip {
  constructor(sceneManager, gameState) {
    this.sceneManager = sceneManager
    this.gameState = gameState
    this._flipping = false
    this._flipProgress = 0
    this._flipDuration = 0.6   // seconds
    this._startAzimuth = 0
    this._onCompleteCallbacks = []

    gameState.addEventListener('move:made', () => {
      if (gameState.mode === 'pvp' && !this._flipping) {
        this._startFlip()
      }
    })
  }
```

#### `_startFlip()`
1. Capture current camera state:
   ```js
   const cam = this.sceneManager.camera
   const target = this.sceneManager.controls.target  // should be (0,0,0)
   // Compute current azimuth from camera position relative to target
   const dx = cam.position.x - target.x
   const dz = cam.position.z - target.z
   this._radius = Math.sqrt(dx*dx + dz*dz)
   this._height = cam.position.y
   this._startAzimuth = Math.atan2(dx, dz)  // current angle in XZ plane
   this._targetAzimuth = this._startAzimuth + Math.PI  // +180°
   ```
2. Set `this._flipping = true`, `this._flipProgress = 0`
3. Disable OrbitControls: `this.sceneManager.controls.enabled = false`
4. Fire `'flip:start'` event on `gameState` (MoveHandler listens to lock clicks)

#### `update(delta)`
Called each frame by SceneManager (see task 2):
```js
if (!this._flipping) return

this._flipProgress += delta / this._flipDuration
const t = Math.min(this._flipProgress, 1)

// Ease in-out cubic: smoother than quadratic for a rotation
const eased = t < 0.5
  ? 4 * t * t * t
  : 1 - Math.pow(-2 * t + 2, 3) / 2

const currentAzimuth = this._startAzimuth + eased * Math.PI

const cam = this.sceneManager.camera
const target = this.sceneManager.controls.target
cam.position.x = target.x + Math.sin(currentAzimuth) * this._radius
cam.position.z = target.z + Math.cos(currentAzimuth) * this._radius
cam.position.y = this._height
cam.lookAt(target)

if (t >= 1) {
  this._flipping = false
  this.sceneManager.controls.enabled = true
  // Sync OrbitControls internal state to new camera position
  this.sceneManager.controls.update()
  gameState.dispatchEvent(new Event('flip:complete'))
  this._onCompleteCallbacks.forEach(fn => fn())
  this._onCompleteCallbacks = []
}
```

#### `onComplete(fn)`
Register a one-time callback for when the current flip ends:
```js
if (!this._flipping) { fn(); return; }
this._onCompleteCallbacks.push(fn)
```

#### `isFlipping()` → boolean

---

### 2. Update `src/scene/SceneManager.js`
In `render()`, call `CameraFlip.update(delta)` if a flip instance is attached:
```js
render() {
  const delta = this.clock.getDelta()
  Animations.update(delta)
  if (this._cameraFlip) this._cameraFlip.update(delta)
  this.controls.update()
  this.renderer.render(this.scene, this.camera)
}
```
Add a setter to wire up the flip instance after construction:
```js
setCameraFlip(cameraFlip) {
  this._cameraFlip = cameraFlip
}
```

In `src/main.js`, after creating CameraFlip:
```js
const cameraFlip = new CameraFlip(sceneManager, gameState)
sceneManager.setCameraFlip(cameraFlip)
```

---

### 3. Update `src/game/MoveHandler.js`
Lock clicks during flip:

```js
// In constructor, after receiving cameraFlip ref:
gameState.addEventListener('flip:start', () => { this.disabled = true })
gameState.addEventListener('flip:complete', () => { this.disabled = false })
```

And in `_onCanvasClick()`, check at the top:
```js
if (this.disabled) return
```

> MoveHandler constructor signature change: add `cameraFlip` as last param (can be null for AI mode).
> Update the `new MoveHandler(...)` call in `main.js` accordingly.

---

### 4. Update HUD to show a "Flipping…" indicator (optional but nice)
In `src/ui/HUD.js`, listen to flip events:
```js
gameState.addEventListener('flip:start', () => {
  document.getElementById('turn-indicator').textContent = '↺ Switching sides...'
})
gameState.addEventListener('flip:complete', () => {
  this._updateTurnIndicator()  // restore normal turn text
})
```

---

## Output Files
- `src/scene/CameraFlip.js` (create)
- `src/scene/SceneManager.js` (update: `setCameraFlip()` + `update` call)
- `src/game/MoveHandler.js` (update: disable during flip + constructor param)
- `src/ui/HUD.js` (update: flip status text)
- `src/main.js` (update: wire `setCameraFlip`)

## Constraints
- Do NOT move or rotate the board mesh, square meshes, or piece meshes — camera only
- Do NOT change `GameState`, `Board`, `Pieces`, or `Animations` in this prompt
- OrbitControls MUST be re-enabled after every flip — no exceptions
- If a second move fires while flipping (shouldn't happen due to lock), ignore it
- Flip only triggers in `mode === 'pvp'` — AI mode camera stays fixed

**Show only changed/created files.**
