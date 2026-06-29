import { sceneManager } from './scene/SceneManager.js'
import { Board } from './scene/Board.js'
import { Pieces } from './scene/Pieces.js'
import { GameState } from './game/GameState.js'
import { MoveHandler } from './game/MoveHandler.js'
import { CameraFlip } from './scene/CameraFlip.js'
import { AI } from './game/AI.js'
import { HUD } from './ui/HUD.js'
import { ModeSelector } from './ui/ModeSelector.js'
import { SoundManager } from './ui/SoundManager.js'
import { SettingsPanel } from './ui/SettingsPanel.js'
import { Board2D } from './scene2d/Board2D.js'
import { settings, THEMES } from './utils/themes.js'

// Render loop can run before a mode is chosen — it just draws an empty board.
sceneManager.start()

async function init() {
  // 1. Wait for the player's first mode/difficulty choice.
  const first = await ModeSelector.show()

  // Preload sounds right after the first user gesture (the mode-selector click
  // is a valid gesture for starting an AudioContext). Fire-and-forget — if the
  // files are missing the game still works silently.
  const soundManager = new SoundManager()
  soundManager.preload().catch((err) => console.warn('Sound load failed:', err))

  // 2. Build the game with the chosen mode.
  const gameState = new GameState(first.mode)
  const board = new Board(sceneManager.scene)
  const pieces = new Pieces(sceneManager.scene)
  pieces.syncWithFen(gameState.getFen())

  // Smooth 180° camera flip after each PvP move (no-op in AI mode).
  const cameraFlip = new CameraFlip(sceneManager, gameState)
  sceneManager.setCameraFlip(cameraFlip)

  const moveHandler = new MoveHandler(
    sceneManager.renderer,
    sceneManager.camera,
    board,
    pieces,
    gameState,
    cameraFlip
  )
  const hud = new HUD(gameState, pieces, board, soundManager)

  // 2D view shares the same GameState (pure logic). Both views stay in sync;
  // only the visible one accepts clicks. Kids switch live from the gear menu.
  const board2d = new Board2D(gameState, document.getElementById('board-2d'))

  const applyView = (view) => {
    const is2d = view === '2d'
    document.getElementById('chess-canvas').classList.toggle('hidden', is2d)
    board2d.setActive(is2d)
    // Disable 3D click handling while the 2D board is showing, and vice versa.
    moveHandler.disabled = is2d || gameState.status !== 'playing'
  }
  // Keep the 3D board/background and 3D pieces in sync with the same theme &
  // piece-style settings the 2D board uses, so both views always match.
  const applyTheme3D = () => {
    const t = THEMES[settings.get('theme')] || THEMES.candy
    board.applyTheme(t)
    sceneManager.setBackground(t.page)
  }
  settings.addEventListener('change', (e) => {
    if (e.detail.key === 'theme') applyTheme3D()
    if (e.detail.key === 'pieceStyle') pieces.rebuild(gameState.getFen())
  })
  applyTheme3D()

  new SettingsPanel(applyView)
  document.getElementById('settings-btn').classList.remove('hidden')
  applyView(settings.get('view'))

  // Single AI instance. It self-gates on gameState.mode === 'ai', so it stays
  // dormant in PvP and we never have to tear it down when the mode changes.
  const ai = new AI(gameState, first.difficulty || 'easy')

  // In-HUD dropdown: tweak AI strength live, no restart needed (the new depth
  // applies on black's next move).
  const difficultyEl = document.getElementById('difficulty')
  const controlsEl = document.getElementById('controls')
  const syncControls = (mode, diff) => {
    if (difficultyEl) difficultyEl.value = diff
    if (controlsEl) controlsEl.classList.toggle('hidden', mode !== 'ai')
  }
  if (difficultyEl) {
    difficultyEl.addEventListener('change', () => {
      ai.difficulty = difficultyEl.value
    })
  }
  syncControls(first.mode, ai.difficulty)

  // Play Again replays the same mode/difficulty instantly (HUD's restart button
  // already resets state, re-syncs pieces, and re-enables input). The mode
  // selector only appears on first load.
}

init()
