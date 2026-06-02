const STORAGE_KEY = 'league-notifications'
const DELETED_KEY = 'league-deleted-notifications'

function getDeletedKeys() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]') } catch { return [] }
}

function markDeleted(key) {
  const list = getDeletedKeys()
  if (!list.includes(key)) {
    list.push(key)
    try { localStorage.setItem(DELETED_KEY, JSON.stringify(list)) } catch {}
  }
}

export const useNotificationCenter = () => {
  const notifications = ref([])

  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      notifications.value = raw ? JSON.parse(raw) : []
    } catch {
      notifications.value = []
    }
  }

  function save() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.value))
  }

  function makeKey(n) {
    return (n.url || '') + (n.body || '') + (n.title || '')
  }

  function add(notif) {
    const key = makeKey(notif)
    if (getDeletedKeys().includes(key)) return
    notifications.value.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      read: false,
      createdAt: new Date().toISOString(),
      ...notif,
    })
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
    save()
  }

  function markAsRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) { n.read = true; save() }
  }

  function markAllRead() {
    notifications.value.forEach(n => { n.read = true })
    save()
  }

  function remove(id) {
    const removed = notifications.value.find(n => n.id === id)
    if (removed) markDeleted(makeKey(removed))
    notifications.value = notifications.value.filter(n => n.id !== id)
    save()
  }

  function clear() {
    notifications.value.forEach(n => markDeleted(makeKey(n)))
    notifications.value = []
    save()
  }

  async function fetchFromSW() {
    if (!import.meta.client || !('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const channel = new MessageChannel()
      const promise = new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data?.type === 'PUSH_NOTIFICATIONS') {
            resolve(event.data.notifications || [])
          }
        }
      })
      reg.active?.postMessage({ type: 'GET_PUSH_NOTIFICATIONS' }, [channel.port2])
      const swNotifs = await promise
      const existingIds = new Set(notifications.value.map(n => n.url + n.body))
      let added = 0
      for (const n of swNotifs) {
        const key = (n.url || '') + (n.body || '')
        if (existingIds.has(key)) continue
        if (getDeletedKeys().includes(key)) continue
        add({ ...n, fromSW: true })
        existingIds.add(key)
        added++
      }
      if (added > 0) save()
    } catch {
      // SW not available
    }
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  if (import.meta.client) {
    load()
    fetchFromSW()
    // Listen for live push notifications from Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NEW_PUSH_NOTIFICATION') {
          add(event.data.notification)
        }
      })
    }
  }

  return { notifications, unreadCount, add, markAsRead, markAllRead, remove, clear, fetchFromSW }
}
