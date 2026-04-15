import { format, parseISO } from 'date-fns'
import type { Plan, Rating, RankedPlan, Identity } from '../types'

export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ── Identity helpers ──────────────────────────────────────────────────────────

export function getIdentity(): Identity | null {
  const name = localStorage.getItem('sp_username')
  const emoji = localStorage.getItem('sp_emoji')
  const secret = localStorage.getItem('sp_secret')
  if (!name || !emoji || !secret) return null
  return { name, emoji, secret }
}

export function saveIdentity(name: string, emoji: string, secret: string): void {
  localStorage.setItem('sp_username', name)
  localStorage.setItem('sp_emoji', emoji)
  localStorage.setItem('sp_secret', secret)
}

export function getUserName(): string {
  return localStorage.getItem('sp_username') ?? ''
}

export function getJoinedSessions(): string[] {
  try {
    const raw = localStorage.getItem('sp_sessions')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function addJoinedSession(code: string): void {
  const sessions = getJoinedSessions()
  if (!sessions.includes(code)) {
    localStorage.setItem('sp_sessions', JSON.stringify([...sessions, code]))
  }
}

// ── Date display ──────────────────────────────────────────────────────────────

export function formatPlanDate(plan: Plan): string | null {
  try {
    switch (plan.date_type) {
      case 'none':
        return null
      case 'single':
        if (!plan.date_single) return null
        return format(parseISO(plan.date_single), "EEE MMM d · h:mm a")
      case 'range':
        if (!plan.date_range_start || !plan.date_range_end) return null
        return `${format(parseISO(plan.date_range_start), 'MMM d')}–${format(parseISO(plan.date_range_end), 'MMM d')}`
      case 'multi':
        if (!plan.date_multi || plan.date_multi.length === 0) return null
        return plan.date_multi.map((d) => format(parseISO(d), 'MMM d')).join(', ')
      default:
        return null
    }
  } catch {
    return null
  }
}

// ── Ranking ────────────────────────────────────────────────────────────────────

function getEarliestDate(plan: Plan): Date | null {
  try {
    switch (plan.date_type) {
      case 'single':
        return plan.date_single ? parseISO(plan.date_single) : null
      case 'range':
        return plan.date_range_start ? parseISO(plan.date_range_start) : null
      case 'multi': {
        if (!plan.date_multi || plan.date_multi.length === 0) return null
        const dates = plan.date_multi.map((d) => parseISO(d)).sort((a, b) => a.getTime() - b.getTime())
        return dates[0] ?? null
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

export function computeRankedPlans(plans: Plan[], ratings: Rating[]): RankedPlan[] {
  const M = 3
  const now = Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  const ratingsByPlan = new Map<string, Rating[]>()
  for (const plan of plans) ratingsByPlan.set(plan.id, [])
  for (const rating of ratings) {
    const existing = ratingsByPlan.get(rating.plan_id)
    if (existing) existing.push(rating)
  }

  const planMeans = new Map<string, number>()
  for (const [planId, planRatings] of ratingsByPlan.entries()) {
    if (planRatings.length === 0) {
      planMeans.set(planId, 0)
    } else {
      const sum = planRatings.reduce((acc, r) => acc + r.score, 0)
      planMeans.set(planId, sum / planRatings.length)
    }
  }

  const allRatedMeans = [...planMeans.values()].filter((m) => m > 0)
  const C = allRatedMeans.length > 0
    ? allRatedMeans.reduce((a, b) => a + b, 0) / allRatedMeans.length
    : 3

  return plans
    .map((plan) => {
      const planRatings = ratingsByPlan.get(plan.id) ?? []
      const v = planRatings.length
      const R = planMeans.get(plan.id) ?? 0
      const bayesianScore = v > 0
        ? (v / (v + M)) * R + (M / (v + M)) * C
        : 0

      let timeScore = 0
      const earliest = getEarliestDate(plan)
      if (earliest) {
        const msAway = earliest.getTime() - now
        if (msAway >= 0 && msAway <= thirtyDaysMs) {
          timeScore = 1 - msAway / thirtyDaysMs
        }
      }

      const rankScore = 0.7 * bayesianScore + 0.3 * timeScore * 5

      return { ...plan, ratings: planRatings, bayesianScore, rankScore, averageScore: R, voteCount: v }
    })
    .sort((a, b) => b.rankScore - a.rankScore)
}

// ── Clipboard ─────────────────────────────────────────────────────────────────

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  return new Promise((resolve) => {
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    resolve()
  })
}
