export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { fcmToken } = body
  if (!fcmToken) {
    return { ok: false, subscribed: false }
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const serviceKey = config.supabaseServiceKey || config.public.supabaseKey

  const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(fcmToken)}&select=id`, {
    headers: {
      apikey: config.public.supabaseKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })

  if (!res.ok) return { ok: false, subscribed: false }
  const data = await res.json()
  return { ok: true, subscribed: data?.length > 0 }
})
