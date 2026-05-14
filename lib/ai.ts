import { supabase } from './supabase'
import { useStore, getPRs } from '../store'
import type { WorkoutPlan } from '../store'
export type { WorkoutPlan } from '../store'

export type AIRecommendation = {
  recommendation: string
  focus: string
  suggestedExercises: string[]
  restWarning: string | null
  imbalances: string[]
  emphasis: string[]
}

export type SessionFeedback = {
  headline: string
  coachNote: string
  nextTarget: string
  newPRs: string[]
}

export async function getAIRecommendation(photoBase64?: string): Promise<AIRecommendation> {
  const { sessions, exercises, goal, daysPerWeek, experienceLevel, equipment, focusMuscles, injuries } = useStore.getState()

  const { data, error } = await supabase.functions.invoke('ai-recommend', {
    body: { sessions, exercises, photoBase64, goal, daysPerWeek, experienceLevel, equipment, focusMuscles, injuries }
  })

  if (error) throw error
  return data as AIRecommendation
}

export async function generateAIWorkout(goal: string, daysPerWeek: number, feedback?: string): Promise<WorkoutPlan> {
  const { sessions, exercises, experienceLevel, equipment, focusMuscles, injuries } = useStore.getState()

  const { data, error } = await supabase.functions.invoke('ai-workout', {
    body: { sessions, exercises, goal, daysPerWeek, experienceLevel, equipment, focusMuscles, injuries, feedback }
  })

  if (error) throw error
  return data as WorkoutPlan
}

export async function getSessionFeedback(sessionId: string): Promise<SessionFeedback> {
  const { sessions, exercises } = useStore.getState()

  const currentSession = sessions.find(s => s.id === sessionId)
  if (!currentSession) throw new Error('Session not found')

  const previousSessions = sessions.filter(s => s.id !== sessionId)
  const prs = getPRs(sessions, exercises)

  // Add exercise name to each PR entry for the edge function
  const prsWithNames = Object.fromEntries(
    Object.entries(prs).map(([exId, pr]) => {
      const ex = exercises.find(e => e.id === exId)
      return [exId, { ...pr, name: ex?.name ?? exId }]
    })
  )

  const { data, error } = await supabase.functions.invoke('ai-session-feedback', {
    body: { currentSession, previousSessions, prs: prsWithNames }
  })

  if (error) throw error
  return data as SessionFeedback
}
