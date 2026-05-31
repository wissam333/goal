import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { endpoint } = body
  if (!endpoint) {
    throw createError({ statusCode: 400, message: 'Missing endpoint' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseKey
  )

  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return { ok: true }
})
