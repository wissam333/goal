export const useAdminData = () => {
  const supabase = useSupabase()

  const checkDb = () => { if (!supabase) throw new Error('Supabase not initialized') }

  const getTeams = async () => {
    if (!supabase) return []
    const { data } = await supabase.from("teams").select("*")
    return data || []
  }

  const getPlayers = async () => {
    if (!supabase) return []
    const { data } = await supabase.from("players").select("*")
    return data || []
  }

  const getMatches = async () => {
    if (!supabase) return []
    const { data } = await supabase.from("matches").select("*")
    return data || []
  }

  const getSettings = async () => {
    if (!supabase) return null
    const { data } = await supabase.from("settings").select("*")
    return data?.length ? data[0] : null
  }

  const saveTeam = async (team) => {
    checkDb()
    const { error } = await supabase.from("teams").upsert(team, { onConflict: "slug" })
    if (error) throw error
  }

  const deleteTeam = async (slug) => {
    checkDb()
    const { error } = await supabase.from("teams").delete().eq("slug", slug)
    if (error) throw error
  }

  const savePlayer = async (player) => {
    checkDb()
    const { error } = await supabase.from("players").upsert(player, { onConflict: "slug" })
    if (error) throw error
  }

  const deletePlayer = async (slug) => {
    checkDb()
    const { error } = await supabase.from("players").delete().eq("slug", slug)
    if (error) throw error
  }

  const saveMatch = async (match) => {
    checkDb()
    const { error } = await supabase.from("matches").upsert(match, { onConflict: "slug" })
    if (error) throw error
  }

  const deleteMatch = async (slug) => {
    checkDb()
    const { error } = await supabase.from("matches").delete().eq("slug", slug)
    if (error) throw error
  }

  const saveSettings = async (settings) => {
    checkDb()
    const { error } = await supabase.from("settings").upsert({ id: 1, ...settings }, { onConflict: "id" })
    if (error) throw error
  }

  const uploadToStorage = async (blob, bucket, fileName) => {
    checkDb()
    const ext = blob.type?.includes("png") ? "png" : "webp"
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const path = `${uniqueName}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return `${publicUrl}?t=${Date.now()}`
  }

  const uploadPhoto = async (blob, matchSlug) => {
    checkDb()
    const ext = blob.type?.includes("png") ? "png" : "webp"
    const path = `${matchSlug}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("match-photos").upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from("match-photos").getPublicUrl(path)
    return publicUrl
  }

  const deletePhoto = async (url) => {
    if (!supabase) return
    const bucket = supabase.storage.from("match-photos")
    const parts = url.split("/match-photos/")
    if (parts.length < 2) return
    const path = parts[1]
    const { error } = await bucket.remove([path])
    if (error) void(error)
  }

  return {
    getTeams, getPlayers, getMatches, getSettings,
    saveTeam, deleteTeam, savePlayer, deletePlayer,
    saveMatch, deleteMatch, saveSettings,
    uploadToStorage, uploadPhoto, deletePhoto,
  }
}
