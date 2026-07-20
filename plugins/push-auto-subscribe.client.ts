export default defineNuxtPlugin({
  name: 'push-auto-subscribe',
  enforce: 'pre',
  setup() {
    if (import.meta.client) {
      setTimeout(async () => {
        try {
          const { subscribe } = usePushNotifications()
          await subscribe()
        } catch {}
      }, 2000)
    }
  },
})
