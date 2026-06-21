export const useAppTitle = () => {
  const name = ref('')
  const loaded = ref(false)

  const fetch = async () => {
    if (name.value) {
      loaded.value = true
      return
    }
    try {
      const supabase = useSupabase()
      if (!supabase) return
      const { data } = await supabase.from('settings').select('name').limit(1).single()
      if (data?.name) {
        name.value = data.name
      }
    } catch {
      // fallback to i18n value
    } finally {
      loaded.value = true
    }
  }

  if (import.meta.client) {
    onMounted(() => fetch())
  }

  const refresh = () => {
    name.value = ''
    loaded.value = false
    fetch()
  }

  return { name, loaded, fetch, refresh }
}
