import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import {
  buildMatchCardModel,
  buildMatchCardSvg,
  buildMatchCardDescription,
} from './server/utils/matchResultCard.js'

const env = readFileSync('.env', 'utf8')
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'))
  return m?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const sb = createClient(get('SUPABASE_URL'), get('SUPABASE_ANON_KEY'))

// Guest prediction insert
const voter = 'guest-ui-test-' + Date.now()
const { data: matches } = await sb
  .from('matches')
  .select('slug, league_id, status')
  .eq('status', 'upcoming')
  .limit(1)
const m = matches?.[0]
if (!m) {
  console.log('No upcoming match — testing with any match slug for insert only')
}
const matchSlug = m?.slug || 'ga-al-ahly-vs-baswram'
const leagueId = m?.league_id

const payload = {
  match_slug: matchSlug,
  team_slug: '__draw__',
  voter_id: voter,
  user_id: null,
}
if (leagueId) payload.league_id = leagueId

const ins = await sb.from('match_predictions').insert(payload).select()
console.log('guest insert ok?', !ins.error, ins.error?.message || ins.data?.[0]?.id)

// Read back by voter_id
const { data: mine } = await sb
  .from('match_predictions')
  .select('*')
  .eq('match_slug', matchSlug)
  .eq('voter_id', voter)
  .limit(1)
console.log('read back', mine?.[0]?.team_slug)

// cleanup
await sb.from('match_predictions').delete().eq('voter_id', voter)
console.log('cleaned')

// Card SVG full names
const { data: rich } = await sb
  .from('matches')
  .select('*')
  .eq('slug', 'ga-biemra-club-vs-birmanat-alshaykh')
  .limit(1)
const match = rich?.[0]
if (match) {
  for (const key of ['goalScorers', 'cards']) {
    if (typeof match[key] === 'string') match[key] = JSON.parse(match[key])
  }
  const { data: teams } = await sb
    .from('teams')
    .select('slug, title, logo')
    .in('slug', [match.homeTeam, match.awayTeam])
  const model = buildMatchCardModel({
    match,
    homeTeam: teams?.find((t) => t.slug === match.homeTeam),
    awayTeam: teams?.find((t) => t.slug === match.awayTeam),
    players: [],
    leagueName: 'دوري بعمرة',
    locale: 'ar',
  })
  const svg = buildMatchCardSvg(model)
  console.log('svg height', (svg.match(/height="(\d+)/) || [])[1])
  console.log('has ellipsis?', svg.includes('…') || svg.includes('...'))
  console.log('full name beraa?', svg.includes('براء'))
  console.log('full long name?', svg.includes('عيسى') && svg.includes('حمدان'))
  console.log('cards section?', svg.includes('البطاقات'))
  console.log(buildMatchCardDescription(model))
}
