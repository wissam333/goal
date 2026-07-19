export const useAppTitle = () => {
  const name = ref('')
  const loaded = ref(false)

  const fetch = async () => {
    if (name.value) {
      loaded.value = true
      return
    }
    try {
      const { league } = useCurrentLeague()
      if (league.value?.name) {
        name.value = league.value.name
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
