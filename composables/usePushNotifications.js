export const usePushNotifications = () => {
  const supported = import.meta.client && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

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
      const { $fcmMessaging } = useNuxtApp()
      if (!$fcmMessaging) return null
      const { getToken } = await import('firebase/messaging')
      const reg = await navigator.serviceWorker.ready
      const vapidKey = useRuntimeConfig().public.firebaseVapidKey
      const token = await getToken($fcmMessaging, {
        vapidKey,
        serviceWorkerRegistration: reg,
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
        body: { fcmToken: token, keys: { type: 'fcm' } },
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
    try {
      const { $fcmMessaging } = useNuxtApp()
      if ($fcmMessaging) {
        const { deleteToken } = await import('firebase/messaging')
        await deleteToken($fcmMessaging)
      }
    } catch {}
    subscribed.value = false
  }

  async function checkSubscription() {
    if (!supported) return
    const token = await getFcmToken()
    if (token) {
      try {
        const res = await $fetch('/api/notifications/check', {
          method: 'POST',
          body: { fcmToken: token },
        })
        subscribed.value = res?.subscribed === true
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
