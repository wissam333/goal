export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { title, body: messageBody, url, icon } = body
    if (!title) {
      throw createError({ statusCode: 400, statusMessage: 'Missing title' })
    }

    const supabaseUrl = config.public.supabaseUrl
    const serviceKey = config.supabaseServiceKey
    if (!supabaseUrl || !serviceKey) {
      throw createError({ statusCode: 500, statusMessage: 'Supabase not configured' })
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=endpoint,keys`, {
      headers: {
        apikey: config.public.supabaseKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })

    if (!res.ok) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to query push_subscriptions: ${res.status}. Run SQL migration first.`,
      })
    }

    const subscriptions = await res.json()
    if (!subscriptions?.length) {
      return { ok: true, sent: 0, message: 'No subscribers. Open the site and allow notifications.' }
    }

    const payload = {
      title,
      body: messageBody || '',
      icon: icon || '/logo.png',
      badge: '/favicon.svg',
      data: { url: url || '/' },
    }

    // Create VAPID auth once (all FCM endpoints share same origin)
    const origin = new URL(subscriptions[0].endpoint).origin
    const vapidAuth = await createVapidAuth(
      config.vapidPrivateKey,
      config.public.vapidPublicKey,
      origin
    )

    let sent = 0
    const errors = []
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const shortEndpoint = (sub.endpoint || '').slice(0, 60)
        try {
          const result = await sendPush(sub, payload, vapidAuth)
          if (result.ok) {
            sent++
          } else if (result.status === 410 || result.status === 404) {
            await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
              method: 'DELETE',
              headers: {
                apikey: config.public.supabaseKey,
                Authorization: `Bearer ${serviceKey}`,
              },
            })
          } else {
            errors.push(`ep=${shortEndpoint} status=${result.status}`)
          }
        } catch (e) {
          errors.push(`ep=${shortEndpoint} err=${e?.message || e}`)
        }
      })
    )

    return { ok: true, sent, total: subscriptions.length, errors: errors.length ? errors : undefined }
  } catch (err) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Unknown error',
    })
  }
})
