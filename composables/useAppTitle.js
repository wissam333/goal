let cachedName = null
const name = ref('')
const loaded = ref(false)

export const useAppTitle = () => {
  if (cachedName) {
    name.value = cachedName
  }

  const fetch = async () => {
    if (cachedName) {
      name.value = cachedName
      loaded.value = true
      return
    }
    try {
      const supabase = useSupabase()
      if (!supabase) return
      const { data } = await supabase.from('settings').select('name').limit(1).single()
      if (data?.name) {
        cachedName = data.name
        name.value = data.name
      }
    } catch {
      // fallback to i18n value
    } finally {
      loaded.value = true
    }
  }

  if (import.meta.client && !cachedName) {
    onMounted(() => fetch())
  }

  const refresh = () => {
    cachedName = null
    name.value = ''
    loaded.value = false
    fetch()
  }

  return { name, loaded, fetch, refresh }
}
