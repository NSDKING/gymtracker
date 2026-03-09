import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Set = {
  reps: number
  weight: number
}

export type SessionEntry = {
  exerciseId: string
  sets: Set[]
}

export type Session = {
  id: string
  date: string        // ISO string e.g. "2026-03-09"
  entries: SessionEntry[]
  note?: string
  durationSeconds?: number
}

export type Exercise = {
  id: string
  name: string
  muscle: string
}

// ─── STORE ────────────────────────────────────────────────────────────────────

type Store = {
  exercises: Exercise[]
  sessions: Session[]

  // Exercise actions
  addExercise: (exercise: Exercise) => void
  deleteExercise: (id: string) => void

  // Session actions
  addSession: (session: Session) => void
  deleteSession: (id: string) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      exercises: [
        { id: 'e1', name: 'Bench Press', muscle: 'Chest' },
        { id: 'e2', name: 'Squat', muscle: 'Legs' },
        { id: 'e3', name: 'Deadlift', muscle: 'Back' },
        { id: 'e4', name: 'Pull-up', muscle: 'Back' },
        { id: 'e5', name: 'Overhead Press', muscle: 'Shoulders' },
        { id: 'e6', name: 'Row', muscle: 'Back' },
      ],
      sessions: [],

      addExercise: (exercise) =>
        set((state) => ({ exercises: [...state.exercises, exercise] })),

      deleteExercise: (id) =>
        set((state) => ({ exercises: state.exercises.filter((e) => e.id !== id) })),

      addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] })),

      deleteSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
    }),
    {
      name: 'gymtracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// ─── SELECTORS ────────────────────────────────────────────────────────────────
// Helper functions to compute derived data — call these in your screens

export const getTotalVolume = (entries: SessionEntry[]) =>
  entries.reduce((total, entry) =>
    total + entry.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0)

export const getPRs = (sessions: Session[], exercises: Exercise[]) => {
  const prs: Record<string, { weight: number; date: string }> = {}
  ;[...sessions].reverse().forEach((session) => {
    session.entries.forEach((entry) => {
      entry.sets.forEach((set) => {
        if (!prs[entry.exerciseId] || set.weight > prs[entry.exerciseId].weight) {
          prs[entry.exerciseId] = { weight: set.weight, date: session.date }
        }
      })
    })
  })
  return prs
}

export const getStreak = (sessions: Session[]) => {
  if (!sessions.length) return 0
  const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse()
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let cursor = today

  for (const dateStr of dates) {
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    const diff = Math.round((cursor.getTime() - date.getTime()) / 86400000)
    if (diff > 1) break
    streak++
    cursor = date
  }
  return streak
}