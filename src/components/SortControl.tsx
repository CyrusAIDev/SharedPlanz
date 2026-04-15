import { motion } from 'framer-motion'
import type { SortMode } from '../types'

interface SortControlProps {
  value: SortMode
  onChange: (mode: SortMode) => void
}

const MODES: { mode: SortMode; label: string }[] = [
  { mode: 'top',     label: 'Top Rated ⭐' },
  { mode: 'soonest', label: 'Soonest 📅' },
  { mode: 'voted',   label: 'Most Voted 🗳️' },
  { mode: 'newest',  label: 'Newest ✨' },
  { mode: 'unrated', label: 'Not Rated 👀' },
]

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
      {MODES.map((m) => (
        <motion.button
          key={m.mode}
          whileTap={{ scale: 0.93 }}
          onClick={() => onChange(m.mode)}
          className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap"
          style={{
            background: value === m.mode ? 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' : 'rgba(255,255,255,0.07)',
            color: value === m.mode ? '#fff' : 'rgba(255,255,255,0.45)',
            border: value === m.mode ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {m.label}
        </motion.button>
      ))}
    </div>
  )
}
