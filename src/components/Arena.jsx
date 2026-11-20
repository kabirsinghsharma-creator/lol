import { memo, useMemo } from 'react'
import Pufferfish from './Pufferfish.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'
import Particles from './Particles.jsx'

export function ringPositions(n) {
  // Player 0 sits at the bottom; indices increase clockwise on screen.
  return Array.from({ length: n }, (_, i) => {
    const a = ((90 + (i * 360) / n) * Math.PI) / 180
    return { x: 50 + Math.cos(a) * 39, y: 50 + Math.sin(a) * 37 }
  })
}

const Reef = memo(function Reef() {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" aria-hidden>
      <defs>
        <radialGradient id="reef-floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f4c6e" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#0a3555" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#041a33" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="reef-glow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#2ef2d0" stopOpacity="0" />
          <stop offset="88%" stopColor="#2ef2d0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2ef2d0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="196" fill="url(#reef-floor)" />
      <circle cx="200" cy="200" r="196" fill="url(#reef-glow)" />
      <ellipse cx="200" cy="200" rx="156" ry="148" fill="none" stroke="#2ef2d0" strokeOpacity="0.16" strokeWidth="2" strokeDasharray="4 10" />
      {/* sand patches */}
      <ellipse cx="200" cy="300" rx="120" ry="26" fill="#c8a96b" opacity="0.08" />
      {/* corals */}
      <g opacity="0.85">
        <g className="seaweed" style={{ transformOrigin: '70px 330px' }}>
          <path d="M70 330 C 60 300, 80 290, 66 262 C 56 240, 74 228, 68 210" stroke="#2ef2d0" strokeOpacity="0.5" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        <g className="seaweed" style={{ transformOrigin: '330px 320px', animationDelay: '-1.5s' }}>
          <path d="M330 322 C 340 294, 322 280, 336 254 C 346 232, 330 222, 336 204" stroke="#6ee7a8" strokeOpacity="0.45" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        <path d="M110 352 q -6 -26 6 -40 q -16 -6 -10 -20 q 14 4 12 18 q 10 -18 22 -10 q -4 18 -18 22 q 10 14 4 30 Z" fill="#ff7eb6" opacity="0.35" />
        <path d="M290 356 q -4 -22 8 -34 q -14 -10 -6 -22 q 12 6 10 20 q 12 -14 22 -4 q -6 16 -20 18 q 6 12 0 22 Z" fill="#8f7bff" opacity="0.35" />
        <circle cx="96" cy="120" r="5" fill="#2ef2d0" opacity="0.35" />
        <circle cx="312" cy="96" r="4" fill="#ff7eb6" opacity="0.35" />
        <circle cx="330" cy="140" r="3" fill="#ffd166" opacity="0.4" />
        <circle cx="70" cy="180" r="3" fill="#ffd166" opacity="0.35" />
      </g>
    </svg>
  )
})

function Arena({ state, draft, bursts, overlays, gains }) {
  const { players, current, phase, stage, speech, clock, winnerId } = state
  const positions = useMemo(() => ringPositions(players.length), [players.length])
  const target = positions[current] ?? { x: 50, y: 50 }
  const pufferX = 50 + (target.x - 50) * 0.36
  const pufferY = 50 + (target.y - 50) * 0.36
  const facing = target.x < 49 ? -1 : 1
  const popped = phase === 'popped' || phase === 'over'
  const showPuffer = !popped

  return (
    <div className="relative w-full aspect-square select-none">
      <Reef />

      {/* the pufferfish swims toward whoever holds it */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: `${pufferX}%`,
          top: `${pufferY}%`,
          width: '40%',
          height: '40%',
          transform: 'translate(-50%, -50%)',
          transition: `left 0.45s cubic-bezier(.3,1.4,.5,1), top 0.45s cubic-bezier(.3,1.4,.5,1)${showPuffer ? ', opacity .4s' : ''}`,
          opacity: showPuffer ? 1 : 0,
        }}
      >
        <Pufferfish stage={phase === 'reveal' ? 0 : stage} facing={facing} />
      </div>

      {players.map((p, i) => (
        <PlayerAvatar
          key={p.id}
          player={p}
          pos={positions[i]}
          isActive={i === current && (phase === 'playing' || phase === 'reveal')}
          speech={speech[p.id]}
          draft={i === current ? draft : ''}
          clock={clock}
          isWinner={phase === 'over' && p.id === winnerId}
          gainedAt={gains[p.id]}
        />
      ))}

      <Particles bursts={bursts} />
      {overlays}
    </div>
  )
}

export default Arena
