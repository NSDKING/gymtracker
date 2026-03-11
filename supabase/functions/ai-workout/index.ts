import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sessions, exercises, goal, daysPerWeek } = await req.json()

    const client = new Anthropic()

    const exerciseList = exercises.map((e: any) => `${e.name} (${e.muscle})`).join(', ')
    const recentSessions = sessions.slice(0, 5).map((s: any) => ({
      date: s.date,
      exercises: s.entries.map((e: any) => e.exercise.name)
    }))

    const prompt = `You are an expert strength coach. Generate a workout plan for this athlete.

Goal: ${goal}
Days per week: ${daysPerWeek}
Known exercises: ${exerciseList}
Recent sessions: ${JSON.stringify(recentSessions)}

Respond with JSON only, no markdown, in this exact format:
{
  "planName": "short name for this plan",
  "description": "1-2 sentence description",
  "days": [
    {
      "dayName": "Day 1 - Push",
      "focus": "Chest, Shoulders, Triceps",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "6-8",
          "notes": "Focus on controlled descent"
        }
      ]
    }
  ]
}`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as any).text
    const parsed = JSON.parse(text)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})