import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import type { Vote, VoteResponse, Plan } from '../types'

interface VoteResultsProps {
  votes: Vote[]
  responses: VoteResponse[]
  plans: Plan[]
}

export function VoteResults({ votes, responses, plans }: VoteResultsProps) {
  const pastVotes = votes.filter((v) => !v.is_active)

  if (pastVotes.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-white/40 text-xs uppercase tracking-widest">Past Votes</p>
      {pastVotes.map((vote) => {
        const voteResponses = responses.filter((r) => r.vote_id === vote.id)
        const total = voteResponses.length

        const counts = new Map<string, number>()
        for (const r of voteResponses) {
          counts.set(r.chosen_plan_id, (counts.get(r.chosen_plan_id) ?? 0) + 1)
        }

        const winnerId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
        const winnerPlan = plans.find((p) => p.id === winnerId)

        return (
          <motion.div
            key={vote.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-white/60 text-sm font-semibold mb-1">
              {vote.question ?? 'Which plan wins?'}
            </p>
            <p className="text-white/30 text-xs mb-3">
              {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })} · {total} vote{total !== 1 ? 's' : ''}
            </p>

            {vote.plan_ids.map((planId) => {
              const plan = plans.find((p) => p.id === planId)
              if (!plan) return null
              const count = counts.get(planId) ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const isWinner = planId === winnerId

              return (
                <div key={planId} className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-xs font-semibold truncate ${isWinner ? 'text-[#FFD93D]' : 'text-white/50'}`}>
                        {isWinner && '🏆 '}{plan.title}
                      </p>
                      <p className="text-white/40 text-xs ml-2 shrink-0">{pct}%</p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isWinner ? '#FFD93D' : 'rgba(168,85,247,0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {winnerPlan && (
              <p className="text-white/30 text-xs mt-2">
                Winner: <span className="text-[#FFD93D] font-semibold">{winnerPlan.title}</span>
              </p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
