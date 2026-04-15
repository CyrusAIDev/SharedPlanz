import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Rating } from '../types'

export function useRatings(planIds: string[]) {
  const [ratings, setRatings] = useState<Rating[]>([])

  useEffect(() => {
    if (planIds.length === 0) return

    async function fetchRatings() {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .in('plan_id', planIds)
      if (data) setRatings(data as Rating[])
    }

    void fetchRatings()

    // Subscribe to any rating change for these plan IDs
    const sub = supabase
      .channel(`ratings:${planIds.join(',')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        () => { void fetchRatings() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(sub) }
  }, [planIds.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  return ratings
}
