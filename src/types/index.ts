export interface Session {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Participant {
  id: string
  session_id: string
  name: string
  emoji: string | null
  secret_emoji: string | null
  joined_at: string
}

export type DateType = 'none' | 'single' | 'range' | 'multi'

export interface Plan {
  id: string
  session_id: string
  added_by: string
  added_by_emoji: string | null
  title: string
  description: string | null
  date_type: DateType
  date_single: string | null
  date_range_start: string | null
  date_range_end: string | null
  date_multi: string[] | null
  created_at: string
}

export interface Rating {
  id: string
  plan_id: string
  participant_name: string
  score: number
}

export interface RankedPlan extends Plan {
  ratings: Rating[]
  bayesianScore: number
  rankScore: number
  averageScore: number
  voteCount: number
}

export interface Vote {
  id: string
  session_id: string
  created_by: string
  question: string | null
  plan_ids: string[]
  is_active: boolean
  created_at: string
}

export interface VoteResponse {
  id: string
  vote_id: string
  participant_name: string
  chosen_plan_id: string
}

export interface Availability {
  id: string
  session_id: string
  participant_name: string
  participant_emoji: string | null
  free_dates: string[]
  updated_at: string
}

export interface Identity {
  name: string
  emoji: string
  secret: string
}

export interface PlanEdit {
  id: string
  plan_id: string
  session_id: string
  edited_by: string
  edited_by_emoji: string | null
  previous_title: string | null
  created_at: string
}

export type TabName = 'plans' | 'decide' | 'people'

export type SortMode = 'top' | 'soonest' | 'voted' | 'newest' | 'unrated'
