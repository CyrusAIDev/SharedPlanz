import { useRef, useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { DateTypeSelector } from './DateTypeSelector'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import type { DateType } from '../types'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameMonth, addMonths, isSameDay, startOfWeek, endOfWeek,
  parse,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'

interface AddPlanSheetProps {
  open: boolean
  onClose: () => void
  sessionId: string
  username: string
  userEmoji: string
}

export function AddPlanSheet({ open, onClose, sessionId, username, userEmoji }: AddPlanSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateType, setDateType] = useState<DateType>('none')
  const [dateSingle, setDateSingle] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [multiDates, setMultiDates] = useState<string[]>([])
  const [calViewDate, setCalViewDate] = useState(new Date())
  const [loading, setLoading] = useState(false)

  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)
  const rangeStartRef = useRef<HTMLInputElement>(null)
  const rangeEndRef = useRef<HTMLInputElement>(null)

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(168,85,247,0.2)',
    fontSize: '16px',
  }
  const inputClass =
    'w-full px-4 py-3.5 rounded-xl text-white text-base placeholder-white/30 focus:outline-none transition-all'

  function formatDisplayDate(iso: string) {
    if (!iso) return null
    try {
      return format(parse(iso, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')
    } catch {
      return iso
    }
  }

  function formatDisplayTime(t: string) {
    if (!t) return null
    try {
      const [h, m] = t.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
    } catch {
      return t
    }
  }

  // Tappable styled box that triggers a hidden input
  function TapField({
    value,
    placeholder,
    icon,
    onClick,
    disabled = false,
  }: {
    value: string | null
    placeholder: string
    icon: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }) {
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer select-none transition-all"
        style={{
          ...inputStyle,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ color: 'rgba(168,85,247,0.7)', flexShrink: 0 }}>{icon}</span>
        <span
          className="text-base truncate"
          style={{ color: value ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}
        >
          {value ?? placeholder}
        </span>
      </div>
    )
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setDateType('none')
    setDateSingle('')
    setTimeInput('')
    setRangeStart('')
    setRangeEnd('')
    setMultiDates([])
    setCalViewDate(new Date())
  }

  function toggleMultiDate(date: Date) {
    const iso = format(date, 'yyyy-MM-dd')
    setMultiDates((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]
    )
  }

  function renderMultiCalendar() {
    const monthStart = startOfMonth(calViewDate)
    const monthEnd = endOfMonth(calViewDate)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
    const today = new Date()

    return (
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(168,85,247,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setCalViewDate((d) => addMonths(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <ChevronLeft size={16} color="rgba(255,255,255,0.6)" />
          </motion.button>
          <p className="text-white font-bold text-sm">{format(calViewDate, 'MMMM yyyy')}</p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setCalViewDate((d) => addMonths(d, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
          </motion.button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center text-white/25 text-xs py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, calViewDate)
            const iso = format(day, 'yyyy-MM-dd')
            const selected = multiDates.includes(iso)
            const isToday = isSameDay(day, today)

            return (
              <motion.button
                key={day.toISOString()}
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={() => inMonth && toggleMultiDate(day)}
                disabled={!inMonth}
                className="flex items-center justify-center rounded-lg min-h-[36px]"
                style={{
                  background: selected ? 'rgba(255,107,107,0.25)' : 'transparent',
                  border: selected
                    ? '1.5px solid #FF6B6B'
                    : isToday
                    ? '1.5px solid rgba(168,85,247,0.4)'
                    : '1.5px solid transparent',
                  opacity: inMonth ? 1 : 0.2,
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: selected ? '#FF6B6B' : isToday ? '#A855F7' : 'rgba(255,255,255,0.7)' }}
                >
                  {format(day, 'd')}
                </span>
              </motion.button>
            )
          })}
        </div>

        {multiDates.length > 0 && (
          <p className="text-white/40 text-xs mt-2 text-center">
            {multiDates.length} day{multiDates.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>
    )
  }

  function buildPayload() {
    const base = {
      session_id: sessionId,
      added_by: username,
      added_by_emoji: userEmoji || '✨',
      title: title.trim(),
      description: description.trim() || null,
      date_type: dateType,
      date_single: null as string | null,
      date_range_start: null as string | null,
      date_range_end: null as string | null,
      date_multi: null as string[] | null,
    }

    try {
      if (dateType === 'single' && dateSingle) {
        base.date_single = timeInput ? `${dateSingle}T${timeInput}:00` : `${dateSingle}T00:00:00`
      } else if (dateType === 'range' && rangeStart && rangeEnd) {
        base.date_range_start = `${rangeStart}T00:00:00`
        base.date_range_end = `${rangeEnd}T00:00:00`
      } else if (dateType === 'multi' && multiDates.length > 0) {
        base.date_multi = multiDates
      }
    } catch {
      // ignore date parsing issues
    }

    return base
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error("What's the idea? Give it a title!"); return }
    if (!username) { toast.error('Identity not found — go back home'); return }
    setLoading(true)
    try {
      const payload = buildPayload()
      const { error } = await supabase.from('plans').insert(payload)
      if (error) throw error
      toast.success('Plan added! 🎉')
      resetForm()
      onClose()
    } catch (err) {
      console.error('[AddPlanSheet] error:', err)
      console.error('[AddPlanSheet] full error:', JSON.stringify(err))
      toast.error('Could not add plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Drop an idea 💡">
      <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-3 mt-2">
        <input
          type="text"
          placeholder="What's the idea? (be creative!)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          style={inputStyle}
          autoFocus
          maxLength={100}
        />
        <textarea
          placeholder="More details... (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} resize-none h-20`}
          style={inputStyle}
          maxLength={300}
        />

        <p className="text-white/35 text-xs uppercase tracking-widest mt-1">When?</p>
        <DateTypeSelector value={dateType} onChange={setDateType} />

        {dateType === 'single' && (
          <div className="flex gap-2">
            {/* Tappable date box */}
            <TapField
              value={formatDisplayDate(dateSingle)}
              placeholder="Tap to pick date"
              icon={<Calendar size={16} />}
              onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
            />
            <input
              ref={dateInputRef}
              type="date"
              value={dateSingle}
              onChange={(e) => setDateSingle(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* Tappable time box */}
            <TapField
              value={formatDisplayTime(timeInput)}
              placeholder="Tap to pick time"
              icon={<Clock size={16} />}
              onClick={() => timeInputRef.current?.showPicker?.() ?? timeInputRef.current?.click()}
              disabled={!dateSingle}
            />
            <input
              ref={timeInputRef}
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              disabled={!dateSingle}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        )}

        {dateType === 'range' && (
          <div className="flex gap-2">
            {/* Tappable range start */}
            <TapField
              value={formatDisplayDate(rangeStart)}
              placeholder="Start date"
              icon={<Calendar size={16} />}
              onClick={() => rangeStartRef.current?.showPicker?.() ?? rangeStartRef.current?.click()}
            />
            <input
              ref={rangeStartRef}
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* Tappable range end */}
            <TapField
              value={formatDisplayDate(rangeEnd)}
              placeholder="End date"
              icon={<Calendar size={16} />}
              onClick={() => rangeEndRef.current?.showPicker?.() ?? rangeEndRef.current?.click()}
            />
            <input
              ref={rangeEndRef}
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        )}

        {dateType === 'multi' && renderMultiCalendar()}

        <motion.button
          type="submit"
          disabled={loading || !title.trim()}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 100%)' }}
        >
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : 'Add Plan 🚀'}
        </motion.button>
      </form>
    </BottomSheet>
  )
}
