export const useMatchPredictions = (leagueId = null) => {
  const supabase = useSupabase()
  const route = useRoute()
  const { user } = useAuth()
  const _id = computed(() => leagueId || useCurrentLeague().leagueId.value)
  if (!supabase) throw new Error("Supabase client not available")

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

  const submitPrediction = async (matchSlug, teamSlug) => {
    const uid = getUserId()
    if (!uid) return { error: "login_required" }
    const lid = await _resolveLeague()
    const payload = { match_slug: matchSlug, team_slug: teamSlug, voter_id: uid, user_id: uid }
    if (lid) payload.league_id = lid
    const { data, error } = await supabase.from("match_predictions").insert(payload)
    return { data, error }
  }

  const getPredictions = async (matchSlug) => {
    const lid = await _resolveLeague()
    let q = supabase.from("match_predictions").select("team_slug").eq("match_slug", matchSlug)
    if (lid) q = q.eq("league_id", lid)
    const { data, error } = await q
    if (error || !data) return {}
    return data.reduce((acc, row) => {
      acc[row.team_slug] = (acc[row.team_slug] || 0) + 1
      return acc
    }, {})
  }

  const hasPredicted = async (matchSlug) => {
    const uid = getUserId()
    if (!uid) return false
    const lid = await _resolveLeague()
    let q = supabase.from("match_predictions").select("id").eq("match_slug", matchSlug).eq("user_id", uid)
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q.maybeSingle()
    return !!data
  }

  const getPredictedTeam = async (matchSlug) => {
    const uid = getUserId()
    if (!uid) return null
    const lid = await _resolveLeague()
    let q = supabase.from("match_predictions").select("team_slug").eq("match_slug", matchSlug).eq("user_id", uid)
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q.maybeSingle()
    return data?.team_slug || null
  }

  const getUserPredictions = async () => {
    const uid = getUserId()
    if (!uid) return []
    const lid = await _resolveLeague()
    let q = supabase.from("match_predictions").select("match_slug, team_slug, created_at").eq("user_id", uid).order("created_at", { ascending: false })
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  return { submitPrediction, getPredictions, hasPredicted, getPredictedTeam, getUserPredictions }
}
