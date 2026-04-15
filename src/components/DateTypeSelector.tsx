import { motion } from 'framer-motion'
import type { DateType } from '../types'

interface DateTypeSelectorProps {
  value: DateType
  onChange: (type: DateType) => void
}

const OPTIONS: { type: DateType; label: string; icon: string }[] = [
  { type: 'none',   label: 'Anytime',     icon: '🤷' },
  { type: 'single', label: 'Specific day', icon: '📅' },
  { type: 'range',  label: 'Date range',  icon: '📆' },
  { type: 'multi',  label: 'Multiple days', icon: '🗓️' },
]

export function DateTypeSelector({ value, onChange }: DateTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => (
        <motion.button
          key={opt.type}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(opt.type)}
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: value === opt.type ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)',
            border: value === opt.type ? '1.5px solid rgba(168,85,247,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
            color: value === opt.type ? '#E9D5FF' : 'rgba(255,255,255,0.5)',
          }}
        >
          <span className="text-xl">{opt.icon}</span>
          <span className="text-xs">{opt.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
