import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { currentSession, previousSessions, prs } = await req.json()

    const client = new Anthropic()

    // Build previous-session context for same exercises
    const exerciseNames = new Set(
      currentSession.entries.map((e: any) => e.exercise.name)
    )

    const relevantHistory = previousSessions
      .filter((s: any) =>
        s.entries.some((e: any) => exerciseNames.has(e.exercise.name))
      )
      .slice(0, 5)
      .map((s: any) => ({
        date: s.date,
        exercises: s.entries
          .filter((e: any) => exerciseNames.has(e.exercise.name))
          .map((e: any) => ({
            name: e.exercise.name,
            sets: e.sets.length,
            maxWeight: Math.max(...e.sets.map((set: any) => set.weight), 0),
            totalVolume: e.sets.reduce((t: number, set: any) => t + set.reps * set.weight, 0),
          })),
      }))

    // Summarise current session
    const currentSummary = {
      date: currentSession.date,
      totalVolume: currentSession.entries.reduce(
        (t: number, e: any) => t + e.sets.reduce((st: number, set: any) => st + set.reps * set.weight, 0),
        0
      ),
      exercises: currentSession.entries.map((e: any) => ({
        name: e.exercise.name,
        muscle: e.exercise.muscle,
        sets: e.sets.length,
        maxWeight: Math.max(...e.sets.map((set: any) => set.weight), 0),
        totalVolume: e.sets.reduce((t: number, set: any) => t + set.reps * set.weight, 0),
        allSets: e.sets,
      })),
    }

    // PRs for exercises in this session
    const sessionPRs = Object.entries(prs)
      .filter(([_, pr]: [string, any]) => pr.date === currentSession.date)
      .map(([_, pr]: [string, any]) => pr)

    const prompt = `You are a direct, knowledgeable strength coach. Give sharp, specific post-session feedback.

Today's session:
${JSON.stringify(currentSummary, null, 2)}

New PRs set today: ${sessionPRs.length > 0 ? JSON.stringify(sessionPRs) : 'None'}

Previous sessions for the same exercises (for comparison):
${JSON.stringify(relevantHistory, null, 2)}

Write feedback that is:
- Specific to actual numbers (weight, sets, volume)
- Celebratory if PRs were hit, with a concrete next target
- Honest about volume drops if they occurred (e.g. "volume dropped 15% vs last week — intentional deload or just fatigue?")
- Forward-looking: always end with one concrete target for next session

Respond with JSON only, no markdown:
{
  "headline": "4-8 word punchy summary (e.g. 'Bench PR — now chase 102.5kg')",
  "coachNote": "2-4 sentence specific feedback referencing actual weights and comparing to history",
  "nextTarget": "One concrete actionable target for next session (e.g. 'Aim for 102.5kg × 3 on Bench Press')",
  "newPRs": ["Exercise: Xkg (e.g. Bench Press: 100kg)"]
}`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      system: 'You are a precision strength coach. Always respond with valid JSON only.',
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
