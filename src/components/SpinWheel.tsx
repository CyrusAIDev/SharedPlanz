import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { RankedPlan } from '../types'

const COLORS = ['#FF6B6B','#A855F7','#FFD93D','#6BCB77','#3B82F6','#F97316','#EC4899','#06B6D4','#8B5CF6','#10B981']

type WheelMode = 'fair' | 'vibe'

interface SpinWheelProps { plans: RankedPlan[] }

function computeWeights(plans: RankedPlan[], mode: WheelMode): number[] {
  if (mode === 'fair') return plans.map(() => 1)
  return plans.map((p) => 1.0 + p.rankScore * 1.5)
}

export function SpinWheel({ plans }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<RankedPlan | null>(null)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [mode, setMode] = useState<WheelMode>('fair')

  function drawWheel(angle: number, weights?: number[]) {
    const canvas = canvasRef.current
    if (!canvas || plans.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 4
    ctx.clearRect(0, 0, size, size)

    const w = weights ?? computeWeights(plans, mode)
    const total = w.reduce((a, b) => a + b, 0)
    let startAngle = angle

    plans.forEach((plan, i) => {
      const sliceAngle = (w[i]! / total) * 2 * Math.PI
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = COLORS[i % COLORS.length]!
      ctx.fill()
      ctx.strokeStyle = 'rgba(26,16,37,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.min(13, 110 / plans.length)}px -apple-system, sans-serif`
      const label = plan.title.length > 14 ? plan.title.slice(0, 13) + '…' : plan.title
      ctx.fillText(label, radius - 10, 5)
      ctx.restore()

      startAngle = endAngle
    })

    // Center hub
    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#1A1025'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Pointer (right side, fixed)
    const pointerX = size - 8
    ctx.beginPath()
    ctx.moveTo(pointerX, cy - 10)
    ctx.lineTo(pointerX, cy + 10)
    ctx.lineTo(pointerX - 22, cy)
    ctx.closePath()
    ctx.fillStyle = 'white'
    ctx.shadowColor = 'rgba(255,255,255,0.6)'
    ctx.shadowBlur = 6
    ctx.fill()
    ctx.shadowBlur = 0
  }

  useEffect(() => { drawWheel(currentAngle) }, [plans, currentAngle, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  function spin() {
    if (spinning || plans.length === 0) return
    setSpinning(true)
    setWinner(null)

    const weights = computeWeights(plans, mode)
    const total = weights.reduce((a, b) => a + b, 0)

    const extraRotations = 6 + Math.random() * 4
    const finalAngle = currentAngle + extraRotations * 2 * Math.PI + Math.random() * 2 * Math.PI
    const duration = 4000
    const start = performance.now()
    const startAngle = currentAngle

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic + slight bounce
      const ease = progress < 1
        ? 1 - Math.pow(1 - progress, 3)
        : 1
      const angle = startAngle + (finalAngle - startAngle) * ease
      drawWheel(angle, weights)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCurrentAngle(finalAngle)
        setSpinning(false)

        // Determine winner: pointer sits at angle 0 (right side, 3 o'clock)
        // After rotating wheel by finalAngle, the pointer at angle 0 sees segment at (-finalAngle)
        const pointerInWheel = ((-finalAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
        let cumulative = 0
        let winnerIdx = 0
        for (let i = 0; i < plans.length; i++) {
          cumulative += (weights[i]! / total) * 2 * Math.PI
          if (pointerInWheel < cumulative) {
            winnerIdx = i
            break
          }
        }
        const won = plans[winnerIdx] ?? plans[0]!
        setWinner(won)
        const winnerColor = COLORS[winnerIdx % COLORS.length]!
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: [winnerColor, '#FFD93D', '#ffffff'] })
      }
    }
    requestAnimationFrame(animate)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Mode toggle */}
      <div className="flex p-1 rounded-2xl gap-1 w-full"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(168,85,247,0.15)' }}>
        {([['fair', '🎲 Fair Spin'], ['vibe', '✨ Vibe Spin']] as const).map(([id, label]) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (!spinning) { setMode(id); setWinner(null) } }}
            disabled={spinning}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: mode === id ? 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' : 'transparent',
              color: mode === id ? '#fff' : 'rgba(255,255,255,0.4)',
            }}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {mode === 'vibe' && (
        <p className="text-white/30 text-xs text-center -mt-2">
          Higher-rated plans get bigger slices
        </p>
      )}

      <canvas ref={canvasRef} width={300} height={300} className="rounded-full"
        style={{ boxShadow: '0 0 40px rgba(255,107,107,0.2)' }} />

      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,107,107,0.12)', border: '1.5px solid rgba(255,107,107,0.3)' }}>
            <p className="text-white/50 text-xs mb-1 uppercase tracking-widest">Winner 🎉</p>
            <p className="text-white font-black text-xl">{winner.title}</p>
            {winner.description && <p className="text-white/50 text-sm mt-1">{winner.description}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 w-full">
        <motion.button whileTap={{ scale: 0.97 }} onClick={spin} disabled={spinning}
          className="flex-1 py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}>
          {spinning ? 'Spinning… 🎡' : winner ? 'Spin Again 🔄' : 'Spin the Wheel 🎡'}
        </motion.button>
        {winner && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setWinner(null)}
            className="px-4 py-4 rounded-2xl font-bold text-white/50 text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Clear
          </motion.button>
        )}
      </div>
    </div>
  )
}
