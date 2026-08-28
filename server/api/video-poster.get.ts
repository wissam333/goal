function cleanFb(url) {
  try {
    const u = new URL(url)
    u.search = ''
    u.host = 'm.facebook.com'
    return u.toString()
  } catch { return url }
}

function decodeEntities(s) {
  if (!s) return s
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea')
    txt.innerHTML = s
    return txt.value
  }
  // server fallback (no DOM): decode common numeric + named entities
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
}

function extractMeta(html, prop) {
  const re = new RegExp(`property="${prop}"[^>]*content="([^"]+)"`, 'i')
  const m = html.match(re)
  return m ? decodeEntities(m[1].replaceAll('&amp;', '&')) : null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url
  if (!url || typeof url !== 'string') return { image: null, title: null }

  const isFb = /facebook\.com|fb\.watch|fb\.com/.test(url)
  const isYt = /youtube\.com|youtu\.be/.test(url)

  // YouTube thumbnail needs no fetching
  if (isYt) {
    const id = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([^&\s/]+)/)?.[1]
    if (id) return { image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, title: null }
  }

  if (!isFb) return { image: null, title: null }

  try {
    const res = await $fetch(cleanFb(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    })
    const html = typeof res === 'string' ? res : JSON.stringify(res)
    const image = extractMeta(html, 'og:image')
    const title = extractMeta(html, 'og:title')
    return { image, title }
  } catch {
    return { image: null, title: null }
  }
})
