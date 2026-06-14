export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string
  if (!url) return { url: null }

  try {
    const res = await $fetch.raw(url, { redirect: 'follow' })
    return { url: res.url || url }
  } catch {
    return { url }
  }
})
