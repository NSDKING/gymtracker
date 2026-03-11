import { supabase } from './supabase'
import { Exercise, Session } from '../store'

// ─── Exercises ───────────────────────────────────────────────

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map(e => ({ id: e.id, name: e.name, muscle: e.muscle }))
}

export async function insertExercise(name: string, muscle: string): Promise<Exercise> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, muscle, user_id: user!.id })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, name: data.name, muscle: data.muscle }
}

export async function updateExercise(id: string, name: string, muscle: string) {
  const { error } = await supabase
    .from('exercises')
    .update({ name, muscle })
    .eq('id', id)
  if (error) throw error
}

export async function deleteExercise(id: string) {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Sessions ────────────────────────────────────────────────

export async function fetchSessions(): Promise<Session[]> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id, date, note,
      session_entries (
        id, exercise_id,
        sets ( reps, weight )
      )
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
  if (error) throw error

  // Fetch exercise names for the IDs
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, muscle')

  const exMap = Object.fromEntries(exercises!.map(e => [e.id, e]))

  return sessions.map(s => ({
    id: s.id,
    date: s.date,
    note: s.note,
    entries: s.session_entries.map((entry: any) => ({
      exercise: exMap[entry.exercise_id] ?? { id: entry.exercise_id, name: 'Unknown', muscle: '' },
      sets: entry.sets.map((set: any) => ({ reps: set.reps, weight: set.weight })),
    })),
  }))
}

export async function insertSession(session: Omit<Session, 'id'>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()

  // Insert session
  const { data: s, error: sErr } = await supabase
    .from('sessions')
    .insert({ user_id: user!.id, date: session.date, note: session.note })
    .select()
    .single()
  if (sErr) throw sErr

  // Insert entries + sets
  for (const entry of session.entries) {
    const { data: e, error: eErr } = await supabase
      .from('session_entries')
      .insert({ session_id: s.id, exercise_id: entry.exercise.id })
      .select()
      .single()
    if (eErr) throw eErr

    if (entry.sets.length > 0) {
      const { error: setErr } = await supabase
        .from('sets')
        .insert(entry.sets.map(set => ({ entry_id: e.id, reps: set.reps, weight: set.weight })))
      if (setErr) throw setErr
    }
  }

  return s.id
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
  if (error) throw error
}

export async function updateSessionSets(
  sessionId: string,
  exerciseId: string,
  newSets: { reps: number; weight: number }[]
) {
  // Find the entry
  const { data: entry, error: eErr } = await supabase
    .from('session_entries')
    .select('id')
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .single()
  if (eErr) throw eErr

  // Delete old sets and reinsert
  await supabase.from('sets').delete().eq('entry_id', entry.id)
  if (newSets.length > 0) {
    const { error } = await supabase
      .from('sets')
      .insert(newSets.map(s => ({ entry_id: entry.id, reps: s.reps, weight: s.weight })))
    if (error) throw error
  }
}