export const useStandings = () => {
  const { getTeamOutcome, getOpenPlayScore } = useMatchResult()

  const calculateStandings = (teamList, allMatches) => {
    if (!teamList || !allMatches) return []
    return teamList
      .map((team) => {
        const teamMatches = allMatches.filter(
          (m) =>
            (m.homeTeam === team.slug || m.awayTeam === team.slug) &&
            m.status === "played",
        )

        let W = 0, D = 0, L = 0, GF = 0, GA = 0
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
          form: formResults.slice(0, 5).reverse(),
        }
      })
      .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
  }

  const getGroupStandings = (group, teams, matches) => {
    if (!teams || !matches) return []
    const groupTeams = teams.filter((t) => (t.group || "A") === group)
    return calculateStandings(groupTeams, matches)
  }

  const standingsMap = (teamList, allMatches) => {
    if (!teamList || !allMatches) return {}
    const arr = calculateStandings(teamList, allMatches)
    const map = {}
    arr.forEach((s) => { map[s.slug] = s })
    return map
  }

  return { calculateStandings, getGroupStandings, standingsMap }
}
