import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowRight, Hash } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateCode } from '../lib/utils'
import { ProgressBar } from '../components/ProgressBar'

type HomeState = 'idle' | 'create' | 'join'

export function HomePage() {
  const navigate = useNavigate()
  const [uiState, setUiState] = useState<HomeState>('idle')
  const [sessionName, setSessionName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!sessionName.trim()) { toast.error('Give your session a name first'); return }
    setLoading(true)
    try {
      const code = generateCode()
      console.log('[HomePage] creating session with code:', code)
      const { data: sessionData, error: sErr } = await supabase
        .from('sessions')
        .insert({ name: sessionName.trim(), code })
        .select()
        .single()

      if (sErr) { console.error('[HomePage] session insert error:', sErr); throw sErr }
      if (!sessionData) { throw new Error('Session insert returned no data') }

      console.log('[HomePage] navigating to /session/' + code)
      navigate(`/session/${code}`)
    } catch (err) {
      console.error('[HomePage] create failed:', err)
      toast.error('Could not create session — is the Supabase schema set up?')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (joinCode.length < 6) { toast.error('Enter the full 6-character code'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id')
        .eq('code', joinCode.toUpperCase())
        .maybeSingle()

      if (error) { console.error('[HomePage] join lookup error:', error); throw error }
      if (!data) { toast.error("Session not found — check the code"); return }

      navigate(`/session/${joinCode.toUpperCase()}`)
    } catch (err) {
      console.error('[HomePage] join failed:', err)
      toast.error('Could not join session')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-5 py-4 rounded-2xl text-white text-base placeholder-white/30 focus:outline-none transition-all'
  const inputStyle = {
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(168,85,247,0.3)',
  }

  return (
    <>
      <ProgressBar loading={loading} />

      {/* Mesh background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="blob-a absolute -top-40 -left-20 w-80 h-80 rounded-full" style={{ background: 'rgba(168,85,247,0.18)', filter: 'blur(80px)' }} />
        <div className="blob-b absolute top-1/3 -right-20 w-72 h-72 rounded-full" style={{ background: 'rgba(255,107,107,0.14)', filter: 'blur(80px)' }} />
        <div className="blob-c absolute -bottom-20 left-1/4 w-64 h-64 rounded-full" style={{ background: 'rgba(255,217,61,0.08)', filter: 'blur(70px)' }} />
      </div>

      <div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="logo-shimmer text-5xl font-black tracking-tight">Shared Planz</h1>
          <p className="text-white/50 text-base mt-3">Stop debating. Start doing. 🎉</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-sm flex flex-col gap-3"
        >
          <AnimatePresence mode="wait">
            {uiState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUiState('create')}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 min-h-[56px]"
                  style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
                >
                  Start a Plan Party 🚀
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUiState('join')}
                  className="w-full py-4 rounded-2xl font-bold text-white/80 text-base min-h-[56px]"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(168,85,247,0.2)' }}
                >
                  Jump In 🙌
                </motion.button>
              </motion.div>
            )}

            {uiState === 'create' && (
              <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3">
                <p className="text-white/60 text-sm text-center mb-1">Who are you planning with? 🫂</p>
                <input
                  type="text"
                  placeholder="e.g. The Boys 🔥, Date Night 💕, Family Trip 🌴"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                  className={inputClass}
                  style={inputStyle}
                  autoFocus
                  maxLength={60}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { void handleCreate() }}
                  disabled={loading || !sessionName.trim()}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50 min-h-[56px]"
                  style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
                >
                  {loading
                    ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <>Create Group 🚀 <ArrowRight size={18} /></>}
                </motion.button>
                <button onClick={() => setUiState('idle')} className="text-white/40 text-sm text-center py-2">Back</button>
              </motion.div>
            )}

            {uiState === 'join' && (
              <motion.div key="join" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3">
                <p className="text-white/60 text-sm text-center mb-1">Got a code? Let's go!</p>
                <div className="relative">
                  <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && void handleJoin()}
                    className={`${inputClass} pl-11 tracking-[0.25em] uppercase font-mono`}
                    style={inputStyle}
                    autoFocus
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { void handleJoin() }}
                  disabled={loading || joinCode.length < 6}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50 min-h-[56px]"
                  style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
                >
                  {loading
                    ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <>Jump In 🙌 <ArrowRight size={18} /></>}
                </motion.button>
                <button onClick={() => setUiState('idle')} className="text-white/40 text-sm text-center py-2">Back</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}
