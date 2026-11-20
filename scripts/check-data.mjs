// Sanity-checks the category dataset and the fuzzy matcher.
import { CATEGORIES } from '../src/data/categories.js'
import { normalize, matchAnswer, getIndex } from '../src/game/matcher.js'

let problems = 0
let total = 0
for (const c of CATEGORIES) {
  const seen = new Map()
  const counts = { common: 0, rare: 0, krillion: 0 }
  for (const a of c.answers) {
    counts[a.tier]++
    for (const alias of a.aliases) {
      const k = normalize(alias)
      if (seen.has(k) && seen.get(k) !== a.id) {
        console.log(`  dup in ${c.id}: "${alias}" (${a.tier}) already ${seen.get(k)}`)
        problems++
      }
      seen.set(k, a.id)
    }
  }
  total += c.answers.length
  // every alias must resolve to its own answer
  for (const a of c.answers) for (const alias of a.aliases) {
    const m = matchAnswer(c.id, alias)
    if (!m || (m.answer.id !== a.id && normalize(m.answer.name) !== normalize(alias))) {
      console.log(`  alias "${alias}" in ${c.id} resolves to ${m?.answer.name}`); problems++
    }
  }
  console.log(`${c.emoji} ${c.title.padEnd(30)} C${String(counts.common).padStart(3)} R${String(counts.rare).padStart(3)} K${String(counts.krillion).padStart(3)}`)
  getIndex(c.id)
}
console.log(`\n${CATEGORIES.length} categories, ${total} answers, ${problems} problems`)

const t = (cat, guess, expect) => {
  const m = matchAnswer(cat, guess)
  const got = m ? m.answer.name : null
  const ok = got === expect
  if (!ok) problems++
  console.log(`${ok ? 'ok ' : 'BAD'} ${cat}: "${guess}" -> ${got} (expected ${expect})`)
}
t('euro-capitals', 'paris', 'Paris')
t('euro-capitals', 'PARIS!', 'Paris')
t('euro-capitals', 'Tallin', 'Tallinn')
t('euro-capitals', 'vaduz', 'Vaduz')
t('euro-capitals', 'Reykjavík', 'Reykjavik')
t('euro-capitals', 'Copenhagn', 'Copenhagen')
t('euro-capitals', 'Ammsterdan', 'Amsterdam')
t('euro-capitals', 'Rom', null)
t('euro-capitals', 'Banana', null)
t('fruits', 'figs', 'Fig')
t('fruits', 'strawberries', 'Strawberry')
t('90s-movies', 'matrix', 'The Matrix')
t('africa', 'niger', 'Niger')
t('africa', 'nigeria', 'Nigeria')
t('africa', 'mali', 'Mali')
t('us-states', 'arkansas', 'Arkansas')
t('us-states', 'kansas', 'Kansas')
t('shakespeare', 'henry vi', 'Henry VI')
t('shakespeare', 'Henry V', 'Henry V')
t('cocktails', 'gin & tonic', 'Gin and Tonic')
process.exit(problems ? 1 : 0)
