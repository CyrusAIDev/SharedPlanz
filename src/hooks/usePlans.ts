import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Plan } from '../types'

export function usePlans(sessionId: string | undefined) {
  const [plans, setPlans] = useState<Plan[]>([])

  useEffect(() => {
    if (!sessionId) return

    async function fetchPlans() {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      if (data) setPlans(data as Plan[])
    }

    void fetchPlans()

    const sub = supabase
      .channel(`plans:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans', filter: `session_id=eq.${sessionId}` },
        () => { void fetchPlans() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(sub) }
  }, [sessionId])

  return plans
}
