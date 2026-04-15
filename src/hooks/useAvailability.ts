import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Availability } from '../types'

export function useAvailability(sessionId: string | undefined) {
  const [availability, setAvailability] = useState<Availability[]>([])

  useEffect(() => {
    if (!sessionId) return

    async function fetchAvailability() {
      const { data } = await supabase
        .from('availability')
        .select('*')
        .eq('session_id', sessionId)
      if (data) setAvailability(data as Availability[])
    }

    void fetchAvailability()

    const sub = supabase
      .channel(`availability:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability', filter: `session_id=eq.${sessionId}` },
        () => { void fetchAvailability() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(sub) }
  }, [sessionId])

  return availability
}
