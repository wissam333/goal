import { createClient } from "@supabase/supabase-js"
import {
  buildMatchCardModel,
  buildMatchCardDescription,
  buildMatchCardSvg,
} from "../../../utils/matchResultCard.js"

function parseJsonFields(match: Record<string, any>) {
  for (const key of ["goalScorers", "cards", "photos", "videos"]) {
    if (typeof match[key] === "string") {
      try {
        match[key] = JSON.parse(match[key])
      } catch {
        match[key] = []
      }
    }
  }
  return match
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing match slug" })
  }

  const query = getQuery(event)
  const leagueSlug = typeof query.league === "string" ? query.league : ""
  const locale = query.locale === "en" ? "en" : "ar"
  const format = query.format === "json" ? "json" : "svg"

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey =
    (config.supabaseServiceKey as string) ||
    (config.public.supabaseKey as string)
  const siteUrl = (config.public.siteUrl as string) || ""

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase not configured",
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let leagueId: string | null = null
  let leagueName = (config.public.leagueName as string) || "Green Ball"

  if (leagueSlug) {
    const { data: league } = await supabase
      .from("leagues")
      .select("id, name")
      .eq("slug", leagueSlug)
      .maybeSingle()
    if (league) {
      leagueId = league.id
      leagueName = league.name || leagueName
    }
  }

  let matchQuery = supabase.from("matches").select("*").eq("slug", slug).limit(1)
  if (leagueId) matchQuery = matchQuery.eq("league_id", leagueId)

  const { data: matchRows, error: matchErr } = await matchQuery
  if (matchErr) {
    throw createError({ statusCode: 500, statusMessage: matchErr.message })
  }
  const matchRow = Array.isArray(matchRows) ? matchRows[0] : matchRows
  if (!matchRow) {
    throw createError({ statusCode: 404, statusMessage: "Match not found" })
  }

  const match = parseJsonFields(matchRow)

  // Resolve league name from match if not already
  if (!leagueSlug && match.league_id) {
    const { data: league } = await supabase
      .from("leagues")
      .select("name, slug")
      .eq("id", match.league_id)
      .maybeSingle()
    if (league?.name) leagueName = league.name
  }

  const teamSlugs = [match.homeTeam, match.awayTeam].filter(Boolean)
  let teamsQuery = supabase.from("teams").select("slug, title, logo")
  if (match.league_id) teamsQuery = teamsQuery.eq("league_id", match.league_id)
  const { data: teams } = await teamsQuery.in("slug", teamSlugs)

  const homeTeam = teams?.find((t) => t.slug === match.homeTeam) || null
  const awayTeam = teams?.find((t) => t.slug === match.awayTeam) || null

  // Players referenced by goals / cards
  const goalScorers = Array.isArray(match.goalScorers) ? match.goalScorers : []
  const cards = Array.isArray(match.cards) ? match.cards : []
  const playerSlugs = [
    ...new Set(
      [...goalScorers, ...cards]
        .map((e: any) => e?.player)
        .filter(Boolean),
    ),
  ] as string[]

  let players: any[] = []
  if (playerSlugs.length) {
    let playersQuery = supabase
      .from("players")
      .select("slug, title, team")
      .in("slug", playerSlugs)
    if (match.league_id) {
      playersQuery = playersQuery.eq("league_id", match.league_id)
    }
    const { data } = await playersQuery
    players = data || []
  }

  const model = buildMatchCardModel({
    match,
    homeTeam,
    awayTeam,
    players,
    leagueName,
    siteUrl,
    locale,
  })

  if (format === "json") {
    setHeader(event, "Content-Type", "application/json; charset=utf-8")
    setHeader(event, "Cache-Control", "public, max-age=60, s-maxage=120")
    return {
      model,
      description: buildMatchCardDescription(model),
      title: `${model.home.title} ${model.scoreText} ${model.away.title}`,
    }
  }

  const svg = buildMatchCardSvg(model)
  setHeader(event, "Content-Type", "image/svg+xml; charset=utf-8")
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
  )
  // Help Facebook/Twitter treat this as an image asset
  setHeader(event, "Content-Disposition", `inline; filename="match-${slug}.svg"`)
  return svg
})
