export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { fcmToken } = body
  if (!fcmToken) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fcmToken' })
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

  if (!res.ok) throw createError({ statusCode: 500, statusMessage: 'Check failed' })
  const data = await res.json()
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Not subscribed' })
  return { ok: true }
})
