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
    const { exerciseName, dayFocus, equipment, injuries, userRequest } = await req.json()

    const client = new Anthropic()

    const prompt = `You are a strength coach. Suggest ONE exercise to replace "${exerciseName}" in a ${dayFocus} workout.

Equipment: ${EQUIPMENT_LABELS[equipment] || equipment || 'Full gym'}
${injuries ? `Injuries / limitations: ${injuries}` : ''}
${userRequest ? `User request: ${userRequest}` : ''}

- Target similar muscle groups as the original
- Must work with the available equipment
- Avoid injured areas

Respond with JSON only, no markdown:
{"name":"Exercise Name","sets":3,"reps":"8-10","targetWeight":"70kg","notes":"Brief coaching note"}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: 'Respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as any).text
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    return new Response(text, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
