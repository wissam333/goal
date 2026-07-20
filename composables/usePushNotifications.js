function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

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

  async function getPushSubscription() {
    if (!supported) return null
    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = useRuntimeConfig().public.firebaseVapidKey
      if (!vapidKey) return null
      let subscription = await reg.pushManager.getSubscription()
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }
      return subscription.toJSON()
    } catch {
      return null
    }
  }

  async function subscribe() {
    if (!supported || permission.value !== 'granted') return null
    const sub = await getPushSubscription()
    if (!sub?.endpoint) return null
    try {
      await $fetch('/api/notifications/subscribe', {
        method: 'POST',
        body: sub,
      })
      subscribed.value = true
    } catch {
      return null
    }
    return sub.endpoint
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const json = sub.toJSON()
        await $fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          body: { endpoint: json.endpoint },
        }).catch(() => {})
        await sub.unsubscribe()
      }
    } catch {}
    subscribed.value = false
  }

  async function checkSubscription() {
    if (!supported) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      subscribed.value = !!sub
    } catch {
      subscribed.value = false
    }
  }

  if (supported && import.meta.client) {
    checkSubscription()
  }

  return { supported, permission, subscribed, requestPermission, subscribe, unsubscribe }
}
