import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Vote, VoteResponse } from '../types'

export function useVotes(sessionId: string | undefined) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [voteResponses, setVoteResponses] = useState<VoteResponse[]>([])

  useEffect(() => {
    if (!sessionId) return

    async function fetchVotes() {
      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
      if (votesData) setVotes(votesData as Vote[])
    }

    async function fetchResponses() {
      const { data: votesData } = await supabase
        .from('votes')
        .select('id')
        .eq('session_id', sessionId)
      if (!votesData || votesData.length === 0) return
      const voteIds = votesData.map((v: { id: string }) => v.id)
      const { data: responsesData } = await supabase
        .from('vote_responses')
        .select('*')
        .in('vote_id', voteIds)
      if (responsesData) setVoteResponses(responsesData as VoteResponse[])
    }

    void fetchVotes()
    void fetchResponses()

    const voteSub = supabase
      .channel(`votes:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes', filter: `session_id=eq.${sessionId}` },
        () => { void fetchVotes() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vote_responses' },
        () => { void fetchResponses() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(voteSub) }
  }, [sessionId])

  return { votes, voteResponses }
}
