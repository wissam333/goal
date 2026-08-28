/**
 * Video embed helpers. Centralizes embed URL building and Facebook URL cleaning.
 */

function isFbUrl(url) {
  return /facebook\.com|fb\.watch|fb\.com/.test(url)
}

/**
 * Clean a Facebook video URL for embedding:
 * - strips tracking query params (share_url, rdid, __tn__ …)
 * - keeps only the canonical /videos/ID path
 */
function cleanFbUrl(url) {
  if (!isFbUrl(url)) return url
  try {
    const u = new URL(url)
    u.search = ''
    return u.toString()
  } catch {
    // fallback: drop everything after "?"
    const idx = url.indexOf('?')
    return idx === -1 ? url : url.slice(0, idx)
  }
}

function getFbId(url) {
  if (!url) return null
  // /videos/ID, /reel/ID, /watch/?v=ID, /video.php?v=ID, fb.watch/ID
  const m = url.match(/(?:\/videos\/|\/reel\/|\/watch\/?\?v=|\/video\.php\?v=|fb\.watch\/)(\d+)/)
  if (m) return m[1]
  const m2 = url.match(/\/videos\/(\d+)/)
  if (m2) return m2[1]
  // last numeric segment
  const m3 = url.match(/(\d{10,})/)
  return m3 ? m3[1] : null
}

function buildEmbedUrl(url) {
  if (!url) return ''
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([^&\s/]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const fbId = getFbId(url)
  if (fbId) return `https://www.facebook.com/video/embed?video_id=${fbId}`
  return cleanFbUrl(url)
}

export function useVideoEmbed() {
  return { isFbUrl, cleanFbUrl, buildEmbedUrl, getFbId }
}
