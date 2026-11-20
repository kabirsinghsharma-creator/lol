import { FUSE_SECONDS } from '../game/engine.js'
import { getCategory } from '../game/matcher.js'

const BAR_COLORS = [
  'linear-gradient(90deg, #2ef2d0, #4dd0e1)',
  'linear-gradient(90deg, #ffd166, #ffbf4d)',
  'linear-gradient(90deg, #ff8a3d, #ff6b3d)',
  'linear-gradient(90deg, #ff2d55, #ff4b4b)',
]

export default function CategoryHeader({ state }) {
  const category = getCategory(state.categoryId)
  const frac = Math.max(0, Math.min(1, state.timeLeft / FUSE_SECONDS))
  const stage = state.phase === 'reveal' ? 0 : state.stage
  const burning = state.phase === 'playing'
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div key={state.round} className="reveal-card text-center">
        <div className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-cyan-200/70 font-bold">
          Round {state.round} · {state.used.length} used
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl leading-tight drop-shadow-[0_0_18px_rgba(46,242,208,.35)]">
          <span className="mr-2">{category.emoji}</span>
          {category.title}
        </h1>
        <p className="text-cyan-100/70 text-sm sm:text-base">{category.prompt}</p>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="relative flex-1 h-3 rounded-full bg-black/40 border border-white/10 overflow-visible">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${frac * 100}%`, background: BAR_COLORS[stage], transition: 'background .4s' }}
          />
          {burning && frac > 0 && (
            <div className="absolute top-1/2 w-3 h-3 rounded-full bg-amber-100 fuse-spark" style={{ left: `${frac * 100}%` }} />
          )}
        </div>
        <div
          className={`font-display font-extrabold tabular-nums w-12 text-right text-lg ${stage === 3 ? 'text-red-400' : stage === 2 ? 'text-orange-300' : 'text-cyan-100'}`}
        >
          {Math.ceil(state.timeLeft)}s
        </div>
      </div>
    </div>
  )
}
