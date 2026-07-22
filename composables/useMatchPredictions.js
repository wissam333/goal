/**
 * Match predictions — logged-in users + guests (localStorage voter_id).
 * Guests submit via Nitro API (bypasses RLS that requires auth.uid()).
 * Logged-in users try direct Supabase first, then API fallback.
 */
export const useMatchPredictions = (leagueId = null) => {
  const supabase = useSupabase()
  const route = useRoute()
  const { user } = useAuth()
  const { getVoterId } = useVoterId()
  const _id = computed(() => leagueId || useCurrentLeague().leagueId.value)
  if (!supabase) throw new Error("Supabase client not available")

  const localKey = (matchSlug) => `prediction_${matchSlug}`

  const _resolveLeague = async () => {
    let lid = _id.value
    if (!lid && route.params.league) {
      const { data } = await supabase
        .from("leagues")
        .select("id")
        .eq("slug", route.params.league)
        .maybeSingle()
      if (data) lid = data.id
    }
    return lid
  }

  const leagueSlugParam = () => {
    const s = route.params.league
    return typeof s === "string" ? s : ""
  }

  const getUserId = () => (user.value ? user.value.id : null)

  const getIdentity = () => {
    const uid = getUserId()
    if (uid) return { kind: "user", voterId: uid, userId: uid }
    const vid = getVoterId()
    if (!vid) return null
    return { kind: "guest", voterId: vid, userId: null }
  }

  const cacheLocal = (matchSlug, teamSlug) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(localKey(matchSlug), teamSlug)
    } catch {
      /* ignore */
    }
  }

  const readLocal = (matchSlug) => {
    if (!import.meta.client) return null
    try {
      return localStorage.getItem(localKey(matchSlug))
    } catch {
      return null
    }
  }

  const submitViaApi = async (matchSlug, teamSlug, identity) => {
    try {
      const res = await $fetch("/api/predictions/submit", {
        method: "POST",
        body: {
          matchSlug,
          teamSlug,
          voterId: identity.voterId,
          userId: identity.userId,
          leagueSlug: leagueSlugParam() || undefined,
        },
      })
      if (res?.ok) {
        cacheLocal(matchSlug, res.team_slug || teamSlug)
        if (res.already) return { error: "already_predicted", team: res.team_slug }
        return { data: res, error: null }
      }
      return { error: "submit_failed" }
    } catch (err) {
      const msg = err?.data?.statusMessage || err?.statusMessage || err?.message
      if (msg === "predictions_closed") return { error: "predictions_closed" }
      return { error: msg || "submit_failed" }
    }
  }

  const submitPrediction = async (matchSlug, teamSlug) => {
    const identity = getIdentity()
    if (!identity) return { error: "no_identity" }

    if (await hasPredicted(matchSlug)) {
      return { error: "already_predicted" }
    }

    // Guests always use API (RLS often blocks anon insert with user_id null)
    if (identity.kind === "guest") {
      return submitViaApi(matchSlug, teamSlug, identity)
    }

    // Logged-in: try direct insert first
    const lid = await _resolveLeague()
    const payload = {
      match_slug: matchSlug,
      team_slug: teamSlug,
      voter_id: identity.voterId,
      user_id: identity.userId,
    }
    if (lid) payload.league_id = lid

    const { data, error } = await supabase
      .from("match_predictions")
      .insert(payload)
      .select()
      .limit(1)

    if (!error) {
      cacheLocal(matchSlug, teamSlug)
      return { data: data?.[0] || data, error: null }
    }

    if (error.code === "23505" || /duplicate|unique/i.test(error.message || "")) {
      return { error: "already_predicted" }
    }

    // RLS / other failures → API with service key
    if (/row-level security|policy|permission|42501/i.test(error.message || "")) {
      return submitViaApi(matchSlug, teamSlug, identity)
    }

    // Last resort API
    const apiRes = await submitViaApi(matchSlug, teamSlug, identity)
    if (!apiRes.error) return apiRes
    return { error: error.message || apiRes.error }
  }

  const getPredictions = async (matchSlug) => {
    const lid = await _resolveLeague()
    let q = supabase
      .from("match_predictions")
      .select("team_slug")
      .eq("match_slug", matchSlug)
    if (lid) q = q.eq("league_id", lid)
    const { data, error } = await q
    if (error || !data) return {}
    return data.reduce((acc, row) => {
      acc[row.team_slug] = (acc[row.team_slug] || 0) + 1
      return acc
    }, {})
  }

  const _queryOwnPrediction = async (matchSlug) => {
    const identity = getIdentity()
    const local = readLocal(matchSlug)

    if (!identity) {
      return local ? { team_slug: local } : null
    }

    const lid = await _resolveLeague()
    let q = supabase
      .from("match_predictions")
      .select("team_slug, user_id, voter_id")
      .eq("match_slug", matchSlug)

    if (lid) q = q.eq("league_id", lid)

    if (identity.kind === "user") {
      q = q.or(`user_id.eq.${identity.userId},voter_id.eq.${identity.voterId}`)
    } else {
      q = q.eq("voter_id", identity.voterId)
    }

    const { data } = await q.limit(1)
    const row = Array.isArray(data) ? data[0] : data
    if (row) {
      cacheLocal(matchSlug, row.team_slug)
      return row
    }
    return local ? { team_slug: local } : null
  }

  const hasPredicted = async (matchSlug) => !!(await _queryOwnPrediction(matchSlug))

  const getPredictedTeam = async (matchSlug) => {
    const row = await _queryOwnPrediction(matchSlug)
    return row?.team_slug || null
  }

  const getUserPredictions = async () => {
    const uid = getUserId()
    if (!uid) return []
    const lid = await _resolveLeague()
    let q = supabase
      .from("match_predictions")
      .select("match_slug, team_slug, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  return {
    submitPrediction,
    getPredictions,
    hasPredicted,
    getPredictedTeam,
    getUserPredictions,
    getIdentity,
  }
}
