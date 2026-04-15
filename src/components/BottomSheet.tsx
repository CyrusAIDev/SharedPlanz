import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px]"
            style={{
              background: '#221335',
              border: '1px solid rgba(168,85,247,0.2)',
              borderBottom: 'none',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pb-2 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{title}</h2>
              <button onClick={onClose} className="text-white/40 text-sm py-1 px-2">Cancel</button>
            </div>
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
