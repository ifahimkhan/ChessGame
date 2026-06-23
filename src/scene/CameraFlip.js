// Smoothly orbits the camera 180° around the board after each PvP move so the
// next player faces the board from their side. Camera only — board and pieces
// never move. NO game logic here; it reacts to GameState events.
export class CameraFlip {
  constructor(sceneManager, gameState) {
    this.sceneManager = sceneManager
    this.gameState = gameState
    this._flipping = false
    this._flipProgress = 0
    this._flipDuration = 0.6 // seconds
    this._radius = 0
    this._height = 0
    this._startAzimuth = 0
    this._onCompleteCallbacks = []

    gameState.addEventListener('move:made', () => {
      if (gameState.mode === 'pvp' && !this._flipping) {
        this._startFlip()
      }
    })
  }

  _startFlip() {
    const cam = this.sceneManager.camera
    const target = this.sceneManager.controls.target

    const dx = cam.position.x - target.x
    const dz = cam.position.z - target.z
    this._radius = Math.sqrt(dx * dx + dz * dz)
    this._height = cam.position.y
    this._startAzimuth = Math.atan2(dx, dz)

    this._flipping = true
    this._flipProgress = 0

    // Disable OrbitControls so it doesn't fight the animation.
    this.sceneManager.controls.enabled = false
    this.gameState.dispatchEvent(new Event('flip:start'))
  }

  update(delta) {
    if (!this._flipping) return

    this._flipProgress += delta / this._flipDuration
    const t = Math.min(this._flipProgress, 1)

    // Ease in-out cubic.
    const eased =
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const azimuth = this._startAzimuth + eased * Math.PI

    const cam = this.sceneManager.camera
    const target = this.sceneManager.controls.target
    cam.position.x = target.x + Math.sin(azimuth) * this._radius
    cam.position.z = target.z + Math.cos(azimuth) * this._radius
    cam.position.y = this._height
    cam.lookAt(target)

    if (t >= 1) {
      this._flipping = false
      this.sceneManager.controls.enabled = true
      // Re-sync OrbitControls' internal spherical to the new camera position.
      this.sceneManager.controls.update()
      this.gameState.dispatchEvent(new Event('flip:complete'))
      const callbacks = this._onCompleteCallbacks
      this._onCompleteCallbacks = []
      callbacks.forEach((fn) => fn())
    }
  }

  // Register a one-time callback for when the current flip ends.
  onComplete(fn) {
    if (!this._flipping) {
      fn()
      return
    }
    this._onCompleteCallbacks.push(fn)
  }

  isFlipping() {
    return this._flipping
  }
}
