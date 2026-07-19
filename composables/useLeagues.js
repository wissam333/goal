export const useLeagues = () => {
  const supabase = useSupabase()

  const getLeagues = async () => {
    if (!supabase) return []
    const { data } = await supabase
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    return data || []
  }

  const getAllLeagues = async () => {
    if (!supabase) return []
    const { data } = await supabase
      .from('leagues')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    return data || []
  }

  const getLeague = async (slug) => {
    if (!supabase) return null
    const { data } = await supabase
      .from('leagues')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    return data
  }

  const saveLeague = async (league) => {
    if (!supabase) throw new Error('Supabase not available')
    const { error } = await supabase
      .from('leagues')
      .upsert(league, { onConflict: 'slug' })
    if (error) throw error
  }

  const deleteLeague = async (id) => {
    if (!supabase) return
    await supabase.from('leagues').delete().eq('id', id)
  }

  return { getLeagues, getAllLeagues, getLeague, saveLeague, deleteLeague }
}
