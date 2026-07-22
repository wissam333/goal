import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env', 'utf8')
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'))
  return m?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const sb = createClient(get('SUPABASE_URL'), get('SUPABASE_SERVICE_KEY') || get('SUPABASE_ANON_KEY'))

// Probe columns via a dry insert rollback isn't possible; just select
const { data, error } = await sb.from('match_predictions').select('*').limit(3)
console.log('sample', JSON.stringify({ error, data }, null, 2))

// Try to discover constraints via pg_catalog if service role allows rpc — skip
// Test guest-style insert then delete
const testVoter = 'guest-test-' + Date.now()
const matchSlug = data?.[0]?.match_slug
const leagueId = data?.[0]?.league_id
console.log('using match', matchSlug, leagueId)

if (matchSlug) {
  const payload = {
    match_slug: matchSlug,
    team_slug: '__draw__',
    voter_id: testVoter,
    user_id: null,
  }
  if (leagueId) payload.league_id = leagueId
  const ins = await sb.from('match_predictions').insert(payload).select()
  console.log('guest insert', JSON.stringify(ins, null, 2))
  if (ins.data?.[0]?.id) {
    await sb.from('match_predictions').delete().eq('id', ins.data[0].id)
    console.log('cleaned test row')
  }
  // second insert same voter should fail if unique on voter_id
  const ins2 = await sb.from('match_predictions').insert(payload).select()
  console.log('duplicate guest insert', JSON.stringify(ins2, null, 2))
  if (ins2.data?.[0]?.id) {
    await sb.from('match_predictions').delete().eq('id', ins2.data[0].id)
  }
  // clean both if both succeeded
  await sb.from('match_predictions').delete().eq('voter_id', testVoter)
}
