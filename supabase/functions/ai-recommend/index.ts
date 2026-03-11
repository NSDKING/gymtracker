import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sessions, exercises } = await req.json()

    const client = new Anthropic()

    // Build a compact summary of recent training
    const recentSessions = sessions.slice(0, 10).map((s: any) => ({
      date: s.date,
      exercises: s.entries.map((e: any) => ({
        name: e.exercise.name,
        muscle: e.exercise.muscle,
        sets: e.sets.length,
        maxWeight: Math.max(...e.sets.map((set: any) => set.weight)),
      }))
    }))

    const prompt = `You are an expert strength coach. Analyze this athlete's recent training history and give short, specific recommendations.

Training history (most recent first):
${JSON.stringify(recentSessions, null, 2)}

Respond with JSON only, no markdown, in this exact format:
{
  "recommendation": "2-3 sentence recommendation on what to train next and why",
  "focus": "the main muscle group or movement pattern to prioritize",
  "suggestedExercises": ["exercise1", "exercise2", "exercise3"],
  "restWarning": "null or a short warning if a muscle group is being overtrained"
}`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
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