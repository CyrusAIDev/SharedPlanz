import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { saveIdentity, addJoinedSession } from '../lib/utils'
import { EmojiGrid } from './EmojiGrid'
import type { Identity } from '../types'

const AVATAR_EMOJIS = ['🔥','🎸','🌸','⚡','🎯','🍕','🎬','🌴','🎉','🦋','🐻','🎮','🏄','🎨','🦄','🌈','🍦','🎺','🏆','🌙']
const SECRET_EMOJIS = ['🦊','🐬','🌵','🎪','🍉','🔮','🎲','🦁','🌋','⭐']

type Step = 'name' | 'emoji' | 'secret' | 'verify'

interface ExistingParticipant { emoji: string | null; secret_emoji: string | null }

interface IdentityFlowProps {
  sessionId: string
  sessionName: string
  sessionCode: string
  isInvited: boolean
  onComplete: (identity: Identity) => void
}

const slideVariants = {
  enter: { x: '100%', opacity: 0 },
  center: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
  exit: { x: '-60%', opacity: 0, transition: { duration: 0.2 } },
}

const btnClass =
  'w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]'
const inputClass =
  'w-full px-5 py-4 rounded-2xl text-white text-base placeholder-white/30 focus:outline-none transition-all'

export function IdentityFlow({ sessionId, sessionName, sessionCode, isInvited, onComplete }: IdentityFlowProps) {
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [secret, setSecret] = useState('')
  const [existing, setExisting] = useState<ExistingParticipant | null>(null)
  const [verifyPick, setVerifyPick] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [loading, setLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const shakeRef = useRef<HTMLDivElement>(null)

  const stepIndex = step === 'name' ? 0 : step === 'emoji' ? 1 : step === 'secret' ? 2 : -1

  async function handleNameNext() {
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Tell us your name first!'); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('participants')
        .select('emoji, secret_emoji')
        .eq('session_id', sessionId)
        .eq('name', trimmed)
        .maybeSingle()

      if (data && data.secret_emoji) {
        setExisting(data as ExistingParticipant)
        setStep('verify')
      } else {
        setStep('emoji')
      }
    } catch (err) {
      console.error('[IdentityFlow] name check error:', err)
      setStep('emoji')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    if (!avatar) { toast.error('Pick your vibe!'); return }
    if (!secret) { toast.error('Pick your magic key!'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('participants').upsert(
        { session_id: sessionId, name: name.trim(), emoji: avatar, secret_emoji: secret },
        { onConflict: 'session_id,name' }
      )
      if (error) {
        console.error('[IdentityFlow] upsert error:', error)
        await supabase.from('participants').insert(
          { session_id: sessionId, name: name.trim(), emoji: avatar, secret_emoji: secret }
        )
      }
      saveIdentity(name.trim(), avatar, secret)
      addJoinedSession(sessionCode)
      onComplete({ name: name.trim(), emoji: avatar, secret })
    } catch (err) {
      console.error('[IdentityFlow] complete error:', err)
      toast.error('Something went wrong — try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!verifyPick) { toast.error('Tap your magic key!'); return }
    if (verifyPick === existing?.secret_emoji) {
      const restoredEmoji = existing.emoji ?? '🎉'
      saveIdentity(name.trim(), restoredEmoji, verifyPick)
      addJoinedSession(sessionCode)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FF6B6B','#A855F7','#FFD93D'] })
      toast.success(`You're back! ${restoredEmoji} ${name.trim()} 🎉`)
      onComplete({ name: name.trim(), emoji: restoredEmoji, secret: verifyPick })
    } else {
      const next = attempts + 1
      setAttempts(next)
      setVerifyPick('')

      if (next >= 3) {
        setVerifyError("3 strikes! Join with a different name instead.")
        // Broadcast to session channel
        try {
          await supabase.channel(`session:${sessionId}`)
            .send({
              type: 'broadcast',
              event: 'identity_fail',
              payload: { name: name.trim(), attempts: next },
            })
        } catch (err) {
          console.error('[IdentityFlow] broadcast error:', err)
        }
      } else {
        setVerifyError(`Hmm, that's not right! 🤔 Try again.`)
      }

      if (shakeRef.current) {
        shakeRef.current.classList.remove('shake')
        void shakeRef.current.offsetWidth
        shakeRef.current.classList.add('shake')
      }
    }
  }

  function resetToNewName() {
    setStep('name')
    setExisting(null)
    setAttempts(0)
    setVerifyError('')
    setVerifyPick('')
    setName('')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: '#1A1025' }}>
      {/* Animated mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-a absolute -top-32 -left-32 w-72 h-72 rounded-full" style={{ background: 'rgba(168,85,247,0.2)', filter: 'blur(70px)' }} />
        <div className="blob-b absolute top-1/2 -right-24 w-80 h-80 rounded-full" style={{ background: 'rgba(255,107,107,0.15)', filter: 'blur(70px)' }} />
        <div className="blob-c absolute -bottom-20 left-1/4 w-60 h-60 rounded-full" style={{ background: 'rgba(255,217,61,0.1)', filter: 'blur(60px)' }} />
      </div>

      {/* Header: back button + progress dots */}
      <div
        className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        {step !== 'name' && step !== 'verify' ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setStep(step === 'secret' ? 'emoji' : 'name')}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <ChevronLeft size={20} color="white" />
          </motion.button>
        ) : (
          <div className="w-10" />
        )}

        {stepIndex >= 0 && (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ width: i === stepIndex ? 24 : 8, opacity: i <= stepIndex ? 1 : 0.3 }}
                className="h-2 rounded-full"
                style={{ background: '#A855F7' }}
              />
            ))}
          </div>
        )}
        <div className="w-10" />
      </div>

      {/* Step content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'name' && (
            <motion.div key="name" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col flex-1 pt-6">
              <div className="mb-8">
                <h1 className="logo-shimmer text-4xl font-black tracking-tight mb-1">Shared Planz</h1>
                <p className="text-white/50 text-base mt-2">
                  {isInvited ? `You're invited to "${sessionName}" 🎉` : "Let's set up your identity"}
                </p>
              </div>
              <h2 className="text-white font-bold text-2xl mb-2">What do people call you?</h2>
              <p className="text-white/40 text-sm mb-5">This is how you'll appear to your crew</p>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleNameNext()}
                className={inputClass}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(168,85,247,0.3)' }}
                autoFocus
                maxLength={30}
                autoCapitalize="words"
                autoCorrect="off"
              />
              <div className="flex-1" />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { void handleNameNext() }}
                disabled={loading || !name.trim()}
                className={btnClass}
                style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)', marginBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
              >
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Next <ArrowRight size={18} /></>}
              </motion.button>
            </motion.div>
          )}

          {step === 'emoji' && (
            <motion.div key="emoji" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col flex-1 pt-6 pb-safe">
              <h2 className="text-white font-bold text-2xl mb-1">Pick your vibe ✨</h2>
              <p className="text-white/40 text-sm mb-5">This is your avatar in the session</p>
              <EmojiGrid emojis={AVATAR_EMOJIS} selected={avatar} onSelect={setAvatar} columns={5} cellSize={60} />
              <div className="flex-1" />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (avatar) { setStep('secret') } else { toast.error('Pick your vibe first!') } }}
                disabled={!avatar}
                className={btnClass}
                style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)', marginBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
              >
                Next <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {step === 'secret' && (
            <motion.div key="secret" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col flex-1 pt-6">
              <h2 className="text-white font-bold text-2xl mb-1">Your magic key 🔐</h2>
              <p className="text-white/50 text-sm mb-1">Remember this one — it lets you get back in on any device</p>
              <p className="text-white/30 text-xs mb-5">Pick one from these 10 secret emojis</p>
              <EmojiGrid emojis={SECRET_EMOJIS} selected={secret} onSelect={setSecret} columns={5} cellSize={60} />
              <div className="flex-1" />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { void handleComplete() }}
                disabled={loading || !secret}
                className={btnClass}
                style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)', marginBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
              >
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : 'Jump In 🚀'}
              </motion.button>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div key="verify" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col flex-1 pt-6">
              <h2 className="text-white font-bold text-2xl mb-1">Welcome back! 👋</h2>
              <p className="text-white/50 text-sm mb-5">Hey <strong className="text-white">{name}</strong> — prove it's you with your magic key 🔐</p>

              <div ref={shakeRef}>
                <EmojiGrid emojis={SECRET_EMOJIS} selected={verifyPick} onSelect={setVerifyPick} columns={5} cellSize={60} />
              </div>

              {verifyError && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm mt-4"
                  style={{ color: '#FF6B6B' }}
                >
                  {verifyError}
                </motion.p>
              )}

              <div className="flex-1" />

              {attempts >= 3 ? (
                <div className="flex flex-col gap-3" style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
                  <p className="text-white/40 text-sm text-center">No worries! Join with a different name instead.</p>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={resetToNewName} className={btnClass} style={{ background: 'rgba(255,255,255,0.1)' }}>
                    Try a different name
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { void handleVerify() }}
                  disabled={!verifyPick}
                  className={btnClass}
                  style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)', marginBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
                >
                  That's my key 🔑
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
