export const usePredictionPoints = () => {
  const supabase = useSupabase()
  if (!supabase) throw new Error("Supabase client not available")

  const awardPoints = async (matchSlug) => {
    const { data: match } = await supabase
      .from("matches")
      .select("homeTeam, awayTeam, homeScore, awayScore, homeScoreAET, awayScoreAET, homePenalties, awayPenalties, resultMethod, status")
      .eq("slug", matchSlug)
      .single()

    if (!match || match.status !== "played") return { awarded: 0 }
    if (match.homeScore === null || match.awayScore === null) return { awarded: 0 }

    const allIds = new Set()

    // 1. Award points for correct match predictions (winner or draw)
    // Uses final winner including pens — not a false draw after shootout
    const { getPredictionOutcome } = useMatchResult()
    const predictedTeam = getPredictionOutcome(match)
    if (!predictedTeam) return { awarded: 0 }

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

    if (!allIds.size) return { awarded: 0 }

    for (const uid of allIds) {
      await supabase.rpc("increment_prediction_points", { user_id: uid })
    }

    return { awarded: allIds.size }
  }

  return { awardPoints }
}
