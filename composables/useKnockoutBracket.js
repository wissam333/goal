// ponytail: legacy 'F' → 'FINAL' shorthand collided with biemra's 8-group stage (group F).
// No match in the DB stores 'F' for the final — al-jarwiyya stores 'FINAL' explicitly.
function normalizeRound(group) {
  return group
}

const KNOCKOUT_ROUNDS = ['R16', 'QF', 'SF', 'FINAL']

export function isKnockoutRound(group) {
  return KNOCKOUT_ROUNDS.includes(normalizeRound(group))
}

function buildTeamMap(teams) {
  const m = {}
  ;(teams || []).forEach(t => { m[t.slug] = t })
  return m
}

function getTeamName(slug, teamMap) {
  return teamMap[slug]?.title || slug
}

function getGroupTeamSlugs(group, teams) {
  return (teams || []).filter(t => (t.group || 'A') === group && !t.is_struck).map(t => t.slug)
}

function isGroupComplete(group, teams, matches) {
  const slugs = getGroupTeamSlugs(group, teams)
  if (slugs.length < 2) return false
  const groupMatches = (matches || []).filter(m => {
    if (m.group && m.group !== group) return false
    return slugs.includes(m.homeTeam) && slugs.includes(m.awayTeam)
  })
  if (groupMatches.length === 0) return false
  const totalExpected = (slugs.length * (slugs.length - 1)) / 2
  if (groupMatches.length < totalExpected) return false
  return groupMatches.every(m => m.status === 'played')
}

function getOrdinal(n, locale) {
  if (locale === 'ar') {
    return ['أول', 'ثاني', 'ثالث', 'رابع', 'خامس'][n - 1] || `${n}`
  }
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}

const AR_TBD = 'تحدد لاحقاً'

function resolveSide(side, teams, matches, teamMap, getGroupStandingsFn, slots, locale) {
  const tbd = locale === 'ar' ? AR_TBD : 'TBD'

  if (!side) return { label: tbd, teamSlug: null, resolved: false }

  if (side.type === 'tbd')
    return { label: tbd, teamSlug: null, resolved: false }

  if (side.type === 'team') {
    const slug = side.slug
    return { label: getTeamName(slug, teamMap), teamSlug: slug, resolved: true }
  }

  if (side.type === 'winner') {
    const prefix = locale === 'ar' ? 'فائز' : 'Winner of'
    if (!slots) return { label: `${prefix} ${side.of}`, teamSlug: null, resolved: false }
    const sourceSlot = slots.find(s => s.id === side.of)
    if (sourceSlot && sourceSlot._match && sourceSlot._match.status === 'played') {
      const winner = getWinnerSlug(sourceSlot._match)
      if (winner) return { label: getTeamName(winner, teamMap), teamSlug: winner, resolved: true }
    }
    return { label: `${prefix} ${side.of}`, teamSlug: null, resolved: false }
  }

  if (side.type === 'seed') {
    const complete = isGroupComplete(side.group, teams, matches)
    if (complete) {
      const standings = getGroupStandingsFn(side.group, teams, matches)
      const entry = standings[side.pos - 1]
      if (entry) {
        return {
          label: getTeamName(entry.slug, teamMap),
          teamSlug: entry.slug,
          resolved: true,
          seedLabel: `${getOrdinal(side.pos, locale)} ${side.group}`,
        }
      }
    }
    return {
      label: `${getOrdinal(side.pos, locale)} ${side.group}`,
      teamSlug: null,
      resolved: false,
    }
  }

  return { label: tbd, teamSlug: null, resolved: false }
}

function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function hasPair(home, away) {
  return home !== null && away !== null
}

function getOpenPlayScore(match) {
  if (!match) return { home: null, away: null }
  const aetH = num(match.homeScoreAET)
  const aetA = num(match.awayScoreAET)
  if (hasPair(aetH, aetA)) return { home: aetH, away: aetA }
  return { home: num(match.homeScore), away: num(match.awayScore) }
}

function getPenaltyScore(match) {
  if (!match) return { home: null, away: null }
  return { home: num(match.homePenalties), away: num(match.awayPenalties) }
}

function getResultMethod(match) {
  if (!match) return 'ft'
  const m = match.resultMethod
  if (m === 'aet' || m === 'pen') return m
  const pens = getPenaltyScore(match)
  if (hasPair(pens.home, pens.away)) return 'pen'
  const aetH = num(match.homeScoreAET)
  const aetA = num(match.awayScoreAET)
  if (hasPair(aetH, aetA)) {
    const regH = num(match.homeScore)
    const regA = num(match.awayScore)
    if (hasPair(regH, regA) && (aetH !== regH || aetA !== regA)) return 'aet'
    if (aetH !== aetA) return 'aet'
  }
  return 'ft'
}

function getWinnerSlug(match) {
  if (!match || match.status !== 'played') return null
  const method = getResultMethod(match)
  if (method === 'pen') {
    const pens = getPenaltyScore(match)
    if (hasPair(pens.home, pens.away) && pens.home !== pens.away) {
      return pens.home > pens.away ? match.homeTeam : match.awayTeam
    }
  }
  const open = getOpenPlayScore(match)
  if (!hasPair(open.home, open.away) || open.home === open.away) return null
  return open.home > open.away ? match.homeTeam : match.awayTeam
}

