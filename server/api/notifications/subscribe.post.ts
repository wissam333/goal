export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { fcmToken, keys } = body
  if (!fcmToken) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fcmToken' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const anonKey = config.public.supabaseKey
  const serviceKey = config.supabaseServiceKey
  if (!supabaseUrl || !anonKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase not configured' })
  }

  const auth = serviceKey ? `Bearer ${serviceKey}` : `Bearer ${anonKey}`

  // Clean up old subscription for this FCM token
  await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(fcmToken)}`, {
    method: 'DELETE',
    headers: { apikey: anonKey, Authorization: auth },
  })

  // Insert new FCM subscription
  const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: auth,
    },
    body: JSON.stringify({
      endpoint: fcmToken,
      keys: keys || { type: 'fcm' },
      user_agent: getHeader(event, 'user-agent') || null,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown')
    throw createError({ statusCode: 500, statusMessage: `Subscribe failed (${res.status}): ${text}` })
  }

  return { ok: true }
})
