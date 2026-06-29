import { THEMES, PIECE_STYLES, settings } from '../utils/themes.js'

// Wires the gear button + settings panel to the settings store.
// Pure DOM. Calls onViewChange('2d'|'3d') when the player switches view.
export class SettingsPanel {
  constructor(onViewChange) {
    this.onViewChange = onViewChange
    this.btn = document.getElementById('settings-btn')
    this.panel = document.getElementById('settings-panel')
    this.themeSel = document.getElementById('theme-select')
    this.pieceSel = document.getElementById('piece-select')
    this.viewSeg = document.getElementById('view-seg')

    this._populate()
    this._syncFromStore()
    this._wire()
  }

  _populate() {
    for (const [key, t] of Object.entries(THEMES)) {
      this.themeSel.appendChild(new Option(t.label, key))
    }
    for (const [key, s] of Object.entries(PIECE_STYLES)) {
      this.pieceSel.appendChild(new Option(s.label, key))
    }
  }

  _syncFromStore() {
    this.themeSel.value = settings.get('theme')
    this.pieceSel.value = settings.get('pieceStyle')
    this._markView(settings.get('view'))
  }

  _markView(view) {
    this.viewSeg.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === view)
    })
  }

  _wire() {
    this.btn.addEventListener('click', () => {
      this.panel.classList.toggle('hidden')
    })

    this.themeSel.addEventListener('change', () =>
      settings.set('theme', this.themeSel.value)
    )
    this.pieceSel.addEventListener('change', () =>
      settings.set('pieceStyle', this.pieceSel.value)
    )

    this.viewSeg.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        settings.set('view', b.dataset.view)
        this._markView(b.dataset.view)
      })
    })

    settings.addEventListener('change', (e) => {
      if (e.detail.key === 'view' && this.onViewChange) {
        this.onViewChange(e.detail.value)
      }
    })
  }
}
