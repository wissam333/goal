export const useMatchPredictions = () => {
  const supabase = useSupabase()
  const { user } = useAuth()
  if (!supabase) throw new Error("Supabase client not available")

  const getUserId = () => {
    if (user.value) return user.value.id
    return null
  }

  const submitPrediction = async (matchSlug, teamSlug) => {
    const uid = getUserId()
    if (!uid) return { error: "login_required" }

    const { data, error } = await supabase
      .from("match_predictions")
      .insert({ match_slug: matchSlug, team_slug: teamSlug, voter_id: uid, user_id: uid })
    return { data, error }
  }

  const getPredictions = async (matchSlug) => {
    const { data, error } = await supabase
      .from("match_predictions")
      .select("team_slug")
      .eq("match_slug", matchSlug)
    if (error || !data) return {}
    return data.reduce((acc, row) => {
      acc[row.team_slug] = (acc[row.team_slug] || 0) + 1
      return acc
    }, {})
  }

  const hasPredicted = async (matchSlug) => {
    const uid = getUserId()
    if (!uid) return false
    const { data } = await supabase
      .from("match_predictions")
      .select("id")
      .eq("match_slug", matchSlug)
      .eq("user_id", uid)
      .maybeSingle()
    return !!data
  }

  const getPredictedTeam = async (matchSlug) => {
    const uid = getUserId()
    if (!uid) return null
    const { data } = await supabase
      .from("match_predictions")
      .select("team_slug")
      .eq("match_slug", matchSlug)
      .eq("user_id", uid)
      .maybeSingle()
    return data?.team_slug || null
  }

  const getUserPredictions = async () => {
    const uid = getUserId()
    if (!uid) return []
    const { data } = await supabase
      .from("match_predictions")
      .select("match_slug, team_slug, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
    return data || []
  }

  return { submitPrediction, getPredictions, hasPredicted, getPredictedTeam, getUserPredictions }
}
