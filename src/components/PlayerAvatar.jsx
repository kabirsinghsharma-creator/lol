import { Ghost, Bot, Crown } from 'lucide-react'
import Hearts from './Hearts.jsx'
import { TIER_META } from './RarityBadge.jsx'

const BUBBLE_LIFE = { valid: 2.6, invalid: 1.8, duplicate: 1.8, pop: 2.2 }

function Bubble({ speech, draft, isActive, isBot, clock }) {
  let content = null
  let tone = 'bg-white/95 text-slate-900'
  let key = speech?.at ?? 'none'

  if (isActive && !isBot && draft) {
    content = <span className="caret">{draft}</span>
    key = 'draft'
  } else if (speech) {
    const age = clock - speech.at
    const life = BUBBLE_LIFE[speech.kind]
    const persistent = speech.kind === 'typing' || speech.kind === 'thinking'
    if (persistent ? isActive : age < life) {
      switch (speech.kind) {
        case 'thinking':
          content = (
            <span className="thinking-dots tracking-widest">
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </span>
          )
          break
        case 'typing':
          content = <span className="caret">{speech.text}</span>
          break
        case 'valid':
          content = (
            <span className="flex items-center gap-1">
              <span>{speech.text}</span>
              {speech.tier !== 'common' && <span style={{ color: TIER_META[speech.tier].color }}>✦</span>}
            </span>
          )
          tone =
            speech.tier === 'krillion'
              ? 'shine text-amber-950'
              : speech.tier === 'rare'
                ? 'bg-violet-200 text-violet-950'
                : 'bg-teal-100 text-teal-950'
          break
        case 'invalid':
          content = (
            <span>
              <span className="line-through decoration-2">{speech.text}</span> ✗
            </span>
          )
          tone = 'bg-rose-500 text-white'
          break
        case 'duplicate':
          content = (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-[10px] uppercase tracking-wider opacity-90">Already used!</span>
              <span className="line-through">{speech.text}</span>
            </span>
          )
          tone = 'bg-amber-400 text-amber-950'
          break
        case 'pop':
          content = <span className="font-extrabold">💥 POP!</span>
          tone = 'bg-red-500 text-white'
          break
        default:
          content = null
      }
    }
  }
  if (!content) return null
  return (
    <div
      key={key}
      className={`pop-in max-w-[9.5rem] px-2.5 py-1 rounded-xl shadow-lg text-xs sm:text-sm font-bold text-center break-words ${tone} ${
        speech && (speech.kind === 'invalid' || speech.kind === 'duplicate') && !(isActive && !isBot && draft) ? 'shake-x' : ''
      }`}
    >
      {content}
    </div>
  )
}

export default function PlayerAvatar({ player, pos, isActive, speech, draft, clock, isWinner, gainedAt }) {
  const below = pos.y < 45
  const ghost = !player.alive
  return (
    <div
      className="absolute z-20 flex flex-col items-center"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', width: 'clamp(70px, 14vmin, 120px)' }}
    >
      {!below && (
        <div className="absolute bottom-full mb-1 flex justify-center w-48 pointer-events-none">
          <Bubble speech={speech} draft={draft} isActive={isActive} isBot={player.isBot} clock={clock} />
        </div>
      )}
      <div className={`relative ${ghost ? 'ghost-float' : ''}`}>
        {isActive && !ghost && (
          <div
            className="absolute -inset-2 rounded-full border-2 border-dashed spin-slow"
            style={{ borderColor: player.color, opacity: 0.85 }}
          />
        )}
        <div
          className={`relative rounded-full grid place-items-center select-none transition-all duration-300 ${
            isActive && !ghost ? 'ring-pulse scale-110' : ''
          }`}
          style={{
            width: 'clamp(46px, 9vmin, 74px)',
            height: 'clamp(46px, 9vmin, 74px)',
            fontSize: 'clamp(24px, 5vmin, 40px)',
            '--ring': `${player.color}aa`,
            background: ghost
              ? 'radial-gradient(circle at 35% 30%, rgba(200,220,255,.25), rgba(80,100,140,.15))'
              : `radial-gradient(circle at 35% 30%, ${player.color}66, ${player.color}22 60%, rgba(4,20,39,.8))`,
            border: `3px solid ${ghost ? 'rgba(200,220,255,.25)' : player.color}`,
            boxShadow: ghost ? 'none' : `0 0 ${isActive ? 26 : 12}px ${player.color}${isActive ? 'cc' : '55'}`,
            filter: ghost ? 'grayscale(1)' : 'none',
            opacity: ghost ? 0.55 : 1,
          }}
        >
          {ghost ? <Ghost className="w-1/2 h-1/2 text-slate-200" /> : <span>{player.emoji}</span>}
          {player.isBot && !ghost && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-abyss-900 border border-white/20 p-0.5">
              <Bot className="w-3 h-3 text-cyan-200" />
            </span>
          )}
          {isWinner && (
            <Crown className="absolute -top-5 w-6 h-6 text-amber-300 drop-shadow-[0_0_6px_#ffd166]" fill="#ffd166" />
          )}
        </div>
      </div>
      <div
        className={`mt-1.5 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold truncate max-w-full ${
          ghost ? 'text-slate-400 line-through' : 'text-white'
        }`}
        style={{ background: isActive && !ghost ? `${player.color}55` : 'rgba(2,12,28,.6)' }}
      >
        {player.name}
      </div>
      <div className="mt-0.5 h-4">
        {ghost ? (
          <span className="text-[10px] uppercase tracking-widest text-slate-400">spectating</span>
        ) : (
          <Hearts lives={player.lives} size={13} gainedAt={gainedAt} />
        )}
      </div>
      {below && (
        <div className="absolute top-full mt-1 flex justify-center w-48 pointer-events-none">
          <Bubble speech={speech} draft={draft} isActive={isActive} isBot={player.isBot} clock={clock} />
        </div>
      )}
    </div>
  )
}
