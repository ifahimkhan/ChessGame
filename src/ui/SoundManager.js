// Audio playback via Web Audio API. Preloaded buffers, volume-controllable,
// avoids per-play latency. Mute state persisted in localStorage.
// Sound files: Lichess "standard" set (AGPLv3) — see prompts/prompt_F3_sounds.md.

export class SoundManager {
  constructor() {
    this._muted = localStorage.getItem('chess-muted') === 'true'
    this._ctx = null // AudioContext — created on first user gesture
    this._buffers = {} // { move, capture, check }
    this._loaded = false
  }

  // Load + decode all sounds. Call from a user-gesture handler (mode-selector
  // click) so the AudioContext is allowed to start. Fire-and-forget: on failure
  // the game still runs silently.
  async preload() {
    this._ctx = new (window.AudioContext || window.webkitAudioContext)()

    const files = {
      move: 'sounds/move.mp3',
      capture: 'sounds/capture.mp3',
      check: 'sounds/check.mp3'
    }

    await Promise.all(
      Object.entries(files).map(async ([name, path]) => {
        try {
          const res = await fetch(path)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const arrayBuffer = await res.arrayBuffer()
          this._buffers[name] = await this._ctx.decodeAudioData(arrayBuffer)
        } catch (err) {
          console.warn(`[SoundManager] Failed to load ${name}:`, err)
          console.warn(
            '[SoundManager] Run the curl commands in prompts/prompt_F3_sounds.md to download the audio files.'
          )
        }
      })
    )
    this._loaded = true
  }

  // name: 'move' | 'capture' | 'check'
  play(name) {
    if (this._muted || !this._loaded || !this._buffers[name]) return
    // Resume if the context was suspended by autoplay policy.
    if (this._ctx.state === 'suspended') this._ctx.resume()
    const source = this._ctx.createBufferSource()
    source.buffer = this._buffers[name]
    source.connect(this._ctx.destination)
    source.start(0)
  }

  // Convenience for the 'move:made' listener. Check takes priority and plays
  // INSTEAD of move/capture (matches Lichess behaviour).
  playForMove(detail, chess) {
    if (chess.isCheck()) {
      this.play('check')
    } else if (detail.captured) {
      this.play('capture')
    } else {
      this.play('move')
    }
  }

  toggleMute() {
    this._muted = !this._muted
    localStorage.setItem('chess-muted', this._muted)
    return this._muted
  }

  isMuted() {
    return this._muted
  }
}
