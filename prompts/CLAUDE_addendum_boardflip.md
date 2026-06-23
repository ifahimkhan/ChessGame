# CLAUDE.md — Addendum: Board Flip / Multiplayer Mode
> Append this section to the existing CLAUDE.md under a new heading "## Feature: Board Flip PvP"

---

## Feature: Board Flip PvP

### What changed
- `GameState.mode` already supports `'pvp'` and `'ai'` — no new values needed
- New: after every move in `'pvp'` mode, the camera animates 180° around the Y-axis
- The board, pieces, and HUD all stay in world space — only the camera orbits

### Camera flip behaviour
- **Trigger**: `'move:made'` event fires → if `mode === 'pvp'` → start flip animation
- **Rotation**: camera orbits from current azimuth to current azimuth + 180° around Y
- **Duration**: 600ms, ease-in-out
- **Polar angle**: stays constant during flip (no vertical movement)
- **OrbitControls**: must be temporarily disabled during animation, re-enabled after
- Camera flip lives in: `src/scene/CameraFlip.js` (new file — keeps SceneManager clean)

### Mode selector UI
- Shown at app startup as a full-screen overlay before the game begins
- Two choices: "vs Human" (pvp) and "vs AI" (ai)
- On selection: overlay hides, `GameState` is initialised with chosen mode, board renders
- Selector lives in: `src/ui/ModeSelector.js` (new file)
- After game over + restart: mode selector re-appears so players can switch

### Ownership
| New file | Domain |
|----------|--------|
| `src/scene/CameraFlip.js` | D4 — scene |
| `src/ui/ModeSelector.js` | D4 — UI |

### Modified files
| File | Change |
|------|--------|
| `src/main.js` | Defer init until mode is selected; wire CameraFlip |
| `src/ui/HUD.js` | Trigger mode selector on restart; show "Flip in progress" lock |
| `index.html` | Add `#mode-selector` overlay markup |

### Do rules (new)
- CameraFlip disables OrbitControls for exactly the animation duration — no longer
- During camera flip, `MoveHandler` click events must be ignored (lock flag)
- Board coordinates do NOT change — camera moves, not the board
- In AI mode: no flip at all — camera stays fixed behind white

### Don't rules (new)
- Don't rotate the board mesh or pieces — only the camera
- Don't flip for the AI's move — only for the human's move (and AI mode has no flip)
- Don't re-instantiate GameState on mode change — call `gameState.reset()` instead
