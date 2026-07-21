export const useAdminData = (leagueId = null) => {
  const supabase = useSupabase()
  const route = useRoute()
  const _overrideId = useState('admin-selected-league', () => null)
  const _id = computed(() => leagueId || _overrideId.value || useCurrentLeague().leagueId.value)

  const checkDb = () => { if (!supabase) throw new Error('Supabase not initialized') }

  const _resolveLeague = async () => {
    let lid = _id.value
    if (!lid && route.params.league) {
      const { data } = await supabase.from('leagues').select('id').eq('slug', route.params.league).maybeSingle()
      if (data) lid = data.id
    }
    return lid
  }

  const getTeams = async () => {
    if (!supabase) return []
    const lid = await _resolveLeague()
    let q = supabase.from("teams").select("*")
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  const getPlayers = async () => {
    if (!supabase) return []
    const lid = await _resolveLeague()
    let q = supabase.from("players").select("*")
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  const getMatches = async () => {
    if (!supabase) return []
    const lid = await _resolveLeague()
    let q = supabase.from("matches").select("*")
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  const getSettings = async () => {
    if (!supabase) return null
    const lid = await _resolveLeague()
    let q = supabase.from("settings").select("*")
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data?.length ? data[0] : null
  }

  const saveTeam = async (team) => {
    checkDb()
    const payload = { ...team }
    const lid = await _resolveLeague()
    if (lid) payload.league_id = lid
    const { data: existing } = await supabase.from("teams").select("slug").eq("slug", payload.slug).maybeSingle()
    let error
    if (existing) {
      ;({ error } = await supabase.from("teams").update(payload).eq("slug", payload.slug))
    } else {
      ;({ error } = await supabase.from("teams").insert(payload))
    }
    if (error) throw error
  }

  const deleteTeam = async (slug) => {
    checkDb()
    const lid = await _resolveLeague()
    let q = supabase.from("teams").delete()
    if (lid) q = q.eq("league_id", lid)
    q = q.eq("slug", slug)
    const { error } = await q
    if (error) throw error
  }

  const savePlayer = async (player) => {
    checkDb()
    const payload = { ...player }
    const lid = await _resolveLeague()
    if (lid) payload.league_id = lid
    const { data: existing } = await supabase.from("players").select("slug").eq("slug", payload.slug).maybeSingle()
    let error
    if (existing) {
      ;({ error } = await supabase.from("players").update(payload).eq("slug", payload.slug))
    } else {
      ;({ error } = await supabase.from("players").insert(payload))
    }
    if (error) throw error
  }

  const deletePlayer = async (slug) => {
    checkDb()
    const lid = await _resolveLeague()
    let q = supabase.from("players").delete()
    if (lid) q = q.eq("league_id", lid)
    q = q.eq("slug", slug)
    const { error } = await q
    if (error) throw error
  }

  const getManagers = async () => {
    checkDb()
    const lid = await _resolveLeague()
    let q = supabase.from("managers").select("*").order("id")
    if (lid) q = q.eq("league_id", lid)
    const { data } = await q
    return data || []
  }

  const saveManager = async (manager) => {
    checkDb()
    const payload = { ...manager }
    const lid = await _resolveLeague()
    if (lid && !payload.league_id) payload.league_id = lid
    if (payload.id) {
      const { id, ...rest } = payload
      let q = supabase.from("managers").update(rest).eq("id", id)
      if (lid) q = q.eq("league_id", lid)
      const { error } = await q
      if (error) throw error
    } else {
      const { error } = await supabase.from("managers").insert(payload)
      if (error) throw error
    }
  }

  const deleteManager = async (id) => {
    checkDb()
    const lid = await _resolveLeague()
    let q = supabase.from("managers").delete().eq("id", id)
    if (lid) q = q.eq("league_id", lid)
    const { error } = await q
    if (error) throw error
  }

  const saveMatch = async (match) => {
    checkDb()
    const payload = { ...match }
    const lid = await _resolveLeague()
    if (lid) payload.league_id = lid
    const { data: existing } = await supabase.from("matches").select("slug").eq("slug", payload.slug).maybeSingle()
    let error
    if (existing) {
      ;({ error } = await supabase.from("matches").update(payload).eq("slug", payload.slug))
    } else {
      ;({ error } = await supabase.from("matches").insert(payload))
    }
    if (error) throw error
  }

  const deleteMatch = async (slug) => {
    checkDb()
    const lid = await _resolveLeague()
    let q = supabase.from("matches").delete()
    if (lid) q = q.eq("league_id", lid)
    q = q.eq("slug", slug)
    const { error } = await q
    if (error) throw error
  }

  const saveSettings = async (settings) => {
    checkDb()
    const payload = { ...settings }
    const lid = await _resolveLeague()
    if (lid) payload.league_id = lid
    const { error } = await supabase.from("settings").upsert(payload)
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

  function setAdminLeagueId(id) { _overrideId.value = id }

  return {
    getTeams, getPlayers, getMatches, getSettings,
    getManagers, saveManager, deleteManager,
    saveTeam, deleteTeam, savePlayer, deletePlayer,
    saveMatch, deleteMatch, saveSettings,
    uploadToStorage, uploadPhoto, deletePhoto,
    setAdminLeagueId,
  }
}
