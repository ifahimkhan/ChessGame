# prompt_4_gamestate.md
## Domain: D2 — Game Logic / State
**Read CLAUDE.md first for full context before writing any code.**

---

## Goal
Create the `GameState` class — the single source of truth for the chess game. Wraps `chess.js`, exposes a clean event-driven API, and manages game mode (pvp vs AI).

---

## Context Snapshot
- Library: `chess.js` v1.x — `import { Chess } from 'chess.js'`
- `chess.js` API: `chess.moves({ square })`, `chess.move({ from, to, promotion })`, `chess.fen()`, `chess.isGameOver()`, `chess.isCheckmate()`, `chess.isStalemate()`, `chess.isDraw()`, `chess.turn()` (`'w'` or `'b'`)
- No DOM, no Three.js in this file
- Events dispatched via `EventTarget` (browser native, no library needed)

---

## Tasks

### 1. Create `src/game/GameState.js`

```js
import { Chess } from 'chess.js'

export class GameState extends EventTarget {
  constructor(mode = 'pvp') {
    super()
    this.chess = new Chess()
    this.mode = mode          // 'pvp' | 'ai'
    this.selectedSquare = null
    this.legalMovesCache = [] // squares the selected piece can move to
    this.history = []         // array of { from, to, san, fen } per move
    this.status = 'playing'   // 'playing' | 'checkmate' | 'draw' | 'stalemate'
  }
```

#### `selectSquare(square)`
- If `this.selectedSquare === square`: deselect, clear cache, emit `'piece:deselected'`
- Else if square has a piece of `this.currentTurn()`: 
  - Set `this.selectedSquare = square`
  - Compute `this.legalMovesCache` (array of destination squares)
  - Emit `'piece:selected'` with `{ square, legalMoves }`
- If clicking a square in `this.legalMovesCache`: attempt `makeMove(this.selectedSquare, square)`

#### `makeMove(from, to, promotion = 'q')`
- Validate via `chess.move({ from, to, promotion })`
- On success:
  - Push to `this.history`
  - Emit `'move:made'` with `{ from, to, san, fen: this.chess.fen(), captured }`
  - Check game over → update `this.status`, emit `'game:over'` if needed
  - Reset `this.selectedSquare` and `this.legalMovesCache`
- On failure: emit `'move:illegal'`

#### `getLegalMoves(square)` → array of destination squares (strings)
```js
return this.chess.moves({ square, verbose: true }).map(m => m.to)
```

#### `currentTurn()` → `'w'` | `'b'`

#### `getFen()` → current FEN string

#### `isCapture(from, to)` → boolean (check `chess.moves` verbose for `captured` field)

#### `reset()`
- `this.chess.reset()`
- Reset all state fields
- Emit `'game:reset'`

#### Events reference
| Event name | Detail payload |
|-----------|----------------|
| `'piece:selected'` | `{ square, legalMoves }` |
| `'piece:deselected'` | `{ square }` |
| `'move:made'` | `{ from, to, san, fen, captured }` |
| `'move:illegal'` | `{ from, to }` |
| `'game:over'` | `{ reason: 'checkmate'|'stalemate'|'draw', winner: 'w'|'b'|null }` |
| `'game:reset'` | `{}` |

### 2. Update `src/main.js`
```js
import { GameState } from './game/GameState.js'
const gameState = new GameState('pvp') // or 'ai'
```

---

## Output Files
- `src/game/GameState.js` (create)
- `src/main.js` (update)

## Constraints
- ZERO Three.js imports in this file
- All move validation goes through `chess.js` — never hand-roll
- Use `EventTarget` not a custom emitter (no npm deps)
- Promotion always defaults to queen (`'q'`) — no UI picker needed in v1

**Show only changed/created files.**
