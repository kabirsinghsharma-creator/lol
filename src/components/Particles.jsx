import { memo, useMemo } from 'react'

const PALETTES = {
  pop: ['#ff4b4b', '#ff8a3d', '#ffd166', '#bff6ff', '#ffffff'],
  krillion: ['#ffd166', '#fff3b0', '#ffb703', '#2ef2d0', '#ff7eb6', '#ffffff'],
  rare: ['#c4b5fd', '#a78bfa', '#e9d5ff', '#2ef2d0'],
  common: ['#5eead4', '#99f6e4', '#bff6ff'],
  heart: ['#ff5c7a', '#ff8fa3', '#ffd166'],
  victory: ['#ffd166', '#2ef2d0', '#ff7eb6', '#8f7bff', '#ffffff', '#6ee7a8'],
}

function Burst({ x, y, kind }) {
  const parts = useMemo(() => {
    const colors = PALETTES[kind] ?? PALETTES.common
    const count = { pop: 46, krillion: 64, rare: 18, common: 10, heart: 14, victory: 90 }[kind] ?? 12
    const power = { pop: 260, krillion: 300, rare: 120, common: 80, heart: 90, victory: 420 }[kind] ?? 100
    return Array.from({ length: count }, (_, i) => {
      const a = Math.random() * Math.PI * 2
      const dist = power * (0.35 + Math.random() * 0.75)
      const shape = kind === 'heart' ? 'heart' : Math.random() < (kind === 'pop' ? 0.55 : 0.3) ? 'bubble' : Math.random() < 0.5 ? 'confetti' : 'star'
      return {
        i,
        dx: Math.cos(a) * dist,
        dy: Math.sin(a) * dist - (shape === 'bubble' ? 60 : 0),
        rot: (Math.random() - 0.5) * 720,
        size: shape === 'bubble' ? 6 + Math.random() * 16 : 6 + Math.random() * 8,
        color: colors[i % colors.length],
        delay: Math.random() * 0.12,
        dur: 0.9 + Math.random() * 0.8,
        shape,
      }
    })
  }, [kind])

  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
      {parts.map((p) => {
        const style = {
          '--dx': `${p.dx}px`,
          '--dy': `${p.dy}px`,
          '--rot': `${p.rot}deg`,
          '--delay': `${p.delay}s`,
          '--dur': `${p.dur}s`,
          width: p.size,
          height: p.shape === 'confetti' ? p.size * 0.45 : p.size,
        }
        if (p.shape === 'bubble')
          return (
            <span
              key={p.i}
              className="particle rounded-full"
              style={{ ...style, border: `2px solid ${p.color}`, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.7), transparent 60%)' }}
            />
          )
        if (p.shape === 'heart')
          return (
            <span key={p.i} className="particle text-base leading-none" style={{ ...style, color: p.color }}>
              ♥
            </span>
          )
        if (p.shape === 'star')
          return (
            <span key={p.i} className="particle leading-none" style={{ ...style, color: p.color, fontSize: p.size * 1.6 }}>
              ✦
            </span>
          )
        return <span key={p.i} className="particle rounded-sm" style={{ ...style, background: p.color }} />
      })}
    </div>
  )
}

function Particles({ bursts }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-30">
      {bursts.map((b) => (
        <Burst key={b.id} x={b.x} y={b.y} kind={b.kind} />
      ))}
    </div>
  )
}

export default memo(Particles)
