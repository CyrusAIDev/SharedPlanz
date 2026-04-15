import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useSessionContext } from '../context/SessionContext'
import { AvailabilityCalendar } from './AvailabilityCalendar'

interface PeopleTabProps {
  username: string
  userEmoji: string
}

export function PeopleTab({ username, userEmoji }: PeopleTabProps) {
  const { session, participants, plans, ratings, availability } = useSessionContext()
  const [availOpen, setAvailOpen] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      {/* Participants */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
          {participants.length} Participant{participants.length !== 1 ? 's' : ''}
        </p>
        <div className="flex flex-col gap-2.5">
          {participants.length === 0 ? (
            <div className="text-center py-10 text-white/30 text-sm">Nobody here yet — share the code!</div>
          ) : (
            participants.map((p, i) => {
              const ratedCount = plans.filter((plan) =>
                ratings.some((r) => r.plan_id === plan.id && r.participant_name === p.name)
              ).length

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-3.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
                    >
                      {p.emoji ?? p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{p.name}</p>
                      <p className="text-white/30 text-xs">
                        Joined {formatDistanceToNow(new Date(p.joined_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-xs font-medium">{ratedCount}/{plans.length} rated</p>
                    <div className="flex gap-1 mt-1.5 justify-end">
                      {plans.map((plan) => {
                        const rated = ratings.some((r) => r.plan_id === plan.id && r.participant_name === p.name)
                        return (
                          <div key={plan.id} className="w-2 h-2 rounded-full"
                            style={{ background: rated ? '#A855F7' : 'rgba(255,255,255,0.12)' }} />
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Availability calendar (collapsible) */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setAvailOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="text-white font-semibold text-sm">Availability</span>
          </div>
          {availOpen ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
        </motion.button>

        {availOpen && (
          <div className="px-4 pb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <AvailabilityCalendar
              sessionId={session.id}
              username={username}
              userEmoji={userEmoji}
              availability={availability}
            />
          </div>
        )}
      </div>
    </div>
  )
}
