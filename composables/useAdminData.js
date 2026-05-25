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
  { slug: 'ga-alnour-vs-aytam', title: 'النور vs الأيتام', date: '2026-05-02T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'alnour', awayTeam: 'aytam', homeScore: 3, awayScore: 1 },
  { slug: 'gb-alqadsia-vs-alnasr', title: 'القادسية vs النصر', date: '2026-05-03T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'alqadsia', awayTeam: 'alnasr', homeScore: 2, awayScore: 2 },
  { slug: 'ga-alnour-vs-alqadsia', title: 'النور vs القادسية', date: '2026-05-09T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'alnour', awayTeam: 'alqadsia', homeScore: 1, awayScore: 0 },
  { slug: 'gb-aytam-vs-alnasr', title: 'الأيتام vs النصر', date: '2026-05-10T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'played', homeTeam: 'aytam', awayTeam: 'alnasr', homeScore: 2, awayScore: 3 },
  { slug: 'ga-alnour-vs-alnasr', title: 'النور vs النصر', date: '2026-05-16T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'alnasr', homeScore: null, awayScore: null },
  { slug: 'gb-aytam-vs-alqadsia', title: 'الأيتام vs القادسية', date: '2026-05-17T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'aytam', awayTeam: 'alqadsia', homeScore: null, awayScore: null },
  { slug: 'ga-alnour-vs-aytam-2', title: 'النور vs الأيتام', date: '2026-05-23T17:00:00+00:00', group: 'A', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'aytam', homeScore: null, awayScore: null },
  { slug: 'gb-alqadsia-vs-alnasr-2', title: 'القادسية vs النصر', date: '2026-05-24T19:00:00+00:00', group: 'B', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alqadsia', awayTeam: 'alnasr', homeScore: null, awayScore: null },
  { slug: 'sf-alnour-vs-alqadsia', title: 'نصف النهائي: النور vs القادسية', date: '2026-05-30T17:00:00+00:00', group: 'SF', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'alqadsia', homeScore: null, awayScore: null },
  { slug: 'sf-alnasr-vs-aytam', title: 'نصف النهائي: النصر vs الأيتام', date: '2026-05-31T19:00:00+00:00', group: 'SF', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnasr', awayTeam: 'aytam', homeScore: null, awayScore: null },
  { slug: 'f-alnour-vs-alnasr', title: 'النهائي', date: '2026-06-06T20:00:00+00:00', group: 'F', venue: 'الملعب الرئيسي', status: 'upcoming', homeTeam: 'alnour', awayTeam: 'alnasr', homeScore: null, awayScore: null },
]

const LS_KEY_TEAMS = 'admin_teams'
const LS_KEY_PLAYERS = 'admin_players'
const LS_KEY_MATCHES = 'admin_matches'
const LS_KEY_SETTINGS = 'admin_settings'

const getLocalData = (key, initial) => {
  if (!import.meta.client) return [...initial]
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : [...initial]
  } catch { return [...initial] }
}

const saveLocalData = (key, data) => {
  if (!import.meta.client) return
  localStorage.setItem(key, JSON.stringify(data))
}

export const useAdminData = () => {
  const supabase = useSupabase()

  const isMock = !supabase

  const getTeams = async () => {
    if (isMock) return getLocalData(LS_KEY_TEAMS, MOCK_TEAMS)
    const { data } = await supabase.from("teams").select("*")
    return data || []
  }

  const getPlayers = async () => {
    if (isMock) return getLocalData(LS_KEY_PLAYERS, MOCK_PLAYERS)
    const { data } = await supabase.from("players").select("*")
    return data || []
  }

  const getMatches = async () => {
    if (isMock) return getLocalData(LS_KEY_MATCHES, MOCK_MATCHES)
    const { data } = await supabase.from("matches").select("*")
    return data || []
  }

  const getSettings = async () => {
    if (isMock) return getLocalData(LS_KEY_SETTINGS, [{ id: 1, leagueName: 'دوري القرية السنوي', season: '2026' }])[0] || null
    const { data } = await supabase.from("settings").select("*")
    return data?.length ? data[0] : null
  }

  const saveTeam = async (team) => {
    if (isMock) {
      const list = getLocalData(LS_KEY_TEAMS, MOCK_TEAMS)
      const idx = list.findIndex(t => t.slug === team.slug)
      if (idx >= 0) list[idx] = { ...list[idx], ...team }
      else list.push(team)
      saveLocalData(LS_KEY_TEAMS, list)
      return
    }
    const { error } = await supabase.from("teams").upsert(team, { onConflict: "slug" })
    if (error) throw error
  }

  const deleteTeam = async (slug) => {
    if (isMock) {
      const list = getLocalData(LS_KEY_TEAMS, MOCK_TEAMS).filter(t => t.slug !== slug)
      saveLocalData(LS_KEY_TEAMS, list)
      return
    }
    const { error } = await supabase.from("teams").delete().eq("slug", slug)
    if (error) throw error
  }

  const savePlayer = async (player) => {
    if (isMock) {
      const list = getLocalData(LS_KEY_PLAYERS, MOCK_PLAYERS)
      const idx = list.findIndex(p => p.slug === player.slug)
      if (idx >= 0) list[idx] = { ...list[idx], ...player }
      else list.push(player)
      saveLocalData(LS_KEY_PLAYERS, list)
      return
    }
    const { error } = await supabase.from("players").upsert(player, { onConflict: "slug" })
    if (error) throw error
  }

  const deletePlayer = async (slug) => {
    if (isMock) {
      const list = getLocalData(LS_KEY_PLAYERS, MOCK_PLAYERS).filter(p => p.slug !== slug)
      saveLocalData(LS_KEY_PLAYERS, list)
      return
    }
    const { error } = await supabase.from("players").delete().eq("slug", slug)
    if (error) throw error
  }

  const saveMatch = async (match) => {
    if (isMock) {
      const list = getLocalData(LS_KEY_MATCHES, MOCK_MATCHES)
      const idx = list.findIndex(m => m.slug === match.slug)
      if (idx >= 0) list[idx] = { ...list[idx], ...match }
      else list.push(match)
      saveLocalData(LS_KEY_MATCHES, list)
      return
    }
    const { error } = await supabase.from("matches").upsert(match, { onConflict: "slug" })
    if (error) throw error
  }

  const deleteMatch = async (slug) => {
    if (isMock) {
      const list = getLocalData(LS_KEY_MATCHES, MOCK_MATCHES).filter(m => m.slug !== slug)
      saveLocalData(LS_KEY_MATCHES, list)
      return
    }
    const { error } = await supabase.from("matches").delete().eq("slug", slug)
    if (error) throw error
  }

  const saveSettings = async (settings) => {
    if (isMock) {
      saveLocalData(LS_KEY_SETTINGS, [{ id: 1, ...settings }])
      return
    }
    const { error } = await supabase.from("settings").upsert({ id: 1, ...settings }, { onConflict: "id" })
    if (error) throw error
  }

  const publish = () => {
    const hookUrl = import.meta.client ? localStorage.getItem("league_vercel_hook") || "" : ""
    if (!hookUrl) return { error: "لم يتم تعيين رابط النشر (Vercel Deploy Hook)" }
    return fetch(hookUrl, { method: "POST" })
      .then(r => r.ok ? { error: null } : { error: "فشل النشر" })
      .catch(() => ({ error: "فشل الاتصال" }))
  }

  return {
    getTeams, getPlayers, getMatches, getSettings,
    saveTeam, deleteTeam, savePlayer, deletePlayer,
    saveMatch, deleteMatch, saveSettings, publish,
  }
}
