import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProgressBarProps { loading: boolean }

export function ProgressBar({ loading }: ProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (loading) {
      setVisible(true)
      setProgress(0)
      const timer = setInterval(() => {
        setProgress((prev) => prev >= 85 ? (clearInterval(timer), 85) : prev + Math.random() * 15)
      }, 200)
      return () => clearInterval(timer)
    } else {
      setProgress(100)
      const hide = setTimeout(() => { setVisible(false); setProgress(0) }, 400)
      return () => clearTimeout(hide)
    }
  }, [loading])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 h-[2px]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #FF6B6B, #A855F7)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
