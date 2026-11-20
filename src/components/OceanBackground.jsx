import { memo, useMemo } from 'react'

function OceanBackground() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 18,
        dur: 9 + Math.random() * 14,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 80,
      })),
    [],
  )
  const specks = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        dur: 2 + Math.random() * 4,
        delay: -Math.random() * 4,
      })),
    [],
  )
  return (
    <div className="fixed inset-0 ocean-bg overflow-hidden pointer-events-none" aria-hidden>
      {[8, 28, 52, 74, 90].map((left, i) => (
        <div
          key={left}
          className="light-ray"
          style={{ left: `${left}%`, '--r': `${(i - 2) * 7}deg`, animationDelay: `${-i * 1.7}s` }}
        />
      ))}
      {specks.map((s) => (
        <div
          key={s.id}
          className="speck"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bg-bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            '--drift': `${b.drift}px`,
          }}
        />
      ))}
      {/* distant reef silhouette */}
      <svg className="absolute bottom-0 left-0 w-full h-40 opacity-40" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path
          d="M0 160 L0 110 Q 60 70 120 105 T 260 95 Q 320 40 380 100 T 520 90 Q 600 60 680 105 T 840 95 Q 920 50 990 100 T 1120 92 Q 1170 80 1200 100 L1200 160 Z"
          fill="#03142a"
        />
      </svg>
    </div>
  )
}

export default memo(OceanBackground)
