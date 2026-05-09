import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  full_gym: 'Full gym (barbells, cables, machines, dumbbells)',
  home_gym: 'Home gym (dumbbells, bench, limited equipment)',
  bodyweight: 'Bodyweight only (no equipment)',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sessions, exercises, goal, daysPerWeek, experienceLevel, equipment, focusMuscles, injuries } = await req.json()

    const client = new Anthropic()

    const prMap: Record<string, { name: string; muscle: string; prWeight: number; prDate: string }> = {}
    for (const session of sessions) {
      for (const entry of session.entries) {
        const maxWeight = Math.max(...entry.sets.map((s: any) => s.weight), 0)
        if (maxWeight <= 0) continue
        const exId = entry.exercise.id
        if (!prMap[exId] || maxWeight > prMap[exId].prWeight) {
          prMap[exId] = {
            name: entry.exercise.name,
            muscle: entry.exercise.muscle,
            prWeight: maxWeight,
            prDate: session.date,
          }
        }
      }
    }

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
        maxWeight: Math.max(...e.sets.map((set: any) => set.weight), 0),
        totalVolume: e.sets.reduce((t: number, set: any) => t + set.reps * set.weight, 0),
      })),
    }))

    const prSummary = Object.values(prMap)
      .map(p => `${p.name} (${p.muscle}): ${p.prWeight}kg PR on ${p.prDate}`)
      .join('\n')

    const exerciseList = exercises.map((e: any) => `${e.name} (${e.muscle})`).join(', ')

    const prompt = `You are an expert strength and conditioning coach. Generate a personalised weekly workout program.

Athlete profile:
- Goal: ${goal}
- Experience level: ${experienceLevel || 'intermediate'}
- Training frequency: ${daysPerWeek} days/week
- Equipment: ${EQUIPMENT_LABELS[equipment] || equipment || 'Full gym'}
- Focus muscles: ${focusMuscles?.length ? focusMuscles.join(', ') : 'all muscle groups'}
${injuries ? `- Injuries / limitations: ${injuries}` : ''}

Available exercises in their library: ${exerciseList || 'none yet — suggest standard exercises'}

Personal Records (use to set realistic target weights):
${prSummary || 'No PRs recorded yet — use beginner-friendly weights'}

Recent training history (last ${recentSessions.length} sessions, most recent first):
${JSON.stringify(recentSessions, null, 2)}

Instructions:
- Design ${daysPerWeek} training days with appropriate muscle group splits
- Adjust complexity and volume to the athlete's experience level (beginners: fewer exercises, simpler movements; advanced: more volume, compound-heavy)
- For each exercise, set targetWeight based on their PR (70-85% for volume, 90-95% for strength work); use 'BW' for bodyweight exercises
- Vary rep ranges to match the goal: strength (3-6), hypertrophy (8-12), endurance (12-20)
- Respect any injuries or limitations — avoid or substitute problematic movements
- If a muscle has been heavily trained recently, reduce its volume this week
- Only suggest exercises available with their equipment

Respond with JSON only, no markdown, in this exact format:
{
  "planName": "short name for this plan",
  "description": "1-2 sentence description mentioning the goal and key focus",
  "days": [
    {
      "dayName": "Day 1 - Push",
      "focus": "Chest, Shoulders, Triceps",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "6-8",
          "targetWeight": "85kg",
          "notes": "At 85% of your 100kg PR — push for 90kg if the last set feels easy"
        }
      ]
    }
  ]
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are a precision strength coach. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
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
