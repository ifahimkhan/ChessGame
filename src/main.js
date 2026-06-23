import { sceneManager } from './scene/SceneManager.js'
import { Board } from './scene/Board.js'
import { Pieces } from './scene/Pieces.js'
import { GameState } from './game/GameState.js'
import { MoveHandler } from './game/MoveHandler.js'
import { AI } from './game/AI.js'
import { HUD } from './ui/HUD.js'

const params = new URLSearchParams(location.search)
const mode = params.get('mode') === 'pvp' ? 'pvp' : 'ai'

const gameState = new GameState(mode) // 'pvp' | 'ai'

const board = new Board(sceneManager.scene)

const pieces = new Pieces(sceneManager.scene)
pieces.syncWithFen(gameState.getFen())

const moveHandler = new MoveHandler(
  sceneManager.renderer,
  sceneManager.camera,
  board,
  pieces,
  gameState
)

const hud = new HUD(gameState, pieces, board)

if (mode === 'ai') {
  new AI(gameState, params.get('diff') || 'easy')
}

sceneManager.start()
// (other imports added in later prompts)
