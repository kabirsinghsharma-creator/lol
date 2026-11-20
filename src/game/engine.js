import { CATEGORIES } from '../data/categories.js'
import { matchAnswer, rarityScore } from './matcher.js'
import { BOT_ROSTER, chooseAnswer, thinkTime, typingSpeed } from './bots.js'

export const FUSE_SECONDS = 25
export const MIN_PASS_SECONDS = 7
export const FREEZE_SECONDS = 2
export const START_LIVES = 3
export const MAX_LIVES = 4
const FIRST_REVEAL = 3
const ROUND_REVEAL = 1.6
const TICK_INTERVAL = [1, 0.62, 0.36, 0.17]

/** 0: calm (>15s) · 1: puffed (9–15s) · 2: spiky (4–9s) · 3: critical (<4s) */
export function stageFor(t) {
  if (t > 15) return 0
  if (t > 9) return 1
  if (t > 4) return 2
  return 3
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

function emit(s, type, data = {}) {
  s.seq += 1
  s.events = [...s.events.slice(-40), { id: s.seq, type, at: s.clock, ...data }]
}

function setPlayer(s, idx, fn) {
  s.players = s.players.map((p, i) => (i === idx ? fn(p) : p))
}

function say(s, playerId, bubble) {
  s.speech = { ...s.speech, [playerId]: { ...bubble, at: s.clock } }
}

export function nextAlive(players, from) {
  const n = players.length
  for (let k = 1; k <= n; k++) {
    const j = (from + k) % n
    if (players[j].alive) return j
  }
  return from
}

function pickCategory(recent) {
  const pool = CATEGORIES.filter((c) => !recent.includes(c.id))
  return pickRandom(pool.length ? pool : CATEGORIES).id
}

function beginRound(s, starter, reveal) {
  s.round += 1
  s.categoryId = pickCategory(s.recent)
  s.recent = [...s.recent, s.categoryId].slice(-24)
  s.used = []
  s.timeLeft = FUSE_SECONDS
  s.stage = 0
  s.nextTickAt = FUSE_SECONDS - TICK_INTERVAL[0]
  s.current = starter
  s.phase = 'reveal'
  s.phaseLeft = reveal
  s.bot = null
  s.speech = {}
  emit(s, 'roundStart', { categoryId: s.categoryId, round: s.round, playerIdx: starter })
}

function startTurn(s) {
  const p = s.players[s.current]
  if (p.isBot) {
    const profile = BOT_ROSTER.find((b) => b.key === p.botKey)
    s.bot = {
      phase: 'think',
      wait: thinkTime(profile, { used: s.used, timeLeft: s.timeLeft, attempts: 0, difficulty: s.difficulty }),
      attempts: 0,
    }
  } else {
    s.bot = null
  }
  emit(s, 'turn', { playerIdx: s.current, isBot: p.isBot })
}

/**
 * players: [{ id, name, emoji, color, isBot, botKey? }]
 */
export function createGame({ players, difficulty = 'normal', mode = 'solo' }) {
  const s = {
    mode,
    difficulty,
    players: players.map((p) => ({
      ...p,
      lives: START_LIVES,
      alive: true,
      stats: { valid: 0, wrong: 0, survivals: 0, pops: 0, rares: 0, krillions: 0, best: null },
    })),
    phase: 'reveal',
    phaseLeft: FIRST_REVEAL,
    round: 0,
    recent: [],
    categoryId: null,
    used: [],
    timeLeft: FUSE_SECONDS,
    stage: 0,
    nextTickAt: FUSE_SECONDS - 1,
    current: 0,
    feed: [],
    events: [],
    seq: 0,
    clock: 0,
    bot: null,
    speech: {},
    eliminationOrder: [],
    winnerId: null,
    popIndex: null,
    paused: false,
  }
  beginRound(s, Math.floor(Math.random() * players.length), FIRST_REVEAL)
  return s
}

function pop(s) {
  const idx = s.current
  const p = s.players[idx]
  const lives = Math.max(0, p.lives - 1)
  setPlayer(s, idx, (pl) => ({
    ...pl,
    lives,
    alive: lives > 0,
    stats: { ...pl.stats, pops: pl.stats.pops + 1 },
  }))
  s.timeLeft = 0
  s.phase = 'popped'
  s.phaseLeft = FREEZE_SECONDS
  s.popIndex = idx
  s.bot = null
  say(s, p.id, { text: 'POP!', kind: 'pop' })
  emit(s, 'pop', { playerIdx: idx })
  if (lives === 0) {
    s.eliminationOrder = [...s.eliminationOrder, p.id]
    emit(s, 'eliminated', { playerIdx: idx })
  }
}

/** Returns 'valid' | 'invalid' | 'duplicate' | null (ignored). Mutates the draft `s`. */
function submit(s, idx, rawText) {
  if (s.phase !== 'playing' || idx !== s.current) return null
  const text = String(rawText ?? '').trim()
  if (!text) return null
  const p = s.players[idx]
  const m = matchAnswer(s.categoryId, text, s.used)

  if (!m) {
    setPlayer(s, idx, (pl) => ({ ...pl, stats: { ...pl.stats, wrong: pl.stats.wrong + 1 } }))
    say(s, p.id, { text, kind: 'invalid' })
    emit(s, 'invalid', { playerIdx: idx, text })
    return 'invalid'
  }
  if (m.used) {
    setPlayer(s, idx, (pl) => ({ ...pl, stats: { ...pl.stats, wrong: pl.stats.wrong + 1 } }))
    say(s, p.id, { text: m.answer.name, kind: 'duplicate' })
    emit(s, 'duplicate', { playerIdx: idx, text: m.answer.name })
    return 'duplicate'
  }

  const { answer } = m
  const category = CATEGORIES.find((c) => c.id === s.categoryId)
  s.used = [...s.used, answer.id]
  const score = rarityScore(answer)
  const gainLife = answer.tier === 'krillion' && p.lives < MAX_LIVES
  setPlayer(s, idx, (pl) => {
    const best =
      !pl.stats.best || score > pl.stats.best.score
        ? { answer: answer.name, tier: answer.tier, score, category: category.title }
        : pl.stats.best
    return {
      ...pl,
      lives: gainLife ? pl.lives + 1 : pl.lives,
      stats: {
        ...pl.stats,
        valid: pl.stats.valid + 1,
        survivals: pl.stats.survivals + 1,
        rares: pl.stats.rares + (answer.tier === 'rare' ? 1 : 0),
        krillions: pl.stats.krillions + (answer.tier === 'krillion' ? 1 : 0),
        best,
      },
    }
  })
  s.feed = [
    {
      id: s.seq + 1,
      playerId: p.id,
      answer: answer.name,
      tier: answer.tier,
      category: category.title,
      emoji: category.emoji,
      round: s.round,
      fuzzy: m.fuzzy,
    },
    ...s.feed,
  ].slice(0, 60)
  say(s, p.id, { text: answer.name, kind: 'valid', tier: answer.tier })
  emit(s, 'valid', { playerIdx: idx, tier: answer.tier, answer: answer.name, fuzzy: m.fuzzy })
  if (gainLife) emit(s, 'lifeGained', { playerIdx: idx })
  else if (answer.tier === 'krillion') emit(s, 'krillionMaxed', { playerIdx: idx })

  // Pass the puffer clockwise. The fuse keeps burning — but never below 7s.
  const next = nextAlive(s.players, idx)
  s.current = next
  if (s.timeLeft < MIN_PASS_SECONDS) {
    s.timeLeft = MIN_PASS_SECONDS
    s.stage = stageFor(s.timeLeft)
    emit(s, 'fuseBump', { playerIdx: next })
  }
  s.nextTickAt = s.timeLeft - TICK_INTERVAL[s.stage]
  emit(s, 'pass', { from: idx, to: next })
  startTurn(s)
  return 'valid'
}

function botStep(s, dt) {
  const idx = s.current
  const p = s.players[idx]
  const profile = BOT_ROSTER.find((b) => b.key === p.botKey)
  const b = { ...s.bot }

  if (b.phase === 'think') {
    b.wait -= dt
    const cur = s.speech[p.id]
    if (!cur || (cur.kind !== 'thinking' && s.clock - cur.at > 1.2)) {
      say(s, p.id, { text: '', kind: 'thinking' })
    }
    if (b.wait <= 0) {
      const choice = chooseAnswer(profile, {
        categoryId: s.categoryId,
        used: s.used,
        attempts: b.attempts,
        difficulty: s.difficulty,
      })
      b.phase = 'type'
      b.target = choice.text
      b.typed = 0
      b.cps = typingSpeed(profile, s.difficulty)
    }
  } else if (b.phase === 'type') {
    const before = Math.floor(b.typed)
    b.typed += dt * b.cps
    const shown = b.target.slice(0, Math.floor(b.typed))
    if (Math.floor(b.typed) !== before) {
      say(s, p.id, { text: shown, kind: 'typing' })
      emit(s, 'botKey', { playerIdx: idx })
    }
    if (b.typed >= b.target.length) {
      b.phase = 'send'
      b.wait = 0.16
    }
  } else if (b.phase === 'send') {
    b.wait -= dt
    if (b.wait <= 0) {
      const result = submit(s, idx, b.target)
      if (result === 'valid') return // startTurn already set up the next player
      s.bot = {
        phase: 'think',
        attempts: b.attempts + 1,
        wait: thinkTime(profile, {
          used: s.used,
          timeLeft: s.timeLeft,
          attempts: b.attempts + 1,
          difficulty: s.difficulty,
        }),
      }
      return
    }
  }
  s.bot = b
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return createGame(action.config)

    case 'TOGGLE_PAUSE':
      if (state.phase === 'over') return state
      return { ...state, paused: !state.paused }

    case 'SUBMIT': {
      if (state.paused) return state
      const s = { ...state }
      const p = s.players[s.current]
      if (!p || p.isBot) return state
      const result = submit(s, s.current, action.text)
      return result ? s : state
    }

    case 'TICK': {
      if (state.paused || state.phase === 'over') return state
      const dt = Math.min(Math.max(action.dt, 0), 0.4)
      const s = { ...state, clock: state.clock + dt }

      if (s.phase === 'reveal') {
        s.phaseLeft -= dt
        if (s.phaseLeft <= 0) {
          s.phase = 'playing'
          startTurn(s)
        }
        return s
      }

      if (s.phase === 'popped') {
        s.phaseLeft -= dt
        if (s.phaseLeft <= 0) {
          const alive = s.players.filter((p) => p.alive)
          if (alive.length <= 1) {
            s.phase = 'over'
            s.winnerId = alive[0]?.id ?? null
            emit(s, 'victory', { winnerId: s.winnerId })
          } else {
            beginRound(s, nextAlive(s.players, s.popIndex), ROUND_REVEAL)
          }
        }
        return s
      }

      // playing
      s.timeLeft = Math.max(0, s.timeLeft - dt)
      const stage = stageFor(s.timeLeft)
      if (stage !== s.stage) {
        if (stage > s.stage) emit(s, 'stage', { stage })
        s.stage = stage
      }
      if (s.timeLeft <= s.nextTickAt && s.timeLeft > 0) {
        emit(s, 'tick', { stage })
        s.nextTickAt = s.timeLeft - TICK_INTERVAL[stage]
      }
      if (s.timeLeft <= 0) {
        pop(s)
        return s
      }
      if (s.players[s.current].isBot && s.bot) botStep(s, dt)
      return s
    }

    default:
      return state
  }
}

/** Post-game summary. */
export function summarize(state) {
  const { players } = state
  let rarest = null
  for (const p of players) {
    const b = p.stats.best
    if (b && (!rarest || b.score > rarest.score)) rarest = { ...b, player: p }
  }
  let survivor = null
  for (const p of players) {
    if (!survivor || p.stats.survivals > survivor.stats.survivals) survivor = p
  }
  const winner = players.find((p) => p.id === state.winnerId) ?? null
  const order = [...state.eliminationOrder].reverse()
  const standings = [
    ...(winner ? [winner] : []),
    ...order.map((id) => players.find((p) => p.id === id)),
  ].filter(Boolean)
  return { winner, rarest, survivor, standings, rounds: state.round }
}
