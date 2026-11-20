import { Trophy, Sparkles, Shield, RotateCcw, Home, Ghost } from 'lucide-react'
import RarityBadge from './RarityBadge.jsx'
import { summarize } from '../game/engine.js'

export default function Summary({ state, onReplay, onMenu }) {
  const { winner, rarest, survivor, standings, rounds } = summarize(state)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-abyss-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="pop-in glass rounded-3xl w-full max-w-lg p-5 sm:p-7 text-center shadow-[0_0_80px_rgba(46,242,208,.15)]">
        <Trophy className="w-12 h-12 mx-auto text-amber-300 drop-shadow-[0_0_14px_#ffd166]" />
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70 font-bold mt-2">Last fish floating</div>
        <div className="font-display font-extrabold text-4xl sm:text-5xl mt-1" style={{ color: winner?.color }}>
          {winner?.emoji} {winner?.name ?? 'Nobody'}
        </div>
        <div className="text-sm text-cyan-100/60">
          won after {rounds} round{rounds === 1 ? '' : 's'}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5 text-left">
          <div className="rounded-2xl bg-amber-300/10 border border-amber-300/25 p-3">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-amber-200">
              <Sparkles className="w-4 h-4" /> Rarest Answer of the Match
            </div>
            {rarest ? (
              <>
                <div className="font-display font-extrabold text-2xl mt-1 leading-tight">{rarest.answer}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <RarityBadge tier={rarest.tier} />
                  <span className="text-xs text-cyan-100/70">{rarest.category}</span>
                </div>
                <div className="text-sm mt-1 font-bold" style={{ color: rarest.player.color }}>
                  {rarest.player.emoji} {rarest.player.name}
                </div>
              </>
            ) : (
              <div className="text-sm text-cyan-100/60 mt-1">No answers landed!</div>
            )}
          </div>
          <div className="rounded-2xl bg-teal-300/10 border border-teal-300/25 p-3">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-teal-200">
              <Shield className="w-4 h-4" /> Most Survivals
            </div>
            <div className="font-display font-extrabold text-2xl mt-1 leading-tight" style={{ color: survivor.color }}>
              {survivor.emoji} {survivor.name}
            </div>
            <div className="text-sm text-cyan-100/70 mt-1">
              {survivor.stats.survivals} successful pass{survivor.stats.survivals === 1 ? '' : 'es'} before the pop
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-black/25 border border-white/5 overflow-hidden text-left">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-cyan-200/60">
              <tr>
                <th className="py-2 pl-3 text-left font-bold">#</th>
                <th className="py-2 text-left font-bold">Player</th>
                <th className="py-2 text-right font-bold" title="Successful passes">Passes</th>
                <th className="py-2 text-right font-bold" title="Rare / Krillion answers">✦</th>
                <th className="py-2 pr-3 text-right font-bold" title="Wrong or repeated answers">Misses</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((p, i) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="py-2 pl-3 font-extrabold text-cyan-100/70">{i + 1}</td>
                  <td className="py-2 font-bold" style={{ color: p.color }}>
                    <span className="mr-1">{p.alive ? p.emoji : <Ghost className="inline w-4 h-4 text-slate-400" />}</span>
                    {p.name}
                  </td>
                  <td className="py-2 text-right tabular-nums">{p.stats.survivals}</td>
                  <td className="py-2 text-right tabular-nums">
                    <span className="text-violet-200">{p.stats.rares}</span> / <span className="text-amber-200">{p.stats.krillions}</span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-cyan-100/70">{p.stats.wrong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onReplay}
            className="rounded-2xl py-3 font-display font-extrabold text-lg text-abyss-950 bg-gradient-to-br from-amber-200 to-orange-400 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Play again
          </button>
          <button
            onClick={onMenu}
            className="rounded-2xl py-3 font-display font-bold text-lg bg-white/10 hover:bg-white/15 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Menu
          </button>
        </div>
      </div>
    </div>
  )
}
