import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { ChevronLeft, Users } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { SessionProvider, useSessionContext } from '../context/SessionContext'
import { IdentityFlow } from '../components/IdentityFlow'
import { PlansTab } from '../components/PlansTab'
import { DecideTab } from '../components/DecideTab'
import { PeopleTab } from '../components/PeopleTab'
import { TabBar } from '../components/TabBar'
import { ProgressBar } from '../components/ProgressBar'
import { ShareSheet } from '../components/ShareSheet'
import { VoteModal } from '../components/VoteModal'
import { getIdentity, saveIdentity, addJoinedSession, getJoinedSessions } from '../lib/utils'
import { supabase } from '../lib/supabase'
import type { Identity, TabName } from '../types'

function SessionPageInner() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, loading, error } = useSession(code ?? '')

  const [identity, setIdentity] = useState<Identity | null>(null)
  const [identityReady, setIdentityReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabName>('plans')
  const [shareOpen, setShareOpen] = useState(false)

  // After session loads, resolve identity
  useEffect(() => {
    if (!session) return

    const stored = getIdentity()
    const joined = getJoinedSessions()

    if (stored && joined.includes(session.code)) {
      setIdentity(stored)
      setIdentityReady(true)
      toast.success(`Welcome back ${stored.emoji} ${stored.name}! 👋`, { duration: 2000 })
      void supabase.from('participants').upsert(
        { session_id: session.id, name: stored.name, emoji: stored.emoji, secret_emoji: stored.secret },
        { onConflict: 'session_id,name' }
      ).then(({ error: e }) => { if (e) console.error('[SessionPage] auto-join upsert error:', e) })
    } else if (stored && !joined.includes(session.code)) {
      addJoinedSession(session.code)
      setIdentity(stored)
      setIdentityReady(true)
      void supabase.from('participants').upsert(
        { session_id: session.id, name: stored.name, emoji: stored.emoji, secret_emoji: stored.secret },
        { onConflict: 'session_id,name' }
      ).then(({ error: e }) => { if (e) console.error('[SessionPage] new-session upsert error:', e) })
    } else {
      setIdentityReady(false)
    }
  }, [session])

  function handleIdentityComplete(id: Identity) {
    saveIdentity(id.name, id.emoji, id.secret)
    addJoinedSession(session!.code)
    setIdentity(id)
    setIdentityReady(true)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-5 text-center" style={{ background: '#1A1025' }}>
        <div className="text-6xl">😕</div>
        <div>
          <p className="text-white font-bold text-xl">Session not found</p>
          <p className="text-white/50 text-sm mt-2">"{code}" didn't match any session</p>
          {error && <p className="text-red-400/60 text-xs mt-2 font-mono break-all">{error}</p>}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/')}
          className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}>
          Go Home
        </motion.button>
      </div>
    )
  }

  // ── Identity flow overlay ──────────────────────────────────────────────────
  if (!identityReady && !getIdentity()) {
    return (
      <IdentityFlow
        sessionId={session.id}
        sessionName={session.name}
        sessionCode={session.code}
        isInvited={true}
        onComplete={handleIdentityComplete}
      />
    )
  }

  // ── Session content ────────────────────────────────────────────────────────
  return (
    <>
      <SessionProvider session={session}>
        <SessionContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          identity={identity}
          onShare={() => setShareOpen(true)}
          onBack={() => navigate('/')}
        />
      </SessionProvider>
      {session && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          sessionName={session.name}
          sessionCode={session.code}
        />
      )}
    </>
  )
}

interface SessionContentProps {
  activeTab: TabName
  setActiveTab: (t: TabName) => void
  identity: Identity | null
  onShare: () => void
  onBack: () => void
}

function SessionContent({ activeTab, setActiveTab, identity, onShare, onBack }: SessionContentProps) {
  const { session, rankedPlans, participants, votes, voteResponses } = useSessionContext()
  const [dismissedVoteIds, setDismissedVoteIds] = useState<string[]>([])

  // Show the most recent active vote that hasn't been dismissed
  const activeVote = votes.find((v) => v.is_active && !dismissedVoteIds.includes(v.id)) ?? null

  function dismissVote(voteId: string) {
    setDismissedVoteIds((prev) => [...prev, voteId])
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1A1025' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
          paddingBottom: '0.75rem',
          background: 'rgba(26,16,37,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168,85,247,0.12)',
        }}
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="text-white/50 p-1 -ml-1">
          <ChevronLeft size={24} />
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {identity?.emoji && <span className="text-lg">{identity.emoji}</span>}
            <h1 className="text-white font-bold text-base truncate">{session.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
          style={{ background: 'rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.9)' }}>
          <Users size={11} />
          <span>{participants.length}</span>
        </div>

        <motion.button whileTap={{ scale: 0.95 }} onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}>
          Invite Crew 🔗
        </motion.button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'plans' && (
              <PlansTab username={identity?.name ?? ''} userEmoji={identity?.emoji ?? ''} />
            )}
            {activeTab === 'decide' && <DecideTab />}
            {activeTab === 'people' && (
              <PeopleTab username={identity?.name ?? ''} userEmoji={identity?.emoji ?? ''} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} planCount={rankedPlans.length} />

      {/* Vote interrupting modal */}
      {activeVote && (
        <VoteModal
          vote={activeVote}
          responses={voteResponses}
          plans={rankedPlans}
          username={identity?.name ?? ''}
          onDismiss={() => dismissVote(activeVote.id)}
        />
      )}
    </div>
  )
}

export function SessionPage() {
  return <SessionPageInner />
}
