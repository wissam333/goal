export const MATCH_LIST_COLS =
  'slug,title,date,group,venue,status,homeTeam,awayTeam,homeScore,awayScore,homeScoreAET,awayScoreAET,homePenalties,awayPenalties,resultMethod,motmWinner,league_id'

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

const stripPrefixes = (record, fields = ['slug'], leagueSlug) => {
  if (!record || !leagueSlug) return record
  const p = leagueSlug + '::'
  for (const f of fields) {
    if (record[f] && record[f].startsWith(p)) record[f] = record[f].slice(p.length)
  }
  return record
}

export const useLeagueData = (leagueId = null) => {
  const supabase = useSupabase()
  const route = useRoute()

  const _id = computed(() => leagueId || useCurrentLeague().leagueId.value)
  const _leagueSlug = computed(() => route.params.league)

  const _resolveLeague = async () => {
    let lid = _id.value
    if (!lid && route.params.league) {
      const { data } = await supabase.from('leagues').select('id').eq('slug', route.params.league).maybeSingle()
      if (data) lid = data.id
    }
    return lid
  }

  const fromSupabase = async (table, query = {}) => {
    if (!supabase) return null
    try {
      let q = supabase.from(table).select(query.select || "*")
      const eqs = {}
      if (query.eq) Object.assign(eqs, query.eq)
      const lid = await _resolveLeague()
      if (lid) eqs.league_id = lid
      for (const [k, v] of Object.entries(eqs)) q = q.eq(k, v)
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

  const prefix = (s) => {
    if (!_leagueSlug.value || !s) return s
    const p = _leagueSlug.value + '::'
    return s.startsWith(p) ? s : p + s
  }

  const fetchTeams = async () => {
    const data = await fromSupabase("teams")
    if (!data) return []
    const ls = _leagueSlug.value
    return data.map(t => stripPrefixes(t, ['slug'], ls))
  }

  const fetchTeam = async (slug) => {
    const data = await fromSupabase("teams", {
      eq: { slug: prefix(slug) },
      select: "*",
      limit: 1,
    })
    if (!data?.length) return null
    return stripPrefixes(data[0], ['slug'], _leagueSlug.value)
  }

  const fetchPlayers = async (filters = {}) => {
    const query = { select: "*" }
    const eqs = {}
    if (filters.team) eqs.team = prefix(filters.team)
    if (Object.keys(eqs).length) query.eq = eqs
    if (filters.order) query.order = filters.order
    const data = await fromSupabase("players", query)
    if (!data) return []
    const ls = _leagueSlug.value
    return data.map(p => stripPrefixes(p, ['slug', 'team'], ls))
  }

  const fetchPlayer = async (slug) => {
    const data = await fromSupabase("players", {
      eq: { slug: prefix(slug) },
      select: "*",
      limit: 1,
    })
    if (!data?.length) return null
    return stripPrefixes(data[0], ['slug', 'team'], _leagueSlug.value)
  }

  const fetchMatches = async (filters = {}) => {
    const query = { select: filters.select || "*" }
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
      query.or = [`homeTeam.eq.${prefix(filters.team)},awayTeam.eq.${prefix(filters.team)}`]
    if (filters.statusIn)
      query.in = [{ column: "status", values: filters.statusIn }]
    const data = await fromSupabase("matches", query)
    if (!data) return []
    const ls = _leagueSlug.value
    return data.map(m => {
      parseJsonFields(m)
      if (m.goalScorers?.length) {
        for (const g of m.goalScorers) stripPrefixes(g, ['player', 'team'], ls)
      }
      if (m.cards?.length) {
        for (const c of m.cards) stripPrefixes(c, ['player', 'team'], ls)
      }
      stripPrefixes(m, ['motmWinner'], ls)
      return stripPrefixes(m, ['homeTeam', 'awayTeam', 'slug'], ls)
    })
  }

  const fetchMatch = async (slug) => {
    const matches = await fetchMatches({ slug: prefix(slug) })
    return matches?.[0] || null
  }

  const fetchManagers = async (teamSlug) => {
    const data = await fromSupabase("managers", {
      select: "*",
      eq: { team_slug: prefix(teamSlug) },
    })
    return data || []
  }

  const fetchManager = async (id) => {
    const data = await fromSupabase("managers", {
      select: "*",
      eq: { id },
      limit: 1,
    })
    return data?.length ? data[0] : null
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
    fetchManager,
    fetchMatches,
    fetchMatch,
    fetchSettings,
  }
}
