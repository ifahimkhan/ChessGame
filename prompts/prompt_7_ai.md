# prompt_7_ai.md
## Domain: D2 (partial) — Chess AI
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Add a simple AI opponent that plays black. Two difficulty levels: `easy` (random legal move) and `medium` (minimax depth 2 with basic material evaluation).

---

## Context Snapshot
- `chess.js` API: `chess.moves({ verbose: true })` returns all legal moves; `chess.move(m)` applies one
- AI only plays when `gameState.mode === 'ai'` and it's black's turn (`chess.turn() === 'b'`)
- AI is triggered after a `'move:made'` event (human just moved white)
- AI must NOT block the render loop — use `setTimeout(0)` or `requestAnimationFrame`
- `GameState.makeMove(from, to)` is the public API — AI uses this same method

---

## Tasks

### 1. Create `src/game/AI.js`

#### Piece values (for evaluation)
```js
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }
```

#### `evaluate(chess)` → number (positive = good for white)
- Sum piece values: white pieces positive, black pieces negative
- Use `chess.board()` (returns 8×8 array of `{ type, color } | null`)

#### `minimax(chess, depth, alpha, beta, maximizing)` → score
- Standard alpha-beta minimax
- Base case: `depth === 0` → return `evaluate(chess)`
- Get moves, try each, undo after: `chess.move(m)` ... `chess.undo()`
- Depth 2 max (fast enough for browser)

#### `getBestMove(chess, difficulty)` → `{ from, to }` or null
- `easy`: pick a random move from `chess.moves({ verbose: true })`
- `medium`: run minimax depth 2, return best move for black (minimising)
- Return null if no moves (shouldn't happen — game over is checked first)

#### `class AI`
```js
export class AI {
  constructor(gameState, difficulty = 'easy') {
    this.gameState = gameState
    this.difficulty = difficulty
    this._listen()
  }

  _listen() {
    this.gameState.addEventListener('move:made', (e) => {
      if (this.gameState.mode !== 'ai') return
      if (this.gameState.currentTurn() !== 'b') return
      if (this.gameState.status !== 'playing') return
      // Non-blocking: yield to render frame first
      setTimeout(() => this._doMove(), 0)
    })
  }

  _doMove() {
    const chess = this.gameState.chess  // direct access for minimax
    const move = getBestMove(chess, this.difficulty)
    if (move) this.gameState.makeMove(move.from, move.to)
  }
}
```

### 2. Update `src/main.js`
```js
import { AI } from './game/AI.js'
// Only if mode is 'ai':
const ai = new AI(gameState, 'easy') // or 'medium'
```
Decide mode at startup — you can read from a query param:
```js
const params = new URLSearchParams(location.search)
const mode = params.get('mode') === 'pvp' ? 'pvp' : 'ai'
```
Then pass `mode` to `new GameState(mode)` and `new AI(gameState, params.get('diff') || 'easy')`.

---

## Output Files
- `src/game/AI.js` (create)
- `src/main.js` (update: mode detection + AI instantiation)

## Constraints
- AI only plays black — never call `gameState.makeMove` for white pieces
- `chess.undo()` must be called after every minimax branch to restore state
- Do NOT import Three.js in AI.js
- Medium difficulty depth is capped at 2 — do not increase (will freeze browser)
- No Web Worker needed at depth 2

**Show only changed/created files.**
