import { createClient } from "@supabase/supabase-js"

let _client = null

export const useSupabase = () => {
  if (_client) return _client
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabaseKey
  if (!url || !key) return null
  try {
    _client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    return _client
  } catch {
    return null
  }
}
