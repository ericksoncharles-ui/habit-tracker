import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  Circle,
  PlusCircle,
  Trash2,
  Flame,
  Target,
  CalendarDays,
} from 'lucide-react'

const STORAGE_KEY = 'habit-tracker-data'

const COLORS = [
  { id: 'violet', dot: 'bg-violet-500', ring: 'ring-violet-400', check: 'text-violet-500', light: 'bg-violet-50' },
  { id: 'sky',    dot: 'bg-sky-500',    ring: 'ring-sky-400',    check: 'text-sky-500',    light: 'bg-sky-50'    },
  { id: 'emerald',dot: 'bg-emerald-500',ring: 'ring-emerald-400',check: 'text-emerald-500',light: 'bg-emerald-50'},
  { id: 'amber',  dot: 'bg-amber-500',  ring: 'ring-amber-400',  check: 'text-amber-500',  light: 'bg-amber-50'  },
  { id: 'rose',   dot: 'bg-rose-500',   ring: 'ring-rose-400',   check: 'text-rose-500',   light: 'bg-rose-50'   },
  { id: 'fuchsia',dot: 'bg-fuchsia-500',ring: 'ring-fuchsia-400',check: 'text-fuchsia-500',light: 'bg-fuchsia-50'},
]

function getColorById(id) {
  return COLORS.find((c) => c.id === id) || COLORS[0]
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function getWeekDates(referenceDate) {
  const d = new Date(referenceDate)
  const day = d.getDay() // 0=Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd
  })
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { habits: [] }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (_) {}
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ habits, todayKey }) {
  const total = habits.length
  const done = habits.filter((h) => h.completions?.[todayKey]).length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const barColor =
    pct === 100
      ? 'bg-emerald-500'
      : pct >= 60
      ? 'bg-sky-500'
      : pct >= 30
      ? 'bg-amber-500'
      : 'bg-rose-400'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Target size={18} className="text-violet-500" />
          <span>Today's Progress</span>
        </div>
        <span className="text-2xl font-bold text-slate-800">{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {done} of {total} habit{total !== 1 ? 's' : ''} completed today
      </p>
    </div>
  )
}

// ── Add Habit Form ────────────────────────────────────────────────────────────
function AddHabitForm({ onAdd }) {
  const [name, setName] = useState('')
  const [colorId, setColorId] = useState(COLORS[0].id)

  function submit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, colorId)
    setName('')
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
    >
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Add New Habit
      </h2>
      <div className="flex gap-3 items-center">
        {/* Color picker */}
        <div className="flex gap-1.5 shrink-0">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorId(c.id)}
              className={`w-6 h-6 rounded-full ${c.dot} transition-transform ${
                colorId === c.id ? 'scale-125 ring-2 ring-offset-2 ' + c.ring : 'hover:scale-110'
              }`}
            />
          ))}
        </div>
        {/* Name input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning run, Read 20 pages…"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          Add
        </button>
      </div>
    </form>
  )
}

// ── Week Header ───────────────────────────────────────────────────────────────
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function WeekHeader({ weekDates, todayKey }) {
  return (
    <div className="grid grid-cols-[1fr_repeat(7,2.5rem)] gap-2 px-5 mb-1">
      <div />
      {weekDates.map((d, i) => {
        const key = toDateKey(d)
        const isToday = key === todayKey
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className={`text-xs font-medium ${isToday ? 'text-violet-600' : 'text-slate-400'}`}>
              {DAY_LABELS[i]}
            </span>
            <span
              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-500'
              }`}
            >
              {d.getDate()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Habit Row ─────────────────────────────────────────────────────────────────
function HabitRow({ habit, weekDates, todayKey, onToggle, onDelete }) {
  const color = getColorById(habit.color)

  const streak = (() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (habit.completions?.[toDateKey(d)]) count++
      else break
    }
    return count
  })()

  return (
    <div className={`grid grid-cols-[1fr_repeat(7,2.5rem)] gap-2 items-center px-5 py-3 rounded-xl ${color.light} border border-slate-100`}>
      {/* Habit name + streak */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-3 h-3 rounded-full shrink-0 ${color.dot}`} />
        <span className="text-sm font-medium text-slate-700 truncate">{habit.name}</span>
        {streak > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold shrink-0 ml-auto pr-1">
            <Flame size={12} />
            {streak}
          </span>
        )}
        <button
          onClick={() => onDelete(habit.id)}
          className="ml-auto shrink-0 text-slate-300 hover:text-rose-400 transition-colors"
          title="Delete habit"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Day checkboxes */}
      {weekDates.map((d) => {
        const key = toDateKey(d)
        const checked = !!habit.completions?.[key]
        const isToday = key === todayKey
        const isFuture = key > todayKey

        return (
          <button
            key={key}
            onClick={() => !isFuture && onToggle(habit.id, key)}
            disabled={isFuture}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
              isFuture
                ? 'opacity-25 cursor-not-allowed'
                : 'hover:scale-110 active:scale-95'
            } ${isToday ? 'ring-2 ' + color.ring + ' ring-offset-1' : ''}`}
            title={isFuture ? 'Future day' : checked ? 'Mark incomplete' : 'Mark complete'}
          >
            {checked ? (
              <CheckCircle2 size={22} className={color.check} />
            ) : (
              <Circle size={22} className="text-slate-300" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [habits, setHabits] = useState(() => loadState().habits)
  const today = new Date()
  const todayKey = toDateKey(today)
  const weekDates = getWeekDates(today)

  // Persist on every change
  useEffect(() => {
    saveState({ habits })
  }, [habits])

  const addHabit = useCallback((name, colorId) => {
    setHabits((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, color: colorId, completions: {} },
    ])
  }, [])

  const deleteHabit = useCallback((id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const toggleCompletion = useCallback((id, dateKey) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id !== id
          ? h
          : {
              ...h,
              completions: {
                ...h.completions,
                [dateKey]: !h.completions?.[dateKey],
              },
            },
      ),
    )
  }, [])

  const todayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Habit Tracker
            </h1>
            <p className="flex items-center gap-1.5 mt-1 text-sm text-slate-400">
              <CalendarDays size={14} />
              {todayLabel}
            </p>
          </div>
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Target size={22} className="text-white" />
          </div>
        </div>

        {/* Progress */}
        <ProgressBar habits={habits} todayKey={todayKey} />

        {/* Add form */}
        <AddHabitForm onAdd={addHabit} />

        {/* Habit grid */}
        {habits.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-4 overflow-x-auto">
            <WeekHeader weekDates={weekDates} todayKey={todayKey} />
            <div className="space-y-2 px-4 mt-2">
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  weekDates={weekDates}
                  todayKey={todayKey}
                  onToggle={toggleCompletion}
                  onDelete={deleteHabit}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400">
            <CheckCircle2 size={40} className="text-slate-200" />
            <p className="text-sm font-medium">No habits yet — add one above!</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pb-4">
          Your data is saved locally in your browser.
        </p>
      </div>
    </div>
  )
}
