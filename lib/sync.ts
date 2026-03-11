import { supabase } from './supabase'
import { useStore, Session, Exercise } from '../store'

// Push all local data to Supabase (called once when user first upgrades)
export async function pushLocalToSupabase() {
  const { exercises, sessions } = useStore.getState()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  // Upsert exercises
  if (exercises.length > 0) {
    const { error } = await supabase.from('exercises').upsert(
      exercises.map(e => ({ id: e.id, name: e.name, muscle: e.muscle, user_id: user.id })),
      { onConflict: 'id' }
    )
    if (error) throw error
  }

  // Upsert sessions + entries + sets
  for (const session of sessions) {
    const { error: sErr } = await supabase.from('sessions').upsert(
      { id: session.id, user_id: user.id, date: session.date, note: session.note },
      { onConflict: 'id' }
    )
    if (sErr) throw sErr

    for (const entry of session.entries) {
      const entryId = `${session.id}_${entry.exercise.id}`
      const { error: eErr } = await supabase.from('session_entries').upsert(
        { id: entryId, session_id: session.id, exercise_id: entry.exercise.id },
        { onConflict: 'id' }
      )
      if (eErr) throw eErr

      if (entry.sets.length > 0) {
        await supabase.from('sets').delete().eq('entry_id', entryId)
        const { error: setErr } = await supabase.from('sets').insert(
          entry.sets.map(s => ({ entry_id: entryId, reps: s.reps, weight: s.weight }))
        )
        if (setErr) throw setErr
      }
    }
  }
}

// Pull Supabase data and replace local store (called on login on new device)
export async function pullFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: exercises, error: exErr } = await supabase
    .from('exercises')
    .select('*')
    .order('name')
  if (exErr) throw exErr

  const { data: sessions, error: sErr } = await supabase
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
  if (sErr) throw sErr

  const exMap = Object.fromEntries(exercises.map(e => [e.id, e]))

  const mappedSessions: Session[] = sessions.map(s => ({
    id: s.id,
    date: s.date,
    note: s.note,
    entries: (s.session_entries as any[]).map(entry => ({
      exercise: exMap[entry.exercise_id] ?? { id: entry.exercise_id, name: 'Unknown', muscle: '' },
      sets: (entry.sets as any[]).map((set: any) => ({ reps: set.reps, weight: set.weight })),
    })),
  }))

  // Replace local store with cloud data
  useStore.setState({
    exercises: exercises.map(e => ({ id: e.id, name: e.name, muscle: e.muscle })),
    sessions: mappedSessions,
    syncEnabled: true,
  })
}