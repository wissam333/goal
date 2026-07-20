import { initializeApp, getApps } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const config = useRuntimeConfig().public
  if (!config.firebaseApiKey || !config.firebaseProjectId) return

  if (!getApps().length) {
    initializeApp({
      apiKey: config.firebaseApiKey,
      authDomain: config.firebaseAuthDomain,
      projectId: config.firebaseProjectId,
      appId: config.firebaseAppId,
      messagingSenderId: config.firebaseMessagingSenderId,
    })
  }

  const messaging = getMessaging()
  return { provide: { fcmMessaging: messaging } }
})
