const PREDICTION_KEY_PREFIX = 'prediction_'

export const useMatchPredictions = () => {
  const supabase = useSupabase()
  const { getVoterId } = useVoterId()
  if (!supabase) throw new Error("Supabase client not available")

  const submitPrediction = async (matchSlug, teamSlug) => {
    const key = `${PREDICTION_KEY_PREFIX}${matchSlug}`
    if (process.client && localStorage.getItem(key)) {
      return { error: "already_predicted" }
    }
    const voterId = getVoterId()
    if (!voterId) return { data: null, error: "no_voter_id" }

    const { data, error } = await supabase
      .from("match_predictions")
      .insert({ match_slug: matchSlug, team_slug: teamSlug, voter_id: voterId })
    if (!error && process.client) {
      localStorage.setItem(key, teamSlug)
    }
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
    if (process.client && localStorage.getItem(`${PREDICTION_KEY_PREFIX}${matchSlug}`)) {
      return true
    }
    const voterId = getVoterId()
    if (!voterId) return false
    const { data } = await supabase
      .from("match_predictions")
      .select("id")
      .eq("match_slug", matchSlug)
      .eq("voter_id", voterId)
      .maybeSingle()
    if (data) {
      if (process.client) {
        localStorage.setItem(`${PREDICTION_KEY_PREFIX}${matchSlug}`, 'true')
      }
      return true
    }
    return false
  }

  const getPredictedTeam = (matchSlug) => {
    if (!process.client) return null
    return localStorage.getItem(`${PREDICTION_KEY_PREFIX}${matchSlug}`)
  }

  return { submitPrediction, getPredictions, hasPredicted, getPredictedTeam }
}
