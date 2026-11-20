import { useState } from 'react'
import { Bot, Users, Play, Plus, X, Heart, Timer, Sparkles, Eye, ChevronDown, Trophy } from 'lucide-react'
import Pufferfish from './Pufferfish.jsx'
import { BOT_ROSTER, DIFFICULTY, pickBots } from '../game/bots.js'
import { CATEGORIES } from '../data/categories.js'

export const HUMAN_EMOJIS = ['🐬', '🐳', '🦭', '🐧', '🦦', '🦞', '🪼', '🦑']
export const HUMAN_COLORS = ['#4dd0e1', '#ffd166', '#ff7eb6', '#9b8cff', '#6ee7a8', '#ff8a5c']

const load = (k, fallback) => {
  try {
    const v = localStorage.getItem(k)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-xl bg-black/30 p-1 border border-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
            value === o.value ? 'bg-cyan-300 text-abyss-950 shadow' : 'text-cyan-100/70 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Setup({ onStart }) {
  const saved = load('puffer-panic:setup', {})
  const [mode, setMode] = useState(saved.mode ?? 'solo')
  const [name, setName] = useState(saved.name ?? 'You')
  const [emoji, setEmoji] = useState(saved.emoji ?? HUMAN_EMOJIS[0])
  const [botCount, setBotCount] = useState(saved.botCount ?? 4)
  const [difficulty, setDifficulty] = useState(saved.difficulty ?? 'normal')
  const [spectate, setSpectate] = useState(false)
  const [names, setNames] = useState(saved.names ?? ['Player 1', 'Player 2', 'Player 3'])
  const [showRules, setShowRules] = useState(false)

  const start = () => {
    save('puffer-panic:setup', { mode, name, emoji, botCount, difficulty, names })
    let players
    if (mode === 'solo') {
      const bots = pickBots(spectate ? Math.min(botCount + 1, 6) : botCount).map((b) => ({
        id: b.key,
        name: b.name,
        emoji: b.emoji,
        color: b.color,
        isBot: true,
        botKey: b.key,
      }))
      players = spectate
        ? bots
        : [{ id: 'you', name: name.trim() || 'You', emoji, color: HUMAN_COLORS[0], isBot: false }, ...bots]
    } else {
      players = names.map((n, i) => ({
        id: `h${i}`,
        name: n.trim() || `Player ${i + 1}`,
        emoji: HUMAN_EMOJIS[i % HUMAN_EMOJIS.length],
        color: HUMAN_COLORS[i % HUMAN_COLORS.length],
        isBot: false,
      }))
    }
    onStart({ players, difficulty, mode: mode === 'solo' ? (spectate ? 'spectate' : 'solo') : 'party' })
  }

  return (
    <div className="relative z-10 h-full overflow-y-auto scrollbar-thin">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="w-36 h-36 sm:w-44 sm:h-44 -mb-4">
          <Pufferfish stage={0} calm />
        </div>
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-none text-center bg-gradient-to-b from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,209,102,.35)]">
          Puffer Panic
        </h1>
        <p className="mt-2 text-cyan-100/80 text-center max-w-md">
          A hot-potato trivia party on the reef. Name something in the category, pass the puffer — and don't be holding it when it pops.
        </p>

        <div className="glass rounded-3xl mt-6 w-full max-w-xl p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'solo', icon: Bot, title: 'Solo vs Bots', sub: 'Play right now' },
              { v: 'party', icon: Users, title: 'Pass & Play', sub: '2–6 friends, one keyboard' },
            ].map(({ v, icon: Icon, title, sub }) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={`rounded-2xl p-3 text-left border transition ${
                  mode === v ? 'border-cyan-300 bg-cyan-300/15 shadow-[0_0_24px_rgba(77,208,225,.25)]' : 'border-white/10 bg-black/20 hover:border-white/25'
                }`}
              >
                <Icon className="w-5 h-5 text-cyan-300" />
                <div className="font-display font-bold text-lg mt-1 leading-tight">{title}</div>
                <div className="text-xs text-cyan-100/60">{sub}</div>
              </button>
            ))}
          </div>

          {mode === 'solo' ? (
            <div className="mt-5 space-y-4">
              {!spectate && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-cyan-200/70 font-bold">Your name</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 16))}
                      className="flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-3 py-2 font-bold outline-none focus:border-cyan-300"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {HUMAN_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-10 h-10 rounded-xl text-2xl grid place-items-center transition ${
                          emoji === e ? 'bg-cyan-300/30 ring-2 ring-cyan-300' : 'bg-black/20 hover:bg-white/10'
                        }`}
                        aria-label={`Avatar ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-cyan-200/70 font-bold mb-1">Bots</div>
                  <Segmented value={botCount} onChange={setBotCount} options={[3, 4, 5].map((n) => ({ value: n, label: `${n}` }))} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-cyan-200/70 font-bold mb-1">Difficulty</div>
                  <Segmented
                    value={difficulty}
                    onChange={setDifficulty}
                    options={Object.entries(DIFFICULTY).map(([k, d]) => ({ value: k, label: d.label }))}
                  />
                </div>
              </div>
              <p className="text-xs text-cyan-100/50 -mt-2">{DIFFICULTY[difficulty].desc}. Bots are picked at random from the crew below.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BOT_ROSTER.map((b) => (
                  <div key={b.key} className="rounded-xl bg-black/20 border border-white/5 p-2 flex gap-2 items-start">
                    <span className="text-2xl leading-none">{b.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold truncate" style={{ color: b.color }}>
                        {b.name}
                      </div>
                      <div className="text-[11px] text-cyan-100/55 leading-snug">{b.blurb}</div>
                    </div>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-cyan-100/80 cursor-pointer select-none">
                <input type="checkbox" checked={spectate} onChange={(e) => setSpectate(e.target.checked)} className="accent-cyan-300 w-4 h-4" />
                <Eye className="w-4 h-4" /> Spectate — watch the bots play each other
              </label>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              <div className="text-xs uppercase tracking-widest text-cyan-200/70 font-bold">Players (seated clockwise)</div>
              {names.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-10 h-10 shrink-0 rounded-full grid place-items-center text-xl border-2"
                    style={{ borderColor: HUMAN_COLORS[i], background: `${HUMAN_COLORS[i]}22` }}
                  >
                    {HUMAN_EMOJIS[i]}
                  </span>
                  <input
                    value={n}
                    onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value.slice(0, 16) : x)))}
                    className="flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-3 py-2 font-bold outline-none focus:border-cyan-300"
                  />
                  <button
                    type="button"
                    disabled={names.length <= 2}
                    onClick={() => setNames(names.filter((_, j) => j !== i))}
                    className="p-2 rounded-lg text-cyan-100/60 hover:text-rose-300 disabled:opacity-20"
                    aria-label="Remove player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={names.length >= 6}
                  onClick={() => setNames([...names, `Player ${names.length + 1}`])}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" /> Add player
                </button>
                <span className="text-xs text-cyan-100/50 self-center">
                  {names.length}/6 · pass the keyboard (or laptop!) when it's someone else's turn.
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={start}
            className="mt-6 w-full rounded-2xl py-4 font-display font-extrabold text-2xl text-abyss-950 bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 shadow-[0_0_30px_rgba(255,209,102,.35)] hover:brightness-110 active:scale-[.98] transition flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" fill="currentColor" /> Dive In
          </button>
        </div>

        <div className="glass rounded-2xl mt-4 w-full max-w-xl">
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="w-full px-5 py-3 flex items-center justify-between font-display font-bold text-lg"
          >
            How to play
            <ChevronDown className={`w-5 h-5 transition ${showRules ? 'rotate-180' : ''}`} />
          </button>
          {showRules && (
            <ul className="px-5 pb-5 space-y-2 text-sm text-cyan-50/85">
              <li className="flex gap-2"><Timer className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" /> Each category starts a 25-second fuse. Type a valid answer to pass the puffer clockwise — the fuse keeps burning! If fewer than 7 seconds remain, the next player gets bumped up to 7.</li>
              <li className="flex gap-2"><X className="w-4 h-4 mt-0.5 text-rose-300 shrink-0" /> Wrong or repeated answers don't pass the puffer — keep trying. Small typos are forgiven.</li>
              <li className="flex gap-2"><Heart className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" /> Holding the puffer when it pops costs a heart. Everyone starts with 3; at 0 you become a ghost.</li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 mt-0.5 text-amber-200 shrink-0" /> Answers are Common, Rare, or One in a Krillion. A Krillion answer grants a bonus heart (max 4).</li>
              <li className="flex gap-2"><Trophy className="w-4 h-4 mt-0.5 text-cyan-300 shrink-0" /> Last fish floating wins. {CATEGORIES.length} categories, {CATEGORIES.reduce((n, c) => n + c.answers.length, 0).toLocaleString()} answers. Press Esc to pause.</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
