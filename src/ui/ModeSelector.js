// Full-screen overlay shown before the game starts and again after restart.
// Resolves a Promise with { mode, difficulty } once the player chooses.
// NO Three.js, NO game logic — pure DOM.
export class ModeSelector {
  static _resolver = null
  static _wired = false

  // Bind click/hover handlers exactly once; reused for every round.
  static _wire() {
    if (ModeSelector._wired) return
    ModeSelector._wired = true

    const overlay = document.getElementById('mode-selector')
    const diffRow = document.getElementById('difficulty-row')
    const diffSelect = document.getElementById('difficulty-select')

    overlay.querySelectorAll('.mode-btn').forEach((btn) => {
      // Reveal difficulty picker only for the AI option.
      btn.addEventListener('mouseenter', () => {
        diffRow.style.display = btn.dataset.mode === 'ai' ? 'flex' : 'none'
      })

      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode
        const difficulty = mode === 'ai' ? diffSelect.value || 'easy' : null

        overlay.classList.add('hidden') // fade out
        setTimeout(() => {
          overlay.style.display = 'none' // remove from view
          const resolve = ModeSelector._resolver
          ModeSelector._resolver = null
          if (resolve) resolve({ mode, difficulty })
        }, 400)
      })
    })
  }

  static show() {
    ModeSelector._wire()
    return new Promise((resolve) => {
      ModeSelector._resolver = resolve
    })
  }

  // Re-show on restart (overlay was display:none after last selection).
  static reshowAfterGame() {
    const overlay = document.getElementById('mode-selector')
    overlay.style.display = 'flex'
    overlay.offsetHeight // force reflow so the opacity transition replays
    overlay.classList.remove('hidden')
    return ModeSelector.show()
  }
}
