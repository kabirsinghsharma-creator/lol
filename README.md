# 🐡 Puffer Panic

A fast-paced, ocean-themed **hot-potato category trivia** party game. Name something that fits the category, pass the pufferfish clockwise, and don't be the one holding it when it pops.

Built with React 18, Vite, Tailwind CSS and Lucide icons. The pufferfish is a custom SVG, and every sound is synthesized with the Web Audio API. No API keys, no backend, and no asset files.

```bash
npm install
npm run dev      # → http://localhost:5173
```

## Modes

- **Solo vs Bots**: you plus 3–5 AI bots, on Chill, Normal or Ruthless. Each bot has its own personality: typing speed, accuracy, how much it likes rare answers, how often it makes typos, and how likely it is to freeze up. There's also a **Spectate** toggle to watch the bots play each other.
- **Pass & Play**: 2–6 humans sharing one keyboard. When the puffer moves to the next player, a banner shows whose turn it is.

## Rules

| | |
|---|---|
| **Fuse** | Each category starts with a 25-second fuse. A valid answer passes the puffer clockwise to the next living player **without resetting** the fuse. If less than 7 s remain, the fuse goes back up to 7 s so the next player has a fair shot. |
| **Wrong / repeated answers** | The puffer stays with you, the input shakes, and you see *Not on the list!* or *Already used!* |
| **Pop** | The player holding the puffer loses a heart. Play freezes for 2 s, then a new category and a fresh 25 s fuse start with the next player. |
| **Lives** | Everyone starts with 3 ❤. A **One in a Krillion** answer gives a bonus heart, up to 4. At 0 hearts you become a ghost spectator. |
| **Win** | The last fish floating wins. The summary shows the **Rarest Answer of the Match**, **Most Survivals** (successful passes), and everyone's stats. |

The pufferfish has five stages: calm and bobbing (>15 s), puffed with wide eyes (9–15 s), spiky, orange and sweating (4–9 s), huge, red and shaking with a heartbeat (<4 s), and then **POP!**, an explosion of bubbles and confetti.

## Data and matching

- `src/data/categories.js` has **51 categories and about 5,200 answers**, each in one of three tiers: `Common`, `Rare` and `One in a Krillion`. Aliases are written with `/`, e.g. `Kyiv/Kiev`.
- `src/game/matcher.js` ignores case, accents and punctuation, drops a leading "the/a/an", and accepts simple plurals. It also forgives typos using Levenshtein distance: 1 typo for words of 5–7 letters and 2 for 8 letters or more. Exact matches are always checked first.
- `npm run check-data` checks the dataset for duplicates and aliases that don't resolve, and runs matcher test cases. `npm run simulate` plays headless all-bot games to check game length and engine behavior.

## Project layout

```
src/
  data/categories.js      category dataset
  game/engine.js          pure game reducer (fuse, passing, pops, lives, events)
  game/bots.js            bot personalities and decision-making
  game/matcher.js         normalization, fuzzy matching, rarity scoring
  audio/sfx.js            Web Audio synth (tick, inflate, pop, chimes, buzz, fanfare)
  components/             Pufferfish SVG, Arena ring, avatars, feed, input, setup, summary
```

Controls: **Enter** submits an answer, **Esc** pauses, and the 🔊 button mutes (the setting is remembered). For testing, `?speed=4` in the URL fast-forwards the game clock.
