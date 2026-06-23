import * as THREE from 'three'
import { COLORS } from '../utils/colors.js'
import { squareToWorld } from '../utils/coords.js'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// Maps highlight type -> palette color. 'lastMove' reuses the highlight tint.
const HIGHLIGHT_COLOR = {
  selected: COLORS.selected,
  legalMove: COLORS.legalMove,
  lastMove: COLORS.highlight
}
const HIGHLIGHT_TYPES = Object.keys(HIGHLIGHT_COLOR)

// Renders the 3D board: 64 squares + border. Owns highlight overlays.
// Does NOT render pieces or handle input.
export class Board {
  constructor(scene) {
    this.scene = scene
    this.squareMeshes = {}
    this.highlights = {} // square -> overlay Mesh (mesh.userData.type set)
    this.buildSquares()
    this.buildBorder()
  }

  buildSquares() {
    const geo = new THREE.PlaneGeometry(1, 1)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const sq = FILES[col] + (row + 1)
        // a1 is dark in standard chess: dark when (col+row) even.
        const isLight = (col + row) % 2 === 1
        const mat = new THREE.MeshLambertMaterial({
          color: isLight ? COLORS.boardLight : COLORS.boardDark
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.rotation.x = -Math.PI / 2
        const { x, z } = squareToWorld(sq)
        mesh.position.set(x, 0, z)
        mesh.receiveShadow = true
        mesh.name = sq
        this.scene.add(mesh)
        this.squareMeshes[sq] = mesh
      }
    }
  }

  buildBorder() {
    const geo = new THREE.BoxGeometry(8.4, 0.15, 8.4)
    const mat = new THREE.MeshLambertMaterial({ color: '#5c3d1e' })
    const platform = new THREE.Mesh(geo, mat)
    platform.position.set(0, -0.08, 0)
    platform.receiveShadow = true
    this.scene.add(platform)
    this.platform = platform
    // TODO: rank/file labels (1-8 left edge, a-h bottom edge) via canvas sprites.
  }

  highlight(square, type) {
    const color = HIGHLIGHT_COLOR[type]
    if (!color) throw new Error(`Unknown highlight type: ${type}`)
    // Remove any existing overlay on this square first.
    this.#removeHighlight(square)
    const geo = new THREE.PlaneGeometry(0.95, 0.95)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    const { x, z } = squareToWorld(square)
    mesh.position.set(x, 0.01, z)
    mesh.userData.type = type
    this.scene.add(mesh)
    this.highlights[square] = mesh
  }

  clearHighlights(types) {
    for (const square of Object.keys(this.highlights)) {
      if (types.includes(this.highlights[square].userData.type)) {
        this.#removeHighlight(square)
      }
    }
  }

  clearAllHighlights() {
    this.clearHighlights(HIGHLIGHT_TYPES)
  }

  #removeHighlight(square) {
    const mesh = this.highlights[square]
    if (!mesh) return
    this.scene.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.dispose()
    delete this.highlights[square]
  }
}
