import { memo } from 'react'
import { Waves } from 'lucide-react'
import RarityBadge from './RarityBadge.jsx'

function AnswerFeed({ feed, players }) {
  const byId = Object.fromEntries(players.map((p) => [p.id, p]))
  const rows = []
  let lastRound = null
  for (const e of feed) {
    if (e.round !== lastRound) {
      rows.push(
        <li key={`r${e.round}-${e.id}`} className="pt-2 pb-1 text-[11px] uppercase tracking-widest text-cyan-200/60 font-bold flex items-center gap-1.5">
          <span>{e.emoji}</span> {e.category}
        </li>,
      )
      lastRound = e.round
    }
    const p = byId[e.playerId]
    rows.push(
      <li
        key={e.id}
        className={`slide-in flex items-center gap-2 rounded-xl px-2.5 py-1.5 ${
          e.tier === 'krillion' ? 'bg-amber-300/10 border border-amber-300/30' : 'bg-white/[0.04]'
        }`}
      >
        <span className="text-lg leading-none" title={p?.name}>
          {p?.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-sm text-white truncate">{e.answer}</div>
          <div className="text-[11px] font-semibold truncate" style={{ color: p?.color }}>
            {p?.name}
            {e.fuzzy && <span className="text-slate-400 font-normal"> · typo forgiven</span>}
          </div>
        </div>
        <RarityBadge tier={e.tier} />
      </li>,
    )
  }
  return (
    <div className="glass rounded-2xl flex flex-col min-h-0 h-full">
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-white/5">
        <Waves className="w-4 h-4 text-cyan-300" />
        <h2 className="font-display font-bold text-lg leading-none">Reef Feed</h2>
        <span className="ml-auto text-xs text-cyan-200/60">{feed.length} answers</span>
      </div>
      {feed.length === 0 ? (
        <p className="p-4 text-sm text-cyan-100/50">Accepted answers will drift in here. Go for the deep cuts — a Krillion answer earns a bonus heart!</p>
      ) : (
        <ul className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 space-y-1.5">{rows}</ul>
      )}
    </div>
  )
}

export default memo(AnswerFeed)
