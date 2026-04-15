import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { RankedPlan } from '../types'

interface DiceRollProps { plans: RankedPlan[] }

export function DiceRoll({ plans }: DiceRollProps) {
  const [rolling, setRolling] = useState(false)
  const [winner, setWinner] = useState<RankedPlan | null>(null)

  function roll() {
    if (rolling) return
    setRolling(true)
    setWinner(null)
    setTimeout(() => {
      const topPlans = plans.slice(0, Math.min(3, plans.length))
      const picked = topPlans[Math.floor(Math.random() * topPlans.length)]
      setWinner(picked)
      setRolling(false)
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 }, colors: ['#FF6B6B', '#A855F7', '#FFD93D'] })
    }, 800)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={roll}
        disabled={rolling}
        className="flex items-center gap-3 px-8 py-5 rounded-2xl font-bold text-white text-base disabled:opacity-50"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(168,85,247,0.2)' }}
        animate={rolling ? { rotate: [0, -18, 18, -12, 12, 0] } : {}}
        transition={{ duration: 0.6 }}
      >
        <Dices size={26} style={{ color: rolling ? '#FF6B6B' : 'rgba(255,255,255,0.7)' }} />
        {rolling ? 'Rolling… 🎲' : 'Roll the Dice 🎲'}
      </motion.button>

      <p className="text-white/35 text-xs">Picks from the top 3 plans</p>

      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full rounded-2xl p-5 text-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1.5px solid rgba(168,85,247,0.3)' }}>
            <p className="text-white/50 text-xs mb-1 uppercase tracking-widest">The dice chose 🎲</p>
            <p className="text-white font-black text-xl">{winner.title}</p>
            {winner.description && <p className="text-white/50 text-sm mt-1">{winner.description}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
