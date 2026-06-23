// Simple chess AI. NO Three.js, NO DOM. Pure chess.js computation.
// Plays black only. Difficulty: 'easy' (random) | 'medium' (minimax depth 2).

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }

const MAX_DEPTH = 2

// Positive = good for white, negative = good for black.
export function evaluate(chess) {
  let score = 0
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq) continue
      const value = PIECE_VALUES[sq.type]
      score += sq.color === 'w' ? value : -value
    }
  }
  return score
}

// Alpha-beta minimax. maximizing = white to move.
export function minimax(chess, depth, alpha, beta, maximizing) {
  if (depth === 0 || chess.isGameOver()) {
    return evaluate(chess)
  }

  const moves = chess.moves({ verbose: true })

  if (maximizing) {
    let best = -Infinity
    for (const m of moves) {
      chess.move(m)
      const score = minimax(chess, depth - 1, alpha, beta, false)
      chess.undo()
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return best
  }

  let best = Infinity
  for (const m of moves) {
    chess.move(m)
    const score = minimax(chess, depth - 1, alpha, beta, true)
    chess.undo()
    best = Math.min(best, score)
    beta = Math.min(beta, score)
    if (beta <= alpha) break
  }
  return best
}

// Returns { from, to } or null. AI is black -> minimising.
export function getBestMove(chess, difficulty) {
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) return null

  if (difficulty !== 'medium') {
    const m = moves[Math.floor(Math.random() * moves.length)]
    return { from: m.from, to: m.to }
  }

  let bestMove = null
  let bestScore = Infinity
  for (const m of moves) {
    chess.move(m)
    const score = minimax(chess, MAX_DEPTH - 1, -Infinity, Infinity, true)
    chess.undo()
    if (score < bestScore) {
      bestScore = score
      bestMove = m
    }
  }
  return bestMove ? { from: bestMove.from, to: bestMove.to } : null
}

export class AI {
  constructor(gameState, difficulty = 'easy') {
    this.gameState = gameState
    this.difficulty = difficulty
    this._listen()
  }

  _listen() {
    this.gameState.addEventListener('move:made', () => {
      if (this.gameState.mode !== 'ai') return
      if (this.gameState.currentTurn() !== 'b') return
      if (this.gameState.status !== 'playing') return
      // Non-blocking: yield to render frame first.
      setTimeout(() => this._doMove(), 0)
    })
  }

  _doMove() {
    if (this.gameState.currentTurn() !== 'b') return
    if (this.gameState.status !== 'playing') return
    const chess = this.gameState.chess
    const move = getBestMove(chess, this.difficulty)
    if (move) this.gameState.makeMove(move.from, move.to)
  }
}
