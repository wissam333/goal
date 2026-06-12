export const useAdminAuth = () => {
  const isLoggedIn = useState("adminLoggedIn", () => false)
  const isAdmin = useState("adminIsAdmin", () => false)

  const checkSession = async () => {
    if (!import.meta.client) return false
    const supabase = useSupabase()
    if (!supabase) return false
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      isLoggedIn.value = true
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle()
      if (profile?.role === "admin") {
        isAdmin.value = true
        return true
      }
    }
    return false
  }

  const login = async (email, password) => {
    const supabase = useSupabase()
    if (!supabase) return { error: "خطأ في الاتصال" }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }
    if (data?.user) {
      let { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()
      if (!profile) {
        const meta = data.user.user_metadata || {}
        await supabase.from("profiles").insert({
          id: data.user.id,
          display_name: meta.full_name || data.user.email || null,
          avatar_url: meta.avatar_url || meta.picture || null,
          role: "user",
        })
        profile = { role: "user" }
      }
      if (profile.role !== "admin") {
        await supabase.auth.signOut()
        return { error: "ليس لديك صلاحية الوصول للوحة التحكم" }
      }
      isLoggedIn.value = true
      isAdmin.value = true
    }
    return { error: null }
  }

  const logout = async () => {
    const supabase = useSupabase()
    if (supabase) await supabase.auth.signOut()
    isLoggedIn.value = false
    isAdmin.value = false
    navigateTo("/admin/login")
  }

  return { isLoggedIn, isAdmin, checkSession, login, logout }
}
