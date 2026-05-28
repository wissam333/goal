export const useAdminAuth = () => {
  const isLoggedIn = useState("adminLoggedIn", () => false)

  const checkSession = async () => {
    if (!import.meta.client) return false
    const supabase = useSupabase()
    if (!supabase) return false
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      isLoggedIn.value = true
      return true
    }
    return false
  }

  const login = async (email, password) => {
    const supabase = useSupabase()
    if (!supabase) return { error: "خطأ في الاتصال" }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }
    isLoggedIn.value = true
    return { error: null }
  }

  const logout = async () => {
    const supabase = useSupabase()
    if (supabase) await supabase.auth.signOut()
    isLoggedIn.value = false
    navigateTo("/admin/login")
  }

  return { isLoggedIn, checkSession, login, logout }
}
