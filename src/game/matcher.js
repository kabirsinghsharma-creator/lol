import { CATEGORIES } from '../data/categories.js'

/** Lowercase, strip accents/punctuation, drop a leading article, collapse to letters+digits. */
export function normalize(raw) {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, '')
    .replace(/ /g, '')
}

/** Levenshtein distance with an early-exit ceiling (returns max+1 when exceeded). */
export function levenshtein(a, b, max = Infinity) {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = new Array(b.length + 1)
  let curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    let rowMin = curr[0]
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (curr[j] < rowMin) rowMin = curr[j]
    }
    if (rowMin > max) return max + 1
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** How many typos we forgive, based on the shorter of the two words. */
export function tolerance(len) {
  if (len >= 8) return 2
  if (len >= 5) return 1
  return 0
}

const indexCache = new Map()

/** Build (and memoize) the lookup structure for a category. */
export function getIndex(categoryId) {
  if (indexCache.has(categoryId)) return indexCache.get(categoryId)
  const category = CATEGORIES.find((c) => c.id === categoryId)
  if (!category) throw new Error(`Unknown category ${categoryId}`)
  const exact = new Map() // key -> answer
  const keys = [] // [key, answer]
  for (const answer of category.answers) {
    for (const alias of answer.aliases) {
      const key = normalize(alias)
      if (!key || exact.has(key)) continue
      exact.set(key, answer)
      keys.push([key, answer])
    }
  }
  const index = { category, exact, keys }
  indexCache.set(categoryId, index)
  return index
}

export function getCategory(categoryId) {
  return getIndex(categoryId).category
}

/**
 * Match a raw guess against a category.
 * @returns {null | { answer, used: boolean, fuzzy: boolean }}
 */
export function matchAnswer(categoryId, raw, usedIds = []) {
  const guess = normalize(raw)
  if (!guess) return null
  const { exact, keys } = getIndex(categoryId)
  const used = new Set(usedIds)
  const wrap = (answer, fuzzy) => ({ answer, used: used.has(answer.id), fuzzy })

  // 1) exact, plus simple plural/singular variants
  const variants = [guess]
  if (guess.length > 4 && guess.endsWith('ies')) variants.push(guess.slice(0, -3) + 'y')
  if (guess.length > 3 && guess.endsWith('es')) variants.push(guess.slice(0, -2))
  if (guess.length > 2 && guess.endsWith('s')) variants.push(guess.slice(0, -1))
  variants.push(guess + 's', guess + 'es')
  for (const v of variants) {
    const hit = exact.get(v)
    if (hit) return wrap(hit, false)
  }

  // 2) fuzzy — best distance wins; ties prefer an unused answer
  let best = null
  let bestDist = Infinity
  for (const [key, answer] of keys) {
    const tol = tolerance(Math.min(key.length, guess.length))
    if (tol === 0) continue
    const d = levenshtein(guess, key, tol)
    if (d > tol) continue
    const better =
      d < bestDist || (d === bestDist && best && used.has(best.id) && !used.has(answer.id))
    if (better) {
      best = answer
      bestDist = d
    }
  }
  return best ? wrap(best, true) : null
}

/** A sortable rarity score: tier dominates, then how deep in the tier list it sits. */
export function rarityScore(answer) {
  const base = { common: 0, rare: 100, krillion: 1000 }[answer.tier] ?? 0
  return base + Math.round((answer.rank ?? 0) * 50)
}
