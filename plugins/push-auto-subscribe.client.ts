export default defineNuxtPlugin({
  name: 'push-auto-subscribe',
  enforce: 'pre',
  setup() {
    if (!import.meta.client) return

    const ok = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    if (!ok) return

    function b64(s) {
      const p = '='.repeat((4 - s.length % 4) % 4)
      const b = (s + p).replace(/-/g, '+').replace(/_/g, '/')
      const r = atob(b)
      return Uint8Array.from(Array.from(r).map(c => c.charCodeAt(0)))
    }

    async function sub() {
      try {
        const reg = await navigator.serviceWorker.ready
        const key = window.__VAPID_KEY
        if (!key) return
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64(key),
        })
        const subRes = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })
        if (!subRes.ok) {
          const text = await subRes.text().catch(() => 'unknown')
          throw new Error(`Server (${subRes.status}): ${text}`)
        }
      } catch (err) {
        console.warn('[Push] subscribe error:', err instanceof Error ? err.message : err)
      }
    }

    if (Notification.permission === 'granted') {
      setTimeout(sub, 500)
    } else if (Notification.permission === 'default') {
      setTimeout(async () => {
        const r = await Notification.requestPermission()
        if (r === 'granted') sub()
      }, 1000)
    }
  },
})
