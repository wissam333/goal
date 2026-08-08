export const useStandings = () => {
  const { getTeamOutcome, getOpenPlayScore } = useMatchResult()

  const DEFAULT_RULES = ['pts', 'gd', 'gf']

  const calculateStandings = (teamList, allMatches, rules = DEFAULT_RULES) => {
    if (!teamList || !allMatches) return []
    const groupMatches = allMatches.filter(
      (m) => !['R16', 'QF', 'SF', 'FINAL'].includes(m.group),
    )
    // Striked teams: their matches are excluded from everyone's record
    const struckSlugs = new Set(
      teamList.filter((t) => t.is_struck).map((t) => t.slug),
    )

    const standings = teamList
      .map((team) => {
        const teamMatches = groupMatches.filter(
          (m) =>
            (m.homeTeam === team.slug || m.awayTeam === team.slug) &&
            m.status === "played" &&
            !struckSlugs.has(m.homeTeam) &&
            !struckSlugs.has(m.awayTeam),
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

    // Multi-stage group sort: each rule splits the remaining tied buckets,
    // so h2h (mini-league) always runs among the teams that are actually tied.
    const ruleValue = (rule, t, h2hPts) => {
      if (rule === 'pts') return t.Pts
      if (rule === 'gd') return t.GD
      if (rule === 'gf') return t.GF
      if (rule === 'fairplay') return t.FairPlay
      return h2hPts.get(t.slug) ?? 0
    }
    const ruleCmp = (rule) => (rule === 'fairplay')
      ? (a, b, av, bv) => av - bv
      : (a, b, av, bv) => bv - av

    const sortBucket = (bucket, rule) => {
      let h2hPts = null
      if (rule === 'h2h') {
        h2hPts = new Map()
        for (const t of bucket) {
          let pts = 0
          for (const o of bucket) {
            if (o.slug === t.slug) continue
            const m = groupMatches.find(
              (mm) =>
                (mm.homeTeam === t.slug && mm.awayTeam === o.slug) ||
                (mm.homeTeam === o.slug && mm.awayTeam === t.slug),
            )
            if (m?.status === 'played') {
              const out = getTeamOutcome(m, t.slug)
              if (out === 'W') pts += 3
              else if (out === 'D') pts += 1
            }
          }
          h2hPts.set(t.slug, pts)
        }
      }
      const cmp = ruleCmp(rule)
      const val = (t) => ruleValue(rule, t, h2hPts)
      const sorted = [...bucket].sort((a, b) => cmp(a, b, val(a), val(b)))
      // split into runs with equal rule value → each run is still tied
      const chunks = []
      let start = 0
      for (let i = 1; i <= sorted.length; i++) {
        if (i === sorted.length || val(sorted[i]) !== val(sorted[start])) {
          chunks.push(sorted.slice(start, i))
          start = i
        }
      }
      return chunks
    }

    const sortByRules = (list) => {
      const active = list.filter((t) => !t.is_struck)
      const struck = list.filter((t) => t.is_struck)
      let buckets = [active]
      for (const rule of rules) {
        const next = []
        for (const b of buckets) {
          if (b.length < 2) { next.push(b); continue }
          next.push(...sortBucket(b, rule))
        }
        buckets = next
      }
      return [...buckets.flat(), ...struck]
    }

    return sortByRules(standings)
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
