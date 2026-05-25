import { createClient } from "@supabase/supabase-js"

let _client = null

export const useSupabase = () => {
  if (_client) return _client
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabaseKey
  if (!url || !key) return null
  _client = createClient(url, key)
  return _client
}
