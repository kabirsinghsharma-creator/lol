// Headless all-bot simulation to sanity-check the engine.
import { gameReducer, createGame, summarize } from '../src/game/engine.js'
import { pickBots } from '../src/game/bots.js'

const runs = Number(process.argv[2] ?? 20)
let totalTime = 0, totalRounds = 0
for (let r = 0; r < runs; r++) {
  const bots = pickBots(4 + (r % 3) - 1)
  let s = createGame({ difficulty: 'normal', players: bots.map((b, i) => ({ id: 'p' + i, name: b.name, emoji: b.emoji, color: b.color, isBot: true, botKey: b.key })) })
  let steps = 0, maxSeenTime = 0, passes = 0, bumps = 0
  while (s.phase !== 'over' && steps < 200000) {
    const prevSeq = s.seq
    s = gameReducer(s, { type: 'TICK', dt: 1 / 30 })
    for (const e of s.events) if (e.id > prevSeq) { if (e.type === 'pass') passes++; if (e.type === 'fuseBump') bumps++ }
    if (s.phase === 'playing') maxSeenTime = Math.max(maxSeenTime, s.timeLeft)
    if (s.timeLeft > 25.0001) throw new Error('fuse exceeded 25')
    steps++
  }
  const sum = summarize(s)
  totalTime += s.clock; totalRounds += s.round
  console.log(`game ${r}: ${s.players.length}p, ${Math.round(s.clock)}s, ${s.round} rounds, ${passes} passes, ${bumps} bumps, winner ${sum.winner?.name}, rarest ${sum.rarest?.answer} (${sum.rarest?.tier}), most survivals ${sum.survivor.name} ${sum.survivor.stats.survivals}`)
  if (s.phase !== 'over') throw new Error('game did not finish')
}
console.log(`avg ${Math.round(totalTime / runs)}s, ${(totalRounds / runs).toFixed(1)} rounds`)
