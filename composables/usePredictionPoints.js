export const usePredictionPoints = () => {
  const supabase = useSupabase()
  if (!supabase) throw new Error("Supabase client not available")

  const awardPoints = async (matchSlug) => {
    const { data: match } = await supabase
      .from("matches")
      .select("homeTeam, awayTeam, homeScore, awayScore, motmWinner, status")
      .eq("slug", matchSlug)
      .single()

    if (!match || match.status !== "played") return { awarded: 0 }
    if (match.homeScore === null || match.awayScore === null) return { awarded: 0 }

    const allIds = new Set()

    // 1. Award points for correct match predictions (winner or draw)
    const homeScore = Number(match.homeScore)
    const awayScore = Number(match.awayScore)

    let predictedTeam = null
    if (homeScore > awayScore) predictedTeam = match.homeTeam
    else if (awayScore > homeScore) predictedTeam = match.awayTeam
    else predictedTeam = "__draw__"

    const { data: predictions } = await supabase
      .from("match_predictions")
      .select("user_id")
      .eq("match_slug", matchSlug)
      .eq("team_slug", predictedTeam)

    if (predictions?.length) {
      for (const p of predictions) {
        if (p.user_id) allIds.add(p.user_id)
      }
    }

    // 2. Award points for correct MOTM predictions
    if (match.motmWinner) {
      const { data: votes } = await supabase
        .from("votes")
        .select("user_id")
        .eq("match_slug", matchSlug)
        .eq("player_slug", match.motmWinner)

      if (votes?.length) {
        for (const v of votes) {
          if (v.user_id) allIds.add(v.user_id)
        }
      }
    }

    if (!allIds.size) return { awarded: 0 }

    for (const uid of allIds) {
      await supabase.rpc("increment_prediction_points", { user_id: uid })
    }

    return { awarded: allIds.size }
  }

  return { awardPoints }
}
