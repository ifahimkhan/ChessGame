import { THEMES, PIECE_STYLES, PIECE_SIZE, settings } from '../utils/themes.js'

// Flat, kid-friendly 2D chess board rendered as an 8x8 DOM grid.
// Shares the same GameState as the 3D view (pure logic, no rules here).
// Re-renders the whole board on every game event — 64 divs is cheap and keeps
// highlights/pieces always consistent with the source of truth.
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] // top -> bottom (white at bottom)
const PROMO_PIECES = ['q', 'r', 'b', 'n']

export class Board2D {
  constructor(gameState, root) {
    this.gameState = gameState
    this.root = root // container element (#board-2d)
    this.disabled = false
    this.active = false // only the visible view handles clicks

    this._build()
    this._listenGameState()
    settings.addEventListener('change', (e) => {
      if (e.detail.key === 'theme' || e.detail.key === 'pieceStyle') this.render()
    })
    this.render()
  }

  // Build the static 8x8 grid once; cells reused across renders.
  _build() {
    this.root.innerHTML = ''
    this.board = document.createElement('div')
    this.board.className = 'board2d-grid'
    this.cells = {} // square -> cell element

    for (const rank of RANKS) {
      for (let f = 0; f < 8; f++) {
        const square = FILES[f] + rank
        const cell = document.createElement('button')
        cell.className = 'board2d-cell'
        cell.dataset.square = square
        cell.addEventListener('click', () => this._onCellClick(square))
        this.board.appendChild(cell)
        this.cells[square] = cell
      }
    }
    this.root.appendChild(this.board)
  }

  _onCellClick(square) {
    if (this.disabled || !this.active) return
    const promo = this._promotionFor(square)
    if (promo) {
      this.gameState.makeMove(this.gameState.selectedSquare, square, promo)
      return
    }
    this.gameState.selectSquare(square)
  }

  // Detect a pawn promotion for the current selection and ask which piece.
  _promotionFor(to) {
    const from = this.gameState.selectedSquare
    if (!from || !this.gameState.legalMovesCache.includes(to)) return null
    const isPromo = this.gameState.chess
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && m.flags.includes('p'))
    if (!isPromo) return null
    const choice = (
      prompt('Promote to: q (Queen), r (Rook), b (Bishop), n (Knight)') || 'q'
    )
      .trim()
      .toLowerCase()
    return PROMO_PIECES.includes(choice) ? choice : 'q'
  }

  _listenGameState() {
    const gs = this.gameState
    const rerender = () => this.render()
    gs.addEventListener('move:made', rerender)
    gs.addEventListener('piece:selected', rerender)
    gs.addEventListener('piece:deselected', rerender)
    gs.addEventListener('move:illegal', rerender)
    gs.addEventListener('game:reset', rerender)
    gs.addEventListener('game:over', () => {
      this.disabled = true
    })
    gs.addEventListener('game:reset', () => {
      this.disabled = false
    })
  }

  // Paint squares, pieces and highlights from the current game state.
  render() {
    const theme = THEMES[settings.get('theme')] || THEMES.candy
    const styleKey = settings.get('pieceStyle')
    const style = PIECE_STYLES[styleKey] || PIECE_STYLES.flowers
    const isClassic = styleKey === 'classic'

    const boardArr = this.gameState.chess.board()
    const bySquare = {}
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = boardArr[r][c]
        if (cell) bySquare[cell.square] = cell
      }
    }

    const selected = this.gameState.selectedSquare
    const legal = new Set(this.gameState.legalMovesCache)
    const last = this.gameState.history[this.gameState.history.length - 1]
    const inCheck = this.gameState.chess.isCheck()
    const turn = this.gameState.currentTurn()

    for (const rank of RANKS) {
      for (let f = 0; f < 8; f++) {
        const square = FILES[f] + rank
        const cell = this.cells[square]
        const isDark = (f + rank) % 2 === 1
        let bg = isDark ? theme.dark : theme.light

        if (last && (square === last.from || square === last.to)) bg = theme.lastMove
        if (square === selected) bg = theme.selected
        cell.style.background = bg
        cell.style.outline = ''

        const piece = bySquare[square]
        // Highlight the king when in check.
        if (inCheck && piece && piece.type === 'k' && piece.color === turn) {
          cell.style.background = theme.check
        }

        // Piece glyph on a coloured token (light = white, dark = black).
        cell.innerHTML = ''
        if (piece) {
          const token = document.createElement('span')
          token.textContent = style.glyphs[piece.type]
          token.style.fontSize = (PIECE_SIZE[piece.type] || 1) + 'em'
          if (isClassic) {
            // Default filled chessmen: solid silhouettes with a thin outline.
            // White side filled ivory, dark side filled warm wood-tan (never
            // plain black). The same filled glyph is used for both sides.
            token.className = 'board2d-piece classic'
            token.style.fontFamily = "'Segoe UI Symbol','DejaVu Sans',serif"
            token.style.color = piece.color === 'w' ? '#fbf5e6' : '#a9712f'
          } else {
            token.className = 'board2d-piece ' + (piece.color === 'w' ? 'side-w' : 'side-b')
          }
          cell.appendChild(token)
        }

        // Legal-move marker: a dot on empty squares, a ring on captures.
        if (legal.has(square)) {
          const dot = document.createElement('span')
          dot.className = piece ? 'board2d-capture' : 'board2d-dot'
          dot.style.setProperty('--legal', theme.legal)
          cell.appendChild(dot)
        }
      }
    }

    this.root.style.setProperty('--page-bg', theme.page)
  }

  setActive(active) {
    this.active = active
    this.root.classList.toggle('hidden', !active)
    if (active) this.render()
  }
}
