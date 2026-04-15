import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Participant } from '../types'

export function useParticipants(sessionId: string | undefined) {
  const [participants, setParticipants] = useState<Participant[]>([])

  useEffect(() => {
    if (!sessionId) return

    async function fetchParticipants() {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true })
      if (data) setParticipants(data as Participant[])
    }

    void fetchParticipants()

    const sub = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
        () => { void fetchParticipants() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(sub) }
  }, [sessionId])

  return participants
}
