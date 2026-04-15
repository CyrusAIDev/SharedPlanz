import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Pencil } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { BottomSheet } from './BottomSheet'
import { StarRating } from './StarRating'
import { formatPlanDate } from '../lib/utils'
import type { RankedPlan, PlanEdit } from '../types'

interface PlanCardProps {
  plan: RankedPlan
  isTop: boolean
  username: string
  rank: number
  planEdits: PlanEdit[]
  onEdit: () => void
}

export function PlanCard({ plan, isTop, username, rank, planEdits, onEdit }: PlanCardProps) {
  const [saving, setSaving] = useState(false)
  const [justRated, setJustRated] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const userRating = plan.ratings.find((r) => r.participant_name === username)
  const currentScore = userRating?.score ?? 0
  const isUnrated = username && !userRating
  const isOwner = plan.added_by === username
  const editCount = planEdits.length

  async function handleRate(score: number) {
    if (!username) { toast.error('Identity not set — go back home'); return }
    if (saving) return
    setSaving(true)
    try {
      if (userRating) {
        const { error } = await supabase.from('ratings').update({ score }).eq('id', userRating.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('ratings').insert({ plan_id: plan.id, participant_name: username, score })
        if (error) throw error
      }
      setJustRated(true)
      setTimeout(() => setJustRated(false), 800)
    } catch (err) {
      console.error('[PlanCard] rate error:', err)
      toast.error('Could not save rating')
    } finally {
      setSaving(false)
    }
  }

  const dateLabel = formatPlanDate(plan)
  const dateIcon = plan.date_type === 'none' ? '🤷' : plan.date_type === 'range' ? '📆' : plan.date_type === 'multi' ? '🗓️' : '📅'

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        whileTap={{ scale: 0.985 }}
        className={`relative rounded-2xl overflow-hidden ${isUnrated ? 'pulse-unrated' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: isTop ? '1.5px solid rgba(255,107,107,0.45)' : '1.5px solid rgba(168,85,247,0.15)',
          boxShadow: isTop ? '0 8px 32px rgba(255,107,107,0.12)' : 'none',
        }}
      >
        {isTop && (
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #FF6B6B, #A855F7)' }} />
        )}

        {/* Star burst on rate */}
        <AnimatePresence>
          {justRated && (
            <motion.div
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <span className="text-4xl">✨</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: isTop ? 'rgba(255,107,107,0.18)' : 'rgba(255,255,255,0.08)',
                  color: isTop ? '#FF6B6B' : 'rgba(255,255,255,0.4)',
                }}>
                #{rank}
              </span>
              <h3 className="text-white font-bold text-base leading-snug truncate">{plan.title}</h3>
            </div>

            <div className="flex items-center gap-2 ml-3 shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-white font-bold text-sm">
                  {plan.voteCount > 0 ? plan.bayesianScore.toFixed(1) : '—'}
                </span>
                <span className="text-white/30 text-xs">{plan.voteCount} vote{plan.voteCount !== 1 ? 's' : ''}</span>
              </div>

              {/* Edit button — only visible to plan creator */}
              {isOwner && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  title="Edit plan"
                >
                  <Pencil size={13} color="rgba(255,255,255,0.35)" />
                </motion.button>
              )}
            </div>
          </div>

          {plan.description && (
            <p className="text-white/55 text-sm mb-3 leading-relaxed">{plan.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-3">
            {plan.date_type === 'none' ? (
              <div className="flex items-center gap-1 text-white/35 text-xs">
                <span>🤷</span><span>Anytime</span>
              </div>
            ) : dateLabel ? (
              <div className="flex items-center gap-1 text-white/45 text-xs">
                <span>{dateIcon}</span><span>{dateLabel}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-white/35 text-xs">
                <Calendar size={12} /><span>Date TBD</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-white/35 text-xs">
              <span>by {plan.added_by_emoji ?? ''} {plan.added_by}</span>
              {editCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setHistoryOpen(true) }}
                  className="text-white/30 text-xs underline underline-offset-2 hover:text-white/50 transition-colors"
                >
                  edited {editCount > 1 ? `${editCount}×` : ''}
                </button>
              )}
            </div>
          </div>

          <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-white/40 text-xs">What do you think? ✨</p>
            {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-[#A855F7] border-t-transparent animate-spin" />}
          </div>
          <div className="mt-2.5">
            <StarRating value={currentScore} onChange={handleRate} size={34} />
          </div>
        </div>
      </motion.div>

      {/* Edit history bottom sheet */}
      <BottomSheet open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Edit history ✏️`}>
        <div className="flex flex-col gap-3 mt-1">
          {planEdits.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">No edits yet</p>
          ) : (
            [...planEdits].reverse().map((edit) => {
              let timeLabel = ''
              try {
                timeLabel = format(parseISO(edit.created_at), "MMM d 'at' h:mm a")
              } catch { /* ignore */ }
              return (
                <div key={edit.id} className="flex flex-col gap-0.5 py-2 border-b last:border-b-0"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-white/80 text-sm">
                    {edit.edited_by_emoji ?? ''} <span className="font-semibold">{edit.edited_by}</span> updated this plan
                  </p>
                  {edit.previous_title && (
                    <p className="text-white/35 text-xs">was: "{edit.previous_title}"</p>
                  )}
                  {timeLabel && (
                    <p className="text-white/25 text-xs">{timeLabel}</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </BottomSheet>
    </>
  )
}
