import { CATEGORIES } from '../data/categories.js'
import { matchAnswer } from './matcher.js'

/**
 * Bot personalities.
 *  think    – [min, max] seconds of "thinking" before typing
 *  cps      – typing speed (characters per second)
 *  know     – base chance an attempt is a correct, unused answer
 *  rarity   – weights for picking [common, rare, krillion]
 *  typo     – chance to fat-finger a (still accepted) answer
 *  blank    – base chance to totally freeze up on a turn
 */
export const BOT_ROSTER = [
  {
    key: 'cora', name: 'Coral Cora', emoji: '🐠', color: '#ff7eb6',
    blurb: 'Quick fins, plays it safe with the classics.',
    think: [1.1, 2.4], cps: 13, know: 0.9, rarity: [0.86, 0.13, 0.01], typo: 0.05, blank: 0.05,
    quips: ['Easy!', 'Swish!', 'Next!'],
  },
  {
    key: 'nautilus', name: 'Prof. Nautilus', emoji: '🐚', color: '#c3a6ff',
    blurb: 'Painfully slow. Knows every deep cut.',
    think: [2.6, 4.4], cps: 8, know: 0.95, rarity: [0.34, 0.52, 0.14], typo: 0.02, blank: 0.04,
    quips: ['Elementary.', 'Hmm, obviously.', 'A classic.'],
  },
  {
    key: 'inky', name: 'Inky', emoji: '🐙', color: '#8f7bff',
    blurb: 'Eight arms on the keyboard. Typos galore.',
    think: [0.9, 2.1], cps: 17, know: 0.8, rarity: [0.68, 0.27, 0.05], typo: 0.35, blank: 0.06,
    quips: ['Blub!', 'Ink-credible!', 'Wheee!'],
  },
  {
    key: 'clawdia', name: 'Capt. Clawdia', emoji: '🦀', color: '#ff7a59',
    blurb: 'Steady, sideways, and surprisingly sharp.',
    think: [1.5, 3.0], cps: 11, know: 0.88, rarity: [0.62, 0.32, 0.06], typo: 0.06, blank: 0.05,
    quips: ['Pinch!', 'Aye!', 'Snip snap!'],
  },
  {
    key: 'sharky', name: 'Sharky', emoji: '🦈', color: '#5ec8ff',
    blurb: 'Blazing fast. Bites first, thinks later.',
    think: [0.6, 1.5], cps: 19, know: 0.72, rarity: [0.8, 0.18, 0.02], typo: 0.12, blank: 0.07,
    quips: ['CHOMP!', 'Too slow!', 'Fin-ished!'],
  },
  {
    key: 'shelly', name: 'Shelly', emoji: '🐢', color: '#6ee7a8',
    blurb: 'Slow and steady. Almost never wrong.',
    think: [2.3, 4.0], cps: 7, know: 0.97, rarity: [0.58, 0.34, 0.08], typo: 0.01, blank: 0.035,
    quips: ['Steady...', 'No rush.', 'Mm-hmm.'],
  },
]

export const DIFFICULTY = {
  chill: { label: 'Chill', desc: 'Sleepy bots that blank out often', think: 1.4, know: -0.1, blank: 1.8, cps: 0.8 },
  normal: { label: 'Normal', desc: 'A fair fight on the reef', think: 1, know: 0, blank: 1, cps: 1 },
  ruthless: { label: 'Ruthless', desc: 'Fast, sharp, rarely freeze', think: 0.72, know: 0.06, blank: 0.5, cps: 1.25 },
}

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/** Seconds a bot spends thinking before its first keystroke this attempt. */
export function thinkTime(profile, { used, timeLeft, attempts, difficulty }) {
  const d = DIFFICULTY[difficulty] ?? DIFFICULTY.normal
  if (attempts === 0) {
    const blankChance = (profile.blank + used.length * 0.018) * d.blank
    if (Math.random() < blankChance) return rand(7, 13) // brain freeze!
  }
  let t = rand(profile.think[0], profile.think[1]) * d.think
  if (attempts > 0) t *= 0.45
  t += Math.min(used.length * 0.09, 3) // the obvious answers run out
  if (timeLeft < 4) t *= 0.75 // panic speeds things up
  return t
}

export function typingSpeed(profile, difficulty) {
  const d = DIFFICULTY[difficulty] ?? DIFFICULTY.normal
  return profile.cps * d.cps * rand(0.85, 1.15)
}

function addTypo(text) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const i = 1 + Math.floor(Math.random() * (text.length - 2))
  if (Math.random() < 0.5) return text.slice(0, i) + text.slice(i + 1) // dropped key
  return text.slice(0, i) + pick(letters) + text.slice(i + 1) // fat finger
}

/** Decide what the bot will type for this attempt. */
export function chooseAnswer(profile, { categoryId, used, attempts, difficulty }) {
  const d = DIFFICULTY[difficulty] ?? DIFFICULTY.normal
  const category = CATEGORIES.find((c) => c.id === categoryId)
  const usedSet = new Set(used)
  const pValid = clamp(profile.know + d.know - used.length * 0.012 - attempts * 0.08, 0.3, 0.99)

  if (Math.random() < pValid) {
    const tiers = ['common', 'rare', 'krillion']
    // weighted tier pick, falling back to whatever is left
    let r = Math.random() * profile.rarity.reduce((a, b) => a + b, 0)
    let tierIdx = 0
    for (; tierIdx < tiers.length - 1; tierIdx++) {
      r -= profile.rarity[tierIdx]
      if (r <= 0) break
    }
    const order = [tierIdx, ...[0, 1, 2].filter((x) => x !== tierIdx)]
    for (const ti of order) {
      // within a tier, favour the more obvious picks a bit
      const pool = category.answers.filter((a) => a.tier === tiers[ti] && !usedSet.has(a.id))
      if (!pool.length) continue
      const idx = Math.floor(Math.pow(Math.random(), 1.4) * pool.length)
      const answer = pool[idx]
      let text = Math.random() < 0.25 ? pick(answer.aliases) : answer.name
      if (text.length >= 6 && Math.random() < profile.typo) {
        const typo = addTypo(text)
        const m = matchAnswer(categoryId, typo, used)
        if (m && m.answer.id === answer.id) text = typo.toLowerCase()
      }
      return { text, intent: 'valid' }
    }
  }

  // Wrong answer: either repeat something already said, or blurt a decoy.
  if (used.length && Math.random() < 0.4) {
    const answer = category.answers.find((a) => a.id === pick(used))
    if (answer) return { text: answer.name, intent: 'duplicate' }
  }
  for (let i = 0; i < 20; i++) {
    const other = pick(CATEGORIES)
    if (other.id === categoryId) continue
    const decoy = pick(other.answers.filter((a) => a.tier === 'common'))
    if (!matchAnswer(categoryId, decoy.name)) return { text: decoy.name, intent: 'invalid' }
  }
  return { text: 'uhhh', intent: 'invalid' }
}

/** Pick `count` distinct bots at random. */
export function pickBots(count) {
  const pool = [...BOT_ROSTER]
  const out = []
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return out
}
