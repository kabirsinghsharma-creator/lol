import { Sparkles, Gem, Shell } from 'lucide-react'

export const TIER_META = {
  common: { label: 'Common', cls: 'bg-teal-400/15 text-teal-200 border-teal-300/30', color: '#5eead4' },
  rare: { label: 'Rare', cls: 'bg-violet-400/20 text-violet-200 border-violet-300/40', color: '#c4b5fd' },
  krillion: { label: 'Krillion!', cls: 'shine text-amber-950 border-amber-200/80 font-extrabold', color: '#ffd166' },
}

export default function RarityBadge({ tier, size = 'sm' }) {
  const meta = TIER_META[tier] ?? TIER_META.common
  const Icon = tier === 'krillion' ? Sparkles : tier === 'rare' ? Gem : Shell
  const pad = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-[11px]'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wide whitespace-nowrap ${pad} ${meta.cls}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} strokeWidth={2.5} />
      {meta.label}
    </span>
  )
}
