// Algebraic notation <-> 3D world coordinates.
// Board centered at origin. Each square = 1 unit.
// col a=0..h=7 -> x = col - 3.5   (a -> -3.5, h -> 3.5)
// row 1=0..8=7 -> z = 3.5 - row   (row1 -> 3.5, row8 -> -3.5)

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

/**
 * 'e4' -> { x, z }
 * squareToWorld('a1') -> { x: -3.5, z: 3.5 }
 * squareToWorld('h8') -> { x:  3.5, z: -3.5 }
 * squareToWorld('e4') -> { x:  0.5, z: 0.5 }
 */
export function squareToWorld(square) {
  if (typeof square !== 'string' || square.length !== 2) {
    throw new Error(`Invalid square: ${square}`)
  }
  const col = FILES.indexOf(square[0])
  const row = Number(square[1]) - 1
  if (col < 0 || row < 0 || row > 7) {
    throw new Error(`Invalid square: ${square}`)
  }
  return { x: col - 3.5, z: 3.5 - row }
}

/**
 * { x, z } -> 'e4' or null if out of bounds.
 * worldToSquare(-3.5, 3.5) -> 'a1'
 * worldToSquare(3.5, -3.5) -> 'h8'
 * worldToSquare(0.5, 0.5)  -> 'e4'
 * worldToSquare(10, 10)    -> null
 */
export function worldToSquare(x, z) {
  const col = Math.round(x + 3.5)
  const row = Math.round(3.5 - z)
  if (col < 0 || col > 7 || row < 0 || row > 7) {
    return null
  }
  return FILES[col] + (row + 1)
}
