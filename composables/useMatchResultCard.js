/**
 * Client helpers for match result cards:
 * - Open Graph image URL (server SVG)
 * - Download PNG (canvas rasterize — works great for Facebook photo posts)
 * - Share with Web Share API (files when supported)
 */

function buildCardPath(matchSlug, { league = "", locale = "ar" } = {}) {
  const params = new URLSearchParams()
  if (league) params.set("league", league)
  if (locale) params.set("locale", locale)
  const q = params.toString()
  return `/api/og/match/${encodeURIComponent(matchSlug)}${q ? `?${q}` : ""}`
}

function absoluteUrl(path) {
  if (!import.meta.client) return path
  if (/^https?:\/\//i.test(path)) return path
  const config = useRuntimeConfig()
  const base =
    config.public.siteUrl ||
    (typeof window !== "undefined" ? window.location.origin : "")
  return `${String(base).replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
}

function readSvgSize(svgText) {
  const w = Number((svgText.match(/\bwidth="(\d+(?:\.\d+)?)"/) || [])[1]) || 1200
  const h = Number((svgText.match(/\bheight="(\d+(?:\.\d+)?)"/) || [])[1]) || 630
  return { width: w, height: h }
}

async function svgToPngBlob(svgText, { scale = 2 } = {}) {
  const { width, height } = readSvgSize(svgText)
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error("Failed to load result card image"))
      image.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG export failed"))),
        "image/png",
        0.95,
      )
    })
    return pngBlob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const useMatchResultCard = () => {
  const config = useRuntimeConfig()
  const exporting = ref(false)
  const lastError = ref(null)

  const getCardUrl = (matchSlug, options = {}) => {
    if (!matchSlug) return ""
    return absoluteUrl(buildCardPath(matchSlug, options))
  }

  const fetchCardSvg = async (matchSlug, options = {}) => {
    const path = buildCardPath(matchSlug, options)
    const svg = await $fetch(path, { responseType: "text" })
    return typeof svg === "string" ? svg : String(svg)
  }

  const fetchCardMeta = async (matchSlug, options = {}) => {
    const path = buildCardPath(matchSlug, { ...options })
    const sep = path.includes("?") ? "&" : "?"
    return await $fetch(`${path}${sep}format=json`)
  }

  const downloadResultCard = async (
    matchSlug,
    { league = "", locale = "ar", filename } = {},
  ) => {
    if (!import.meta.client || !matchSlug) return false
    exporting.value = true
    lastError.value = null
    try {
      const svg = await fetchCardSvg(matchSlug, { league, locale })
      const png = await svgToPngBlob(svg)
      const a = document.createElement("a")
      const objectUrl = URL.createObjectURL(png)
      a.href = objectUrl
      a.download = filename || `result-${matchSlug}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      return true
    } catch (err) {
      lastError.value = err?.message || "export_failed"
      return false
    } finally {
      exporting.value = false
    }
  }

  const shareResultCard = async (
    matchSlug,
    {
      league = "",
      locale = "ar",
      title = "Green Ball",
      text = "",
      pageUrl = "",
    } = {},
  ) => {
    if (!import.meta.client || !matchSlug) return false
    exporting.value = true
    lastError.value = null
    try {
      const svg = await fetchCardSvg(matchSlug, { league, locale })
      const png = await svgToPngBlob(svg)
      const file = new File([png], `result-${matchSlug}.png`, {
        type: "image/png",
      })
      const shareUrl =
        pageUrl ||
        (typeof window !== "undefined" ? window.location.href : "")

      // Prefer sharing the image file (best for Facebook photo culture)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text: text || title,
        })
        return true
      }

      // Fallback: share link + text
      if (navigator.share) {
        await navigator.share({
          title,
          text: text || title,
          url: shareUrl,
        })
        return true
      }

      // Last resort: download the PNG so user can post it manually
      const objectUrl = URL.createObjectURL(png)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `result-${matchSlug}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      return true
    } catch (err) {
      // User cancelled share dialog — not a real error
      if (err?.name === "AbortError") return false
      lastError.value = err?.message || "share_failed"
      return false
    } finally {
      exporting.value = false
    }
  }

  const siteUrl = computed(
    () =>
      config.public.siteUrl ||
      (import.meta.client ? window.location.origin : ""),
  )

  return {
    exporting,
    lastError,
    siteUrl,
    getCardUrl,
    fetchCardSvg,
    fetchCardMeta,
    downloadResultCard,
    shareResultCard,
  }
}
