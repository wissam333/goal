import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  const legacyPaths = [
    '/fixtures', '/standings', '/teams', '/bracket', '/stats',
    '/matches', '/players', '/managers',
  ]

  for (const p of legacyPaths) {
    if (path === p || path.startsWith(p + '/')) {
      const suffix = path.slice(p.length)
      return sendRedirect(event, `/al-jarwiyya${p}${suffix}`, 308)
    }
  }
})
