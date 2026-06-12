let _listenerRegistered = false

const initListener = () => {
  if (_listenerRegistered) return
  if (!import.meta.client) return
  const supabase = useSupabase()
  if (!supabase) return
  _listenerRegistered = true
  supabase.auth.onAuthStateChange((event, session) => {
    const user = useState("auth-user")
    const profile = useState("auth-profile")
    const loading = useState("auth-loading")
    if (session?.user) {
      user.value = session.user
      fetchProfileInternal(session.user.id)
    } else {
      user.value = null
      profile.value = null
    }
    loading.value = false
  })
}

const fetchProfileInternal = async (uid) => {
  const supabase = useSupabase()
  if (!supabase) return
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle()
  if (data) {
    useState("auth-profile").value = data
  } else {
    const { data: userData } = await supabase.auth.getUser()
    const meta = userData?.user?.user_metadata || {}
    await supabase.from("profiles").insert({
      id: uid,
      display_name: meta.full_name || userData?.user?.email || null,
      avatar_url: meta.avatar_url || meta.picture || null,
      role: "user",
    })
    useState("auth-profile").value = {
      id: uid,
      display_name: meta.full_name || userData?.user?.email || null,
      role: "user",
    }
  }
}

export const useAuth = () => {
  const user = useState("auth-user", () => null)
  const profile = useState("auth-profile", () => null)
  const loading = useState("auth-loading", () => true)

  const fetchProfile = async () => {
    if (!user.value) return
    await fetchProfileInternal(user.value.id)
  }

  const signUp = async (email, password) => {
    const supabase = useSupabase()
    if (!supabase) return { error: "no_client" }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data?.session) {
      user.value = data.user
      await fetchProfile()
    }
    return { data, error }
  }

  const signIn = async (email, password) => {
    const supabase = useSupabase()
    if (!supabase) return { error: "no_client" }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data?.user) {
      user.value = data.user
      await fetchProfile()
    }
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const supabase = useSupabase()
    if (!supabase) return { error: "no_client" }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    })
    return { error }
  }

  const signOut = async () => {
    const supabase = useSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  initListener()

  return { user, profile, loading, signUp, signIn, signInWithGoogle, signOut }
}
