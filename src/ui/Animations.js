import { squareToWorld } from '../utils/coords.js'

// Frame-tick animations. No external lib. SceneManager calls update(delta).
// Move = quadratic-bezier arc (peak y=1.5). Capture = scale+fade to 0.

const activeAnimations = []

const ARC_PEAK_Y = 1.5

// ease-in-out quad
function ease(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function playMove(pieceGroup, fromSq, toSq, onComplete) {
  if (!pieceGroup) {
    if (onComplete) onComplete()
    return
  }
  activeAnimations.push({
    type: 'move',
    group: pieceGroup,
    from: squareToWorld(fromSq),
    to: squareToWorld(toSq),
    elapsed: 0,
    duration: 0.35,
    onComplete
  })
}

function playCapture(pieceGroup, onComplete) {
  if (!pieceGroup) {
    if (onComplete) onComplete()
    return
  }
  // Enable transparency so opacity fade is visible (meshes and emoji sprites).
  pieceGroup.traverse((child) => {
    if (child.isMesh || child.isSprite) child.material.transparent = true
  })
  activeAnimations.push({
    type: 'capture',
    group: pieceGroup,
    elapsed: 0,
    duration: 0.2,
    onComplete
  })
}

function applyMove(anim, t) {
  const { from, to, group } = anim
  const mid = { x: (from.x + to.x) / 2, y: ARC_PEAK_Y, z: (from.z + to.z) / 2 }
  const u = 1 - t
  const x = u * u * from.x + 2 * u * t * mid.x + t * t * to.x
  const y = u * u * 0 + 2 * u * t * mid.y + t * t * 0
  const z = u * u * from.z + 2 * u * t * mid.z + t * t * to.z
  group.position.set(x, y, z)
}

function applyCapture(anim, t) {
  const s = 1 - t
  anim.group.scale.set(s, s, s)
  anim.group.traverse((child) => {
    if (child.isMesh || child.isSprite) child.material.opacity = s
  })
}

function update(delta) {
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const anim = activeAnimations[i]
    anim.elapsed += delta
    const raw = Math.min(anim.elapsed / anim.duration, 1)
    const t = ease(raw)

    if (anim.type === 'move') applyMove(anim, t)
    else applyCapture(anim, t)

    if (raw >= 1) {
      activeAnimations.splice(i, 1)
      if (anim.onComplete) anim.onComplete()
    }
  }
}

export const Animations = { playMove, playCapture, update }