function sideTeamPool(side, allSlots, teams, visited = new Set()) {
  if (!side) return []
  if (side.type === 'team') return side.slug ? [side.slug] : []
  if (side.type === 'winner' && side.of) {
    if (visited.has(side.of)) return [] // ponytail: cycle guard, broken draw data must not crash
    const src = (allSlots || []).find(s => s.id === side.of)
    if (src) {
      visited.add(side.of)
      return [...sideTeamPool(src.home, allSlots, teams, visited), ...sideTeamPool(src.away, allSlots, teams, visited)]
    }
  }
  if (side.type === 'seed' && side.group) {
    return (teams || []).filter(t => (t.group || 'A') === side.group && !t.is_struck).map(t => t.slug)
  }
  return []
}

function matchSlotToDbMatch(slot, matches, allSlots, teams, assignedRef) {
  const round = slot.round
  const roundMatches = (matches || [])
    .filter(m => normalizeRound(m.group) === round && m.homeTeam && m.awayTeam)
  const unassigned = assignedRef ? roundMatches.filter(m => !assignedRef.has(m.slug)) : roundMatches
  if (!unassigned.length) return null

  if (slot._home?.teamSlug && slot._away?.teamSlug) {
    const exact = unassigned.find(m => m.homeTeam === slot._home.teamSlug && m.awayTeam === slot._away.teamSlug)
    if (exact) return exact
  }

  if (slot.id) {
    const bySlot = unassigned.find(m => m.bracket_slot === slot.id)
    if (bySlot) return bySlot
  }

  const homePool = sideTeamPool(slot.home, allSlots, teams)
  const awayPool = sideTeamPool(slot.away, allSlots, teams)
  if (homePool.length && awayPool.length) {
    const byTeams = unassigned.find(m => !m.bracket_slot && homePool.includes(m.homeTeam) && awayPool.includes(m.awayTeam))
    if (byTeams) return byTeams
  }

  const ordered = [...unassigned]
    .filter(m => !m.bracket_slot)
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
  return ordered[0] || null
}

export function useKnockoutBracket() {
  const { getGroupStandings } = useStandings()

  function buildBracket({ draw, teams, matches, locale }) {
    if (!draw || !draw.slots || !draw.slots.length) {
      return { published: false, rounds: [] }
    }

    const teamMap = buildTeamMap(teams)

    // ponytail: draw stores prefixed slugs (admin format), public pages strip them — normalize once
    const cleanSide = (side) =>
      side?.type === 'team' && side.slug ? { ...side, slug: String(side.slug).split('::').pop() } : side

    const slots = draw.slots.map(s => ({
      id: s.id,
      round: s.round,
      order: s.order ?? 0,
      home: cleanSide(s.home),
      away: cleanSide(s.away),
      _home: null,
      _away: null,
      _match: null,
    }))

    slots.forEach(slot => {
      slot._home = resolveSide(slot.home, teams, matches, teamMap, getGroupStandings, null, locale)
      slot._away = resolveSide(slot.away, teams, matches, teamMap, getGroupStandings, null, locale)
    })

    const assigned = new Set()
    slots.forEach(slot => {
      const match = matchSlotToDbMatch(slot, matches, slots, teams, assigned)
      if (match) {
        slot._match = match
        assigned.add(match.slug)
      }
    })

    slots.forEach(slot => {
      if (slot.home.type === 'winner') {
        slot._home = resolveSide(slot.home, teams, matches, teamMap, getGroupStandings, slots, locale)
      }
      if (slot.away.type === 'winner') {
        slot._away = resolveSide(slot.away, teams, matches, teamMap, getGroupStandings, slots, locale)
      }
    })

    const roundOrder = { R16: -1, QF: 0, SF: 1, FINAL: 2 }
    const roundMap = {}
    slots.forEach(s => {
      if (!roundMap[s.round]) roundMap[s.round] = []
      roundMap[s.round].push(s)
    })

    const rounds = Object.keys(roundMap)
      .map(r => ({
        key: r,
        slots: roundMap[r].sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => (roundOrder[a.key] ?? 99) - (roundOrder[b.key] ?? 99))

    // ponytail: align backwards so each round is ordered by the FINAL order of the next
    // round — forward alignment broke R16↔QF pairing once QF got reordered under SF,
    // and connector lines are drawn positionally.
    for (let ri = rounds.length - 1; ri >= 1; ri--) {
      const prev = rounds[ri - 1].slots
      const curr = rounds[ri].slots
      const reordered = []
      const used = new Set()
      curr.forEach(slot => {
        ;[slot.home, slot.away].forEach(side => {
          if (side?.type === 'winner' && side.of) {
            const idx = prev.findIndex(s => s.id === side.of)
            if (idx !== -1 && !used.has(idx)) {
              reordered.push(prev[idx])
              used.add(idx)
            }
          }
        })
      })
      prev.forEach((s, i) => {
        if (!used.has(i)) reordered.push(s)
      })
      if (reordered.length === prev.length) {
        rounds[ri - 1].slots = reordered
      }
    }

    return { published: true, rounds }
  }

  return { buildBracket, normalizeRound }
}
