export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event } = {}) => {
    console.error('===== NITRO ERROR =====')
    console.error('URL:', event?.path || event?.url || 'unknown')
    console.error('User-Agent:', event ? getHeader(event, 'user-agent') : 'unknown')
    console.error('Status:', error.statusCode || 500)
    console.error('StatusMessage:', error.statusMessage || '')
    console.error('Message:', error.message || '')
    console.error('Stack:', error.stack || '')
    console.error('Data:', error.data ? JSON.stringify(error.data) : '')
    console.error('===== END NITRO ERROR =====')
  })
})
