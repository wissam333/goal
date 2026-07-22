/**
 * Match result card (SVG) — always light mode, matches public scoreboard + sections.
 * Full names (no ellipsis). Dynamic height grows with goals/cards.
 */

function num(v) {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function hasPair(home, away) {
  return home !== null && away !== null
}

function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function parseJsonField(value, fallback = []) {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

function getOpenPlayScore(match) {
  const aetH = num(match.homeScoreAET)
  const aetA = num(match.awayScoreAET)
  if (hasPair(aetH, aetA)) return { home: aetH, away: aetA }
  return { home: num(match.homeScore), away: num(match.awayScore) }
}

function getResultMethod(match) {
  if (match.resultMethod === "aet" || match.resultMethod === "pen") {
    return match.resultMethod
  }
  const pensH = num(match.homePenalties)
  const pensA = num(match.awayPenalties)
  if (hasPair(pensH, pensA)) return "pen"
  const aetH = num(match.homeScoreAET)
  const aetA = num(match.awayScoreAET)
  if (hasPair(aetH, aetA)) {
    const regH = num(match.homeScore)
    const regA = num(match.awayScore)
    if (hasPair(regH, regA) && (aetH !== regH || aetA !== regA)) return "aet"
  }
  return "ft"
}

function getStatusLabel(match, locale = "ar") {
  const status = match.status || "upcoming"
  if (status === "live") return "LIVE"
  if (status === "played") {
    const method = getResultMethod(match)
    if (method === "pen") return locale === "ar" ? "نهاية · ر.ت." : "FT · PEN"
    if (method === "aet") return locale === "ar" ? "نهاية · ب.و.إ" : "FT · AET"
    return locale === "ar" ? "انتهت" : "FT"
  }
  return locale === "ar" ? "قادمة" : "Upcoming"
}

function prettifyPlayerLabel(value) {
  if (!value) return "—"
  if (value === "unknown" || value === "null") return "—"
  if (/[\u0600-\u06FF]/.test(value) && value.includes("-")) {
    return value.replace(/-/g, " ")
  }
  return value
}

function playerName(slug, playerMap = {}) {
  if (!slug) return "—"
  if (slug === "unknown" || slug === "null") return "—"
  const fromDb = playerMap[slug]?.title || playerMap[slug]?.name
  return prettifyPlayerLabel(fromDb || slug)
}

function formatMinute(minute) {
  if (minute === null || minute === undefined || minute === "") return ""
  return `${minute}'`
}

function sortByMinute(list) {
  return [...list].sort(
    (a, b) => (Number(a.minute) || 0) - (Number(b.minute) || 0),
  )
}

/** Wrap full names — never truncate with ellipsis. */
function wrapText(text, maxChars = 26) {
  const s = String(text || "—").trim() || "—"
  if (s.length <= maxChars) return [s]

  const words = s.split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ""

  const pushWord = (w) => {
    if (!cur) {
      if (w.length <= maxChars) {
        cur = w
      } else {
        // hard-split very long tokens so nothing is hidden
        for (let i = 0; i < w.length; i += maxChars) {
          const chunk = w.slice(i, i + maxChars)
          if (i + maxChars < w.length) lines.push(chunk)
          else cur = chunk
        }
      }
      return
    }
    if ((cur + " " + w).length <= maxChars) {
      cur = `${cur} ${w}`
    } else {
      lines.push(cur)
      cur = ""
      pushWord(w)
    }
  }

  for (const w of words) pushWord(w)
  if (cur) lines.push(cur)
  return lines.length ? lines : ["—"]
}

function estimateTeamNameFontSize(title) {
  const len = String(title || "").length
  if (len <= 12) return 22
  if (len <= 18) return 18
  if (len <= 26) return 16
  return 14
}

/**
 * Build structured payload for the card + text descriptions.
 */
export function buildMatchCardModel({
  match,
  homeTeam,
  awayTeam,
  players = [],
  leagueName = "Green Ball",
  siteUrl = "",
  locale = "ar",
}) {
  const playerMap = Object.fromEntries((players || []).map((p) => [p.slug, p]))
  const goals = parseJsonField(match.goalScorers)
  const cards = parseJsonField(match.cards)
  const open = getOpenPlayScore(match)
  const method = getResultMethod(match)
  const pensH = num(match.homePenalties)
  const pensA = num(match.awayPenalties)

  const homeGoals = sortByMinute(goals.filter((g) => g.team === match.homeTeam))
  const awayGoals = sortByMinute(goals.filter((g) => g.team === match.awayTeam))
  const homeCards = sortByMinute(cards.filter((c) => c.team === match.homeTeam))
  const awayCards = sortByMinute(cards.filter((c) => c.team === match.awayTeam))

  const homeTitle = homeTeam?.title || match.homeTeam || "—"
  const awayTitle = awayTeam?.title || match.awayTeam || "—"

  return {
    locale,
    leagueName,
    siteUrl,
    venue: match.venue || "",
    group: match.group || "",
    status: match.status || "upcoming",
    statusLabel: getStatusLabel(match, locale),
    method,
    home: {
      slug: match.homeTeam,
      title: homeTitle,
      logo: homeTeam?.logo || "",
      score: open.home,
      goals: homeGoals.map((g) => ({
        name: playerName(g.player, playerMap),
        minute: g.minute ?? g.min ?? null,
      })),
      cards: homeCards.map((c) => ({
        name: playerName(c.player, playerMap),
        minute: c.minute ?? c.min ?? null,
        type: c.type === "red" ? "red" : "yellow",
      })),
    },
    away: {
      slug: match.awayTeam,
      title: awayTitle,
      logo: awayTeam?.logo || "",
      score: open.away,
      goals: awayGoals.map((g) => ({
        name: playerName(g.player, playerMap),
        minute: g.minute ?? g.min ?? null,
      })),
      cards: awayCards.map((c) => ({
        name: playerName(c.player, playerMap),
        minute: c.minute ?? c.min ?? null,
        type: c.type === "red" ? "red" : "yellow",
      })),
    },
    pens:
      method === "pen" && hasPair(pensH, pensA)
        ? { home: pensH, away: pensA }
        : null,
    scoreText:
      open.home == null || open.away == null
        ? "–"
        : `${open.home}–${open.away}`,
  }
}

/** Plain-text description for OG / Facebook / WhatsApp. */
export function buildMatchCardDescription(model) {
  const lines = []
  const ar = model.locale === "ar"

  lines.push(`${model.home.title} ${model.scoreText} ${model.away.title}`)
  if (model.pens) {
    lines.push(
      ar
        ? `ركلات الترجيح: ${model.pens.home}–${model.pens.away}`
        : `Penalties: ${model.pens.home}–${model.pens.away}`,
    )
  }
  if (model.statusLabel) lines.push(model.statusLabel)

  const fmtMin = (m) =>
    m !== null && m !== undefined && m !== "" ? `${m}' ` : ""

  const goalLines = []
  for (const g of model.home.goals) {
    goalLines.push(`⚽ ${fmtMin(g.minute)}${g.name} (${model.home.title})`)
  }
  for (const g of model.away.goals) {
    goalLines.push(`⚽ ${fmtMin(g.minute)}${g.name} (${model.away.title})`)
  }
  if (goalLines.length) {
    lines.push(ar ? "الأهداف:" : "Goals:")
    lines.push(...goalLines)
  }

  const cardLines = []
  for (const c of model.home.cards) {
    const icon = c.type === "red" ? "🟥" : "🟨"
    cardLines.push(`${icon} ${fmtMin(c.minute)}${c.name} (${model.home.title})`)
  }
  for (const c of model.away.cards) {
    const icon = c.type === "red" ? "🟥" : "🟨"
    cardLines.push(`${icon} ${fmtMin(c.minute)}${c.name} (${model.away.title})`)
  }
  if (cardLines.length) {
    lines.push(ar ? "البطاقات:" : "Cards:")
    lines.push(...cardLines)
  }

  if (model.venue) {
    lines.push(ar ? `الملعب: ${model.venue}` : `Venue: ${model.venue}`)
  }
  if (model.leagueName) lines.push(model.leagueName)

  return lines.join("\n")
}

/**
 * Font stack for the card. Pass `fontFamily` into buildMatchCardSvg to
 * override with your website's exact font. Note: if this SVG is rasterized
 * server-side (sharp/resvg/satori) rather than rendered in a browser, a
 * plain font-family name won't be enough — the renderer needs the font
 * either installed on the machine or embedded via @font-face with a
 * base64-encoded font file. A CDN @import will silently fail in most
 * server-side SVG rasterizers.
 */
const DEFAULT_FONT = "'Tajawal', Tahoma, 'Segoe UI', Arial, sans-serif"

function teamLogoBlock(team, x, y, size = 72) {
  const r = 16
  const clipId = `clip_${String(team.slug || "t").replace(/[^a-zA-Z0-9_-]/g, "_")}_${x}_${y}`
  if (team.logo && /^https?:\/\//i.test(team.logo)) {
    return `
      <defs>
        <clipPath id="${clipId}">
          <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" />
        </clipPath>
      </defs>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="#ffffff" stroke="rgba(34,197,94,0.28)" stroke-width="2"/>
      <image href="${escapeXml(team.logo)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
    `
  }
  const initial = escapeXml((team.title || "?").charAt(0))
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="#ffffff" stroke="rgba(34,197,94,0.35)" stroke-width="2"/>
    <text x="${x + size / 2}" y="${y + size / 2 + 11}" text-anchor="middle" font-size="30" font-weight="800" fill="#16a34a" font-family="${DEFAULT_FONT}">${initial}</text>
  `
}

function multiLineText({
  lines,
  x,
  y,
  anchor = "start",
  fontSize = 17,
  fill = "#111827",
  weight = "600",
  lineHeight = 22,
  fontFamily = DEFAULT_FONT,
}) {
  return lines
    .map((line, i) => {
      const yy = y + i * lineHeight
      return `<text x="${x}" y="${yy}" text-anchor="${anchor}" font-size="${fontSize}" font-weight="${weight}" fill="${fill}" font-family="${fontFamily}">${escapeXml(line)}</text>`
    })
    .join("")
}

/**
 * Light-mode result card matching the website scoreboard + section cards.
 * Dynamic height — full player/team names, no ellipsis.
 *
 * @param {object} model - from buildMatchCardModel()
 * @param {object} [opts]
 * @param {string} [opts.fontFamily] - override font stack (e.g. your site's exact font)
 */
export function buildMatchCardSvg(model, opts = {}) {
  const W = 1200
  const PAD = 36
  const FONT = opts.fontFamily || DEFAULT_FONT
  // RTL by default, matching the site's Arabic-first layout — pass locale: "en" to switch to LTR.
  const ar = model.locale !== "en"
  const homeTitle = model.home.title || "—"
  const awayTitle = model.away.title || "—"
  const league = model.leagueName || "Green Ball"
  const venue = model.venue || ""
  const status = model.statusLabel || "FT"
  const scoreHome = model.home.score == null ? "–" : String(model.home.score)
  const scoreAway = model.away.score == null ? "–" : String(model.away.score)

  const goalsLabel = ar ? "الأهداف" : "Goals"
  const cardsLabel = ar ? "البطاقات" : "Cards"
  const hasGoals =
    model.home.goals.length > 0 || model.away.goals.length > 0
  const hasCards =
    model.home.cards.length > 0 || model.away.cards.length > 0

  // Team name lines under logos (full name, may wrap)
  const homeNameLines = wrapText(homeTitle, 18)
  const awayNameLines = wrapText(awayTitle, 18)
  const homeNameFs = estimateTeamNameFontSize(homeTitle)
  const awayNameFs = estimateTeamNameFontSize(awayTitle)
  const nameBlockH =
    Math.max(homeNameLines.length, awayNameLines.length) * 24 + 8

  // ── Scoreboard hero (matches .scoreboard-hero light) ──
  // Reserve extra room at the bottom of the hero for the venue line.
  const venueRowH = venue ? 34 : 0
  const heroY = 28
  const heroH = 268 + nameBlockH + venueRowH
  const heroX = PAD
  const heroW = W - PAD * 2

  // ── Event sections (like .section-card on match page) ──
  const LINE_H = 26
  const ROW_GAP = 10
  const SECTION_PAD = 22
  const SECTION_TITLE_H = 36

  function rowHeight(item) {
    const lines = wrapText(item.name, 28)
    return Math.max(LINE_H, lines.length * 20 + 6)
  }

  function sectionHeight(homeItems, awayItems) {
    if (!homeItems.length && !awayItems.length) return 0
    const n = Math.max(homeItems.length, awayItems.length, 1)
    let h = SECTION_PAD + SECTION_TITLE_H
    for (let i = 0; i < n; i++) {
      const hh = homeItems[i] ? rowHeight(homeItems[i]) : 0
      const ah = awayItems[i] ? rowHeight(awayItems[i]) : 0
      h += Math.max(hh, ah, LINE_H) + ROW_GAP
    }
    h += SECTION_PAD - ROW_GAP
    return h
  }

  const goalsH = hasGoals
    ? sectionHeight(model.home.goals, model.away.goals)
    : 0
  const cardsH = hasCards
    ? sectionHeight(model.home.cards, model.away.cards)
    : 0
  const emptyH = !hasGoals && !hasCards ? 88 : 0
  const footerH = 40
  const gap = 16

  const H =
    heroY +
    heroH +
    gap +
    (goalsH ? goalsH + gap : 0) +
    (cardsH ? cardsH + gap : 0) +
    (emptyH ? emptyH + gap : 0) +
    footerH

  const statusText = status

  // Pens / AET under score
  let methodExtra = ""
  if (model.pens) {
    methodExtra = `
      <rect x="${W / 2 - 90}" y="${heroY + 214 + nameBlockH - 24}" width="180" height="30" rx="10" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.35)"/>
      <text x="${W / 2}" y="${heroY + 214 + nameBlockH - 3}" text-anchor="middle" font-size="15" font-weight="700" fill="#15803d" font-family="${FONT}">${ar ? "ر.ت." : "PEN"} ${model.pens.home}–${model.pens.away}</text>
    `
  } else if (model.method === "aet") {
    methodExtra = `
      <text x="${W / 2}" y="${heroY + 214 + nameBlockH - 4}" text-anchor="middle" font-size="14" font-weight="700" fill="#15803d" font-family="${FONT}">${ar ? "ب.و.إ" : "AET"}</text>
    `
  }

  // Venue — bottom center of the scoreboard hero itself (not the page footer)
  const venueBlock = venue
    ? `<text x="${W / 2}" y="${heroY + heroH - 20}" text-anchor="middle" font-size="15" font-weight="600" fill="#166534" font-family="${FONT}">${escapeXml(venue)}</text>`
    : ""

  // Build event rows for a section
  function renderSection(title, homeItems, awayItems, y0, kind) {
    if (!homeItems.length && !awayItems.length) return { svg: "", height: 0 }
    const height = sectionHeight(homeItems, awayItems)
    const n = Math.max(homeItems.length, awayItems.length, 1)
    let y = y0 + SECTION_PAD + 8

    let rows = `
      <rect x="${PAD}" y="${y0}" width="${heroW}" height="${height}" rx="18" fill="#ffffff" stroke="rgba(15,23,42,0.08)"/>
      <text x="${W / 2}" y="${y0 + SECTION_PAD + 8}" text-anchor="middle" font-size="16" font-weight="800" fill="#16a34a" font-family="${FONT}">${escapeXml(title)}</text>
    `
    y = y0 + SECTION_PAD + SECTION_TITLE_H

    for (let i = 0; i < n; i++) {
      const hItem = homeItems[i]
      const aItem = awayItems[i]
      const rh = Math.max(
        hItem ? rowHeight(hItem) : 0,
        aItem ? rowHeight(aItem) : 0,
        LINE_H,
      )
      const midY = y + rh / 2 + 4

      if (hItem) {
        const lines = wrapText(hItem.name, 28)
        const min = formatMinute(hItem.minute)
        const nameBlock = multiLineText({
          lines,
          x: PAD + 28,
          y: y + 16,
          anchor: "start",
          fontSize: 17,
          fill: "#111827",
          weight: "600",
          lineHeight: 20,
          fontFamily: FONT,
        })
        if (kind === "goal") {
          // single marker circle — no inner dot
          rows += `
            ${nameBlock}
            <text x="${W / 2 - 50}" y="${midY}" text-anchor="end" font-size="15" fill="#6b7280" font-family="${FONT}">${escapeXml(min)}</text>
            <circle cx="${W / 2 - 28}" cy="${midY - 5}" r="12" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
          `
        } else {
          const fill = hItem.type === "red" ? "#ef4444" : "#eab308"
          rows += `
            ${nameBlock}
            <text x="${W / 2 - 48}" y="${midY}" text-anchor="end" font-size="15" fill="#6b7280" font-family="${FONT}">${escapeXml(min)}</text>
            <rect x="${W / 2 - 38}" y="${midY - 16}" width="14" height="18" rx="2" fill="${fill}" stroke="rgba(0,0,0,0.1)"/>
          `
        }
      }

      if (aItem) {
        const lines = wrapText(aItem.name, 28)
        const min = formatMinute(aItem.minute)
        const nameBlock = multiLineText({
          lines,
          x: W - PAD - 28,
          y: y + 16,
          anchor: "end",
          fontSize: 17,
          fill: "#111827",
          weight: "600",
          lineHeight: 20,
          fontFamily: FONT,
        })
        if (kind === "goal") {
          rows += `
            <circle cx="${W / 2 + 28}" cy="${midY - 5}" r="12" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
            <text x="${W / 2 + 50}" y="${midY}" text-anchor="start" font-size="15" fill="#6b7280" font-family="${FONT}">${escapeXml(min)}</text>
            ${nameBlock}
          `
        } else {
          const fill = aItem.type === "red" ? "#ef4444" : "#eab308"
          rows += `
            <rect x="${W / 2 + 24}" y="${midY - 16}" width="14" height="18" rx="2" fill="${fill}" stroke="rgba(0,0,0,0.1)"/>
            <text x="${W / 2 + 48}" y="${midY}" text-anchor="start" font-size="15" fill="#6b7280" font-family="${FONT}">${escapeXml(min)}</text>
            ${nameBlock}
          `
        }
      }

      // subtle divider between rows
      if (i < n - 1) {
        rows += `<line x1="${PAD + 24}" y1="${y + rh + 2}" x2="${W - PAD - 24}" y2="${y + rh + 2}" stroke="rgba(15,23,42,0.06)" stroke-width="1"/>`
      }

      y += rh + ROW_GAP
    }

    return { svg: rows, height }
  }

  let cursorY = heroY + heroH + gap
  let goalsBlock = ""
  let cardsBlock = ""
  let emptyBlock = ""

  if (hasGoals) {
    const sec = renderSection(
      goalsLabel,
      model.home.goals,
      model.away.goals,
      cursorY,
      "goal",
    )
    goalsBlock = sec.svg
    cursorY += sec.height + gap
  }

  if (hasCards) {
    const sec = renderSection(
      cardsLabel,
      model.home.cards,
      model.away.cards,
      cursorY,
      "card",
    )
    cardsBlock = sec.svg
    cursorY += sec.height + gap
  }

  if (!hasGoals && !hasCards) {
    const hint =
      model.status === "upcoming"
        ? ar
          ? "المباراة لم تبدأ بعد"
          : "Match not started yet"
        : ar
          ? "لا تفاصيل أهداف أو بطاقات بعد"
          : "No goal or card details yet"
    emptyBlock = `
      <rect x="${PAD}" y="${cursorY}" width="${heroW}" height="${emptyH}" rx="18" fill="#ffffff" stroke="rgba(15,23,42,0.08)"/>
      <text x="${W / 2}" y="${cursorY + emptyH / 2 + 6}" text-anchor="middle" font-size="18" fill="#6b7280" font-family="${FONT}">${escapeXml(hint)}</text>
    `
    cursorY += emptyH + gap
  }

  const homeLogoX = PAD + 90
  const awayLogoX = W - PAD - 90 - 80
  const logoY = heroY + 78
  const scoreCY = heroY + 130

  const aria = `${escapeXml(homeTitle)} ${escapeXml(model.scoreText)} ${escapeXml(awayTitle)}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" dir="${ar ? 'rtl' : 'ltr'}" role="img" aria-label="${aria}">
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="pitch" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8f5e9"/>
      <stop offset="55%" stop-color="#c8e6c9"/>
      <stop offset="100%" stop-color="#e8f5e9"/>
    </linearGradient>
    <radialGradient id="scoreGrad" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eafcf1"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#166534" flood-opacity="0.10"/>
    </filter>
    <filter id="scoreShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#166534" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Page (always light, like site default) -->
  <rect width="${W}" height="${H}" fill="url(#pageBg)"/>

  <!-- Scoreboard hero — same light gradient as website -->
  <rect x="${heroX}" y="${heroY}" width="${heroW}" height="${heroH}" rx="22" fill="url(#pitch)" stroke="rgba(34,197,94,0.28)" stroke-width="2" filter="url(#soft)"/>
  <line x1="${W / 2}" y1="${heroY + 16}" x2="${W / 2}" y2="${heroY + heroH - 16 - venueRowH}" stroke="rgba(0,80,0,0.08)" stroke-width="2"/>

  <!-- Header row inside hero -->
  <circle cx="${heroX + 36}" cy="${heroY + 36}" r="16" fill="#22c55e"/>
  <circle cx="${heroX + 36}" cy="${heroY + 36}" r="6" fill="#fff" opacity="0.95"/>
  <text x="${heroX + 60}" y="${heroY + 42}" text-anchor="start" font-size="20" font-weight="800" fill="#14532d" font-family="${FONT}">Green Ball</text>
  <text x="${W / 2}" y="${heroY + 42}" text-anchor="middle" font-size="16" font-weight="700" fill="#15803d" font-family="${FONT}">${escapeXml(league)}</text>

  <!-- Status badge (like .badge-ft) -->
  <rect x="${W / 2 - 100}" y="${heroY + 56}" width="200" height="32" rx="10" fill="rgba(34,197,94,0.14)" stroke="rgba(34,197,94,0.32)"/>
  <text x="${W / 2}" y="${heroY + 78}" text-anchor="middle" font-size="14" font-weight="800" fill="#15803d" font-family="${FONT}">${escapeXml(statusText)}</text>

  <!-- Home team -->
  ${teamLogoBlock(model.home, homeLogoX, logoY, 80)}
  ${multiLineText({
    lines: homeNameLines,
    x: homeLogoX + 40,
    y: logoY + 100,
    anchor: "middle",
    fontSize: homeNameFs,
    fill: "#111827",
    weight: "800",
    lineHeight: 22,
    fontFamily: FONT,
  })}

  <!-- Away team -->
  ${teamLogoBlock(model.away, awayLogoX, logoY, 80)}
  ${multiLineText({
    lines: awayNameLines,
    x: awayLogoX + 40,
    y: logoY + 100,
    anchor: "middle",
    fontSize: awayNameFs,
    fill: "#111827",
    weight: "800",
    lineHeight: 22,
    fontFamily: FONT,
  })}

  <!-- Score circle: single filled circle, matches match-details score badge -->
  <circle cx="${W / 2}" cy="${scoreCY}" r="92" fill="url(#scoreGrad)" stroke="rgba(34,197,94,0.4)" stroke-width="3" filter="url(#scoreShadow)"/>
  <text x="${W / 2 - 52}" y="${scoreCY + 18}" text-anchor="middle" font-size="48" font-weight="800" fill="#111827" font-family="${FONT}">${escapeXml(scoreHome)}</text>
  <text x="${W / 2}" y="${scoreCY + 14}" text-anchor="middle" font-size="32" font-weight="700" fill="#9ca3af" font-family="${FONT}">–</text>
  <text x="${W / 2 + 52}" y="${scoreCY + 18}" text-anchor="middle" font-size="48" font-weight="800" fill="#111827" font-family="${FONT}">${escapeXml(scoreAway)}</text>

  ${methodExtra}
  ${venueBlock}

  ${goalsBlock}
  ${cardsBlock}
  ${emptyBlock}

  <!-- Footer -->
  <text x="${W / 2}" y="${H - 16}" text-anchor="middle" font-size="13" fill="#94a3b8" font-family="${FONT}">green ball · ${ar ? "نتائج · أهداف · بطاقات" : "results · goals · cards"}</text>
</svg>`
}