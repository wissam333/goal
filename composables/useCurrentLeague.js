const RESERVED_SLUGS = new Set([
  'admin', 'account', 'install', 'api', 'auth',
  'login', 'logout', 'assets', 'static', 'sw',
  'manifest', 'robots', 'favicon', 'og', 'notifications',
])

export const useCurrentLeague = () => {
  const route = useRoute()
  const supabase = useSupabase()

  const league = ref(null)
  const pending = ref(true)
  const error = ref(null)

  const leagueSlug = computed(() => {
    const slug = route.params.league
    if (!slug || typeof slug !== 'string') return null
    if (RESERVED_SLUGS.has(slug)) return null
    return slug
  })

  const leagueId = computed(() => league.value?.id || null)

  const isLeagueRoute = computed(() => !!leagueSlug.value)

  const fetch = async () => {
    const slug = leagueSlug.value
    if (!slug) {
      league.value = null
      pending.value = false
      return
    }
    pending.value = true
    error.value = null
    try {
      if (!supabase) { pending.value = false; return }
      const { data } = await supabase.from('leagues').select('*').eq('slug', slug).maybeSingle()
      if (!data) {
        error.value = 'not_found'
        league.value = null
      } else {
        league.value = data
      }
    } catch (e) {
      error.value = e.message
      league.value = null
    } finally {
      pending.value = false
    }
  }

  const leaguePath = (path) => {
    const slug = leagueSlug.value
    if (!slug) return path || '/'
    const p = path || '/'
    return `/${slug}${p.startsWith('/') ? p : '/' + p}`
  }

  if (import.meta.client) {
    watch(() => route.params.league, fetch, { immediate: !import.meta.client })
    onMounted(() => { if (!league.value) fetch() })
  }

  return { league, leagueId, leagueSlug, isLeagueRoute, pending, error, fetch, leaguePath }
}
