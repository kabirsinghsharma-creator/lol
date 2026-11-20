import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Pause, Play, LogOut, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import Arena, { ringPositions } from './Arena.jsx'
import CategoryHeader from './CategoryHeader.jsx'
import AnswerInput from './AnswerInput.jsx'
import AnswerFeed from './AnswerFeed.jsx'
import Summary from './Summary.jsx'
import { createGame, gameReducer } from '../game/engine.js'
import { sfx } from '../audio/sfx.js'

let fxSeq = 0
// Dev/testing aid: ?speed=4 fast-forwards the game clock.
const SPEED = Math.min(8, Math.max(0.25, Number(new URLSearchParams(window.location.search).get('speed')) || 1))

export default function GameScreen({ config, onExit, muted, onToggleMute }) {
  const [state, dispatch] = useReducer(gameReducer, config, createGame)
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [bursts, setBursts] = useState([])
  const [fx, setFx] = useState({}) // transient overlays keyed by type
  const [gains, setGains] = useState({})
  const [showSummary, setShowSummary] = useState(false)
  const lastEvent = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const positions = useMemo(() => ringPositions(state.players.length), [state.players.length])

  // ——— game clock ———
  useEffect(() => {
    let raf
    let last = performance.now()
    const loop = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05) * SPEED
      last = t
      dispatch({ type: 'TICK', dt })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const addBurst = useCallback((x, y, kind) => {
    const id = ++fxSeq
    setBursts((b) => [...b, { id, x, y, kind }])
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 2200)
  }, [])

  const flashFx = useCallback((key, value, ms) => {
    const id = ++fxSeq
    setFx((f) => ({ ...f, [key]: { ...value, id } }))
    setTimeout(() => setFx((f) => (f[key]?.id === id ? { ...f, [key]: null } : f)), ms)
  }, [])

  // ——— react to engine events: sound, particles, overlays ———
  useEffect(() => {
    const s = stateRef.current
    for (const e of state.events) {
      if (e.id <= lastEvent.current) continue
      lastEvent.current = e.id
      const p = e.playerIdx != null ? s.players[e.playerIdx] : null
      const pos = e.playerIdx != null ? positions[e.playerIdx] : { x: 50, y: 50 }
      switch (e.type) {
        case 'tick':
          sfx.tick(e.stage)
          break
        case 'stage':
          sfx.inflate(e.stage)
          break
        case 'roundStart':
          sfx.roundStart()
          setDraft('')
          break
        case 'valid':
          sfx.valid(e.tier)
          addBurst(pos.x, pos.y, e.tier)
          if (!p.isBot) {
            setDraft('')
            setFeedback({ kind: 'valid', at: e.at })
          }
          if (e.tier === 'krillion') {
            flashFx('krillion', { name: p.name, answer: e.answer, color: p.color }, 2200)
            flashFx('flash', { kind: 'gold' }, 900)
            addBurst(50, 50, 'krillion')
          }
          break
        case 'invalid':
          sfx.invalid()
          if (!p.isBot) setFeedback({ kind: 'invalid', at: e.at })
          break
        case 'duplicate':
          sfx.duplicate()
          if (!p.isBot) setFeedback({ kind: 'duplicate', at: e.at })
          break
        case 'lifeGained':
          sfx.life()
          addBurst(pos.x, pos.y, 'heart')
          setGains((g) => ({ ...g, [p.id]: e.id }))
          break
        case 'pass': {
          sfx.pass()
          const next = s.players[e.to]
          if (s.mode === 'party' && !next.isBot) flashFx('passTo', { name: next.name, color: next.color, emoji: next.emoji }, 1100)
          break
        }
        case 'botKey':
          sfx.key()
          break
        case 'pop': {
          sfx.pop()
          const px = 50 + (pos.x - 50) * 0.36
          const py = 50 + (pos.y - 50) * 0.36
          addBurst(px, py, 'pop')
          flashFx('pop', { name: p.name, color: p.color, x: px, y: py }, 1700)
          flashFx('flash', { kind: 'red' }, 600)
          flashFx('quake', {}, 500)
          setDraft('')
          break
        }
        case 'eliminated':
          sfx.eliminated()
          flashFx('out', { name: p.name, emoji: p.emoji }, 2000)
          break
        case 'victory':
          sfx.victory()
          addBurst(50, 50, 'victory')
          setTimeout(() => setShowSummary(true), 1300)
          break
        default:
      }
    }
  }, [state.events, positions, addBurst, flashFx])

  // ——— keyboard: Esc pauses ———
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') dispatch({ type: 'TOGGLE_PAUSE' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (text) => dispatch({ type: 'SUBMIT', text })
  const replay = () => {
    lastEvent.current = 0
    setShowSummary(false)
    setBursts([])
    setFeedback(null)
    setGains({})
    setDraft('')
    dispatch({ type: 'NEW_GAME', config })
  }

  const overlays = (
    <>
      {fx.pop && (
        <div
          key={fx.pop.id}
          className="pop-text absolute z-40 text-center pointer-events-none"
          style={{ left: `${fx.pop.x}%`, top: `${fx.pop.y}%` }}
        >
          <div className="font-display font-extrabold text-6xl sm:text-7xl text-red-400 drop-shadow-[0_0_20px_rgba(255,60,60,.8)]" style={{ WebkitTextStroke: '2px #fff3' }}>
            POP!
          </div>
          <div className="font-bold text-sm sm:text-base whitespace-nowrap" style={{ color: fx.pop.color }}>
            {fx.pop.name} loses a heart
          </div>
        </div>
      )}
      {fx.krillion && (
        <div key={fx.krillion.id} className="krillion-banner absolute z-40 left-1/2 top-1/2 text-center pointer-events-none">
          <div className="shine rounded-2xl px-5 py-2 text-amber-950 font-display font-extrabold text-2xl sm:text-4xl shadow-[0_0_40px_rgba(255,209,102,.7)] whitespace-nowrap">
            ✦ One in a Krillion! ✦
          </div>
          <div className="mt-1 font-bold text-white drop-shadow whitespace-nowrap">
            <span style={{ color: fx.krillion.color }}>{fx.krillion.name}</span> · “{fx.krillion.answer}” · +1 ♥
          </div>
        </div>
      )}
      {fx.out && (
        <div key={fx.out.id} className="krillion-banner absolute z-40 left-1/2 top-[62%] pointer-events-none">
          <div className="rounded-2xl px-4 py-2 bg-slate-900/90 border border-white/10 font-display font-bold text-xl whitespace-nowrap">
            👻 {fx.out.name} is out!
          </div>
        </div>
      )}
      {fx.passTo && !fx.krillion && (
        <div key={fx.passTo.id} className="krillion-banner absolute z-40 left-1/2 top-[40%] pointer-events-none">
          <div className="rounded-2xl px-4 py-2 font-display font-extrabold text-2xl whitespace-nowrap shadow-xl" style={{ background: fx.passTo.color, color: '#041427' }}>
            {fx.passTo.emoji} {fx.passTo.name}'s turn!
          </div>
        </div>
      )}
      {state.phase === 'reveal' && (
        <div key={`rv${state.round}`} className="absolute z-40 left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="reveal-card rounded-2xl px-4 py-2 bg-abyss-900/85 border border-cyan-300/30 font-display font-bold text-lg sm:text-xl whitespace-nowrap shadow-xl">
            {state.players[state.current].emoji} {state.players[state.current].name} starts — {Math.ceil(state.phaseLeft)}…
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="relative z-10 h-full flex flex-col">
      {state.stage === 3 && state.phase === 'playing' && <div className="pointer-events-none fixed inset-0 z-0 danger-vignette" />}
      {fx.flash && <div key={fx.flash.id} className={`pointer-events-none fixed inset-0 z-40 ${fx.flash.kind === 'gold' ? 'flash-gold' : 'flash-red'}`} />}

      {/* top bar */}
      <header className="relative z-20 flex items-center gap-2 px-3 sm:px-5 pt-3">
        <div className="font-display font-extrabold text-xl text-amber-300 hidden md:block">🐡 Puffer Panic</div>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={onToggleMute} className="p-2 rounded-xl bg-white/5 hover:bg-white/10" aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
            aria-label="Pause"
            title="Pause (Esc)"
          >
            {state.paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button onClick={onExit} className="p-2 rounded-xl bg-white/5 hover:bg-white/10" aria-label="Quit to menu" title="Quit to menu">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row gap-3 lg:gap-5 px-3 sm:px-5 pb-3 overflow-y-auto lg:overflow-hidden">
        <section className="shrink-0 lg:shrink lg:flex-1 lg:min-h-0 flex flex-col items-center">
          <div className="w-full">
            <CategoryHeader state={state} />
          </div>
          <div className="shrink-0 lg:shrink lg:flex-1 lg:min-h-0 w-full flex items-center justify-center py-2 sm:py-4">
            <div className={`w-full ${fx.quake ? 'shake-x' : ''}`} style={{ maxWidth: 'min(100%, max(calc(100vh - 270px), 300px), 720px)' }}>
              <Arena state={state} draft={draft} bursts={bursts} overlays={overlays} gains={gains} />
            </div>
          </div>
          <div className="w-full max-w-2xl">
            <AnswerInput state={state} draft={draft} setDraft={setDraft} onSubmit={submit} feedback={feedback} />
          </div>
        </section>
        <aside className="lg:w-80 xl:w-96 shrink-0 h-80 lg:h-auto min-h-0">
          <AnswerFeed feed={state.feed} players={state.players} />
        </aside>
      </main>

      {state.paused && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-abyss-950/75 backdrop-blur-sm">
          <div className="pop-in glass rounded-3xl p-6 text-center w-72">
            <div className="font-display font-extrabold text-4xl">Paused</div>
            <p className="text-sm text-cyan-100/60 mt-1">The puffer is holding its breath.</p>
            <div className="mt-5 space-y-2">
              <button onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} className="w-full rounded-xl py-2.5 font-bold text-abyss-950 bg-cyan-300 hover:brightness-110 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Resume
              </button>
              <button onClick={replay} className="w-full rounded-xl py-2.5 font-bold bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Restart
              </button>
              <button onClick={onExit} className="w-full rounded-xl py-2.5 font-bold bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Quit to menu
              </button>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'over' && showSummary && <Summary state={state} onReplay={replay} onMenu={onExit} />}
    </div>
  )
}
