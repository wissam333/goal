const STORAGE_KEY = 'league-notifications'

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

  function add(notif) {
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
    notifications.value = notifications.value.filter(n => n.id !== id)
    save()
  }

  function clear() {
    notifications.value = []
    save()
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  if (import.meta.client) load()

  return { notifications, unreadCount, add, markAsRead, markAllRead, remove, clear }
}
