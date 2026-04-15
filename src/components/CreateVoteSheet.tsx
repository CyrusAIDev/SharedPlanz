import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { BottomSheet } from './BottomSheet'
import type { RankedPlan } from '../types'

interface CreateVoteSheetProps {
  open: boolean
  onClose: () => void
  sessionId: string
  username: string
  plans: RankedPlan[]
}

export function CreateVoteSheet({ open, onClose, sessionId, username, plans }: CreateVoteSheetProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)

  function togglePlan(planId: string) {
    setSelected((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : prev.length < 3
          ? [...prev, planId]
          : prev
    )
  }

  async function handleSend() {
    if (selected.length < 2) { toast.error('Pick at least 2 plans to vote on!'); return }
    if (!username) { toast.error('Identity not set'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('votes').insert({
        session_id: sessionId,
        created_by: username,
        question: question.trim() || null,
        plan_ids: selected,
        is_active: true,
      })
      if (error) throw error
      toast.success('Vote started! Everyone will see it 🗳️')
      setSelected([])
      setQuestion('')
      onClose()
    } catch (err) {
      console.error('[CreateVoteSheet] error:', err)
      toast.error('Could not start vote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Start a Vote 🗳️">
      <div className="flex flex-col gap-4 mt-2">
        <input
          type="text"
          placeholder="Optional question (e.g. Where should we go?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={100}
          className="w-full px-4 py-3.5 rounded-xl text-white text-base placeholder-white/30 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(168,85,247,0.2)', fontSize: '16px' }}
        />

        <p className="text-white/40 text-xs">Pick 2–3 plans to put to a vote</p>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {plans.map((plan) => {
            const isSelected = selected.includes(plan.id)
            const isDisabled = !isSelected && selected.length >= 3
            return (
              <motion.button
                key={plan.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => !isDisabled && togglePlan(plan.id)}
                disabled={isDisabled}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left disabled:opacity-40"
                style={{
                  background: isSelected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1.5px solid rgba(168,85,247,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isSelected ? '#A855F7' : 'rgba(255,255,255,0.08)',
                    border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {isSelected && <Check size={13} color="white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{plan.title}</p>
                  {plan.description && <p className="text-white/40 text-xs truncate">{plan.description}</p>}
                </div>
              </motion.button>
            )
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { void handleSend() }}
          disabled={loading || selected.length < 2}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
        >
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : `Send Vote to Everyone 🗳️`}
        </motion.button>
      </div>
    </BottomSheet>
  )
}
