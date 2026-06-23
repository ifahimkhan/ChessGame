import * as THREE from 'three'
import { Animations } from '../ui/Animations.js'
import { sceneManager } from '../scene/SceneManager.js'

const PROMO_PIECES = ['q', 'r', 'b', 'n']

// Glue layer: mouse click -> raycast -> chess square -> GameState.
// Owns NO game logic. Listens to GameState events, drives Board + Pieces.
export class MoveHandler {
  constructor(renderer, camera, board, pieces, gameState) {
    this.renderer = renderer
    this.camera = camera
    this.board = board
    this.pieces = pieces
    this.gameState = gameState

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.disabled = false
    this.hoveredSquare = null

    this._bindEvents()
    this._listenGameState()
  }

  _bindEvents() {
    const el = this.renderer.domElement
    el.addEventListener('click', (e) => this._onCanvasClick(e))
    el.addEventListener('mousemove', (e) => this._onMouseMove(e))
    el.addEventListener('touchend', (e) => {
      e.preventDefault()
      const touch = e.changedTouches[0]
      this._onCanvasClick({ clientX: touch.clientX, clientY: touch.clientY })
    })
  }

  _onCanvasClick(event) {
    if (this.disabled) return

    const square = this._squareFromEvent(event)
    if (!square) return

    const promo = this._promotionFor(square)
    if (promo) {
      this.gameState.makeMove(this.gameState.selectedSquare, square, promo)
      return
    }

    this.gameState.selectSquare(square)
  }

  // Returns promotion piece ('q'|'r'|'b'|'n') if clicking `to` triggers a
  // pawn promotion for the current selection; otherwise null.
  _promotionFor(to) {
    const from = this.gameState.selectedSquare
    if (!from || !this.gameState.legalMovesCache.includes(to)) return null

    const isPromo = this.gameState.chess
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && m.flags.includes('p'))
    if (!isPromo) return null

    const choice = (
      prompt('Promote pawn to: q (Queen), r (Rook), b (Bishop), n (Knight)') ||
      'q'
    )
      .trim()
      .toLowerCase()
    return PROMO_PIECES.includes(choice) ? choice : 'q'
  }

  _onMouseMove(event) {
    if (this.disabled) return
    const square = this._squareFromEvent(event)

    if (square === this.hoveredSquare) return
    this._setHoverScale(this.hoveredSquare, 1)
    this.hoveredSquare = null

    if (!square) return
    const group = this.pieces.getGroup(square)
    if (group && group.userData.color === this.gameState.currentTurn()) {
      this._setHoverScale(square, 1.08)
      this.hoveredSquare = square
    }
  }

  _setHoverScale(square, scale) {
    if (!square) return
    const group = this.pieces.getGroup(square)
    if (group) group.scale.set(scale, scale, scale)
  }

  _squareFromEvent(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const targets = Object.values(this.board.squareMeshes)
    const hits = this.raycaster.intersectObjects(targets, false)
    if (hits.length === 0) return null
    return hits[0].object.name || null
  }

  _listenGameState() {
    const gs = this.gameState

    gs.addEventListener('piece:selected', (e) => {
      const { square, legalMoves } = e.detail
      this.board.clearHighlights(['selected', 'legalMove'])
      this.board.highlight(square, 'selected')
      for (const sq of legalMoves) this.board.highlight(sq, 'legalMove')
    })

    gs.addEventListener('piece:deselected', () => {
      this.board.clearHighlights(['selected', 'legalMove'])
    })

    gs.addEventListener('move:made', (e) => {
      const { from, to, captured } = e.detail
      this.board.clearAllHighlights()
      this.board.highlight(from, 'lastMove')
      this.board.highlight(to, 'lastMove')

      // Captured piece sits on `to` — fade it out, then dispose.
      if (captured) {
        const capturedGroup = this.pieces.getGroup(to)
        Animations.playCapture(capturedGroup, () => this.pieces.removePiece(to))
      }

      // Glide the mover from -> to, then re-sync the full board from FEN.
      // FEN sync correctly handles castling, en passant, and promotion.
      const movingGroup = this.pieces.getGroup(from)
      Animations.playMove(movingGroup, from, to, () =>
        this.pieces.syncWithFen(e.detail.fen)
      )

      this._maybeFlipCamera()
    })

    gs.addEventListener('move:illegal', (e) => {
      const { from } = e.detail
      this.board.highlight(from, 'selected')
      setTimeout(() => this.board.clearHighlights(['selected']), 300)
    })

    gs.addEventListener('game:over', () => {
      this.disabled = true
    })
  }

  // PvP only: swing camera to the side of the player now to move.
  _maybeFlipCamera() {
    if (this.gameState.mode !== 'pvp') return
    const turn = this.gameState.currentTurn()
    sceneManager.camera.position.set(0, 8, turn === 'w' ? 8 : -8)
    sceneManager.controls.target.set(0, 0, 0)
    sceneManager.controls.update()
  }
}
