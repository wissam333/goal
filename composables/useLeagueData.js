const MOCK_TEAMS = [
  { slug: 'alnour', title: 'النور', color: '#22c55e', logo: null, group: 'A' },
  { slug: 'aytam', title: 'الأيتام', color: '#3b82f6', logo: null, group: 'A' },
  { slug: 'alqadsia', title: 'القادسية', color: '#ef4444', logo: null, group: 'B' },
  { slug: 'alnasr', title: 'النصر', color: '#eab308', logo: null, group: 'B' },
]

const MOCK_PLAYERS = [
  { slug: 'ahmed-hassan', title: 'أحمد حسن', team: 'alnour', number: 10, position: 'مهاجم', goals: 5, assists: 2, appearances: 4, photo: null },
  { slug: 'khaled-omar', title: 'خالد عمر', team: 'alnour', number: 7, position: 'وسط', goals: 2, assists: 1, appearances: 4, photo: null },
  { slug: 'yasser-ali', title: 'ياسر علي', team: 'alnour', number: 5, position: 'مدافع', goals: 0, assists: 0, appearances: 4, photo: null },
  { slug: 'nour-saeed', title: 'نور سعيد', team: 'alnour', number: 1, position: 'حارس', goals: 0, assists: 0, appearances: 4, photo: null },
  { slug: 'faris-nour', title: 'فارس نور', team: 'aytam', number: 9, position: 'مهاجم', goals: 3, assists: 1, appearances: 4, photo: null },
  { slug: 'hadi-mahmoud', title: 'هادي محمود', team: 'aytam', number: 8, position: 'وسط', goals: 1, assists: 2, appearances: 4, photo: null },
  { slug: 'sami-ibrahim', title: 'سامي إبراهيم', team: 'aytam', number: 4, position: 'مدافع', goals: 0, assists: 0, appearances: 4, photo: null },
  { slug: 'marwan-hassan', title: 'مروان حسن', team: 'aytam', number: 1, position: 'حارس', goals: 0, assists: 0, appearances: 4, photo: null },
  { slug: 'badr-shamari', title: 'بدر الشمري', team: 'alqadsia', number: 10, position: 'مهاجم', goals: 4, assists: 1, appearances: 4, photo: null },
  { slug: 'abdullah-mohammed', title: 'عبدالله محمد', team: 'alqadsia', number: 6, position: 'وسط', goals: 1, assists: 2, appearances: 4, photo: null },
  { slug: 'faisal-ahmed', title: 'فيصل أحمد', team: 'alqadsia', number: 3, position: 'مدافع', goals: 0, assists: 0, appearances: 4, photo: null },
  { slug: 'lama-saad', title: 'لمى سعد', team: 'alqadsia', number: 1, position: 'حارس', goals: 0, assists: 0, appearances: 4, photo: null },
  { slug: 'omar-abdullah', title: 'عمر عبدالله', team: 'alnasr', number: 9, position: 'مهاجم', goals: 2, assists: 3, appearances: 4, photo: null },
  { slug: 'zakaria-youssef', title: 'زكريا يوسف', team: 'alnasr', number: 7, position: 'وسط', goals: 0, assists: 1, appearances: 4, photo: null },
  { slug: 'tamer-hassan', title: 'تامر حسن', team: 'alnasr', number: 5, position: 'مدافع', goals: 1, assists: 0, appearances: 4, photo: null },
  { slug: 'mohammed-ali', title: 'محمد علي', team: 'alnasr', number: 1, position: 'حارس', goals: 0, assists: 0, appearances: 4, photo: null },
]

