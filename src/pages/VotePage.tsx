import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { EmojiGrid } from '../components/EmojiGrid'
import { ProgressBar } from '../components/ProgressBar'
import type { Vote, VoteResponse, Plan } from '../types'

const AVATAR_EMOJIS = ['🔥','🎸','🌸','⚡','🎯','🍕','🎬','🌴','🎉','🦋','🐻','🎮','🏄','🎨','🦄','🌈','🍦','🎺','🏆','🌙']

type Step = 'identity' | 'vote' | 'results'

const btnClass = 'w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]'

export function VotePage() {
  const { voteId } = useParams<{ voteId: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('identity')
  const [loading, setLoading] = useState(true)
  const [vote, setVote] = useState<Vote | null>(null)
  const [votePlans, setVotePlans] = useState<Plan[]>([])
  const [responses, setResponses] = useState<VoteResponse[]>([])
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!voteId) return

    async function load() {
      setLoading(true)
      try {
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('id', voteId)
          .maybeSingle()
        if (!voteData) { setLoading(false); return }
        const v = voteData as Vote
        setVote(v)

        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .in('id', v.plan_ids)
        if (plansData) setVotePlans(plansData as Plan[])

        const { data: responsesData } = await supabase
          .from('vote_responses')
          .select('*')
          .eq('vote_id', voteId)
        if (responsesData) setResponses(responsesData as VoteResponse[])
      } catch (err) {
        console.error('[VotePage] load error:', err)
      } finally {
        setLoading(false)
      }
    }

    void load()

    // Real-time responses
    const sub = supabase
      .channel(`vote-page:${voteId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vote_responses' }, async () => {
        const { data } = await supabase.from('vote_responses').select('*').eq('vote_id', voteId)
        if (data) setResponses(data as VoteResponse[])
      })
      .subscribe()

    return () => { void supabase.removeChannel(sub) }
  }, [voteId])

  async function handleVote(planId: string) {
    if (submitting || !vote || !name.trim()) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('vote_responses').insert({
        vote_id: vote.id,
        participant_name: name.trim(),
        chosen_plan_id: planId,
      })
      if (error) throw error
      setStep('results')
    } catch (err) {
      console.error('[VotePage] vote error:', err)
      toast.error('Could not submit vote — you may have already voted')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <ProgressBar loading={true} />
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1025' }}>
          <div className="w-10 h-10 rounded-full border-2 border-[#A855F7] border-t-transparent animate-spin" />
        </div>
      </>
    )
  }

  if (!vote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-5 text-center" style={{ background: '#1A1025' }}>
        <div className="text-6xl">😕</div>
        <p className="text-white font-bold text-xl">Vote not found</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/')}
          className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}>
          Go Home
        </motion.button>
      </div>
    )
  }

  const totalVotes = responses.length

  function getCount(planId: string) {
    return responses.filter((r) => r.chosen_plan_id === planId).length
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1A1025' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full" style={{ background: 'rgba(168,85,247,0.18)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full" style={{ background: 'rgba(255,107,107,0.12)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>

        <div className="text-center mb-8">
          <h1 className="logo-shimmer text-3xl font-black tracking-tight mb-2">Shared Planz</h1>
          <p className="text-white/40 text-sm">You're invited to vote! 🗳️</p>
        </div>

        {step === 'identity' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-bold text-xl">{vote.question ?? 'Which plan wins?'}</h2>
            <p className="text-white/50 text-sm">Quick — tell us who you are to cast your vote</p>

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoCapitalize="words"
              autoCorrect="off"
              className="w-full px-5 py-4 rounded-2xl text-white text-base placeholder-white/30 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(168,85,247,0.3)', fontSize: '16px' }}
            />

            <p className="text-white/35 text-sm">Pick your avatar</p>
            <EmojiGrid emojis={AVATAR_EMOJIS} selected={avatar} onSelect={setAvatar} columns={5} cellSize={56} />

            <div className="flex-1" />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (!name.trim()) { toast.error('Enter your name first!'); return }
                if (!avatar) { toast.error('Pick an avatar!'); return }
                setStep('vote')
              }}
              disabled={!name.trim() || !avatar}
              className={btnClass}
              style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
            >
              See the Options →
            </motion.button>
          </div>
        )}

        {step === 'vote' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-bold text-xl">{vote.question ?? 'Which plan wins?'}</h2>
            <p className="text-white/40 text-sm">Tap your pick, {name} {avatar}</p>

            {votePlans.map((plan) => (
              <motion.button
                key={plan.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => { void handleVote(plan.id) }}
                disabled={submitting}
                className="p-4 rounded-2xl text-left disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(168,85,247,0.2)' }}
              >
                <p className="text-white font-bold text-base">{plan.title}</p>
                {plan.description && <p className="text-white/45 text-sm mt-1">{plan.description}</p>}
              </motion.button>
            ))}
          </div>
        )}

        {step === 'results' && (
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <p className="text-3xl mb-2">🎉</p>
              <h2 className="text-white font-bold text-xl">Vote submitted!</h2>
              <p className="text-white/40 text-sm mt-1">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''} so far</p>
            </div>

            <h3 className="text-white/60 text-sm font-semibold">{vote.question ?? 'Which plan wins?'}</h3>

            {votePlans.map((plan) => {
              const count = getCount(plan.id)
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              return (
                <div key={plan.id} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">{plan.title}</p>
                    <p className="text-white/60 text-sm">{pct}% ({count})</p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #FF6B6B, #A855F7)' }}
                    />
                  </div>
                </div>
              )
            })}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/')}
              className={btnClass}
              style={{ background: 'rgba(255,255,255,0.08)', marginTop: '1rem' }}
            >
              Create your own session →
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
