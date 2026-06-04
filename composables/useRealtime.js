export const useRealtime = (table, events = ['*'], filter = {}) => {
  const supabase = useSupabase()
  if (!supabase) return { subscribe: () => {}, unsubscribe: () => {} }

  let channel = null

  function subscribe(callback) {
    if (!import.meta.client) return
    const eventsList = Array.isArray(events) ? events : [events]
    const config = {
      event: eventsList.includes('*') ? '*' : eventsList.join(','),
      schema: 'public',
      table,
    }
    if (filter.column) {
      config.filter = `${filter.column}=eq.${filter.value}`
    }

    channel = supabase.channel(`${table}-${filter.column || 'all'}-${filter.value || 'all'}-${Date.now()}`)
    try {
      channel.on('postgres_changes', config, (payload) => {
        callback(payload)
      }).subscribe()
    } catch {
      // Realtime not available — silent
    }
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return { subscribe, unsubscribe }
}
