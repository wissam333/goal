export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const vapidPublic = config.public.vapidPublicKey
    const vapidPrivate = config.vapidPrivateKey

    if (!vapidPublic || !vapidPrivate) {
      throw createError({ statusCode: 500, statusMessage: 'VAPID keys not configured in .env' })
    }

    const body = await readBody(event)
    const { title, body: messageBody, url, icon } = body
    if (!title) {
      throw createError({ statusCode: 400, statusMessage: 'Missing title' })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey || config.public.supabaseKey
    )

    let subscriptions
    try {
      const res = await supabase.from('push_subscriptions').select('endpoint, keys')
      if (res.error) throw res.error
      subscriptions = res.data
    } catch (dbErr) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to query push_subscriptions table. Run the SQL migration first. ${dbErr.message || dbErr}`,
      })
    }

    if (!subscriptions?.length) {
      return { ok: true, sent: 0, message: 'No subscribers. Open the site and allow notifications.' }
    }

    const webpush = await import('web-push')
    webpush.default.setVapidDetails('mailto:league@example.com', vapidPublic, vapidPrivate)

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
          await webpush.default.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          )
          sent++
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }
      })
    )

    return { ok: true, sent }
  } catch (err) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Unknown error',
    })
  }
})
