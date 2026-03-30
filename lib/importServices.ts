// @/lib/importService.ts
import { supabase } from './supabase';

export async function importWorkoutData(jsonData: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Log in to sync data");

  // Cache exercises to prevent duplicates
  const { data: existingEx } = await supabase.from('exercises').select('*');
  const exMap: Record<string, string> = {}; 
  existingEx?.forEach(e => exMap[e.name.toLowerCase()] = e.id);

  for (const session of jsonData.sessions) {
    // 1. Insert Session
    const { data: s, error: sErr } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        date: session.date.replace('~', ''),
        note: session.label
      })
      .select().single();

    if (sErr) continue;

    for (const exData of session.exercises) {
      let exerciseId = exMap[exData.name.toLowerCase()];

      // 2. Insert Exercise if new
      if (!exerciseId) {
        const { data: newEx } = await supabase
          .from('exercises')
          .insert({ name: exData.name, muscle: 'Imported', user_id: user.id })
          .select().single();
        if (newEx) {
          exerciseId = newEx.id;
          exMap[exData.name.toLowerCase()] = exerciseId;
        }
      }

      // 3. Insert Entry
      const { data: entry } = await supabase
        .from('session_entries')
        .insert({ session_id: s.id, exercise_id: exerciseId })
        .select().single();

      if (entry) {
        // 4. Insert Sets (mapping weight_kg to weight)
        const setsToInsert = exData.sets.map((set: any) => ({
          entry_id: entry.id,
          reps: set.reps,
          weight: set.weight_kg || set.weight 
        }));
        await supabase.from('sets').insert(setsToInsert);
      }
    }
  }
}