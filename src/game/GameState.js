import { Chess } from 'chess.js'

// Single source of truth for the game. Wraps chess.js, emits events.
// NO Three.js, NO DOM here. All rules via chess.js.
export class GameState extends EventTarget {
  constructor(mode = 'pvp') {
    super()
    this.chess = new Chess()
    this.mode = mode // 'pvp' | 'ai'
    this.selectedSquare = null
    this.legalMovesCache = [] // destination squares for selected piece
    this.history = [] // { from, to, san, fen }
    this.status = 'playing' // 'playing' | 'checkmate' | 'draw' | 'stalemate'
  }

  // Click handler entry. Selects, deselects, or moves depending on context.
  selectSquare(square) {
    // Clicking a legal destination of the current selection -> move.
    if (this.selectedSquare && this.legalMovesCache.includes(square)) {
      return this.makeMove(this.selectedSquare, square)
    }

    // Clicking the already-selected square -> deselect.
    if (this.selectedSquare === square) {
      const prev = this.selectedSquare
      this.#clearSelection()
      this.#emit('piece:deselected', { square: prev })
      return false
    }

    // Clicking own piece -> select it.
    const piece = this.chess.get(square)
    if (piece && piece.color === this.currentTurn()) {
      this.selectedSquare = square
      this.legalMovesCache = this.getLegalMoves(square)
      this.#emit('piece:selected', {
        square,
        legalMoves: this.legalMovesCache
      })
      return false
    }

    // Clicking empty/enemy square with no valid selection context -> deselect if needed.
    if (this.selectedSquare) {
      const prev = this.selectedSquare
      this.#clearSelection()
      this.#emit('piece:deselected', { square: prev })
    }
    return false
  }

  makeMove(from, to, promotion = 'q') {
    const captured = this.isCapture(from, to) ? this.chess.get(to) : null
    let result
    try {
      result = this.chess.move({ from, to, promotion })
    } catch {
      result = null
    }

    if (!result) {
      this.#emit('move:illegal', { from, to })
      return false
    }

    const fen = this.chess.fen()
    this.history.push({ from, to, san: result.san, fen })
    this.#clearSelection()

    this.#emit('move:made', {
      from,
      to,
      san: result.san,
      fen,
      captured: result.captured || (captured ? captured.type : null)
    })

    this.#checkGameOver()
    return true
  }

  getLegalMoves(square) {
    return this.chess.moves({ square, verbose: true }).map((m) => m.to)
  }

  currentTurn() {
    return this.chess.turn()
  }

  getFen() {
    return this.chess.fen()
  }

  isCapture(from, to) {
    return this.chess
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && m.captured)
  }

  reset() {
    this.chess.reset()
    this.selectedSquare = null
    this.legalMovesCache = []
    this.history = []
    this.status = 'playing'
    this.#emit('game:reset', {})
  }

  #checkGameOver() {
    if (!this.chess.isGameOver()) return

    if (this.chess.isCheckmate()) {
      this.status = 'checkmate'
      // Side to move is checkmated -> the other side won.
      const winner = this.currentTurn() === 'w' ? 'b' : 'w'
      this.#emit('game:over', { reason: 'checkmate', winner })
      return
    }

    if (this.chess.isStalemate()) {
      this.status = 'stalemate'
      this.#emit('game:over', { reason: 'stalemate', winner: null })
      return
    }

    // Draws: insufficient material, threefold, 50-move.
    this.status = 'draw'
    this.#emit('game:over', { reason: 'draw', winner: null })
  }

  #clearSelection() {
    this.selectedSquare = null
    this.legalMovesCache = []
  }

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }))
  }
}
