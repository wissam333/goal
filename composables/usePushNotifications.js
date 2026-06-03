export const usePushNotifications = () => {
  const supported = import.meta.client && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

  const permission = ref(import.meta.client && typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const subscribed = ref(false)
  const swReady = ref(false)

  async function getReg() {
    if (!supported) return null
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(r => setTimeout(() => r(null), 5000)),
      ])
      swReady.value = !!reg
      return reg
    } catch {
      return null
    }
  }

  async function requestPermission() {
    if (!supported) return 'denied'
    const result = await Notification.requestPermission()
    permission.value = result
    return result
  }

  async function getSubscription() {
    const reg = await getReg()
    if (!reg) return null
    return reg.pushManager.getSubscription()
  }

  async function subscribe() {
    if (!supported || permission.value !== 'granted') return null
    const key = window.__VAPID_KEY
    if (!key) return null
    const reg = await getReg()
    if (!reg) return null
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    })
    await $fetch('/api/notifications/subscribe', {
      method: 'POST',
      body: { subscription: sub.toJSON() },
    })
    subscribed.value = true
    return sub
  }

  async function unsubscribe() {
    const sub = await getSubscription()
    if (sub) {
      await sub.unsubscribe()
      await $fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        body: { endpoint: sub.endpoint },
      })
    }
    subscribed.value = false
  }

  if (supported && import.meta.client) {
    getSubscription().then(sub => { subscribed.value = !!sub })
  }

  return { supported, permission, subscribed, swReady, requestPermission, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)))
}
