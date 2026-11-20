import { Heart } from 'lucide-react'
import { MAX_LIVES } from '../game/engine.js'

export default function Hearts({ lives, size = 14, gainedAt }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${lives} hearts`}>
      {Array.from({ length: MAX_LIVES }, (_, i) => {
        const filled = i < lives
        if (!filled && i >= 3) return null // the bonus 4th slot only shows when earned
        const isBonus = i === 3
        return (
          <Heart
            key={`${i}-${filled ? gainedAt ?? 0 : 'x'}`}
            className={filled && isBonus ? 'heart-gain' : ''}
            width={size}
            height={size}
            strokeWidth={2.5}
            style={{
              color: filled ? (isBonus ? '#ffd166' : '#ff5c7a') : 'rgba(255,255,255,0.25)',
              fill: filled ? (isBonus ? '#ffd166' : '#ff5c7a') : 'transparent',
              filter: filled ? `drop-shadow(0 0 4px ${isBonus ? '#ffd166' : '#ff5c7a'})` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
