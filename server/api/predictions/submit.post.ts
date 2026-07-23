import { createClient } from "@supabase/supabase-js"

/**
 * Guest (and fallback) prediction submit.
 * Uses service key so RLS policies that require auth.uid() don't block guests.
 * One prediction per voter_id per match per league.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const matchSlug = String(body?.matchSlug || "").trim()
  const teamSlug = String(body?.teamSlug || "").trim()
  const voterId = String(body?.voterId || "").trim()
  const leagueSlug = body?.leagueSlug ? String(body.leagueSlug).trim() : ""
  const userId = body?.userId ? String(body.userId).trim() : null

  if (!matchSlug || !teamSlug || !voterId) {
    throw createError({
      statusCode: 400,
      statusMessage: "matchSlug, teamSlug and voterId are required",
    })
  }

  // Basic voter_id shape (uuid-ish / our generator)
  if (voterId.length < 8 || voterId.length > 80) {
    throw createError({ statusCode: 400, statusMessage: "Invalid voterId" })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl as string
  const serviceKey =
    (config.supabaseServiceKey as string) ||
    (config.public.supabaseKey as string)

  if (!supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 500, statusMessage: "Supabase not configured" })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let leagueId: string | null = null
  if (leagueSlug) {
    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("slug", leagueSlug)
      .maybeSingle()
    leagueId = league?.id || null
  }

  // Verify match exists
  const dbMatchSlug = leagueSlug ? leagueSlug + '::' + matchSlug : matchSlug
  let matchQ = supabase.from("matches").select("slug, league_id, status").eq("slug", dbMatchSlug)
  if (leagueId) matchQ = matchQ.eq("league_id", leagueId)
  const { data: matchRows } = await matchQ.limit(1)
  const match = matchRows?.[0]
  if (!match) {
    throw createError({ statusCode: 404, statusMessage: "Match not found" })
  }
  if (!leagueId && match.league_id) leagueId = match.league_id

  const dbTeamSlug = leagueSlug ? leagueSlug + '::' + teamSlug : teamSlug

  // Only upcoming matches accept new predictions
  if (match.status && match.status !== "upcoming") {
    throw createError({ statusCode: 400, statusMessage: "predictions_closed" })
  }

  // Already predicted? (by guest voter_id and/or logged-in user_id)
  let existingQ = supabase
    .from("match_predictions")
    .select("id, team_slug")
    .eq("match_slug", dbMatchSlug)

  if (userId) {
    existingQ = existingQ.or(`voter_id.eq.${voterId},user_id.eq.${userId}`)
  } else {
    existingQ = existingQ.eq("voter_id", voterId)
  }
  if (leagueId) existingQ = existingQ.eq("league_id", leagueId)

  const { data: existingRows } = await existingQ.limit(1)
  const existing = existingRows?.[0]
  if (existing) {
    return {
      ok: true,
      already: true,
      team_slug: existing.team_slug,
    }
  }

  const payload: Record<string, any> = {
    match_slug: dbMatchSlug,
    team_slug: dbTeamSlug,
    voter_id: voterId,
    user_id: userId,
  }
  if (leagueId) payload.league_id = leagueId

  const { data: inserted, error } = await supabase
    .from("match_predictions")
    .insert(payload)
    .select("id, team_slug")
    .maybeSingle()

  if (error) {
    // Unique race
    if (error.code === "23505" || /duplicate|unique/i.test(error.message || "")) {
      return { ok: true, already: true, team_slug: dbTeamSlug }
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    ok: true,
    already: false,
    team_slug: inserted?.team_slug || dbTeamSlug,
    id: inserted?.id,
  }
})
