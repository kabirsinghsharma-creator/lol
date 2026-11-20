import { memo, useId } from 'react'

const PALETTE = [
  { body: '#ffd166', dark: '#e6a93b', belly: '#fff4cc', spot: '#d98f2b', glow: 'rgba(255, 209, 102, 0.45)' },
  { body: '#ffbf4d', dark: '#e0902a', belly: '#ffefc0', spot: '#c97a22', glow: 'rgba(255, 170, 70, 0.55)' },
  { body: '#ff8a3d', dark: '#d35d1c', belly: '#ffd8b0', spot: '#b84d14', glow: 'rgba(255, 120, 50, 0.7)' },
  { body: '#ff4b4b', dark: '#c4232b', belly: '#ffc1b3', spot: '#a0161f', glow: 'rgba(255, 50, 60, 0.85)' },
]
const SCALE = [0.66, 0.8, 0.95, 1.12]
const SPIKE = [0, 0.32, 1, 1.3]
const MOTION = ['puffer-bob', 'puffer-bob-fast', 'puffer-wobble', 'puffer-shake']

// Spikes are laid around the body ellipse.
const SPIKES = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + 0.07
  const rx = 92
  const ry = 80
  return { x: Math.cos(a) * rx, y: Math.sin(a) * ry, deg: (a * 180) / Math.PI }
})

const SPOTS = [
  [-40, -50, 7], [-12, -64, 5], [-62, -22, 6], [-22, -30, 4], [8, -46, 5],
  [-72, 12, 5], [-44, 4, 4], [30, -66, 4], [-82, -40, 4],
]

const T = 'all 0.45s cubic-bezier(.34,1.56,.64,1)'
const FILL_T = { transition: 'fill 0.5s ease' }

