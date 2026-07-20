let fbApp = null
let fbMessaging = null
let firebaseInitPromise = null

function initFirebase() {
  if (fbMessaging || typeof window === 'undefined') return
  if (firebaseInitPromise) return firebaseInitPromise
  firebaseInitPromise = (async () => {
    try {
      const config = useRuntimeConfig().public
      const { initializeApp } = await import('firebase/app')
      const { getMessaging, onMessage } = await import('firebase/messaging')
      fbApp = initializeApp({
        apiKey: config.firebaseApiKey,
        authDomain: config.firebaseAuthDomain,
        projectId: config.firebaseProjectId,
        appId: config.firebaseAppId,
        messagingSenderId: config.firebaseMessagingSenderId,
      })
      fbMessaging = getMessaging(fbApp)
      onMessage(fbMessaging, (payload) => {
        try {
          const nc = useNotificationCenter()
          nc.add({
            title: payload.notification?.title || 'Green Ball',
            body: payload.notification?.body || '',
            url: payload.data?.url || '/',
          })
        } catch {}
      })
    } catch (e) {
      firebaseInitPromise = null
      throw e
    }
  })()
  return firebaseInitPromise
}

export const usePushNotifications = () => {
  const supported = import.meta.client && 'Notification' in window && 'serviceWorker' in navigator

  const permission = ref(import.meta.client && typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const subscribed = ref(false)

  async function requestPermission() {
    if (!supported) return 'denied'
    const result = await Notification.requestPermission()
    permission.value = result
    return result
  }

  async function getFcmToken() {
    if (!supported) return null
    try {
      await initFirebase()
      if (!fbMessaging) return null
      const { getToken } = await import('firebase/messaging')
      const token = await getToken(fbMessaging, {
        vapidKey: useRuntimeConfig().public.firebaseVapidKey,
      })
      return token
    } catch {
      return null
    }
  }

  async function subscribe() {
    if (!supported || permission.value !== 'granted') return null
    const token = await getFcmToken()
    if (!token) return null
    try {
      await $fetch('/api/notifications/subscribe', {
        method: 'POST',
        body: { fcmToken: token },
      })
      subscribed.value = true
    } catch {
      return null
    }
    return token
  }

  async function unsubscribe() {
    const token = await getFcmToken()
    if (token) {
      try {
        await $fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          body: { endpoint: token },
        })
      } catch {}
    }
    if (fbMessaging) {
      try {
        const { deleteToken } = await import('firebase/messaging')
        await deleteToken(fbMessaging)
      } catch {}
    }
    subscribed.value = false
  }

  async function checkSubscription() {
    if (!supported) return
    const token = await getFcmToken()
    if (token) {
      try {
        await $fetch('/api/notifications/check', {
          method: 'POST',
          body: { fcmToken: token },
        })
        subscribed.value = true
      } catch {
        subscribed.value = false
      }
    }
  }

  if (supported && import.meta.client) {
    checkSubscription()
  }

  return { supported, permission, subscribed, requestPermission, subscribe, unsubscribe }
}
