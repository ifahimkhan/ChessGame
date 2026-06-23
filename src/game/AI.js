// Simple chess AI. NO Three.js, NO DOM. Pure chess.js computation.
// Plays black only. Difficulty controls search depth (plies):
//   'easy'   -> random legal move
//   'medium' -> 2-ply alpha-beta minimax
//   'hard'   -> 4-ply alpha-beta minimax
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }

const DIFFICULTY_DEPTH = { easy: 0, medium: 2, hard: 4 }

// Search captures first: better alpha-beta pruning -> deeper search stays fast.
function orderMoves(moves) {
  return moves
    .slice()
    .sort(
      (a, b) =>
        (b.captured ? PIECE_VALUES[b.captured] : 0) -
        (a.captured ? PIECE_VALUES[a.captured] : 0)
    )
}

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

  const moves = orderMoves(chess.moves({ verbose: true }))

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

  const depth = DIFFICULTY_DEPTH[difficulty] ?? 0

  // Easy (depth 0): pick a random legal move.
  if (depth <= 0) {
    const m = moves[Math.floor(Math.random() * moves.length)]
    return { from: m.from, to: m.to }
  }

  let bestMove = null
  let bestScore = Infinity
  for (const m of orderMoves(moves)) {
    chess.move(m)
    const score = minimax(chess, depth - 1, -Infinity, Infinity, true)
    chess.undo()
    if (score < bestScore) {
      bestScore = score
      bestMove = m
    }
  }
  return bestMove ? { from: bestMove.from, to: bestMove.to } : null
}

// Drives black's moves. The actual search runs in a Web Worker so deep
// (hard) searches never block the render loop / UI thread.
export class AI {
  constructor(gameState, difficulty = 'easy') {
    this.gameState = gameState
    this.difficulty = difficulty
    this.thinking = false

    this.worker = new Worker(new URL('./aiWorker.js', import.meta.url), {
      type: 'module'
    })
    this.worker.onmessage = (e) => this._onResult(e.data)

    this._listen()
  }

  _listen() {
    this.gameState.addEventListener('move:made', () => this._maybeMove())
    // A reset can land mid-think; drop any in-flight result.
    this.gameState.addEventListener('game:reset', () => {
      this.thinking = false
    })
  }

  _maybeMove() {
    if (this.gameState.mode !== 'ai') return
    if (this.gameState.currentTurn() !== 'b') return
    if (this.gameState.status !== 'playing') return
    if (this.thinking) return

    this.thinking = true
    this.worker.postMessage({
      fen: this.gameState.getFen(),
      difficulty: this.difficulty
    })
  }

  _onResult(move) {
    this.thinking = false
    // Guard: board may have changed (reset / wrong turn) while thinking.
    if (this.gameState.mode !== 'ai') return
    if (this.gameState.currentTurn() !== 'b') return
    if (this.gameState.status !== 'playing') return
    if (move) this.gameState.makeMove(move.from, move.to)
  }
}
