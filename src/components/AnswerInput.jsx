import { useEffect, useRef } from 'react'
import { Send, Bot, Eye } from 'lucide-react'
import { getCategory } from '../game/matcher.js'

const FEEDBACK = {
  invalid: { text: 'Not on the list!', cls: 'text-rose-300' },
  duplicate: { text: 'Already used!', cls: 'text-amber-300' },
  valid: { text: 'Nice! Puffer passed →', cls: 'text-teal-300' },
}

export default function AnswerInput({ state, draft, setDraft, onSubmit, feedback }) {
  const inputRef = useRef(null)
  const formRef = useRef(null)
  const player = state.players[state.current]
  const humanTurn = !player.isBot && (state.phase === 'playing' || state.phase === 'reveal')
  const canSubmit = !player.isBot && state.phase === 'playing' && !state.paused
  const spectating = state.players.every((p) => p.isBot)
  const category = state.categoryId ? getCategory(state.categoryId) : null

  // Auto-focus whenever it becomes a human's turn.
  useEffect(() => {
    if (humanTurn && !state.paused) inputRef.current?.focus()
  }, [humanTurn, state.current, state.round, state.paused])

  // Typing anywhere jumps into the box.
  useEffect(() => {
    const onKey = (e) => {
      if (!humanTurn || state.paused) return
      if (e.target === inputRef.current) return
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [humanTurn, state.paused])

  // After a miss: shake the box and select the text so the next keystroke replaces it.
  useEffect(() => {
    if (!feedback || feedback.kind === 'valid') return
    formRef.current?.animate?.(
      [0, -9, 9, -9, 9, -5, 5, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 420, easing: 'ease-out' },
    )
    if (humanTurn) inputRef.current?.select()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback])

  const fb = feedback && state.clock - feedback.at < 1.6 ? FEEDBACK[feedback.kind] : null
  const shake = feedback && feedback.kind !== 'valid' && state.clock - feedback.at < 0.5

  if (spectating) {
    return (
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2 text-cyan-100/80 justify-center">
        <Eye className="w-4 h-4" /> Spectating the bots — sit back and enjoy the chaos.
      </div>
    )
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) onSubmit(draft)
        }}
        ref={formRef}
        className="glass rounded-2xl p-2 flex items-center gap-2 transition-shadow"
        style={{
          boxShadow: humanTurn ? `0 0 0 2px ${player.color}, 0 0 28px ${player.color}55` : 'none',
          borderColor: shake ? (feedback.kind === 'duplicate' ? '#fbbf24' : '#fb7185') : undefined,
        }}
      >
        <div
          className="hidden sm:flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-xl text-sm font-extrabold whitespace-nowrap"
          style={{ background: `${player.color}33`, color: player.color }}
        >
          <span className="text-lg leading-none">{player.emoji}</span>
          {player.isBot ? <Bot className="w-4 h-4" /> : player.name}
        </div>
        <input
          ref={inputRef}
          value={humanTurn ? draft : ''}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!humanTurn || state.paused}
          maxLength={48}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={
            state.phase === 'popped'
              ? '💥 POP!'
              : player.isBot
                ? `${player.name} is ${state.bot?.phase === 'type' ? 'typing' : 'thinking'}…`
                : state.phase === 'reveal'
                  ? 'Get ready…'
                  : `${category ? category.prompt : 'Type an answer'}…`
          }
          className="flex-1 min-w-0 bg-transparent outline-none px-2 py-2 text-lg sm:text-xl font-bold text-white placeholder:text-cyan-100/35 disabled:cursor-not-allowed"
          aria-label="Your answer"
        />
        <button
          type="submit"
          disabled={!canSubmit || !draft.trim()}
          className="shrink-0 rounded-xl px-4 py-2.5 font-extrabold text-abyss-950 bg-gradient-to-br from-teal-300 to-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Pass</span>
        </button>
      </form>
      <div className="h-6 mt-1 text-center text-sm font-bold">
        {fb ? (
          <span key={feedback.at} className={`pop-in inline-block ${fb.cls}`}>
            {fb.text}
          </span>
        ) : humanTurn && state.mode === 'party' ? (
          <span className="text-cyan-100/60">
            <span style={{ color: player.color }}>{player.name}</span>, it's your puffer! Type &amp; hit Enter.
          </span>
        ) : null}
      </div>
    </div>
  )
}
