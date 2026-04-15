import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Vote } from 'lucide-react'
import { PlanCard } from './PlanCard'
import { AddPlanSheet } from './AddPlanSheet'
import { CreateVoteSheet } from './CreateVoteSheet'
import { SortControl } from './SortControl'
import { RateNudge } from './RateNudge'
import { useSessionContext } from '../context/SessionContext'
import { parseISO } from 'date-fns'
import type { SortMode, RankedPlan } from '../types'

interface PlansTabProps {
  username: string
  userEmoji: string
}

function getEarliestMs(plan: RankedPlan): number {
  try {
    if (plan.date_type === 'single' && plan.date_single) return parseISO(plan.date_single).getTime()
    if (plan.date_type === 'range' && plan.date_range_start) return parseISO(plan.date_range_start).getTime()
    if (plan.date_type === 'multi' && plan.date_multi && plan.date_multi.length > 0) {
      const dates = plan.date_multi.map((d) => parseISO(d).getTime()).sort((a, b) => a - b)
      return dates[0] ?? Infinity
    }
  } catch {
    // ignore
  }
  return Infinity
}

export function PlansTab({ username, userEmoji }: PlansTabProps) {
  const { session, rankedPlans } = useSessionContext()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [voteSheetOpen, setVoteSheetOpen] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('top')

  const unratedCount = rankedPlans.filter(
    (p) => username && !p.ratings.some((r) => r.participant_name === username)
  ).length

  const sortedPlans = useMemo((): RankedPlan[] => {
    const plans = [...rankedPlans]
    switch (sortMode) {
      case 'top':
        return plans // already sorted by rankScore
      case 'soonest': {
        const withDate = plans.filter((p) => p.date_type !== 'none').sort((a, b) => getEarliestMs(a) - getEarliestMs(b))
        const noDate = plans.filter((p) => p.date_type === 'none')
        return [...withDate, ...noDate]
      }
      case 'voted':
        return plans.sort((a, b) => b.voteCount - a.voteCount)
      case 'newest':
        return plans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'unrated':
        return plans.filter((p) => !p.ratings.some((r) => r.participant_name === username))
      default:
        return plans
    }
  }, [rankedPlans, sortMode, username])

  return (
    <div className="relative flex flex-col gap-3 pb-4">
      {rankedPlans.length > 0 && (
        <>
          <SortControl value={sortMode} onChange={setSortMode} />
          {unratedCount > 0 && sortMode !== 'unrated' && (
            <RateNudge count={unratedCount} onTap={() => setSortMode('unrated')} />
          )}
        </>
      )}

      <AnimatePresence mode="popLayout">
        {sortedPlans.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-6xl"
            >
              {sortMode === 'unrated' ? '🎉' : '👀'}
            </motion.div>
            <div>
              {sortMode === 'unrated' ? (
                <>
                  <p className="text-white font-bold text-lg">All rated! 🌟</p>
                  <p className="text-white/40 text-sm mt-1">You've rated every plan — nice!</p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-lg">No plans yet...</p>
                  <p className="text-white/40 text-sm mt-1">drop the first idea!</p>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          sortedPlans.map((plan, idx) => (
            <PlanCard key={plan.id} plan={plan} isTop={idx === 0 && sortMode === 'top'} username={username} rank={idx + 1} />
          ))
        )}
      </AnimatePresence>

      {/* Vote button (only when 2+ plans) */}
      {rankedPlans.length >= 2 && (
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setVoteSheetOpen(true)}
          className="fixed left-5 z-20 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-white text-sm shadow-lg"
          style={{
            background: 'rgba(168,85,247,0.25)',
            border: '1.5px solid rgba(168,85,247,0.45)',
            bottom: `calc(env(safe-area-inset-bottom) + 5.5rem)`,
          }}
        >
          <Vote size={16} />
          Start a Vote 🗳️
        </motion.button>
      )}

      {/* Floating + button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setSheetOpen(true)}
        animate={rankedPlans.length === 0 ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={rankedPlans.length === 0 ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
        className="fixed right-5 z-20 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)',
          boxShadow: '0 4px 24px rgba(255,107,107,0.4)',
          bottom: `calc(env(safe-area-inset-bottom) + 5.5rem)`,
        }}
      >
        <Plus size={28} color="white" strokeWidth={2.5} />
      </motion.button>

      <AddPlanSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sessionId={session.id}
        username={username}
        userEmoji={userEmoji}
      />

      <CreateVoteSheet
        open={voteSheetOpen}
        onClose={() => setVoteSheetOpen(false)}
        sessionId={session.id}
        username={username}
        plans={rankedPlans}
      />
    </div>
  )
}
