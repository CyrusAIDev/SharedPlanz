import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import type { Vote, VoteResponse, RankedPlan } from '../types'

interface VoteModalProps {
  vote: Vote
  responses: VoteResponse[]
  plans: RankedPlan[]
  username: string
  onDismiss: () => void
}

export function VoteModal({ vote, responses, plans, username, onDismiss }: VoteModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(300)

  const votePlans = vote.plan_ids
    .map((id) => plans.find((p) => p.id === id))
    .filter((p): p is RankedPlan => p !== undefined)

  const myResponse = responses.find((r) => r.vote_id === vote.id && r.participant_name === username)
  const hasVoted = !!myResponse

  const totalVotes = responses.filter((r) => r.vote_id === vote.id).length

  function getCount(planId: string) {
    return responses.filter((r) => r.vote_id === vote.id && r.chosen_plan_id === planId).length
  }

  // 5-minute timeout
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); onDismiss(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onDismiss])

  async function handleVote(planId: string) {
    if (submitting || hasVoted || !username) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('vote_responses').insert({
        vote_id: vote.id,
        participant_name: username,
        chosen_plan_id: planId,
      })
      if (error) throw error
    } catch (err) {
      console.error('[VoteModal] vote error:', err)
      toast.error('Could not submit vote')
    } finally {
      setSubmitting(false)
    }
  }

  const minutesLeft = Math.floor(secondsLeft / 60)
  const secsDisplay = (secondsLeft % 60).toString().padStart(2, '0')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'rgba(26,16,37,0.97)', backdropFilter: 'blur(20px)' }}
      >
        {/* Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full" style={{ background: 'rgba(168,85,247,0.18)', filter: 'blur(60px)' }} />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full" style={{ background: 'rgba(255,107,107,0.12)', filter: 'blur(60px)' }} />
        </div>

        <div className="relative z-10 flex flex-col flex-1 px-6 overflow-y-auto"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>

          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Live Vote 🗳️</p>
            <h2 className="text-white font-black text-2xl leading-tight">
              {vote.question ?? 'Which plan wins?'}
            </h2>
            <p className="text-white/40 text-sm mt-2">
              Started by {vote.created_by} · {minutesLeft}:{secsDisplay} left
            </p>
          </div>

          {/* Plan options */}
          <div className="flex flex-col gap-3 flex-1">
            {votePlans.map((plan) => {
              const count = getCount(plan.id)
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isMyChoice = myResponse?.chosen_plan_id === plan.id

              return (
                <motion.button
                  key={plan.id}
                  whileTap={!hasVoted ? { scale: 0.97 } : {}}
                  onClick={() => { void handleVote(plan.id) }}
                  disabled={hasVoted || submitting}
                  className="relative overflow-hidden rounded-2xl text-left p-4"
                  style={{
                    background: isMyChoice ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)',
                    border: isMyChoice ? '1.5px solid rgba(168,85,247,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {/* Progress bar fill */}
                  {hasVoted && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="absolute inset-y-0 left-0 rounded-2xl"
                      style={{ background: isMyChoice ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)', zIndex: 0 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-base truncate">{plan.title}</p>
                      {plan.description && <p className="text-white/45 text-xs mt-0.5 truncate">{plan.description}</p>}
                    </div>
                    {hasVoted && (
                      <div className="shrink-0 text-right">
                        <p className="text-white font-bold text-lg">{pct}%</p>
                        <p className="text-white/40 text-xs">{count} vote{count !== 1 ? 's' : ''}</p>
                      </div>
                    )}
                    {!hasVoted && (
                      <div
                        className="shrink-0 w-8 h-8 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                      />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            {hasVoted ? (
              <div className="flex flex-col gap-3">
                <p className="text-white/40 text-sm">✅ Your vote is in! {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onDismiss}
                  className="w-full py-3.5 rounded-2xl font-bold text-white/60 text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Dismiss
                </motion.button>
              </div>
            ) : (
              <p className="text-white/30 text-xs">Tap a plan to vote · Auto-closes in {minutesLeft}:{secsDisplay}</p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
