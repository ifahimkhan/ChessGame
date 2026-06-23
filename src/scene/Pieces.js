import * as THREE from 'three'
import { Chess } from 'chess.js'
import { COLORS } from '../utils/colors.js'
import { squareToWorld } from '../utils/coords.js'

// Renders 3D pieces. Listens to game state (FEN) — no input, no animation.
// Each piece is a THREE.Group; userData = { square, color, type }.

function materialFor(color) {
  // color: 'w' | 'b'
  const isWhite = color === 'w'
  return new THREE.MeshPhongMaterial({
    color: isWhite ? COLORS.pieceWhite : COLORS.pieceBlack,
    specular: isWhite ? '#aaaaaa' : '#444444',
    shininess: isWhite ? 30 : 20
  })
}

// Add child mesh to group: position y is the center of the part.
function addPart(group, geometry, material, y, opts = {}) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = y
  if (opts.x) mesh.position.x = opts.x
  if (opts.z) mesh.position.z = opts.z
  if (opts.rotX) mesh.rotation.x = opts.rotX
  if (opts.rotZ) mesh.rotation.z = opts.rotZ
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return mesh
}

function createPawn(mat) {
  const g = new THREE.Group()
  addPart(g, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), mat, 0.05)
  addPart(g, new THREE.CylinderGeometry(0.15, 0.2, 0.5, 24), mat, 0.35)
  addPart(g, new THREE.SphereGeometry(0.2, 24, 16), mat, 0.7)
  return g
}

function createRook(mat) {
  const g = new THREE.Group()
  addPart(g, new THREE.CylinderGeometry(0.35, 0.35, 0.1, 24), mat, 0.05)
  addPart(g, new THREE.CylinderGeometry(0.25, 0.25, 0.7, 24), mat, 0.45)
  addPart(g, new THREE.CylinderGeometry(0.3, 0.3, 0.15, 24), mat, 0.875)
  return g
}

function createKnight(mat) {
  const g = new THREE.Group()
  addPart(g, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), mat, 0.05)
  addPart(g, new THREE.BoxGeometry(0.3, 0.5, 0.25), mat, 0.35)
  // Head box tilted ~20deg to suggest horse head.
  addPart(g, new THREE.BoxGeometry(0.25, 0.2, 0.4), mat, 0.65, {
    z: 0.1,
    rotX: -Math.PI / 9
  })
  return g
}

function createBishop(mat) {
  const g = new THREE.Group()
  addPart(g, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), mat, 0.05)
  addPart(g, new THREE.CylinderGeometry(0.13, 0.25, 0.55, 24), mat, 0.375)
  addPart(g, new THREE.SphereGeometry(0.15, 24, 16), mat, 0.7)
  addPart(g, new THREE.ConeGeometry(0.07, 0.25, 16), mat, 0.95)
  return g
}

function createQueen(mat) {
  const g = new THREE.Group()
  addPart(g, new THREE.CylinderGeometry(0.38, 0.38, 0.1, 24), mat, 0.05)
  addPart(g, new THREE.CylinderGeometry(0.18, 0.3, 0.7, 24), mat, 0.45)
  addPart(g, new THREE.SphereGeometry(0.18, 24, 16), mat, 0.85)
  addPart(g, new THREE.TorusGeometry(0.2, 0.05, 12, 24), mat, 1.05, {
    rotX: Math.PI / 2
  })
  return g
}

function createKing(mat) {
  const g = new THREE.Group()
  addPart(g, new THREE.CylinderGeometry(0.38, 0.38, 0.1, 24), mat, 0.05)
  addPart(g, new THREE.CylinderGeometry(0.18, 0.3, 0.85, 24), mat, 0.525)
  addPart(g, new THREE.SphereGeometry(0.18, 24, 16), mat, 1.0)
  // Cross: vertical + horizontal thin boxes.
  addPart(g, new THREE.BoxGeometry(0.06, 0.3, 0.06), mat, 1.25)
  addPart(g, new THREE.BoxGeometry(0.2, 0.06, 0.06), mat, 1.22)
  return g
}

const FACTORY = {
  p: createPawn,
  r: createRook,
  n: createKnight,
  b: createBishop,
  q: createQueen,
  k: createKing
}

function createPiece(type, color) {
  const mat = materialFor(color)
  const group = FACTORY[type](mat)
  group.userData = { color, type }
  return group
}

export class Pieces {
  constructor(scene) {
    this.scene = scene
    this.meshes = {} // square -> Group
  }

  // Diff current meshes against FEN board. Reuses groups whose piece just
  // moved (already animated) instead of disposing and recreating them, so
  // castling / en passant / promotion all resolve from a single FEN sync.
  syncWithFen(fen) {
    const board = new Chess(fen).board()
    const wanted = {} // square -> { color, type }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c]
        if (!cell) continue
        // chess.js board(): row 0 = rank 8, col 0 = file a.
        wanted[cell.square] = { color: cell.color, type: cell.type }
      }
    }

    const matches = (g, sq) =>
      wanted[sq] &&
      g.userData.color === wanted[sq].color &&
      g.userData.type === wanted[sq].type

    // Squares whose current mesh is wrong/gone -> pool by identity for reuse.
    const additions = []
    const pool = {} // 'wp' -> [Group]
    for (const sq of Object.keys(this.meshes)) {
      if (matches(this.meshes[sq], sq)) continue
      const g = this.meshes[sq]
      delete this.meshes[sq]
      const key = g.userData.color + g.userData.type
      ;(pool[key] ||= []).push(g)
    }

    // Wanted squares not already satisfied need a piece (reused or new).
    for (const sq of Object.keys(wanted)) {
      if (this.meshes[sq]) continue
      additions.push(sq)
    }

    for (const sq of additions) {
      const { color, type } = wanted[sq]
      const reuse = pool[color + type] && pool[color + type].pop()
      if (reuse) {
        const { x, z } = squareToWorld(sq)
        reuse.position.set(x, 0, z)
        reuse.scale.set(1, 1, 1) // clear any hover scale
        reuse.userData.square = sq
        this.meshes[sq] = reuse
      } else {
        this.#place(sq, type, color)
      }
    }

    // Anything left unmatched in the pool was genuinely captured -> dispose.
    for (const key of Object.keys(pool)) {
      for (const g of pool[key]) this.#dispose(g)
    }
  }

  #place(square, type, color) {
    const group = createPiece(type, color)
    const { x, z } = squareToWorld(square)
    group.position.set(x, 0, z)
    group.userData.square = square
    this.scene.add(group)
    this.meshes[square] = group
  }

  // Teleport piece from -> to. No animation here.
  movePiece(from, to) {
    const group = this.meshes[from]
    if (!group) return
    if (this.meshes[to]) this.removePiece(to)
    const { x, z } = squareToWorld(to)
    group.position.set(x, 0, z)
    group.userData.square = to
    this.meshes[to] = group
    delete this.meshes[from]
  }

  removePiece(square) {
    const group = this.meshes[square]
    if (!group) return
    this.#dispose(group)
    delete this.meshes[square]
  }

  // Remove a group from the scene and free its GPU resources.
  #dispose(group) {
    this.scene.remove(group)
    group.traverse((child) => {
      if (!child.isMesh) return
      child.geometry.dispose()
      child.material.dispose()
    })
  }

  getGroup(square) {
    return this.meshes[square] || null
  }
}
