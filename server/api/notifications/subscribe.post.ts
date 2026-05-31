export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { subscription } = body
  if (!subscription?.endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Missing subscription' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const serviceKey = config.supabaseServiceKey || config.public.supabaseKey
  if (!supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase not configured' })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.public.supabaseKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.keys || {},
      user_agent: getHeader(event, 'user-agent') || null,
    }),
  })

  if (!res.ok) {
    throw createError({ statusCode: 500, statusMessage: `Subscribe failed: ${res.status}` })
  }

  return { ok: true }
})
