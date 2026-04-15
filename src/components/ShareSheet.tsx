import { motion } from 'framer-motion'
import { Copy, MessageCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { BottomSheet } from './BottomSheet'
import { copyToClipboard } from '../lib/utils'

interface ShareSheetProps {
  open: boolean
  onClose: () => void
  sessionName: string
  sessionCode: string
}

export function ShareSheet({ open, onClose, sessionName, sessionCode }: ShareSheetProps) {
  const url = `${window.location.origin}/session/${sessionCode}`
  const shareMessage = `Join our planning session on Shared Planz! Tap the link or use code ${sessionCode}: ${url}`

  async function handleCopyCode() {
    try { await copyToClipboard(sessionCode); toast.success('Code copied! 🔗') }
    catch { toast.error('Could not copy') }
  }

  async function handleCopyUrl() {
    try { await copyToClipboard(url); toast.success('Link copied! 🔗') }
    catch { toast.error('Could not copy') }
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Join ${sessionName} on Shared Planz`, text: shareMessage, url })
      } else {
        await copyToClipboard(url)
        toast.success('Link copied! 🔗')
      }
    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        try { await copyToClipboard(url); toast.success('Link copied! 🔗') }
        catch { toast.error('Could not share') }
      }
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Invite Crew 🔗">
      <div className="flex flex-col gap-4 mt-2">
        <p className="text-white/40 text-sm text-center">{sessionName}</p>

        {/* Big code */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { void handleCopyCode() }}
          className="flex flex-col items-center gap-2 py-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(168,85,247,0.2)' }}
        >
          <p className="text-white/40 text-xs uppercase tracking-widest">Session Code</p>
          <p className="text-5xl font-black tracking-[0.2em] logo-shimmer">{sessionCode}</p>
          <div className="flex items-center gap-1.5 text-white/35 text-xs">
            <Copy size={11} />
            <span>Tap to copy code</span>
          </div>
        </motion.button>

        {/* Copy URL */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { void handleCopyUrl() }}
          className="flex items-center justify-between px-4 py-3.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-white/60 text-sm truncate flex-1 text-left">{url}</span>
          <Copy size={15} className="ml-3 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
        </motion.button>

        {/* Native share / iMessage */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { void handleShare() }}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
        >
          <MessageCircle size={18} />
          Share via iMessage
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-white/40 text-sm flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <X size={15} />
          Close
        </motion.button>
      </div>
    </BottomSheet>
  )
}
