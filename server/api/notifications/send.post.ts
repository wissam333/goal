import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const vapidPublic = config.public.vapidPublicKey
  const vapidPrivate = config.vapidPrivateKey

  if (!vapidPublic || !vapidPrivate) {
    throw createError({ statusCode: 500, message: 'VAPID keys not configured' })
  }

  webpush.setVapidDetails('mailto:league@example.com', vapidPublic, vapidPrivate)

  const body = await readBody(event)
  const { title, body: messageBody, url, icon } = body
  if (!title) {
    throw createError({ statusCode: 400, message: 'Missing title' })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseKey
  )

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')

  if (!subscriptions?.length) {
    return { ok: true, sent: 0 }
  }

  const payload = JSON.stringify({
    title,
    body: messageBody || '',
    icon: icon || '/logo.png',
    badge: '/favicon.svg',
    data: { url: url || '/' },
  })

  let sent = 0
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
        sent++
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    })
  )

  return { ok: true, sent }
})
