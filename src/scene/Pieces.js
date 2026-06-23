import * as THREE from 'three'
import { Chess } from 'chess.js'
import { squareToWorld } from '../utils/coords.js'

// Renders 3D pieces. Listens to game state (FEN) — no input, no animation.
// Each piece is a THREE.Group; userData = { square, color, type }.

// --- Wood material ---------------------------------------------------------
// Procedural grain baked to a canvas (vertical streaks -> grain runs up the
// turned body). One shared texture per color; materials are still per-piece
// so the capture fade (mutates material.opacity) stays isolated.

const WOOD = {
  w: { base: '#e3c290', streak: '#c69a5e', hi: '#f1d8a9' }, // boxwood
  b: { base: '#4a2f1d', streak: '#311d10', hi: '#6d4528' } // walnut
}

const textureCache = {} // 'w' | 'b' -> THREE.CanvasTexture

function makeWoodCanvas({ base, streak, hi }) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 130; i++) {
    ctx.strokeStyle = Math.random() < 0.5 ? streak : hi
    ctx.globalAlpha = 0.04 + Math.random() * 0.12
    ctx.lineWidth = 0.5 + Math.random() * 2.5
    const x0 = Math.random() * 256
    ctx.beginPath()
    ctx.moveTo(x0, 0)
    for (let y = 0; y <= 256; y += 12) {
      ctx.lineTo(x0 + Math.sin(y * 0.03 + i) * 6 + (Math.random() - 0.5) * 4, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return c
}

function woodTexture(color) {
  if (textureCache[color]) return textureCache[color]
  const tex = new THREE.CanvasTexture(makeWoodCanvas(WOOD[color]))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  textureCache[color] = tex
  return tex
}

function materialFor(color) {
  // Lacquered-wood look: clearcoat over a matte grained surface.
  return new THREE.MeshPhysicalMaterial({
    map: woodTexture(color),
    roughness: 0.55,
    metalness: 0.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35
  })
}

// --- Geometry helpers ------------------------------------------------------

// Revolve a [radius, height] profile around Y -> a turned (lathe) solid.
// Profiles start/end at x=0 so the bottom and top close cleanly.
function lathe(pairs, mat, segments = 48) {
  const pts = pairs.map(([x, y]) => new THREE.Vector2(x, y))
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, segments), mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// Append points along a circular arc (for rounded heads / finials).
function arc(out, cx, cy, r, a0, a1, steps) {
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps)
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
}

// Add a non-turned detail mesh (boxes, finials, crown beads).
function addPart(group, geometry, material, y, opts = {}) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(opts.x || 0, y, opts.z || 0)
  if (opts.rotX) mesh.rotation.x = opts.rotX
  if (opts.rotY) mesh.rotation.y = opts.rotY
  if (opts.rotZ) mesh.rotation.z = opts.rotZ
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return mesh
}

function createPawn(mat) {
  const g = new THREE.Group()
  const p = [
    [0, 0], [0.3, 0], [0.3, 0.04], [0.27, 0.07], [0.16, 0.12],
    [0.11, 0.2], [0.13, 0.27], [0.2, 0.31], [0.2, 0.34], [0.12, 0.37]
  ]
  arc(p, 0, 0.55, 0.17, -1.15, Math.PI / 2, 12) // rounded head
  g.add(lathe(p, mat))
  return g
}

function createRook(mat) {
  const g = new THREE.Group()
  const p = [
    [0, 0], [0.33, 0], [0.33, 0.05], [0.28, 0.09], [0.19, 0.14],
    [0.17, 0.45], [0.19, 0.5], [0.27, 0.57], [0.27, 0.7], [0, 0.7]
  ]
  g.add(lathe(p, mat))
  // Crenellations: ring of merlons with gaps between.
  const n = 6
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    addPart(g, new THREE.BoxGeometry(0.12, 0.14, 0.1), mat, 0.74, {
      x: Math.cos(a) * 0.225,
      z: Math.sin(a) * 0.225,
      rotY: -a
    })
  }
  return g
}

function createKnight(mat) {
  const g = new THREE.Group()
  const p = [
    [0, 0], [0.3, 0], [0.3, 0.05], [0.26, 0.09], [0.17, 0.14],
    [0.15, 0.27], [0.2, 0.31], [0.2, 0.34], [0, 0.34]
  ]
  g.add(lathe(p, mat))
  // Sculpted horse head from tilted boxes (lathe can't make it).
  addPart(g, new THREE.BoxGeometry(0.26, 0.4, 0.22), mat, 0.52, {
    rotX: -Math.PI / 12
  })
  addPart(g, new THREE.BoxGeometry(0.22, 0.2, 0.42), mat, 0.7, {
    z: 0.12,
    rotX: -Math.PI / 7
  })
  addPart(g, new THREE.BoxGeometry(0.18, 0.16, 0.2), mat, 0.66, {
    z: 0.3,
    rotX: -Math.PI / 6
  })
  addPart(g, new THREE.ConeGeometry(0.05, 0.14, 12), mat, 0.86, { z: -0.06 })
  return g
}

function createBishop(mat) {
  const g = new THREE.Group()
  const p = [
    [0, 0], [0.3, 0], [0.3, 0.05], [0.26, 0.09], [0.15, 0.14],
    [0.105, 0.25], [0.12, 0.34], [0.19, 0.4], [0.19, 0.43], [0.1, 0.46],
    [0.17, 0.55], [0.18, 0.63], [0.13, 0.73], [0.06, 0.81], [0, 0.85]
  ]
  g.add(lathe(p, mat))
  addPart(g, new THREE.SphereGeometry(0.06, 16, 12), mat, 0.88) // finial
  return g
}

function createQueen(mat) {
  const g = new THREE.Group()
  const p = [
    [0, 0], [0.34, 0], [0.34, 0.05], [0.3, 0.09], [0.18, 0.15],
    [0.12, 0.3], [0.14, 0.45], [0.19, 0.57], [0.2, 0.61], [0.13, 0.65],
    [0.22, 0.72], [0.26, 0.78], [0.23, 0.82], [0.1, 0.84], [0.12, 0.89], [0, 0.93]
  ]
  g.add(lathe(p, mat))
  // Crown: ring of beads.
  const n = 8
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    addPart(g, new THREE.SphereGeometry(0.05, 12, 10), mat, 0.84, {
      x: Math.cos(a) * 0.24,
      z: Math.sin(a) * 0.24
    })
  }
  return g
}

function createKing(mat) {
  const g = new THREE.Group()
  const p = [
    [0, 0], [0.34, 0], [0.34, 0.05], [0.3, 0.09], [0.18, 0.15],
    [0.12, 0.32], [0.14, 0.48], [0.19, 0.6], [0.2, 0.64], [0.13, 0.68],
    [0.22, 0.76], [0.26, 0.82], [0.23, 0.86], [0.12, 0.88], [0.13, 0.93], [0, 0.96]
  ]
  g.add(lathe(p, mat))
  // Cross finial.
  addPart(g, new THREE.BoxGeometry(0.06, 0.3, 0.06), mat, 1.13)
  addPart(g, new THREE.BoxGeometry(0.2, 0.06, 0.06), mat, 1.1)
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
