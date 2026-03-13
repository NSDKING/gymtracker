import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
 
export type Exercise = { id: string; name: string; muscle: string }
export type SetEntry = { reps: number; weight: number }
export type SessionEntry = { exercise: Exercise; sets: SetEntry[] }
export type Session = { id: string; date: string; note: string; entries: SessionEntry[] }

type Store = {
  exercises: Exercise[]
  sessions: Session[]
  goal: string
  daysPerWeek: number
  isPro: boolean
  isLoggedIn: boolean
  syncEnabled: boolean
  addExercise: (name: string, muscle: string) => Exercise
  editExercise: (id: string, name: string, muscle: string) => void
  removeExercise: (id: string) => void
  addSession: (session: Omit<Session, 'id'>) => string
  removeSession: (id: string) => void
  editSessionSets: (sessionId: string, exerciseId: string, sets: SetEntry[]) => void
  setIsPro: (v: boolean) => void
  setIsLoggedIn: (v: boolean) => void
  setSyncEnabled: (v: boolean) => void
  setGoal: (v: string) => void
  setDaysPerWeek: (v: number) => void
}

const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      exercises: [],
      sessions: [],
      goal: 'Build Muscle',
      daysPerWeek: 4,
      isPro: false,
      isLoggedIn: false,
      syncEnabled: false,

      addExercise: (name, muscle) => {
        const ex: Exercise = { id: uuid(), name, muscle }
        set(s => ({ exercises: [...s.exercises, ex] }))
        return ex
      },

      editExercise: (id, name, muscle) =>
        set(s => ({ exercises: s.exercises.map(e => e.id === id ? { ...e, name, muscle } : e) })),

      removeExercise: (id) =>
        set(s => ({ exercises: s.exercises.filter(e => e.id !== id) })),

      addSession: (session) => {
        const state = get()
        const id = uuid()
        const newSession: Session = { ...session, id }
        const newSessions = [...state.sessions, newSession]

        // Check for new PRs
        const oldPRs = getPRs(state.sessions, state.exercises)
        const newPRs = getPRs(newSessions, state.exercises)

        for (const [exerciseId, newPR] of Object.entries(newPRs)) {
          const oldPR = oldPRs[exerciseId]
          if (!oldPR || newPR.weight > oldPR.weight) {
            const exercise = state.exercises.find(e => e.id === exerciseId)
            if (exercise && state.isPro) {
            //sendPRNotification(exercise.name, newPR.weight)
            }
          }
        }

        set({ sessions: newSessions })
        return id
      },

      removeSession: (id) =>
        set(s => ({ sessions: s.sessions.filter(s => s.id !== id) })),

      editSessionSets: (sessionId, exerciseId, sets) =>
        set(s => ({
          sessions: s.sessions.map(sess =>
            sess.id !== sessionId ? sess : {
              ...sess,
              entries: sess.entries.map(e =>
                e.exercise.id !== exerciseId ? e : { ...e, sets }
              )
            }
          )
        })),

      setIsPro: (v) => set({ isPro: v }),
      setIsLoggedIn: (v) => set({ isLoggedIn: v }),
      setSyncEnabled: (v) => set({ syncEnabled: v }),
      setGoal: (v) => set({ goal: v }),
      setDaysPerWeek: (v) => set({ daysPerWeek: v }),
    }),
    {
      name: 'repd-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export function getTotalVolume(entries: SessionEntry[]): number {
  return entries.reduce((total, entry) =>
    total + entry.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0
  )
}

export function getStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const trainedDates = new Set(sessions.map(s => s.date))
  let streak = 0
  const cursor = new Date(today)
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10)
    if (trainedDates.has(dateStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1)
        const yesterday = cursor.toISOString().slice(0, 10)
        if (!trainedDates.has(yesterday)) break
      } else {
        break
      }
    }
  }
  return streak
}

export function getPRs(
  sessions: Session[],
  exercises: Exercise[]
): Record<string, { weight: number; date: string }> {
  const prs: Record<string, { weight: number; date: string }> = {}
  for (const session of sessions) {
    for (const entry of session.entries) {
      const maxWeight = Math.max(...entry.sets.map(s => s.weight), 0)
      if (maxWeight <= 0) continue
      const exId = entry.exercise.id
      if (!prs[exId] || maxWeight > prs[exId].weight) {
        prs[exId] = { weight: maxWeight, date: session.date }
      }
    }
  }
  return prs
}