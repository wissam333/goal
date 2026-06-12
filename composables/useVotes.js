export const useVotes = () => {
  const supabase = useSupabase()
  const { user } = useAuth()
  if (!supabase) throw new Error("Supabase client not available")

  const getUserId = () => {
    if (user.value) return user.value.id
    return null
  }

  const submitVote = async (matchSlug, playerSlug) => {
    const uid = getUserId()
    if (!uid) return { error: "login_required" }

    const { data, error } = await supabase
      .from("votes")
      .insert({ match_slug: matchSlug, player_slug: playerSlug, voter_id: uid, user_id: uid })
    return { data, error }
  }

  const getVotes = async (matchSlug) => {
    const { data, error } = await supabase
      .from("votes")
      .select("player_slug")
      .eq("match_slug", matchSlug)
    if (error || !data) return {}
    return data.reduce((acc, row) => {
      acc[row.player_slug] = (acc[row.player_slug] || 0) + 1
      return acc
    }, {})
  }

  const hasVoted = async (matchSlug) => {
    const uid = getUserId()
    if (!uid) return false
    const { data } = await supabase
      .from("votes")
      .select("id")
      .eq("match_slug", matchSlug)
      .eq("user_id", uid)
      .maybeSingle()
    return !!data
  }

  const getUserVotes = async () => {
    const uid = getUserId()
    if (!uid) return []
    const { data } = await supabase
      .from("votes")
      .select("match_slug, player_slug, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
    return data || []
  }

  return { submitVote, getVotes, hasVoted, getUserVotes }
}