const MOCK_MATCHES = [
  { slug: 'ga-alnour-vs-aytam', title: 'النور vs الأيتام', date: '2026-05-02T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'alnour', awayTeam: 'aytam', homeScore: 3, awayScore: 1, goalScorers: [], motmCandidates: [] },
  { slug: 'gb-alqadsia-vs-alnasr', title: 'القادسية vs النصر', date: '2026-05-03T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'alqadsia', awayTeam: 'alnasr', homeScore: 2, awayScore: 2, goalScorers: [], motmCandidates: [] },
  { slug: 'ga-alnour-vs-alqadsia', title: 'النور vs القادسية', date: '2026-05-09T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'alnour', awayTeam: 'alqadsia', homeScore: 1, awayScore: 0, goalScorers: [], motmCandidates: [] },
  { slug: 'gb-aytam-vs-alnasr', title: 'الأيتام vs النصر', date: '2026-05-10T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'aytam', awayTeam: 'alnasr', homeScore: 2, awayScore: 3, goalScorers: [], motmCandidates: [] },
  { slug: 'ga-alnour-vs-alnasr', title: 'النور vs النصر', date: '2026-05-16T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'alnasr', homeScore: null, awayScore: null, goalScorers: [], motmCandidates: [] },
  { slug: 'gb-aytam-vs-alqadsia', title: 'الأيتام vs القادسية', date: '2026-05-17T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'aytam', awayTeam: 'alqadsia', homeScore: null, awayScore: null, goalScorers: [], motmCandidates: [] },
  { slug: 'ga-alnour-vs-aytam-2', title: 'النور vs الأيتام', date: '2026-05-23T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'aytam', homeScore: null, awayScore: null, goalScorers: [], motmCandidates: [] },
  { slug: 'gb-alqadsia-vs-alnasr-2', title: 'القادسية vs النصر', date: '2026-05-24T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alqadsia', awayTeam: 'alnasr', homeScore: null, awayScore: null, goalScorers: [], motmCandidates: [] },
  { slug: 'sf-alnour-vs-alqadsia', title: 'نصف النهائي: النور vs القادسية', date: '2026-05-30T17:00:00+00:00', group: 'SF', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'alqadsia', homeScore: null, awayScore: null, goalScorers: [], motmCandidates: [] },
  { slug: 'sf-alnasr-vs-aytam', title: 'نصف النهائي: النصر vs الأيتام', date: '2026-05-31T19:00:00+00:00', group: 'SF', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnasr', awayTeam: 'aytam', homeScore: null, awayScore: null, goalScorers: [], motmCandidates: [] },
  { slug: 'f-alnour-vs-alnasr', title: 'النهائي', date: '2026-06-06T20:00:00+00:00', group: 'F', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'alnasr', homeScore: null, awayScore: null, goalScorers: [], motmCandidates: [] },
]

const LS_KEY_TEAMS = 'admin_teams'
const LS_KEY_PLAYERS = 'admin_players'
const LS_KEY_MATCHES = 'admin_matches'

const getLocalData = (key, fallback) => {
  if (!import.meta.client) return [...fallback]
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : [...fallback]
  } catch { return [...fallback] }
}

const parseJsonFields = (match) => {
  if (typeof match.goalScorers === "string")
    match.goalScorers = JSON.parse(match.goalScorers);
  if (typeof match.motmCandidates === "string")
    match.motmCandidates = JSON.parse(match.motmCandidates);
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
    const d = await fromSupabase("teams");
    if (d) return d;
    return getLocalData(LS_KEY_TEAMS, MOCK_TEAMS);
  };

  const fetchTeam = async (slug) => {
    const d = await fromSupabase("teams", {
      eq: { slug },
      select: "*",
      limit: 1,
    });
    if (d?.length) return d[0];
    const list = getLocalData(LS_KEY_TEAMS, MOCK_TEAMS);
    return list.find(t => t.slug === slug) || null;
  };

  const fetchPlayers = async (filters = {}) => {
    const query = { select: "*" };
    if (filters.team) query.eq = { team: filters.team };
    if (filters.order) query.order = filters.order;
    const d = await fromSupabase("players", query);
    if (d) return d;
    let list = getLocalData(LS_KEY_PLAYERS, MOCK_PLAYERS);
    if (filters.team) list = list.filter(p => p.team === filters.team);
    return list;
  };

  const fetchPlayer = async (slug) => {
    const d = await fromSupabase("players", {
      eq: { slug },
      select: "*",
      limit: 1,
    });
    if (d?.length) return d[0];
    const list = getLocalData(LS_KEY_PLAYERS, MOCK_PLAYERS);
    return list.find(p => p.slug === slug) || null;
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
    let list = getLocalData(LS_KEY_MATCHES, MOCK_MATCHES);
    if (filters.slug) list = list.filter(m => m.slug === filters.slug);
    if (filters.status) list = list.filter(m => m.status === filters.status);
    if (filters.statusIn) list = list.filter(m => filters.statusIn.includes(m.status));
    if (filters.group) list = list.filter(m => m.group === filters.group);
    if (filters.orderBy) {
      const { field, dir } = filters.orderBy;
      list = [...list].sort((a, b) => {
        const va = a[field] || '', vb = b[field] || '';
        if (dir === 'desc') return va > vb ? -1 : va < vb ? 1 : 0;
        return va < vb ? -1 : va > vb ? 1 : 0;
      });
    }
    if (filters.limit) list = list.slice(0, filters.limit);
    return list;
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
};
