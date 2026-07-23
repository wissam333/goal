export const useVotes = (leagueId = null) => {
  const supabase = useSupabase()
  const route = useRoute()
  const { user } = useAuth()
  const _id = computed(() => leagueId || useCurrentLeague().leagueId.value)
  if (!supabase) throw new Error("Supabase client not available")

  const leagueSlug = () => {
    const s = route.params.league
    return typeof s === "string" ? s : ""
  }

  const prefixSlug = (s) => {
    const ls = leagueSlug()
    if (!ls || !s) return s
    const p = ls + '::'
    return s.startsWith(p) ? s : p + s
  }

  const _resolveLeague = async () => {
    let lid = _id.value
    if (!lid && route.params.league) {
      const { data } = await supabase.from('leagues').select('id').eq('slug', route.params.league).maybeSingle()
      if (data) lid = data.id
    }
    return lid
  }

  const getUserId = () => {
    if (user.value) return user.value.id
    return null
  }

  const submitVote = async (matchSlug, playerSlug) => {
    const uid = getUserId()
    if (!uid) return { error: "login_required" }
    const lid = await _resolveLeague()
    const payload = { match_slug: prefixSlug(matchSlug), player_slug: prefixSlug(playerSlug), voter_id: uid, user_id: uid }
    if (lid) payload.league_id = lid
    const { data, error } = await supabase.from("votes").insert(payload)
    return { data, error }
  }

  const getVotes = async (matchSlug) => {
    const lid = await _resolveLeague()
    const ls = leagueSlug()
    let q = supabase.from("votes").select("player_slug").eq("match_slug", prefixSlug(matchSlug))
    if (lid) q = q.eq("league_id", lid)
    const { data, error } = await q
    if (error || !data) return {}
    const pfx = ls ? ls + '::' : ''
    return data.reduce((acc, row) => {
      const clean = pfx && row.player_slug?.startsWith(pfx) ? row.player_slug.slice(pfx.length) : row.player_slug
      acc[clean] = (acc[clean] || 0) + 1
      return acc
    }, {})
  }

  const hasVoted = async (matchSlug) => {
    const uid = getUserId()
    if (!uid) return false
    const lid = await _resolveLeague()
    let q = supabase.from("votes").select("id").eq("match_slug", prefixSlug(matchSlug)).eq("user_id", uid)
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q.maybeSingle()
    return !!data
  }

  const getUserVotes = async () => {
    const uid = getUserId()
    if (!uid) return []
    const lid = await _resolveLeague()
    let q = supabase.from("votes").select("match_slug, player_slug, created_at").eq("user_id", uid).order("created_at", { ascending: false })
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  return { submitVote, getVotes, hasVoted, getUserVotes }
}
