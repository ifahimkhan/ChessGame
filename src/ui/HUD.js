// 2D HTML overlay. NO Three.js. Listens to GameState events, updates DOM.
// Move history appended incrementally (never full re-render).

const SYMBOLS = {
  w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
  b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
}

export class HUD {
  constructor(gameState, pieces, board, soundManager = null) {
    this.gameState = gameState
    this.pieces = pieces
    this.board = board
    this.soundManager = soundManager
    this.capturedByWhite = [] // black pieces white took
    this.capturedByBlack = [] // white pieces black took
    this.moveNumber = 1
    this.#cache()
    this._listen()
    this._updateTurnIndicator()
    if (this.soundManager) this._renderMuteButton()
  }

  #cache() {
    this.elTurn = document.getElementById('turn-indicator')
    this.elCheck = document.getElementById('check-warning')
    this.elCapWhite = document.getElementById('captured-white')
    this.elCapBlack = document.getElementById('captured-black')
    this.elHistory = document.getElementById('move-history')
    this.elOver = document.getElementById('game-over-screen')
    this.elOverTitle = document.getElementById('game-over-title')
    this.elRestart = document.getElementById('restart-btn')
  }

  _listen() {
    this.gameState.addEventListener('move:made', (e) => this._onMove(e.detail))
    this.gameState.addEventListener('game:over', (e) => this._onGameOver(e.detail))
    this.gameState.addEventListener('game:reset', () => this._onReset())

    // PvP camera flip: show a transient status, then restore the turn text.
    this.gameState.addEventListener('flip:start', () => {
      this.elTurn.textContent = '↺ Switching sides...'
    })
    this.gameState.addEventListener('flip:complete', () => {
      this._updateTurnIndicator()
    })

    this.elRestart.addEventListener('click', () => {
      this.gameState.reset()
      this.pieces.syncWithFen(this.gameState.getFen())
      this.board.clearAllHighlights()
    })
  }

  _onMove(detail) {
    // Sound first (check > capture > move priority handled inside).
    if (this.soundManager) this.soundManager.playForMove(detail, this.gameState.chess)

    // After move, currentTurn() = side now to move = side that was just captured against.
    // Capturer = opposite of currentTurn.
    if (detail.captured) {
      const capturedColor = this.gameState.currentTurn() // owner of captured piece
      const symbol = SYMBOLS[capturedColor][detail.captured]
      if (capturedColor === 'b') this.capturedByWhite.push(symbol)
      else this.capturedByBlack.push(symbol)
      this._renderCaptured()
    }

    this._appendHistory(detail.san)
    this._updateTurnIndicator()
    this.elCheck.classList.toggle('hidden', !this.gameState.chess.isCheck())
  }

  // Black just moved if it's now white's turn.
  _appendHistory(san) {
    const isWhiteMove = this.gameState.currentTurn() === 'b'
    if (isWhiteMove) {
      const row = document.createElement('div')
      row.textContent = `${this.moveNumber}. ${san}`
      this.elHistory.appendChild(row)
    } else {
      const last = this.elHistory.lastElementChild
      if (last) last.textContent += ` ${san}`
      else {
        const row = document.createElement('div')
        row.textContent = `${this.moveNumber}. ... ${san}`
        this.elHistory.appendChild(row)
      }
      this.moveNumber += 1
    }
    this.elHistory.scrollTop = this.elHistory.scrollHeight
  }

  _updateTurnIndicator() {
    const turn = this.gameState.currentTurn()
    this.elTurn.textContent = turn === 'w' ? "White's Turn ♙" : "Black's Turn ♟"
  }

  _renderMuteButton() {
    const btn = document.createElement('button')
    btn.id = 'mute-btn'
    btn.textContent = this.soundManager.isMuted() ? '🔇' : '🔊'
    btn.title = 'Toggle sound'
    btn.addEventListener('click', () => {
      const muted = this.soundManager.toggleMute()
      btn.textContent = muted ? '🔇' : '🔊'
    })
    document.getElementById('hud').appendChild(btn)
  }

  _renderCaptured() {
    this.elCapWhite.textContent = this.capturedByWhite.join('')
    this.elCapBlack.textContent = this.capturedByBlack.join('')
  }

  _onGameOver(detail) {
    this.elOverTitle.textContent = this.#gameOverTitle(detail)
    this.elOver.classList.remove('hidden')
  }

  #gameOverTitle(detail) {
    if (detail.reason === 'checkmate') {
      return detail.winner === 'w' ? 'White Wins!' : 'Black Wins!'
    }
    if (detail.reason === 'stalemate') return 'Stalemate'
    return 'Draw'
  }

  _onReset() {
    this.capturedByWhite = []
    this.capturedByBlack = []
    this.moveNumber = 1
    this.elHistory.replaceChildren()
    this._renderCaptured()
    this._updateTurnIndicator()
    this.elCheck.classList.add('hidden')
    this.elOver.classList.add('hidden')
  }
}
