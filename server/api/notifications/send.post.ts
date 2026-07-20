import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

function getFirebaseAdmin(config) {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: config.public.firebaseProjectId,
        privateKey: (config.firebasePrivateKey || '').replace(/\\n/g, '\n'),
        clientEmail: config.firebaseClientEmail,
      }),
    })
  }
  return getMessaging()
}

function extractFcmToken(endpoint, keys) {
  if (keys?.type === 'fcm' || !endpoint.includes('/fcm/send/')) return endpoint
  const match = endpoint.match(/\/fcm\/send\/(.+)/)
  return match ? match[1] : null
}

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

    // Fetch all subscriptions
    const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=endpoint,keys`, {
      headers: {
        apikey: config.public.supabaseKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })

    if (!res.ok) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to query push_subscriptions: ${res.status}`,
      })
    }

    const subscriptions = await res.json()
    if (!subscriptions?.length) {
      return { ok: true, sent: 0, message: 'No subscribers.' }
    }

    // Extract FCM tokens from subscriptions (old: URL format, new: raw token)
    const tokens = subscriptions
      .map(s => extractFcmToken(s.endpoint, s.keys))
      .filter(Boolean)

    if (!tokens.length) {
      return { ok: true, sent: 0, message: 'No FCM tokens.' }
    }

    const messaging = getFirebaseAdmin(config)
    const message = {
      data: {
        title,
        body: messageBody || '',
        url: url || '/',
        icon: icon || '/favicon.svg',
      },
    }

    let successCount = 0
    let failureCount = 0

    // Send in batches of 500 (FCM limit)
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500)
      try {
        const result = await messaging.sendEachForMulticast({
          tokens: batch,
          ...message,
        })
        successCount += result.successCount
        failureCount += result.failureCount

        // Remove failed tokens
        for (let j = 0; j < result.responses.length; j++) {
          const resp = result.responses[j]
          if (resp.error) {
            const token = batch[j]
            try {
              // Match either full URL (old subscriptions) or raw token
              await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?or=(endpoint.eq.${encodeURIComponent(token)},endpoint.like.*${encodeURIComponent(token)})`, {
                method: 'DELETE',
                headers: {
                  apikey: config.public.supabaseKey,
                  Authorization: `Bearer ${serviceKey}`,
                },
              })
            } catch {}
          }
        }
      } catch {
        failureCount += batch.length
      }
    }

    return { ok: true, sent: successCount, total: tokens.length }
  } catch (err) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Unknown error',
    })
  }
})
