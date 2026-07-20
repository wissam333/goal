export const useSeasons = (leagueId = null) => {
  const supabase = useSupabase()
  const route = useRoute()
  const admin = useAdminData(leagueId)
  const _id = computed(() => leagueId || useCurrentLeague().leagueId.value)

  const _resolveLeague = async () => {
    let lid = _id.value
    if (!lid && route.params.league) {
      const { data } = await supabase.from('leagues').select('id').eq('slug', route.params.league).maybeSingle()
      if (data) lid = data.id
    }
    return lid
  }

  const getSeasons = async () => {
    if (!supabase) return []
    const lid = await _resolveLeague()
    let q = supabase.from("seasons").select("*").order("created_at", { ascending: false })
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  const getSeason = async (slug) => {
    if (!supabase) return null
    const lid = await _resolveLeague()
    let q = supabase.from("seasons").select("*").eq("slug", slug)
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q.maybeSingle()
    return data
  }

  const getActiveSeason = async () => {
    if (!supabase) return null
    const lid = await _resolveLeague()
    let q = supabase.from("seasons").select("*").eq("is_active", true)
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q.maybeSingle()
    return data
  }

  const startNewSeason = async (name) => {
    if (!supabase) throw new Error("Supabase not available")
    const lid = await _resolveLeague()

    const [teams, players, allMatches, settings] = await Promise.all([
      admin.getTeams(),
      admin.getPlayers(),
      admin.getMatches(),
      admin.getSettings(),
    ])

    const snapshot = {
      teams: teams.map(t => ({
        slug: t.slug,
        title: t.title,
        players: players.filter(p => p.team === t.slug).map(p => p.title),
      })),
      matches: allMatches
        .filter(m => m.status === "played")
        .map(m => ({
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore ?? 0,
          awayScore: m.awayScore ?? 0,
          group: m.group,
        })),
      champion: null,
      runnerUp: null,
      groups: settings?.groups || ["A", "B"],
    }

    const finalMatch = allMatches.find(m => m.group === "FINAL" && m.status === "played")
    if (finalMatch) {
      const { homeTeam, awayTeam, homeScore, awayScore } = finalMatch
      if ((homeScore ?? 0) > (awayScore ?? 0)) {
        snapshot.champion = homeTeam
        snapshot.runnerUp = awayTeam
      } else if ((awayScore ?? 0) > (homeScore ?? 0)) {
        snapshot.champion = awayTeam
        snapshot.runnerUp = homeTeam
      }
    }

    const activeSeason = await getActiveSeason()
    if (activeSeason) {
      const { error: updateErr } = await supabase
        .from("seasons")
        .update({ is_active: false, archived_at: new Date().toISOString(), snapshot })
        .eq("id", activeSeason.id)
      if (updateErr) throw updateErr
    }

    let vq = supabase.from("votes").delete()
    if (lid) vq = vq.eq("league_id", lid)
    vq = vq.neq("id", "00000000-0000-0000-0000-000000000000")
    await vq

    let pq = supabase.from("match_predictions").delete()
    if (lid) pq = pq.eq("league_id", lid)
    pq = pq.neq("id", "00000000-0000-0000-0000-000000000000")
    await pq

    let plq = supabase.from("players").delete()
    if (lid) plq = plq.eq("league_id", lid)
    plq = plq.neq("slug", "")
    await plq

    let mq = supabase.from("matches").delete()
    if (lid) mq = mq.eq("league_id", lid)
    mq = mq.neq("slug", "")
    await mq

    let tq = supabase.from("teams").update({ logo: null })
    if (lid) tq = tq.eq("league_id", lid)
    tq = tq.neq("slug", "")
    await tq

    await supabase.from("settings").upsert({
      id: settings?.id || 1,
      season: name,
      groups: ["A", "B"],
      teamsPerGroup: 4,
      ad: null,
      league_id: lid,
    })

    if (lid) {
      await supabase.from('leagues').update({ season_label: name }).eq('id', lid)
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    const { data: newSeason, error: insertErr } = await supabase
      .from("seasons")
      .insert({ name, slug, is_active: true, started_at: new Date().toISOString(), league_id: lid })
      .select()
      .single()
    if (insertErr) throw insertErr

    return newSeason
  }

  const deleteStorageBucket = async (bucket) => {
    if (!supabase) return
    try {
      const { data: files } = await supabase.storage.from(bucket).list()
      if (files?.length) {
        const paths = files.map(f => f.name)
        await supabase.storage.from(bucket).remove(paths)
      }
    } catch (e) {
      void(e)
    }
  }

  return { getSeasons, getSeason, getActiveSeason, startNewSeason }
}
