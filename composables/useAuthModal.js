export const useAuthModal = () => {
  const show = useState("auth-modal-show", () => false)
  const defaultTab = useState("auth-modal-tab", () => "login")

  const open = (tab = "login") => {
    defaultTab.value = tab
    show.value = true
  }

  const close = () => {
    show.value = false
  }

  return { show, defaultTab, open, close }
}
