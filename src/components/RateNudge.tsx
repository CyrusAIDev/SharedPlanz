import { motion } from 'framer-motion'

interface RateNudgeProps {
  count: number
  onTap: () => void
}

export function RateNudge({ count, onTap }: RateNudgeProps) {
  if (count === 0) return null

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold"
      style={{
        background: 'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(168,85,247,0.15) 100%)',
        border: '1.5px solid rgba(255,107,107,0.3)',
        color: '#FFB3B3',
      }}
    >
      You haven't rated {count} plan{count !== 1 ? 's' : ''} yet 👀 — your vote matters!
    </motion.button>
  )
}
