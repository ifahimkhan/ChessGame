// Kid-friendly board color themes and piece styles for the 2D view.
// Pure data + a tiny localStorage-backed settings store with events.
// NO Three.js, NO DOM rendering here.

// --- Color themes ----------------------------------------------------------
// Each theme paints the 2D board: light/dark squares plus accent colours used
// for selection, legal-move dots, last-move and check highlights.
export const THEMES = {
  candy: {
    label: '🍬 Candy',
    light: '#ffe9f3',
    dark: '#ff9ec4',
    page: '#fff0f6',
    selected: '#ffd54a',
    legal: '#ff5ca8',
    lastMove: '#ffc4dd',
    check: '#ff4d4d'
  },
  ocean: {
    label: '🌊 Ocean',
    light: '#e3f7ff',
    dark: '#7fd3f0',
    page: '#eaf9ff',
    selected: '#ffe066',
    legal: '#1ba3d6',
    lastMove: '#bfeeff',
    check: '#ff5a5a'
  },
  forest: {
    label: '🌳 Forest',
    light: '#eef7e0',
    dark: '#9bc97a',
    page: '#f1f8e7',
    selected: '#ffd95e',
    legal: '#5fa83a',
    lastMove: '#d7eebd',
    check: '#ff5a5a'
  },
  sunshine: {
    label: '☀️ Sunshine',
    light: '#fff7d6',
    dark: '#ffce5c',
    page: '#fffae6',
    selected: '#ff8a3d',
    legal: '#f0a500',
    lastMove: '#ffe9a8',
    check: '#ff4d4d'
  },
  bubblegum: {
    label: '🫧 Bubblegum',
    light: '#f3ebff',
    dark: '#c4a7f0',
    page: '#f6f0ff',
    selected: '#ffd54a',
    legal: '#9b5de5',
    lastMove: '#e4d4ff',
    check: '#ff4d6d'
  },
  classic: {
    label: '♟ Classic',
    light: '#f0d9b5',
    dark: '#b58863',
    page: '#2b2b3a',
    selected: '#f7e07a',
    legal: '#6aa84f',
    lastMove: '#cdd26a',
    check: '#ff5a5a'
  }
}

// --- Piece styles ----------------------------------------------------------
// Each style maps piece type -> glyph. `size` scales the glyph per piece so
// the board literally has "different shapes and sizes": small pawns up to big
// kings/queens. White vs black is shown with a light/dark token behind the
// glyph (set in Board2D), so the same shapes work for both sides.
export const PIECE_STYLES = {
  flowers: {
    label: '🌸 Flowers',
    glyphs: { p: '🌼', r: '🌻', n: '🌷', b: '🌸', q: '🌹', k: '🏵️' }
  },
  animals: {
    label: '🐾 Animals',
    glyphs: { p: '🐣', r: '🐢', n: '🐴', b: '🦊', q: '🦄', k: '🦁' }
  },
  fruit: {
    label: '🍓 Fruit',
    glyphs: { p: '🍒', r: '🍇', n: '🍌', b: '🍎', q: '🍓', k: '🍍' }
  },
  classic: {
    label: '♛ Classic',
    // Filled glyphs for both sides; the token colour distinguishes them.
    glyphs: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
  }
}

// Relative glyph sizes (in em) so pieces vary in size by importance.
export const PIECE_SIZE = { p: 1.0, r: 1.25, n: 1.25, b: 1.3, q: 1.55, k: 1.6 }

// --- Settings store --------------------------------------------------------
// Tiny event-emitting store, persisted to localStorage so a kid's choices
// stick between sessions. Emits 'change' whenever any setting updates.
const KEY = 'chess-kids-settings'
const DEFAULTS = { view: '3d', theme: 'candy', pieceStyle: 'flowers' }

class SettingsStore extends EventTarget {
  constructor() {
    super()
    let saved = {}
    try {
      saved = JSON.parse(localStorage.getItem(KEY)) || {}
    } catch {
      saved = {}
    }
    this.state = { ...DEFAULTS, ...saved }
  }

  get(key) {
    return this.state[key]
  }

  set(key, value) {
    if (this.state[key] === value) return
    this.state[key] = value
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state))
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
    this.dispatchEvent(new CustomEvent('change', { detail: { key, value, state: this.state } }))
  }
}

export const settings = new SettingsStore()
