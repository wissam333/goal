export const useStandings = () => {
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
          const scored = isHome ? (m.homeScore || 0) : (m.awayScore || 0)
          const conceded = isHome ? (m.awayScore || 0) : (m.homeScore || 0)
          GF += scored
          GA += conceded
          if (scored > conceded) {
            W++
            formResults.push("W")
          } else if (scored === conceded) {
            D++
            formResults.push("D")
          } else {
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
