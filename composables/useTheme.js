const MODE_KEY = "league-dark-mode"
const COLOR_KEY = "league-primary-color"

export const useTheme = () => {
  const isDark = useState("isDark", () => false)
  const primaryColor = useState("primaryColor", () => "#22c55e")

  const palettes = [
    { label: "Green",  value: "#22c55e" },
    { label: "Red",    value: "#ef4444" },
    { label: "Blue",   value: "#3b82f6" },
    { label: "Purple", value: "#8b5cf6" },
    { label: "Orange", value: "#f97316" },
    { label: "Teal",   value: "#14b8a6" },
  ]

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const applyMode = (dark) => {
    if (!import.meta.client) return
    const root = document.documentElement
    if (dark) root.classList.add("dark")
    else root.classList.remove("dark")
    localStorage.setItem(MODE_KEY, dark ? "true" : "false")
  }

  const applyColor = (color) => {
    if (!import.meta.client) return
    const root = document.documentElement
    root.style.setProperty("--primary", color)
    root.style.setProperty("--primary-soft", hexToRgba(color, 0.1))
    root.style.setProperty("--primary-mid", hexToRgba(color, 0.2))
    localStorage.setItem(COLOR_KEY, color)
  }

  const toggleMode = () => {
    const next = !(document.documentElement.classList.contains("dark"))
    isDark.value = next
    applyMode(next)
  }

  const setColor = (color) => {
    primaryColor.value = color
    applyColor(color)
  }

  const init = () => {
    if (!import.meta.client) return
    const root = document.documentElement
    isDark.value = root.classList.contains("dark")
    const savedColor = localStorage.getItem(COLOR_KEY) || "#22c55e"
    primaryColor.value = savedColor
    applyColor(savedColor)
  }

  return { isDark, primaryColor, palettes, toggleMode, setColor, init, applyMode, applyColor }
}
