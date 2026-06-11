import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type WorkoutPlan = {
  planName: string
  description: string
  days: {
    dayName: string
    focus: string
    exercises: { name: string; sets: number; reps: string; targetWeight: string; notes: string }[]
  }[]
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type Equipment = 'full_gym' | 'home_gym' | 'bodyweight'

export type Exercise = { id: string; name: string; muscle: string }
export type SetEntry = { reps: number; weight: number }
export type SessionEntry = { exercise: Exercise; sets: SetEntry[] }
export type Session = { id: string; date: string; note: string; entries: SessionEntry[] }

type Store = {
  exercises: Exercise[]
  sessions: Session[]
  goal: string
  daysPerWeek: number
  experienceLevel: ExperienceLevel
  equipment: Equipment
  focusMuscles: string[]
  injuries: string
  bodyWeight: number | null
  bodyHeight: number | null
  targetBodyWeight: number | null
  weightUnit: 'kg' | 'lbs'
  heightUnit: 'cm' | 'ft'
  isPro: boolean
  isLoggedIn: boolean
  syncEnabled: boolean
  activeProgram: WorkoutPlan | null
  pendingPlan: WorkoutPlan | null
  pendingAdaptation: boolean
  planGeneratedAt: string | null
  // Weekly schedule: 7-element array [Mon..Sun], -1=rest, 0..N=workout slot index
  weeklySchedule: number[] | null
  // ISO date string (YYYY-MM-DD) when the active program was activated
  planStartDate: string | null
  // Notification preferences (persisted)
  notificationsEnabled: boolean
  reminderHour: number  // 0-23, default 8
  addExercise: (name: string, muscle: string) => Exercise
  editExercise: (id: string, name: string, muscle: string) => void
  removeExercise: (id: string) => void
  addSession: (session: Omit<Session, 'id'>) => { id: string; newPRExerciseNames: string[] }
  removeSession: (id: string) => void
  editSessionSets: (sessionId: string, exerciseId: string, sets: SetEntry[]) => void
  setBodyStats: (weight: number | null, height: number | null, targetWeight: number | null, weightUnit: 'kg' | 'lbs', heightUnit: 'cm' | 'ft') => void
  setIsPro: (v: boolean) => void
  setIsLoggedIn: (v: boolean) => void
  setSyncEnabled: (v: boolean) => void
  setGoal: (v: string) => void
  setDaysPerWeek: (v: number) => void
  setExperienceLevel: (v: ExperienceLevel) => void
  setEquipment: (v: Equipment) => void
  setFocusMuscles: (v: string[]) => void
  setInjuries: (v: string) => void
  setActiveProgram: (plan: WorkoutPlan | null) => void
  setPendingPlan: (plan: WorkoutPlan | null) => void
  setPendingAdaptation: (v: boolean) => void
  setPlanGeneratedAt: (v: string | null) => void
  setWeeklySchedule: (v: number[] | null) => void
  setPlanStartDate: (v: string | null) => void
  setNotificationsEnabled: (v: boolean) => void
  setReminderHour: (v: number) => void
  // Activates a brand-new plan: resets schedule and start date
  activateNewProgram: (plan: WorkoutPlan, daysPerWeek: number) => void
}

const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      exercises: [],
      sessions: [],
      goal: 'Build Muscle',
      daysPerWeek: 4,
      experienceLevel: 'intermediate',
      equipment: 'full_gym',
      focusMuscles: [],
      injuries: '',
      bodyWeight: null,
      bodyHeight: null,
      targetBodyWeight: null,
      weightUnit: 'kg',
      heightUnit: 'cm',
      isPro: false,
      isLoggedIn: false,
      syncEnabled: false,
      activeProgram: null,
      pendingPlan: null,
      pendingAdaptation: false,
      planGeneratedAt: null,
      weeklySchedule: null,
      planStartDate: null,
      notificationsEnabled: false,
      reminderHour: 8,

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

        const oldPRs = getPRs(state.sessions, state.exercises)
        const newPRs = getPRs(newSessions, state.exercises)

        const newPRExerciseNames: string[] = []
        for (const [exerciseId, newPR] of Object.entries(newPRs)) {
          const oldPR = oldPRs[exerciseId]
          if (!oldPR || newPR.weight > oldPR.weight) {
            const exercise = state.exercises.find(e => e.id === exerciseId)
            if (exercise) newPRExerciseNames.push(exercise.name)
          }
        }

        const shouldFlagAdaptation = newPRExerciseNames.length > 0 && state.activeProgram !== null

        set({
          sessions: newSessions,
          ...(shouldFlagAdaptation ? { pendingAdaptation: true } : {}),
        })

        return { id, newPRExerciseNames }
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

      setBodyStats: (weight, height, targetWeight, weightUnit, heightUnit) =>
        set({ bodyWeight: weight, bodyHeight: height, targetBodyWeight: targetWeight, weightUnit, heightUnit }),
      setIsPro: (v) => set({ isPro: v }),
      setIsLoggedIn: (v) => set({ isLoggedIn: v }),
      setSyncEnabled: (v) => set({ syncEnabled: v }),
      setGoal: (v) => set({ goal: v }),
      setDaysPerWeek: (v) => set({ daysPerWeek: v }),
      setExperienceLevel: (v) => set({ experienceLevel: v }),
      setEquipment: (v) => set({ equipment: v }),
      setFocusMuscles: (v) => set({ focusMuscles: v }),
      setInjuries: (v) => set({ injuries: v }),
      setActiveProgram: (plan) => set({ activeProgram: plan, pendingAdaptation: false }),
      setPendingPlan: (plan) => set({ pendingPlan: plan }),
      setPendingAdaptation: (v) => set({ pendingAdaptation: v }),
      setPlanGeneratedAt: (v) => set({ planGeneratedAt: v }),
      setWeeklySchedule: (v) => set({ weeklySchedule: v }),
      setPlanStartDate: (v) => set({ planStartDate: v }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setReminderHour: (v) => set({ reminderHour: v }),

      activateNewProgram: (plan, daysPerWeek) => {
        const today = new Date().toISOString().slice(0, 10)
        const schedule = generateDefaultWeeklySchedule(daysPerWeek)
        set({
          activeProgram: plan,
          pendingAdaptation: false,
          planStartDate: today,
          weeklySchedule: schedule,
        })
      },
    }),
    {
      name: 'repd-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Returns a 7-element schedule [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
// Each value: -1 = rest day, 0..N-1 = workout slot index within the week
export function generateDefaultWeeklySchedule(daysPerWeek: number): number[] {
  switch (daysPerWeek) {
    case 2: return [0, -1, -1, 1, -1, -1, -1]    // Mon, Thu
    case 3: return [0, -1, 1, -1, 2, -1, -1]      // Mon, Wed, Fri
    case 4: return [0, 1, -1, 2, 3, -1, -1]        // Mon, Tue, Thu, Fri
    case 5: return [0, 1, 2, 3, 4, -1, -1]          // Mon–Fri
    case 6: return [0, 1, 2, 3, 4, 5, -1]           // Mon–Sat
    default: return [0, 1, -1, 2, 3, -1, -1]
  }
}

export type ScheduleInfo = {
  today: number | 'rest'
  // The next upcoming workout's plan day index (used to skip rest day)
  nextWorkout: number
}

// Determines today's plan day index and the next upcoming workout.
// Falls back to sessions.length % planDaysCount when schedule data is missing (old plans).
export function getScheduleInfo(
  weeklySchedule: number[] | null,
  planStartDate: string | null,
  planDaysCount: number,
  fallbackSessionCount: number,
): ScheduleInfo {
  if (!weeklySchedule || !planStartDate || planDaysCount === 0) {
    const idx = planDaysCount > 0 ? fallbackSessionCount % planDaysCount : 0
    return { today: idx, nextWorkout: (idx + 1) % Math.max(planDaysCount, 1) }
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dayOfWeek = (now.getDay() + 6) % 7  // Mon=0 .. Sun=6

  // Find Monday of the week planStartDate falls in
  const startDate = new Date(planStartDate)
  startDate.setHours(0, 0, 0, 0)
  const startDow = (startDate.getDay() + 6) % 7  // Mon=0
  const planWeekStart = new Date(startDate)
  planWeekStart.setDate(startDate.getDate() - startDow)

  const activeSlotsPerWeek = weeklySchedule.filter(s => s >= 0).length || 1

  const computePlanDay = (targetDate: Date, slot: number): number => {
    const daysSince = Math.floor((targetDate.getTime() - planWeekStart.getTime()) / 86400000)
    const weeksSince = Math.floor(daysSince / 7)
    return (weeksSince * activeSlotsPerWeek + slot) % planDaysCount
  }

  // Find next workout slot (starting from tomorrow)
  let nextSlot = -1
  let daysAhead = 1
  while (daysAhead <= 7) {
    const nextDow = (dayOfWeek + daysAhead) % 7
    if (weeklySchedule[nextDow] >= 0) {
      nextSlot = weeklySchedule[nextDow]
      break
    }
    daysAhead++
  }
  const nextWorkoutDate = new Date(now)
  nextWorkoutDate.setDate(now.getDate() + daysAhead)
  const nextWorkout = nextSlot >= 0 ? computePlanDay(nextWorkoutDate, nextSlot) : 0

  const todaySlot = weeklySchedule[dayOfWeek]
  if (todaySlot === -1) {
    return { today: 'rest', nextWorkout }
  }

  return { today: computePlanDay(now, todaySlot), nextWorkout }
}

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
  _exercises?: Exercise[]
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
