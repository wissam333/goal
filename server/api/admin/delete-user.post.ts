import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { userId } = await readBody(event)
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'Missing userId' })

  const supabase = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

  const { error: votesErr } = await supabase.from('votes').delete().eq('user_id', userId)
  if (votesErr) throw createError({ statusCode: 500, statusMessage: votesErr.message })

  const { error: predsErr } = await supabase.from('match_predictions').delete().eq('user_id', userId)
  if (predsErr) throw createError({ statusCode: 500, statusMessage: predsErr.message })

  const { error: authErr } = await supabase.auth.admin.deleteUser(userId)
  if (authErr) throw createError({ statusCode: 500, statusMessage: authErr.message })

  return { ok: true }
})
