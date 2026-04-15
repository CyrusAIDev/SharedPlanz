import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { usePlans } from '../hooks/usePlans'
import { useRatings } from '../hooks/useRatings'
import { useParticipants } from '../hooks/useParticipants'
import { useVotes } from '../hooks/useVotes'
import { useAvailability } from '../hooks/useAvailability'
import { computeRankedPlans } from '../lib/utils'
import type { Session, Participant, Plan, Rating, RankedPlan, Vote, VoteResponse, Availability } from '../types'

interface SessionContextValue {
  session: Session
  participants: Participant[]
  plans: Plan[]
  ratings: Rating[]
  rankedPlans: RankedPlan[]
  votes: Vote[]
  voteResponses: VoteResponse[]
  availability: Availability[]
}

const SessionContext = createContext<SessionContextValue | null>(null)

interface SessionProviderProps {
  session: Session
  children: ReactNode
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  const participants = useParticipants(session.id)
  const plans = usePlans(session.id)
  const planIds = useMemo(() => plans.map((p) => p.id), [plans])
  const ratings = useRatings(planIds)
  const rankedPlans = useMemo(() => computeRankedPlans(plans, ratings), [plans, ratings])
  const { votes, voteResponses } = useVotes(session.id)
  const availability = useAvailability(session.id)

  const value = useMemo(
    () => ({ session, participants, plans, ratings, rankedPlans, votes, voteResponses, availability }),
    [session, participants, plans, ratings, rankedPlans, votes, voteResponses, availability]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider')
  return ctx
}
