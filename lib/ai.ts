import { supabase } from './supabase'
import { useStore } from '../store'

export async function getAIRecommendation() {
  const { sessions, exercises } = useStore.getState()

  const { data, error } = await supabase.functions.invoke('ai-recommend', {
    body: { sessions, exercises }
  })

  if (error) throw error
  return data as {
    recommendation: string
    focus: string
    suggestedExercises: string[]
    restWarning: string | null
  }
}

export async function generateAIWorkout(goal: string, daysPerWeek: number) {
  const { sessions, exercises } = useStore.getState()

  const { data, error } = await supabase.functions.invoke('ai-workout', {
    body: { sessions, exercises, goal, daysPerWeek }
  })

  if (error) throw error
  return data as {
    planName: string
    description: string
    days: {
      dayName: string
      focus: string
      exercises: { name: string; sets: number; reps: string; notes: string }[]
    }[]
  }
}