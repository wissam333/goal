import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { subscription } = body
  if (!subscription?.endpoint) {
    throw createError({ statusCode: 400, message: 'Missing subscription' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseKey
  )

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys || {},
      user_agent: getHeader(event, 'user-agent') || null,
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true }
})
