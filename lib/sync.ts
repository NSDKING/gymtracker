import { supabase } from './supabase'
import { useStore, Session, Exercise, WorkoutPlan } from '../store'

// Merge local + cloud data by ID (union, no duplicates, no data loss)
export async function syncWithSupabase() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { exercises: localExercises, sessions: localSessions } = useStore.getState()

  // --- Push local exercises ---
  if (localExercises.length > 0) {
    await supabase.from('exercises').upsert(
      localExercises.map(e => ({ id: e.id, name: e.name, muscle: e.muscle, user_id: user.id })),
      { onConflict: 'id' }
    )
  }

  // --- Push local sessions ---
  for (const session of localSessions) {
    await supabase.from('sessions').upsert(
      { id: session.id, user_id: user.id, date: session.date, note: session.note },
      { onConflict: 'id' }
    )
    for (const entry of session.entries) {
      const entryId = `${session.id}_${entry.exercise.id}`
      await supabase.from('session_entries').upsert(
        { id: entryId, session_id: session.id, exercise_id: entry.exercise.id },
        { onConflict: 'id' }
      )
      if (entry.sets.length > 0) {
        await supabase.from('sets').delete().eq('entry_id', entryId)
        await supabase.from('sets').insert(
          entry.sets.map(s => ({ entry_id: entryId, reps: s.reps, weight: s.weight }))
        )
      }
    }
  }

  // --- Pull cloud data ---
  const { data: cloudExercises } = await supabase
    .from('exercises')
    .select('*')
    .order('name')

  const { data: cloudSessions } = await supabase
    .from('sessions')
    .select(`
      id, date, note,
      session_entries (
        id, exercise_id,
        sets ( reps, weight )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!cloudExercises || !cloudSessions) return

  // --- Merge exercises: union by ID ---
  const localExMap = Object.fromEntries(localExercises.map(e => [e.id, e]))
  const mergedExercises: Exercise[] = [...localExercises]
  for (const ce of cloudExercises) {
    if (!localExMap[ce.id]) {
      mergedExercises.push({ id: ce.id, name: ce.name, muscle: ce.muscle })
    }
  }

  const exMap = Object.fromEntries(mergedExercises.map(e => [e.id, e]))

  // --- Merge sessions: union by ID ---
  const localSessionMap = Object.fromEntries(localSessions.map(s => [s.id, s]))
  const mergedSessions: Session[] = [...localSessions]
  for (const cs of cloudSessions) {
    if (!localSessionMap[cs.id]) {
      mergedSessions.push({
        id: cs.id,
        date: cs.date,
        note: cs.note,
        entries: (cs.session_entries as any[]).map(entry => ({
          exercise: exMap[entry.exercise_id] ?? { id: entry.exercise_id, name: 'Unknown', muscle: '' },
          sets: (entry.sets as any[]).map((set: any) => ({ reps: set.reps, weight: set.weight })),
        })),
      })
    }
  }

  // --- Push local workout plan ---
  const { activeProgram, planGeneratedAt, planStartDate, weeklySchedule } = useStore.getState()
  if (activeProgram) {
    await saveWorkoutPlanToSupabase(activeProgram, {
      generatedAt: planGeneratedAt ?? undefined,
      planStartDate: planStartDate ?? undefined,
      weeklySchedule: weeklySchedule ?? undefined,
    })
  }

  // --- Pull cloud workout plan ---
  const cloudPlan = await loadWorkoutPlanFromSupabase()
  let resolvedPlan = activeProgram
  let resolvedGeneratedAt = planGeneratedAt
  let resolvedPlanStartDate = planStartDate
  let resolvedWeeklySchedule = weeklySchedule

  if (cloudPlan) {
    const localTime = planGeneratedAt ? new Date(planGeneratedAt).getTime() : 0
    const cloudTime = new Date(cloudPlan.generatedAt).getTime()
    if (!activeProgram || cloudTime > localTime) {
      resolvedPlan = cloudPlan.plan
      resolvedGeneratedAt = cloudPlan.generatedAt
      resolvedPlanStartDate = cloudPlan.planStartDate ?? null
      resolvedWeeklySchedule = cloudPlan.weeklySchedule ?? null
    }
  }

  useStore.setState({
    exercises: mergedExercises,
    sessions: mergedSessions,
    syncEnabled: true,
    ...(resolvedPlan ? {
      activeProgram: resolvedPlan,
      planGeneratedAt: resolvedGeneratedAt,
      planStartDate: resolvedPlanStartDate,
      weeklySchedule: resolvedWeeklySchedule,
    } : {}),
  })
}

// Keep for backwards compatibility (used on sign-in)
export async function pullFromSupabase() {
  return syncWithSupabase()
}

// Push all local data to Supabase (called once when user first upgrades)
export async function pushLocalToSupabase() {
  return syncWithSupabase()
}

export async function saveWorkoutPlanToSupabase(
  plan: WorkoutPlan,
  opts: {
    userModified?: boolean
    generatedAt?: string
    planStartDate?: string
    weeklySchedule?: number[]
  } = {}
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('workout_plans').upsert(
    {
      user_id: user.id,
      plan,
      generated_at: opts.generatedAt ?? new Date().toISOString(),
      user_modified: opts.userModified ?? false,
      updated_at: new Date().toISOString(),
      plan_start_date: opts.planStartDate ?? null,
      weekly_schedule: opts.weeklySchedule ?? null,
    },
    { onConflict: 'user_id' }
  )
}

export async function loadWorkoutPlanFromSupabase(): Promise<{
  plan: WorkoutPlan
  generatedAt: string
  userModified: boolean
  planStartDate?: string
  weeklySchedule?: number[]
} | null> {
  const { data } = await supabase
    .from('workout_plans')
    .select('plan, generated_at, user_modified, plan_start_date, weekly_schedule')
    .maybeSingle()

  if (!data) return null
  return {
    plan: data.plan as WorkoutPlan,
    generatedAt: data.generated_at,
    userModified: data.user_modified,
    planStartDate: data.plan_start_date ?? undefined,
    weeklySchedule: data.weekly_schedule ?? undefined,
  }
}