function Pufferfish({ stage = 0, facing = 1, className = '', calm = false }) {
  const s = Math.max(0, Math.min(3, stage))
  const c = PALETTE[s]
  const eyeR = [22, 25, 26, 28][s]
  const pupilR = [11, 10, 8, 5][s]
  const uid = useId().replace(/:/g, '')

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{ transform: `scaleX(${facing})`, transition: 'transform 0.35s ease' }}
    >
      <div
        className="w-full h-full"
        style={{
          transform: `scale(${SCALE[s]})`,
          transition: 'transform 0.55s cubic-bezier(.34,1.7,.64,1), filter 0.5s ease',
          filter: `drop-shadow(0 0 ${12 + s * 8}px ${c.glow})`,
        }}
      >
        <div className={`w-full h-full ${calm ? 'puffer-bob' : MOTION[s]}`}>
          <div className={`w-full h-full ${s === 3 && !calm ? 'heartbeat' : ''}`}>
            <svg viewBox="-175 -170 350 340" className="w-full h-full overflow-visible" aria-label="pufferfish">
              <defs>
                <clipPath id={`clip-${uid}`}>
                  <ellipse cx="0" cy="0" rx="100" ry="88" />
                </clipPath>
                <radialGradient id={`shade-${uid}`} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                  <stop offset="55%" stopColor="#fff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
                </radialGradient>
              </defs>

              {/* tail */}
              <path
                className="tail-wag"
                d="M -92 0 L -152 -46 Q -132 0 -152 46 Z"
                style={{ fill: c.dark, ...FILL_T }}
              />
              {/* dorsal fin */}
              <path d="M -40 -82 Q -24 -122 6 -86 Z" style={{ fill: c.dark, ...FILL_T }} />
              {/* lower fin */}
              <path d="M -30 84 Q -14 116 10 86 Z" style={{ fill: c.dark, ...FILL_T }} />

              {/* spikes */}
              {SPIKES.map((sp, i) => (
                <g key={i} transform={`translate(${sp.x} ${sp.y}) rotate(${sp.deg})`}>
                  <path
                    d="M 0 -8 L 36 0 L 0 8 Z"
                    style={{
                      fill: c.dark,
                      stroke: c.spot,
                      strokeWidth: 1.5,
                      transformBox: 'fill-box',
                      transformOrigin: '0% 50%',
                      transform: `scale(${SPIKE[s]})`,
                      transition: `${T}, fill 0.5s ease`,
                      transitionDelay: `${(i % 6) * 18}ms`,
                    }}
                  />
                </g>
              ))}

              {/* body */}
              <ellipse cx="0" cy="0" rx="100" ry="88" style={{ fill: c.body, ...FILL_T }} />
              <g clipPath={`url(#clip-${uid})`}>
                <ellipse cx="14" cy="50" rx="92" ry="48" style={{ fill: c.belly, ...FILL_T }} />
                {SPOTS.map(([x, y, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} style={{ fill: c.spot, opacity: 0.55, ...FILL_T }} />
                ))}
                <ellipse cx="0" cy="0" rx="100" ry="88" fill={`url(#shade-${uid})`} />
              </g>
              <ellipse cx="-34" cy="-56" rx="26" ry="10" fill="#fff" opacity="0.35" transform="rotate(-22 -34 -56)" />

              {/* pectoral fin */}
              <ellipse
                className="fin-flap"
                cx="14"
                cy="16"
                rx="24"
                ry="12"
                style={{ fill: c.dark, opacity: 0.85, ...FILL_T }}
              />

              {/* cheek blush */}
              <ellipse cx="66" cy="18" rx="14" ry="8" fill="#ff6f91" opacity={s >= 2 ? 0.65 : 0.4} />

              {/* eyes */}
              {[
                { cx: 40, cy: -24, r: eyeR },
                { cx: 80, cy: -20, r: eyeR * 0.72 },
              ].map((e, i) => (
                <g key={i}>
                  <circle cx={e.cx} cy={e.cy} r={e.r} fill="#fff" stroke="#3b1d0f" strokeWidth="2.5" style={{ transition: T }} />
                  <circle
                    cx={e.cx + (s === 3 ? 0 : 4)}
                    cy={e.cy + (s === 3 ? 0 : 2)}
                    r={pupilR * (i ? 0.75 : 1)}
                    fill="#1b0e08"
                    style={{ transition: T }}
                  />
                  <circle cx={e.cx + 7} cy={e.cy - 6} r={pupilR * 0.35 * (i ? 0.75 : 1) + 1.5} fill="#fff" />
                  {s === 0 && (
                    // relaxed eyelid
                    <path
                      d={`M ${e.cx - e.r - 1} ${e.cy - 2} A ${e.r + 1} ${e.r + 1} 0 0 1 ${e.cx + e.r + 1} ${e.cy - 2} Z`}
                      style={{ fill: c.body, ...FILL_T }}
                      stroke="#3b1d0f"
                      strokeWidth="2.5"
                    />
                  )}
                </g>
              ))}

              {/* brows */}
              {s >= 1 && (
                <g stroke="#3b1d0f" strokeWidth="5" strokeLinecap="round" fill="none">
                  {s === 1 ? (
                    <>
                      <path d="M 20 -58 Q 40 -70 60 -60" />
                      <path d="M 68 -50 Q 82 -58 94 -48" />
                    </>
                  ) : (
                    <>
                      <path d="M 18 -50 L 58 -66" />
                      <path d="M 68 -60 L 96 -46" />
                    </>
                  )}
                </g>
              )}

              {/* mouth */}
              {s <= 1 && <ellipse cx="100" cy="16" rx={s ? 8 : 6} ry={s ? 9 : 6} fill="#7a1f33" />}
              {s === 2 && (
                <path d="M 86 22 Q 92 14 98 22 T 110 22" stroke="#7a1f33" strokeWidth="5" fill="none" strokeLinecap="round" />
              )}
              {s === 3 && (
                <g>
                  <rect x="82" y="10" width="26" height="18" rx="6" fill="#7a1f33" />
                  <rect x="85" y="12" width="20" height="6" rx="2" fill="#fff" />
                  <line x1="91" y1="12" x2="91" y2="18" stroke="#7a1f33" strokeWidth="1.5" />
                  <line x1="98" y1="12" x2="98" y2="18" stroke="#7a1f33" strokeWidth="1.5" />
                </g>
              )}

              {/* little bubbles while calm */}
              {s <= 1 && (
                <g>
                  <circle className="mouth-bubble" cx="112" cy="8" r="5" fill="none" stroke="#bff6ff" strokeWidth="2" />
                  <circle className="mouth-bubble" style={{ animationDelay: '1.3s' }} cx="112" cy="8" r="3.5" fill="none" stroke="#bff6ff" strokeWidth="2" />
                </g>
              )}

              {/* sweat */}
              {s >= 2 && (
                <g fill="#9be8ff" stroke="#4fb6e0" strokeWidth="1.5">
                  <path className="sweat" d="M -26 -100 q 7 11 0 15 q -7 -4 0 -15 Z" />
                  <path className="sweat" style={{ animationDelay: '0.45s' }} d="M 104 -64 q 7 11 0 15 q -7 -4 0 -15 Z" />
                  {s === 3 && (
                    <>
                      <path className="sweat" style={{ animationDelay: '0.2s' }} d="M -88 -58 q 7 11 0 15 q -7 -4 0 -15 Z" />
                      <path className="sweat" style={{ animationDelay: '0.7s' }} d="M 46 -96 q 7 11 0 15 q -7 -4 0 -15 Z" />
                    </>
                  )}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Pufferfish)
