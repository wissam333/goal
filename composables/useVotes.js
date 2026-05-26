export const useVotes = () => {
  const supabase = useSupabase()
  const { getVoterId } = useVoterId()
  if (!supabase) throw new Error("Supabase client not available")

  const submitVote = async (matchSlug, playerSlug) => {
    const voteKey = `vote_${matchSlug}`
    if (process.client && localStorage.getItem(voteKey)) {
      return { error: "already_voted" }
    }
    const voterId = getVoterId()
    if (!voterId) return { data: null, error: "no_voter_id" }

    const { data, error } = await supabase
      .from("votes")
      .insert({ match_slug: matchSlug, player_slug: playerSlug, voter_id: voterId })
    if (!error && process.client) {
      localStorage.setItem(voteKey, playerSlug)
    }
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
    if (process.client && localStorage.getItem(`vote_${matchSlug}`)) {
      return true
    }
    const voterId = getVoterId()
    if (!voterId) return false
    const { data } = await supabase
      .from("votes")
      .select("id")
      .eq("match_slug", matchSlug)
      .eq("voter_id", voterId)
      .maybeSingle()
    if (data) {
      if (process.client) {
        localStorage.setItem(`vote_${matchSlug}`, 'true')
      }
      return true
    }
    return false
  }

  return { submitVote, getVotes, hasVoted }
}
