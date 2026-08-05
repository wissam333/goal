export const useStandings = () => {
  const { getTeamOutcome, getOpenPlayScore, getWinnerSlug } = useMatchResult()

  const DEFAULT_RULES = ['pts', 'gd', 'gf']

  const calculateStandings = (teamList, allMatches, rules = DEFAULT_RULES) => {
    if (!teamList || !allMatches) return []
    const groupMatches = allMatches.filter(
      (m) => !['R16', 'QF', 'SF', 'FINAL'].includes(m.group),
    )

    const standings = teamList
      .map((team) => {
        const teamMatches = groupMatches.filter(
          (m) =>
            (m.homeTeam === team.slug || m.awayTeam === team.slug) &&
            m.status === "played",
        )

        let W = 0, D = 0, L = 0, GF = 0, GA = 0
        let fairPlay = 0
        const formResults = []

        const sorted = [...teamMatches].sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        )

        sorted.forEach((m) => {
          const isHome = m.homeTeam === team.slug
          // GF/GA from open-play (regulation or AET totals) — never pens
          const open = getOpenPlayScore(m)
          const scored = isHome ? (open.home || 0) : (open.away || 0)
          const conceded = isHome ? (open.away || 0) : (open.home || 0)
          GF += scored
          GA += conceded

          // Fair play: yellow=1, red=3 (lower is better)
          for (const c of (m.cards || [])) {
            if (c.team === team.slug) fairPlay += c.type === 'red' ? 3 : 1
          }

          // W/D/L from final winner (includes penalties)
          const outcome = getTeamOutcome(m, team.slug)
          if (outcome === "W") {
            W++
            formResults.push("W")
          } else if (outcome === "D") {
            D++
            formResults.push("D")
          } else if (outcome === "L") {
            L++
            formResults.push("L")
          }
        })

        return {
          ...team,
          P: W + D + L,
          W,
          D,
          L,
          GF,
          GA,
          GD: GF - GA,
          Pts: W * 3 + D,
          FairPlay: fairPlay,
          form: formResults.slice(0, 5).reverse(),
        }
      })

    const compare = (a, b) => {
      for (const rule of rules) {
        let diff = 0
        if (rule === 'pts') diff = b.Pts - a.Pts
        else if (rule === 'gd') diff = b.GD - a.GD
        else if (rule === 'gf') diff = b.GF - a.GF
        else if (rule === 'fairplay') diff = a.FairPlay - b.FairPlay
        else if (rule === 'h2h') {
          // winner of the direct match between the two teams ranks higher
          const direct = groupMatches.find((m) =>
            (m.homeTeam === a.slug && m.awayTeam === b.slug) ||
            (m.homeTeam === b.slug && m.awayTeam === a.slug),
          )
          if (direct?.status === 'played') {
            const winner = getWinnerSlug(direct)
            if (winner === a.slug) diff = -1
            else if (winner === b.slug) diff = 1
          }
        }
        if (diff !== 0) return diff
      }
      return 0
    }

    return standings.sort(compare)
  }

  const getGroupStandings = (group, teams, matches, rules) => {
    if (!teams || !matches) return []
    const groupTeams = teams.filter((t) => (t.group || "A") === group)
    return calculateStandings(groupTeams, matches, rules)
  }

  const standingsMap = (teamList, allMatches, rules) => {
    if (!teamList || !allMatches) return {}
    const arr = calculateStandings(teamList, allMatches, rules)
    const map = {}
    arr.forEach((s) => { map[s.slug] = s })
    return map
  }

  return { calculateStandings, getGroupStandings, standingsMap, DEFAULT_RULES }
}
