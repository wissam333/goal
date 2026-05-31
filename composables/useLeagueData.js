const parseJsonFields = (match) => {
  if (typeof match.goalScorers === "string")
    match.goalScorers = JSON.parse(match.goalScorers)
  if (typeof match.photos === "string")
    match.photos = JSON.parse(match.photos)
  if (typeof match.cards === "string")
    match.cards = JSON.parse(match.cards)
  return match
}

const isClient = typeof localStorage !== "undefined"

const CACHE_PREFIX = "league-data-"

const cacheKey = (table, season) => `${CACHE_PREFIX}${season}-${table}`

const readCache = (table, season) => {
  if (!isClient) return null
  try {
    const raw = localStorage.getItem(cacheKey(table, season))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeCache = (table, season, data) => {
  if (!isClient) return
  try {
    localStorage.setItem(cacheKey(table, season), JSON.stringify(data))
  } catch {}
}

export const useLeagueData = () => {
  const supabase = useSupabase()
  const config = useRuntimeConfig()
  const season = config.public.season || "default"

  const fromSupabase = async (table, query = {}) => {
    if (!supabase) return readCache(table, season)
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
      return readCache(table, season)
    }
  }

  const fetchTeams = async () => {
    const data = await fromSupabase("teams")
    if (data) {
      writeCache("teams", season, data)
      return data
    }
    return readCache("teams", season) || []
  }

  const fetchTeam = async (slug) => {
    const data = await fromSupabase("teams", {
      eq: { slug },
      select: "*",
      limit: 1,
    })
    if (data?.length) return data[0]
    const cached = readCache("teams", season)
    if (cached) return cached.find((t) => t.slug === slug) || null
    return null
  }

  const fetchPlayers = async (filters = {}) => {
    const query = { select: "*" }
    if (filters.team) query.eq = { team: filters.team }
    if (filters.order) query.order = filters.order
    const data = await fromSupabase("players", query)
    if (data) {
      if (!filters.team && !filters.order) writeCache("players", season, data)
      return data
    }
    return readCache("players", season) || []
  }

  const fetchPlayer = async (slug) => {
    const data = await fromSupabase("players", {
      eq: { slug },
      select: "*",
      limit: 1,
    })
    if (data?.length) return data[0]
    const cached = readCache("players", season)
    if (cached) return cached.find((p) => p.slug === slug) || null
    return null
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
    if (data) {
      const parsed = data.map(parseJsonFields)
      const isFullTable =
        !filters.status && !filters.group && !filters.slug && !filters.team &&
        !filters.statusIn && !filters.orderBy && !filters.limit
      if (isFullTable) writeCache("matches", season, parsed)
      return parsed
    }
    const cached = readCache("matches", season)
    if (cached) return cached.map(parseJsonFields)
    return []
  }

  const fetchMatch = async (slug) => {
    const matches = await fetchMatches({ slug })
    return matches?.[0] || null
  }

  const fetchSettings = async () => {
    const data = await fromSupabase("settings", { limit: 1 })
    if (data?.length) return data[0]
    return readCache("settings", season) || null
  }

  return {
    fetchTeams,
    fetchTeam,
    fetchPlayers,
    fetchPlayer,
    fetchMatches,
    fetchMatch,
    fetchSettings,
  }
}
