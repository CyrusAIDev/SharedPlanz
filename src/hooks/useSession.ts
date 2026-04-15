import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '../types'

export function useSession(code: string) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      setLoading(false)
      return
    }

    async function fetchSession() {
      try {
        setLoading(true)
        console.log('[useSession] fetching code:', code)
        const { data, error: err } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', code.toUpperCase())
          .single()

        if (err) {
          console.error('[useSession] supabase error:', err)
          throw err
        }
        if (!data) {
          console.error('[useSession] no data returned for code:', code)
          throw new Error('No session data returned')
        }
        console.log('[useSession] session loaded:', data)
        setSession(data as Session)
      } catch (err) {
        console.error('[useSession] catch:', err)
        setError(err instanceof Error ? err.message : 'Session not found')
      } finally {
        setLoading(false)
      }
    }

    void fetchSession()
  }, [code])

  return { session, loading, error }
}
