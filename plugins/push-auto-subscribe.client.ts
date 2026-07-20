export default defineNuxtPlugin({
  name: 'push-auto-subscribe',
  enforce: 'pre',
  setup() {
    if (import.meta.client) {
      setTimeout(async () => {
        try {
          const push = usePushNotifications()
          await push.subscribe()
        } catch {}
      }, 2000)
    }
  },
})
