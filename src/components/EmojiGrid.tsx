import { motion } from 'framer-motion'

interface EmojiGridProps {
  emojis: string[]
  selected: string
  onSelect: (emoji: string) => void
  columns?: number
  cellSize?: number
}

export function EmojiGrid({ emojis, selected, onSelect, columns = 5, cellSize = 64 }: EmojiGridProps) {
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {emojis.map((emoji) => {
        const isSelected = selected === emoji
        return (
          <motion.button
            key={emoji}
            type="button"
            whileTap={{ scale: 0.82 }}
            animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            onClick={() => onSelect(emoji)}
            className="flex items-center justify-center rounded-[18px] select-none"
            style={{
              height: cellSize,
              fontSize: cellSize * 0.48,
              background: isSelected ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)',
              border: isSelected
                ? '2px solid #A855F7'
                : '2px solid rgba(255,255,255,0.08)',
              boxShadow: isSelected ? '0 0 18px rgba(168,85,247,0.35)' : 'none',
            }}
          >
            {emoji}
          </motion.button>
        )
      })}
    </div>
  )
}
