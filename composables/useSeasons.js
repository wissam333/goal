export const useSeasons = () => {
  const supabase = useSupabase()
  const admin = useAdminData()

  const getSeasons = async () => {
    if (!supabase) return []
    const { data } = await supabase.from("seasons").select("*").order("created_at", { ascending: false })
    return data || []
  }

  const getSeason = async (slug) => {
    if (!supabase) return null
    const { data } = await supabase.from("seasons").select("*").eq("slug", slug).single()
    return data
  }

  const getActiveSeason = async () => {
    if (!supabase) return null
    const { data } = await supabase.from("seasons").select("*").eq("is_active", true).maybeSingle()
    return data
  }

  const startNewSeason = async (name) => {
    if (!supabase) throw new Error("Supabase not available")

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

    const finalMatch = allMatches.find(m => m.group === "F" && m.status === "played")
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

    for (const bucket of ["match-photos", "team-logos", "player-photos", "ads"]) {
      await deleteStorageBucket(bucket)
    }

    await supabase.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("match_predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("players").delete().neq("slug", "")
    await supabase.from("matches").delete().neq("slug", "")
    await supabase.from("teams").update({ logo: null }).neq("slug", "")

    await supabase.from("settings").upsert({
      id: 1,
      name: name,
      season: name,
      groups: ["A", "B"],
      teamsPerGroup: 4,
      ad: null,
    })

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    const { data: newSeason, error: insertErr } = await supabase
      .from("seasons")
      .insert({ name, slug, is_active: true, started_at: new Date().toISOString() })
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
