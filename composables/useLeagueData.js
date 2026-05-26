const parseJsonFields = (match) => {
  if (typeof match.goalScorers === "string")
    match.goalScorers = JSON.parse(match.goalScorers);
  if (typeof match.photos === "string")
    match.photos = JSON.parse(match.photos);
  return match;
};

export const useLeagueData = () => {
  const supabase = useSupabase();

  const fromSupabase = async (table, query = {}) => {
    if (!supabase) return null;
    let q = supabase.from(table).select(query.select || "*");
    if (query.eq) for (const [k, v] of Object.entries(query.eq)) q = q.eq(k, v);
    if (query.order)
      q = q.order(
        query.order.field,
        query.order.dir ? { ascending: query.order.dir === "asc" } : {},
      );
    if (query.limit) q = q.limit(query.limit);
    if (query.in)
      for (const { column, values } of query.in) q = q.in(column, values);
    const { data } = await q;
    return data;
  };

  const fetchTeams = async () => {
    return await fromSupabase("teams") || [];
  };

  const fetchTeam = async (slug) => {
    const d = await fromSupabase("teams", {
      eq: { slug },
      select: "*",
      limit: 1,
    });
    return d?.length ? d[0] : null;
  };

  const fetchPlayers = async (filters = {}) => {
    const query = { select: "*" };
    if (filters.team) query.eq = { team: filters.team };
    if (filters.order) query.order = filters.order;
    return await fromSupabase("players", query) || [];
  };

  const fetchPlayer = async (slug) => {
    const d = await fromSupabase("players", {
      eq: { slug },
      select: "*",
      limit: 1,
    });
    return d?.length ? d[0] : null;
  };

  const fetchMatches = async (filters = {}) => {
    const query = { select: "*" };
    const eqs = {};
    if (filters.status) eqs.status = filters.status;
    if (filters.group) eqs.group = filters.group;
    if (filters.slug) eqs.slug = filters.slug;
    if (Object.keys(eqs).length) query.eq = eqs;
    if (filters.orderBy)
      query.order = {
        field: filters.orderBy.field,
        dir: filters.orderBy.dir || "asc",
      };
    if (filters.limit) query.limit = filters.limit;
    if (filters.statusIn)
      query.in = [{ column: "status", values: filters.statusIn }];
    const d = await fromSupabase("matches", query);
    if (d) return d.map(parseJsonFields);
    return [];
  };

  const fetchMatch = async (slug) => {
    const matches = await fetchMatches({ slug });
    return matches?.[0] || null;
  };

  const fetchSettings = async () => {
    const d = await fromSupabase("settings", { limit: 1 });
    return d?.length ? d[0] : null;
  };

  return {
    fetchTeams,
    fetchTeam,
    fetchPlayers,
    fetchPlayer,
    fetchMatches,
    fetchMatch,
    fetchSettings,
  };
}
