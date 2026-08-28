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
  // explicit ?v= / watch / video.php
  const q = url.match(/[?&]v=(\d{10,})/)
  if (q) return q[1]
  // reel or videos: the video id is the LAST 10+ digit number (a page slug/id may come first)
  const nums = url.match(/(\d{10,})/g)
  return nums ? nums[nums.length - 1] : null
}

function buildEmbedUrl(url, width = 560) {
  if (!url) return ''
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([^&\s/]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const fbId = getFbId(url)
  if (fbId) {
    // Legal, framable FB embed endpoint (serves a REAL playable stream via DASH).
    // Use a canonical href that preserves the video ID (cleanFbUrl would drop /watch/?v=).
    const href = /\/watch\//.test(url) ? `https://www.facebook.com/watch/?v=${fbId}` : cleanFbUrl(url)
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false&width=${width}`
  }
  return cleanFbUrl(url)
}

export function useVideoEmbed() {
  return { isFbUrl, cleanFbUrl, buildEmbedUrl, getFbId }
}
