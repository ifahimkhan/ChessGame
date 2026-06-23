import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { COLORS } from '../utils/colors.js'
import { Animations } from '../ui/Animations.js'

// Owns the Three.js renderer loop. Nothing else calls renderer.render().
export class SceneManager {
  constructor(canvasId) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // Filmic tone mapping flatters the PBR wood materials.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1

    this.clock = new THREE.Clock()

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#1a1a2e')

    // Soft indoor IBL so the lacquered wood picks up subtle reflections.
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )

    this.initLights()
    this.initCamera()

    window.addEventListener('resize', () => this.onResize())
  }

  initLights() {
    const ambient = new THREE.AmbientLight(COLORS.ambientLight, 0.3)
    this.scene.add(ambient)

    const dir = new THREE.DirectionalLight(COLORS.directionalLight, 1.0)
    dir.position.set(5, 10, 5)
    dir.castShadow = true
    dir.shadow.mapSize.set(2048, 2048)
    dir.shadow.camera.near = 1
    dir.shadow.camera.far = 30
    dir.shadow.camera.left = -8
    dir.shadow.camera.right = 8
    dir.shadow.camera.top = 8
    dir.shadow.camera.bottom = -8
    this.scene.add(dir)
  }

  initCamera() {
    this.camera.position.set(0, 8, 8)
    this.camera.lookAt(0, 0, 0)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 0, 0)
    this.controls.enableDamping = true
    this.controls.minPolarAngle = 0.2
    this.controls.maxPolarAngle = Math.PI / 2.2
    this.controls.update()
  }

  setCameraFlip(cameraFlip) {
    this._cameraFlip = cameraFlip
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop)
      this.render()
    }
    loop()
  }

  render() {
    const delta = this.clock.getDelta()
    Animations.update(delta)

    // While a camera flip runs it drives the camera directly; OrbitControls
    // must stay out of it (controls.update() would fight the animation).
    const flipping = this._cameraFlip && this._cameraFlip.isFlipping()
    if (this._cameraFlip) this._cameraFlip.update(delta)
    if (!flipping) this.controls.update()

    this.renderer.render(this.scene, this.camera)

    if (import.meta.env.DEV) {
      this._frames = (this._frames || 0) + 1
      const now = performance.now()
      if (now - (this._lastFpsTime || 0) > 1000) {
        document.title = `Chess — ${this._frames} FPS`
        this._frames = 0
        this._lastFpsTime = now
      }
    }
  }
}

export const sceneManager = new SceneManager('chess-canvas')
