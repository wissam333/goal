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
      return { ok: true, sent: 0, message: 'No subscribers.' }
    }

    const payload = {
      title,
      body: messageBody || '',
      icon: icon || '/logo.png',
      badge: '/favicon.svg',
      data: { url: url || '/' },
    }

    let sent = 0
    const errors = []

    // Try web-push (works on Node.js/Vercel), fall back to Web Crypto (Cloudflare Workers)
    try {
      const webPush = await import('web-push').then(m => m.default || m)
      webPush.setVapidDetails(
        'mailto:admin@example.com',
        config.public.vapidPublicKey,
        config.vapidPrivateKey
      )
      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              JSON.stringify(payload),
              { TTL: 86400 }
            )
            sent++
          } catch (e) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
                method: 'DELETE',
                headers: { apikey: config.public.supabaseKey, Authorization: `Bearer ${serviceKey}` },
              })
            } else {
              errors.push(`ep=${(sub.endpoint || '').slice(0, 50)} status=${e.statusCode || 0}`)
            }
          }
        })
      )
    } catch {
      // web-push not available (Cloudflare Workers) — use Web Crypto fallback
      const origin = new URL(subscriptions[0].endpoint).origin
      const vapidAuth = await createVapidAuth(config.vapidPrivateKey, config.public.vapidPublicKey, origin)
      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            const result = await sendPush(sub, payload, vapidAuth)
            if (result.ok) { sent++ }
            else if (result.status === 410 || result.status === 404) {
              await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
                method: 'DELETE',
                headers: { apikey: config.public.supabaseKey, Authorization: `Bearer ${serviceKey}` },
              })
            } else {
              errors.push(`ep=${(sub.endpoint || '').slice(0, 50)} status=${result.status}`)
            }
          } catch (e) {
            errors.push(`ep=${(sub.endpoint || '').slice(0, 50)} err=${e?.message || e}`)
          }
        })
      )
    }

    return { ok: true, sent, total: subscriptions.length, errors: errors.length ? errors : undefined }
  } catch (err) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Unknown error',
    })
  }
})
