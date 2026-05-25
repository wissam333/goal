const ADMIN_KEY = "league-admin-auth"
const ADMIN_PASSWORD = "admin123"

export const useAdminAuth = () => {
  const isLoggedIn = useState("adminLoggedIn", () => false)

  const checkSession = () => {
    if (!import.meta.client) return false
    const session = localStorage.getItem(ADMIN_KEY)
    if (session === "true") {
      isLoggedIn.value = true
      return true
    }
    return false
  }

  const login = (password) => {
    if (password !== ADMIN_PASSWORD) {
      return { error: "كلمة المرور غير صحيحة" }
    }
    isLoggedIn.value = true
    if (import.meta.client) localStorage.setItem(ADMIN_KEY, "true")
    return { error: null }
  }

  const logout = () => {
    isLoggedIn.value = false
    if (import.meta.client) localStorage.removeItem(ADMIN_KEY)
    navigateTo("/admin/login")
  }

  return { isLoggedIn, checkSession, login, logout }
}
