import { SpinWheel } from './SpinWheel'
import { VoteResults } from './VoteResults'
import { useSessionContext } from '../context/SessionContext'

export function DecideTab() {
  const { rankedPlans, votes, voteResponses, plans } = useSessionContext()

  if (rankedPlans.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="text-6xl">🎯</div>
        <p className="text-white font-bold text-lg">Time to decide!</p>
        <p className="text-white/40 text-sm">Add at least 2 plans first, then come back here to let fate choose 🎡</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SpinWheel plans={rankedPlans} />
      <VoteResults votes={votes} responses={voteResponses} plans={plans} />
    </div>
  )
}
