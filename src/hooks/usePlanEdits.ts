import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { PlanEdit } from '../types'

export function usePlanEdits(sessionId: string | undefined, currentUsername: string) {
  const [planEdits, setPlanEdits] = useState<PlanEdit[]>([])
  const usernameRef = useRef(currentUsername)
  usernameRef.current = currentUsername

  useEffect(() => {
    if (!sessionId) return

    async function fetchEdits() {
      const { data } = await supabase
        .from('plan_edits')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      if (data) setPlanEdits(data as PlanEdit[])
    }

    void fetchEdits()

    const sub = supabase
      .channel(`plan_edits:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'plan_edits', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const edit = payload.new as PlanEdit
          setPlanEdits((prev) => [...prev, edit])
          if (edit.edited_by !== usernameRef.current) {
            const emoji = edit.edited_by_emoji ?? ''
            toast(`${emoji} ${edit.edited_by} updated '${edit.previous_title ?? 'a plan'}' ✏️`)
          }
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(sub) }
  }, [sessionId])

  return planEdits
}
