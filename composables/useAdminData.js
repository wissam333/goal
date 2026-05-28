export const useAdminData = () => {
  const supabase = useSupabase()

  const getTeams = async () => {
    const { data } = await supabase.from("teams").select("*")
    return data || []
  }

  const getPlayers = async () => {
    const { data } = await supabase.from("players").select("*")
    return data || []
  }

  const getMatches = async () => {
    const { data } = await supabase.from("matches").select("*")
    return data || []
  }

  const getSettings = async () => {
    const { data } = await supabase.from("settings").select("*")
    return data?.length ? data[0] : null
  }

  const saveTeam = async (team) => {
    const { error } = await supabase.from("teams").upsert(team, { onConflict: "slug" })
    if (error) throw error
  }

  const deleteTeam = async (slug) => {
    const { error } = await supabase.from("teams").delete().eq("slug", slug)
    if (error) throw error
  }

  const savePlayer = async (player) => {
    const { error } = await supabase.from("players").upsert(player, { onConflict: "slug" })
    if (error) throw error
  }

  const deletePlayer = async (slug) => {
    const { error } = await supabase.from("players").delete().eq("slug", slug)
    if (error) throw error
  }

  const saveMatch = async (match) => {
    const { error } = await supabase.from("matches").upsert(match, { onConflict: "slug" })
    if (error) throw error
  }

  const deleteMatch = async (slug) => {
    const { error } = await supabase.from("matches").delete().eq("slug", slug)
    if (error) throw error
  }

  const saveSettings = async (settings) => {
    const { error } = await supabase.from("settings").upsert({ id: 1, ...settings }, { onConflict: "id" })
    if (error) throw error
  }

  return {
    getTeams, getPlayers, getMatches, getSettings,
    saveTeam, deleteTeam, savePlayer, deletePlayer,
    saveMatch, deleteMatch, saveSettings,
  }
}
