export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const serviceKey = config.supabaseServiceKey

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: 'Not configured', hasServiceKey: !!serviceKey, url: !!supabaseUrl }
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=id,endpoint,keys&limit=5`, {
    headers: {
      apikey: config.public.supabaseKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })

  const body = await res.text().catch(() => 'unknown')

  return {
    ok: res.ok,
    status: res.status,
    subscriptions: res.ok ? JSON.parse(body) : [],
    raw: res.ok ? null : body,
  }
})
