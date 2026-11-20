// All sounds are synthesized live with the Web Audio API — no audio files.

const MUTE_KEY = 'puffer-panic:muted'

class Sfx {
  constructor() {
    this.ctx = null
    this.master = null
    this.noiseBuf = null
    this.muted = false
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      /* storage unavailable */
    }
  }

  /** Lazily create/resume the AudioContext (must follow a user gesture). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.55
      const comp = this.ctx.createDynamicsCompressor()
      this.master.connect(comp)
      comp.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  setMuted(m) {
    this.muted = m
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.02)
  }

  ready() {
    return !this.muted && this.ctx && this.ctx.state === 'running'
  }

  tone({ freq = 440, to, dur = 0.15, type = 'sine', vol = 0.25, at = 0, attack = 0.005, release }) {
    if (!this.ready()) return
    const t0 = this.ctx.currentTime + at
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (release ?? dur))
    osc.connect(g)
    g.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + (release ?? dur) + 0.05)
  }

  noise({ dur = 0.3, vol = 0.3, at = 0, filter = 'lowpass', freq = 1200, to }) {
    if (!this.ready()) return
    if (!this.noiseBuf) {
      const len = this.ctx.sampleRate * 1
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }
    const t0 = this.ctx.currentTime + at
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const f = this.ctx.createBiquadFilter()
    f.type = filter
    f.frequency.setValueAtTime(freq, t0)
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(f)
    f.connect(g)
    g.connect(this.master)
    src.start(t0)
    src.stop(t0 + dur + 0.05)
  }

  // ——— game sounds ———

  /** Fuse tick — higher and sharper as the puffer swells. */
  tick(stage = 0) {
    const freq = [520, 640, 780, 980][stage]
    this.tone({ freq, dur: 0.05, type: 'square', vol: 0.05 + stage * 0.02 })
    if (stage === 3) this.tone({ freq: 110, to: 70, dur: 0.12, type: 'sine', vol: 0.35 }) // heartbeat thump
  }

  /** Inflate whoosh when the puffer grows a stage. */
  inflate(stage = 1) {
    const base = 180 + stage * 70
    this.tone({ freq: base, to: base * 2.4, dur: 0.35, type: 'sine', vol: 0.18, attack: 0.04 })
    this.noise({ dur: 0.3, vol: 0.08, filter: 'bandpass', freq: 600, to: 2400 })
  }

  pop() {
    this.noise({ dur: 0.5, vol: 0.7, filter: 'lowpass', freq: 3000, to: 200 })
    this.tone({ freq: 160, to: 40, dur: 0.4, type: 'sine', vol: 0.6, attack: 0.002 })
    this.tone({ freq: 900, to: 120, dur: 0.18, type: 'triangle', vol: 0.25 })
    // bubbles fizzing away
    for (let i = 0; i < 7; i++) {
      const f = 500 + Math.random() * 900
      this.tone({ freq: f, to: f * 1.8, dur: 0.07, type: 'sine', vol: 0.08, at: 0.25 + i * 0.07 })
    }
  }

  valid(tier = 'common') {
    if (tier === 'krillion') {
      ;[784, 988, 1175, 1568, 1976].forEach((f, i) =>
        this.tone({ freq: f, dur: 0.35, type: 'triangle', vol: 0.18, at: i * 0.07 }),
      )
      this.tone({ freq: 2637, dur: 0.6, type: 'sine', vol: 0.08, at: 0.35 })
    } else if (tier === 'rare') {
      ;[660, 880, 1320].forEach((f, i) => this.tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.18, at: i * 0.06 }))
    } else {
      this.tone({ freq: 740, dur: 0.12, type: 'triangle', vol: 0.18 })
      this.tone({ freq: 1110, dur: 0.18, type: 'triangle', vol: 0.18, at: 0.06 })
    }
  }

  invalid() {
    this.tone({ freq: 150, to: 110, dur: 0.22, type: 'sawtooth', vol: 0.16 })
    this.tone({ freq: 155, to: 112, dur: 0.22, type: 'square', vol: 0.08 })
  }

  duplicate() {
    this.tone({ freq: 330, to: 220, dur: 0.1, type: 'square', vol: 0.1 })
    this.tone({ freq: 330, to: 200, dur: 0.14, type: 'square', vol: 0.1, at: 0.11 })
  }

  life() {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) =>
      this.tone({ freq: f, dur: 0.25, type: 'sine', vol: 0.2, at: 0.25 + i * 0.08 }),
    )
  }

  pass() {
    this.noise({ dur: 0.18, vol: 0.06, filter: 'bandpass', freq: 900, to: 2600 })
  }

  key() {
    this.tone({ freq: 1800 + Math.random() * 600, dur: 0.02, type: 'square', vol: 0.015 })
  }

  eliminated() {
    ;[392, 330, 262, 196].forEach((f, i) => this.tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.18, at: 0.5 + i * 0.16 }))
  }

  roundStart() {
    this.tone({ freq: 392, dur: 0.12, type: 'sine', vol: 0.15 })
    this.tone({ freq: 587, dur: 0.2, type: 'sine', vol: 0.15, at: 0.1 })
  }

  victory() {
    const notes = [
      [523, 0], [659, 0.12], [784, 0.24], [1047, 0.36],
      [784, 0.6], [1047, 0.72], [1319, 0.84],
    ]
    notes.forEach(([f, at]) => {
      this.tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.2, at })
      this.tone({ freq: f / 2, dur: 0.3, type: 'sine', vol: 0.12, at })
    })
    this.tone({ freq: 1568, dur: 1.2, type: 'triangle', vol: 0.18, at: 1.05, release: 1.2 })
    this.tone({ freq: 784, dur: 1.2, type: 'sine', vol: 0.14, at: 1.05, release: 1.2 })
  }

  click() {
    this.tone({ freq: 880, dur: 0.05, type: 'sine', vol: 0.1 })
  }
}

export const sfx = new Sfx()
