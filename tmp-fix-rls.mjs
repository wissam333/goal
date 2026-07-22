import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env', 'utf8')
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'))
  return m?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const url = get('SUPABASE_URL')
const anon = get('SUPABASE_ANON_KEY')
const service = get('SUPABASE_SERVICE_KEY')

const admin = createClient(url, service)
const client = createClient(url, anon)

// Try to read policies via SQL if available
const sql = `
select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr,
       pg_get_expr(polwithcheck, polrelid) as check_expr
from pg_policy
where polrelid = 'match_predictions'::regclass;
`
const { data: policies, error: polErr } = await admin.rpc('exec_sql', { query: sql }).maybeSingle?.() ?? {}
console.log('rpc policies', polErr?.message || policies)

// Probe insert with various payloads using anon
const { data: m } = await admin.from('matches').select('slug, league_id').limit(1).maybeSingle()
const base = {
  match_slug: m.slug,
  team_slug: '__draw__',
  league_id: m.league_id,
}

const cases = [
  { name: 'guest null user', payload: { ...base, voter_id: 'g1-'+Date.now(), user_id: null } },
  { name: 'guest omit user', payload: { ...base, voter_id: 'g2-'+Date.now() } },
  { name: 'guest empty user string skip', payload: { ...base, voter_id: 'g3-'+Date.now() } },
]

for (const c of cases) {
  const res = await client.from('match_predictions').insert(c.payload).select()
  console.log(c.name, res.error ? res.error.message : 'OK ' + res.data?.[0]?.id)
  if (res.data?.[0]?.id) {
    await admin.from('match_predictions').delete().eq('id', res.data[0].id)
  }
}

// Check if authenticated insert works differently - skip

// Use service role to force-open policies via raw? Supabase JS can't run arbitrary SQL without db connection.
// Try postgres REST schema
const { data: cols } = await admin.from('match_predictions').select('*').limit(0)
console.log('admin can select', !cols === false)

// Attempt: create policy by documenting - run SQL through supabase management is not available.

// Double-check service insert works
const srv = await admin.from('match_predictions').insert({
  ...base,
  voter_id: 'svc-'+Date.now(),
  user_id: null,
}).select()
console.log('service guest insert', srv.error?.message || 'OK')
if (srv.data?.[0]?.id) await admin.from('match_predictions').delete().eq('id', srv.data[0].id)
