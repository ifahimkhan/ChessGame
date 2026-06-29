import * as THREE from 'three'
import { THEMES, settings } from '../utils/themes.js'
import { squareToWorld } from '../utils/coords.js'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const HIGHLIGHT_TYPES = ['selected', 'legalMove', 'lastMove']

// Renders the 3D board: 64 squares + border. Owns highlight overlays.
// Square colors + highlight tints follow the active color theme so the 3D
// board matches the 2D board (Forest, Candy, Ocean…). Does NOT render pieces.
export class Board {
  constructor(scene) {
    this.scene = scene
    this.squareMeshes = {}
    this.highlights = {} // square -> overlay Mesh (mesh.userData.type set)
    this.theme = THEMES[settings.get('theme')] || THEMES.candy
    this.buildSquares()
    this.buildBorder()
  }

  // Map a highlight type to a theme color.
  #highlightColor(type) {
    if (type === 'selected') return this.theme.selected
    if (type === 'legalMove') return this.theme.legal
    if (type === 'lastMove') return this.theme.lastMove
    return null
  }

  buildSquares() {
    const geo = new THREE.PlaneGeometry(1, 1)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const sq = FILES[col] + (row + 1)
        // a1 is dark in standard chess: dark when (col+row) even.
        const isLight = (col + row) % 2 === 1
        const mat = new THREE.MeshLambertMaterial({
          color: isLight ? this.theme.light : this.theme.dark
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.rotation.x = -Math.PI / 2
        const { x, z } = squareToWorld(sq)
        mesh.position.set(x, 0, z)
        mesh.receiveShadow = true
        mesh.name = sq
        mesh.userData.isLight = isLight
        this.scene.add(mesh)
        this.squareMeshes[sq] = mesh
      }
    }
  }

  // Recolor every square to a new theme (live theme switching).
  applyTheme(theme) {
    this.theme = theme
    for (const sq of Object.keys(this.squareMeshes)) {
      const mesh = this.squareMeshes[sq]
      mesh.material.color.set(mesh.userData.isLight ? theme.light : theme.dark)
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
    const color = this.#highlightColor(type)
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
