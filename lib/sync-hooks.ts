import { useStore, Exercise, SetEntry } from '../store'
import { supabase } from './supabase'

// Call this instead of store.addSession when syncEnabled
export async function syncAddSession(session: Omit<import('../store').Session, 'id'>) {
  const id = useStore.getState().addSession(session)
  if (!useStore.getState().syncEnabled) return id

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return id

  await supabase.from('sessions').insert({ id, user_id: user.id, date: session.date, note: session.note })

  for (const entry of session.entries) {
    const entryId = `${id}_${entry.exercise.id}`
    await supabase.from('session_entries').insert({ id: entryId, session_id: id, exercise_id: entry.exercise.id })
    if (entry.sets.length > 0) {
      await supabase.from('sets').insert(entry.sets.map(s => ({ entry_id: entryId, reps: s.reps, weight: s.weight })))
    }
  }

  return id
}

export async function syncRemoveSession(id: string) {
  useStore.getState().removeSession(id)
  if (!useStore.getState().syncEnabled) return
  await supabase.from('sessions').delete().eq('id', id)
}

export async function syncAddExercise(name: string, muscle: string): Promise<Exercise> {
  const ex = useStore.getState().addExercise(name, muscle)
  if (!useStore.getState().syncEnabled) return ex

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ex

  await supabase.from('exercises').insert({ id: ex.id, name, muscle, user_id: user.id })
  return ex
}

export async function syncEditExercise(id: string, name: string, muscle: string) {
  useStore.getState().editExercise(id, name, muscle)
  if (!useStore.getState().syncEnabled) return
  await supabase.from('exercises').update({ name, muscle }).eq('id', id)
}

export async function syncRemoveExercise(id: string) {
  useStore.getState().removeExercise(id)
  if (!useStore.getState().syncEnabled) return
  await supabase.from('exercises').delete().eq('id', id)
}

export async function syncEditSessionSets(sessionId: string, exerciseId: string, sets: SetEntry[]) {
  useStore.getState().editSessionSets(sessionId, exerciseId, sets)
  if (!useStore.getState().syncEnabled) return

  const entryId = `${sessionId}_${exerciseId}`
  await supabase.from('sets').delete().eq('entry_id', entryId)
  if (sets.length > 0) {
    await supabase.from('sets').insert(sets.map(s => ({ entry_id: entryId, reps: s.reps, weight: s.weight })))
  }
}