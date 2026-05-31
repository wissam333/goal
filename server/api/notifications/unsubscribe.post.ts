export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { endpoint } = body
  if (!endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Missing endpoint' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const serviceKey = config.supabaseServiceKey || config.public.supabaseKey
  if (!supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase not configured' })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
    headers: {
      apikey: config.public.supabaseKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })

  if (!res.ok) {
    throw createError({ statusCode: 500, statusMessage: `Unsubscribe failed: ${res.status}` })
  }

  return { ok: true }
})
