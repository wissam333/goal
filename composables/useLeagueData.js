const parseJsonFields = (match) => {
  if (typeof match.goalScorers === "string")
    match.goalScorers = JSON.parse(match.goalScorers)
  if (typeof match.photos === "string")
    match.photos = JSON.parse(match.photos)
  if (typeof match.videos === "string")
    match.videos = JSON.parse(match.videos)
  if (typeof match.cards === "string")
    match.cards = JSON.parse(match.cards)
  return match
}

export const useLeagueData = () => {
  const supabase = useSupabase()

  const fromSupabase = async (table, query = {}) => {
    if (!supabase) return null
    try {
      let q = supabase.from(table).select(query.select || "*")
      if (query.eq) for (const [k, v] of Object.entries(query.eq)) q = q.eq(k, v)
      if (query.in)
        for (const { column, values } of query.in) q = q.in(column, values)
      if (query.or)
        for (const condition of query.or) q = q.or(condition)
      if (query.order)
        q = q.order(
          query.order.field,
          query.order.dir ? { ascending: query.order.dir === "asc" } : {},
        )
      if (query.limit) q = q.limit(query.limit)
      const { data, error } = await q
      if (error) throw error
      return data
    } catch {
      return null
    }
  }

  const fetchTeams = async () => {
    const data = await fromSupabase("teams")
    return data || []
  }

  const fetchTeam = async (slug) => {
    const data = await fromSupabase("teams", {
      eq: { slug },
      select: "*",
      limit: 1,
    })
    return data?.length ? data[0] : null
  }

  const fetchPlayers = async (filters = {}) => {
    const query = { select: "*" }
    if (filters.team) query.eq = { team: filters.team }
    if (filters.order) query.order = filters.order
    const data = await fromSupabase("players", query)
    return data || []
  }

  const fetchPlayer = async (slug) => {
    const data = await fromSupabase("players", {
      eq: { slug },
      select: "*",
      limit: 1,
    })
    return data?.length ? data[0] : null
  }

  const fetchMatches = async (filters = {}) => {
    const query = { select: "*" }
    const eqs = {}
    if (filters.status) eqs.status = filters.status
    if (filters.group) eqs.group = filters.group
    if (filters.slug) eqs.slug = filters.slug
    if (Object.keys(eqs).length) query.eq = eqs
    if (filters.orderBy)
      query.order = {
        field: filters.orderBy.field,
        dir: filters.orderBy.dir || "asc",
      }
    if (filters.limit) query.limit = filters.limit
    if (filters.team)
      query.or = [`homeTeam.eq.${filters.team},awayTeam.eq.${filters.team}`]
    if (filters.statusIn)
      query.in = [{ column: "status", values: filters.statusIn }]
    const data = await fromSupabase("matches", query)
    if (data) return data.map(parseJsonFields)
    return []
  }

  const fetchMatch = async (slug) => {
    const matches = await fetchMatches({ slug })
    return matches?.[0] || null
  }

  const fetchManagers = async (teamSlug) => {
    const data = await fromSupabase("managers", {
      select: "*",
      eq: { team_slug: teamSlug },
    })
    return data || []
  }

  const fetchSettings = async () => {
    const data = await fromSupabase("settings", { limit: 1 })
    return data?.length ? data[0] : null
  }

  return {
    fetchTeams,
    fetchTeam,
    fetchPlayers,
    fetchPlayer,
    fetchManagers,
    fetchMatches,
    fetchMatch,
    fetchSettings,
  }
}
