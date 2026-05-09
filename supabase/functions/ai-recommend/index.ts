import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sessions, exercises, photoBase64, goal, daysPerWeek, experienceLevel, equipment, focusMuscles, injuries } = await req.json()

    const client = new Anthropic()

    const recentSessions = sessions.slice(0, 10).map((s: any) => ({
      date: s.date,
      totalVolume: s.entries.reduce(
        (t: number, e: any) => t + e.sets.reduce((st: number, set: any) => st + set.reps * set.weight, 0),
        0
      ),
      exercises: s.entries.map((e: any) => ({
        name: e.exercise.name,
        muscle: e.exercise.muscle,
        sets: e.sets.length,
        maxWeight: Math.max(...e.sets.map((set: any) => set.weight)),
      }))
    }))

    const equipmentLabels: Record<string, string> = {
      full_gym: 'Full gym (barbells, cables, machines)',
      home_gym: 'Home gym (dumbbells, bench)',
      bodyweight: 'Bodyweight only',
    }

    const textPrompt = `You are an expert strength coach and physique specialist. Analyze this athlete's recent training history${photoBase64 ? ' and physique photo' : ''}.

Athlete profile:
- Goal: ${goal || 'Build Muscle'}
- Experience level: ${experienceLevel || 'intermediate'}
- Training frequency target: ${daysPerWeek || 4} days/week
- Equipment: ${equipmentLabels[equipment] || 'Full gym'}
- Focus muscles: ${focusMuscles?.length ? focusMuscles.join(', ') : 'all muscle groups'}
${injuries ? `- Injuries / limitations: ${injuries}` : ''}

Training history (most recent first):
${JSON.stringify(recentSessions, null, 2)}

${photoBase64 ? `Use the physique photo to:
- Assess overall muscle development and symmetry
- Identify lagging or underdeveloped muscle groups
- Identify any visible left/right or front/back imbalances
- Refine your recommendations based on what you observe` : ''}

Respond with JSON only, no markdown, in this exact format:
{
  "recommendation": "2-3 sentence recommendation on what to train next and why",
  "focus": "the main muscle group or movement pattern to prioritize",
  "suggestedExercises": ["exercise1", "exercise2", "exercise3"],
  "restWarning": null,
  "imbalances": [],
  "emphasis": []
}

Rules:
- restWarning: a short string warning if a muscle group appears overtrained (trained 3+ times in a week with no rest), or null
- imbalances: array of strings describing any muscle imbalances visible in the photo or implied by training patterns (e.g. "Posterior chain appears undertrained vs chest/anterior dominance"). Empty array if no photo and no clear pattern imbalance.
- emphasis: array of 2-4 actionable strings describing what to emphasise in upcoming training to correct imbalances or accelerate progress (e.g. "Add 2 sets of face pulls to every upper body session"). Empty array if no specific emphasis needed.`

    const userContent: Anthropic.MessageParam['content'] = photoBase64
      ? [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: photoBase64,
            },
          },
          { type: 'text', text: textPrompt },
        ]
      : textPrompt

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 768,
      system: 'You are a precision strength coach. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = (message.content[0] as any).text
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
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
