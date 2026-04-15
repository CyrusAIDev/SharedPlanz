import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth,
  addMonths, subMonths, isSameDay, startOfWeek, endOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Availability } from '../types'

interface AvailabilityCalendarProps {
  sessionId: string
  username: string
  userEmoji: string
  availability: Availability[]
}

const PARTICIPANT_COLORS = [
  '#FF6B6B', '#A855F7', '#FFD93D', '#6BCB77', '#3B82F6',
  '#F97316', '#EC4899', '#06B6D4', '#8B5CF6', '#10B981',
]

export function AvailabilityCalendar({ sessionId, username, userEmoji, availability }: AvailabilityCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date())
  const [saving, setSaving] = useState(false)

  const myAvail = availability.find((a) => a.participant_name === username)
  const myFreeDates = myAvail?.free_dates ?? []

  function isMyFree(date: Date) {
    return myFreeDates.includes(format(date, 'yyyy-MM-dd'))
  }

  function getParticipantDots(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availability
      .filter((a) => a.free_dates.includes(dateStr))
      .map((a) => a.participant_name)
  }

  async function toggleDay(date: Date) {
    if (!username || saving) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const newDates = isMyFree(date)
      ? myFreeDates.filter((d) => d !== dateStr)
      : [...myFreeDates, dateStr]

    setSaving(true)
    try {
      await supabase.from('availability').upsert(
        {
          session_id: sessionId,
          participant_name: username,
          participant_emoji: userEmoji,
          free_dates: newDates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,participant_name' }
      )
    } catch (err) {
      console.error('[AvailabilityCalendar] error:', err)
    } finally {
      setSaving(false)
    }
  }

  function renderMonth(baseDate: Date) {
    const monthStart = startOfMonth(baseDate)
    const monthEnd = endOfMonth(baseDate)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

    return (
      <div>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <ChevronLeft size={16} color="rgba(255,255,255,0.6)" />
          </motion.button>
          <p className="text-white font-bold text-sm">{format(baseDate, 'MMMM yyyy')}</p>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
          </motion.button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
            <div key={d} className="text-center text-white/25 text-xs py-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, baseDate)
            const isFree = isMyFree(day)
            const dots = getParticipantDots(day)
            const majority = availability.length > 0 && dots.length >= Math.ceil(availability.length / 2)
            const isToday = isSameDay(day, new Date())

            return (
              <motion.button
                key={day.toISOString()}
                whileTap={{ scale: 0.85 }}
                onClick={() => { void toggleDay(day) }}
                disabled={!inMonth || saving}
                className="flex flex-col items-center justify-start py-1 rounded-lg min-h-[44px] gap-0.5"
                style={{
                  background: isFree ? 'rgba(107,203,119,0.2)' : 'transparent',
                  border: isFree ? '1.5px solid rgba(107,203,119,0.45)' : isToday ? '1.5px solid rgba(168,85,247,0.4)' : '1.5px solid transparent',
                  opacity: inMonth ? 1 : 0.2,
                  boxShadow: majority ? '0 0 10px rgba(107,203,119,0.3)' : 'none',
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: isFree ? '#6BCB77' : isToday ? '#A855F7' : 'rgba(255,255,255,0.7)' }}
                >
                  {format(day, 'd')}
                </span>
                {/* Participant dots */}
                {dots.length > 0 && inMonth && (
                  <div className="flex flex-wrap gap-0.5 justify-center max-w-full px-0.5">
                    {dots.slice(0, 4).map((pName) => {
                      const aIdx = availability.findIndex((a) => a.participant_name === pName)
                      return (
                        <div
                          key={pName}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: PARTICIPANT_COLORS[aIdx % PARTICIPANT_COLORS.length] }}
                          title={pName}
                        />
                      )
                    })}
                    {dots.length > 4 && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
                    )}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {renderMonth(viewDate)}

      {/* Legend */}
      {availability.length > 0 && (
        <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {availability.map((a, idx) => (
            <div key={a.participant_name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: PARTICIPANT_COLORS[idx % PARTICIPANT_COLORS.length] }} />
              <span className="text-white/50 text-xs">{a.participant_emoji ?? ''} {a.participant_name}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-white/25 text-xs mt-3">Tap days to mark yourself as free ✅</p>
    </div>
  )
}
