/**
 * Central match result helpers for FT / AET / penalties.
 *
 * Field semantics:
 * - homeScore / awayScore       → regulation (90′) goals
 * - homeScoreAET / awayScoreAET → total goals after extra time (includes 90′)
 * - homePenalties / awayPenalties → shootout tallies
 * - resultMethod                → 'ft' | 'aet' | 'pen'
 */

function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function hasPair(home, away) {
  return home !== null && away !== null
}

export function useMatchResult() {
  /** Open-play score shown large: AET totals if set, else regulation. */
  function getOpenPlayScore(match) {
    if (!match) return { home: null, away: null }
    const aetH = num(match.homeScoreAET)
    const aetA = num(match.awayScoreAET)
    if (hasPair(aetH, aetA)) return { home: aetH, away: aetA }
    return { home: num(match.homeScore), away: num(match.awayScore) }
  }

  function getRegulationScore(match) {
    if (!match) return { home: null, away: null }
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
    // Infer from data (handles ft matches with penalty scores)
    const pens = getPenaltyScore(match)
    if (hasPair(pens.home, pens.away)) return 'pen'
    const aetH = num(match.homeScoreAET)
    const aetA = num(match.awayScoreAET)
    if (hasPair(aetH, aetA)) {
      const reg = getRegulationScore(match)
      if (hasPair(reg.home, reg.away) && (aetH !== reg.home || aetA !== reg.away)) return 'aet'
      if (aetH !== aetA) return 'aet'
    }
    return 'ft'
  }

  /**
   * Final match winner (who advances / champion).
   * pen → penalties; else open-play (AET or FT).
   * Returns homeTeam slug, awayTeam slug, or null.
   */
  function getWinnerSlug(match) {
    if (!match) return null
    if (match.homeScore == null && match.awayScore == null
        && match.homeScoreAET == null && match.homePenalties == null) {
      return null
    }

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

  function isTeamWinner(match, teamSlug) {
    if (!match || !teamSlug) return false
    const winner = getWinnerSlug(match)
    return winner === teamSlug
  }

  /**
   * W / D / L for a team in a match (respects AET + penalties).
   * Use this for form, standings points, and team history — never raw score compare alone.
   */
  function getTeamOutcome(match, teamSlug) {
    if (!match || !teamSlug) return null
    const winner = getWinnerSlug(match)
    if (winner === teamSlug) return 'W'
    if (winner && winner !== teamSlug) return 'L'
    // True draw only when no final winner (equal open play, no pens)
    if (hasPair(num(match.homeScore), num(match.awayScore))) return 'D'
    return null
  }

  /** True only for genuine draws (no AET/pen winner). */
  function isDraw(match) {
    if (!match) return false
    return getWinnerSlug(match) === null
      && hasPair(num(match.homeScore), num(match.awayScore))
  }

  /** Display name slug of winner team, or null. */
  function getLoserSlug(match) {
    const winner = getWinnerSlug(match)
    if (!winner || !match) return null
    return winner === match.homeTeam ? match.awayTeam : match.homeTeam
  }

  /**
   * Outcome for prediction points:
   * - winner team slug, or
   * - '__draw__' only when truly drawn (group FT draws)
   */
  function getPredictionOutcome(match) {
    const winner = getWinnerSlug(match)
    if (winner) return winner
    if (isDraw(match)) return '__draw__'
    return null
  }

  /** Structured parts for UI. */
  function formatScoreParts(match, locale = 'ar') {
    const empty = {
      main: '–',
      mainHome: null,
      mainAway: null,
      badge: '',
      pens: '',
      pensHome: null,
      pensAway: null,
      method: 'ft',
      subtitle: '',
      compact: '–',
    }
    if (!match) return empty

    const method = getResultMethod(match)
    const reg = getRegulationScore(match)
    const open = getOpenPlayScore(match)
    const pens = getPenaltyScore(match)
    const aetSet = hasPair(num(match.homeScoreAET), num(match.awayScoreAET))

    if (!hasPair(open.home, open.away) && !hasPair(reg.home, reg.away)) {
      return empty
    }

    const mainHome = open.home ?? reg.home
    const mainAway = open.away ?? reg.away
    const main = `${mainHome}–${mainAway}`

    const aetBadge = locale === 'ar' ? 'ب.و.إ' : 'AET'
    const penBadge = locale === 'ar' ? 'ر.ت.' : 'PEN'

    let badge = ''
    let subtitle = ''
    let pensStr = ''

    if (method === 'aet' || (aetSet && method !== 'pen')) {
      badge = aetBadge
      if (hasPair(reg.home, reg.away) && (reg.home !== mainHome || reg.away !== mainAway)) {
        subtitle = locale === 'ar'
          ? `${reg.home}–${reg.away} (الوقت الأصلي)`
          : `${reg.home}–${reg.away} (FT)`
      }
    }

    if (method === 'pen' || hasPair(pens.home, pens.away)) {
      if (hasPair(pens.home, pens.away)) {
        pensStr = `${pens.home}–${pens.away}`
        badge = penBadge
        if (aetSet && hasPair(reg.home, reg.away) && (reg.home !== mainHome || reg.away !== mainAway)) {
          subtitle = locale === 'ar'
            ? `${reg.home}–${reg.away} → ${mainHome}–${mainAway} ${aetBadge}`
            : `${reg.home}–${reg.away} → ${mainHome}–${mainAway} ${aetBadge}`
        } else if (hasPair(reg.home, reg.away)) {
          subtitle = ''
        }
      }
    }

    let compact = main
    if (method === 'aet' || (aetSet && method !== 'pen')) {
      if (hasPair(reg.home, reg.away) && (reg.home !== mainHome || reg.away !== mainAway)) {
        compact = `${reg.home}–${reg.away} (${main} ${aetBadge})`
      } else {
        compact = `${main} ${aetBadge}`
      }
    }
    if ((method === 'pen' || hasPair(pens.home, pens.away)) && pensStr) {
      compact = `${main} (${pensStr} ${penBadge})`
    }

    return {
      main,
      mainHome,
      mainAway,
      badge,
      pens: pensStr,
      pensHome: pens.home,
      pensAway: pens.away,
      method,
      subtitle,
      compact,
    }
  }

  function formatScore(match, locale = 'ar') {
    return formatScoreParts(match, locale).compact
  }

  /** Total open-play goals (for goal-scorer row count). Never includes pens. */
  function getOpenPlayGoalTotal(matchOrForm) {
    if (!matchOrForm) return 0
    const aetH = num(matchOrForm.homeScoreAET)
    const aetA = num(matchOrForm.awayScoreAET)
    if (hasPair(aetH, aetA)) return aetH + aetA
    return (num(matchOrForm.homeScore) || 0) + (num(matchOrForm.awayScore) || 0)
  }

  /** Per-team open-play goals (for auto goal-scorer rows). */
  function getOpenPlayTeamGoals(matchOrForm) {
    if (!matchOrForm) return { home: 0, away: 0 }
    const aetH = num(matchOrForm.homeScoreAET)
    const aetA = num(matchOrForm.awayScoreAET)
    if (hasPair(aetH, aetA)) return { home: aetH, away: aetA }
    return {
      home: num(matchOrForm.homeScore) || 0,
      away: num(matchOrForm.awayScore) || 0,
    }
  }

  /**
   * Normalize result fields for save.
   * Clears unused AET/pen fields when method is ft.
   */
  function buildResultFields(form, { isUpcoming = false } = {}) {
    if (isUpcoming) {
      return {
        homeScore: null,
        awayScore: null,
        homeScoreAET: null,
        awayScoreAET: null,
        homePenalties: null,
        awayPenalties: null,
        resultMethod: 'ft',
      }
    }

    const method = form.resultMethod || 'ft'
    const homeScore = num(form.homeScore)
    const awayScore = num(form.awayScore)

    let homeScoreAET = null
    let awayScoreAET = null
    let homePenalties = null
    let awayPenalties = null

    if (method === 'aet' || method === 'pen') {
      homeScoreAET = num(form.homeScoreAET)
      awayScoreAET = num(form.awayScoreAET)
      // If admin left AET blank but chose aet, fall back to regulation
      if (method === 'aet' && !hasPair(homeScoreAET, awayScoreAET)) {
        homeScoreAET = homeScore
        awayScoreAET = awayScore
      }
    }

    if (method === 'pen') {
      homePenalties = num(form.homePenalties)
      awayPenalties = num(form.awayPenalties)
    }

    return {
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
      homeScoreAET,
      awayScoreAET,
      homePenalties,
      awayPenalties,
      resultMethod: method,
    }
  }

  /**
   * Validate admin result form. Returns error message string or null.
   */
  function validateResultForm(form) {
    const method = form.resultMethod || 'ft'
    const homeScore = num(form.homeScore)
    const awayScore = num(form.awayScore)

    if (homeScore === null || awayScore === null) {
      return 'يرجى إدخال نتيجة الوقت الأصلي'
    }
    if (homeScore < 0 || awayScore < 0) {
      return 'لا يمكن أن تكون النتيجة سالبة'
    }

    if (method === 'aet') {
      const aetH = num(form.homeScoreAET)
      const aetA = num(form.awayScoreAET)
      if (aetH === null || aetA === null) {
        return 'يرجى إدخال نتيجة الوقت الإضافي'
      }
      if (aetH < homeScore || aetA < awayScore) {
        return 'نتيجة الوقت الإضافي يجب ألا تقل عن نتيجة الوقت الأصلي'
      }
      if (aetH === aetA) {
        return 'الوقت الإضافي لا يمكن أن ينتهي بتعادل — اختر ركلات الترجيح أو صحّح النتيجة'
      }
    }

    if (method === 'pen') {
      const penH = num(form.homePenalties)
      const penA = num(form.awayPenalties)
      if (penH === null || penA === null) {
        return 'يرجى إدخال نتيجة ركلات الترجيح'
      }
      if (penH === penA) {
        return 'ركلات الترجيح يجب أن تحسم فائزاً (لا تعادل)'
      }
      // If AET filled, validate it isn't lower than FT
      const aetH = num(form.homeScoreAET)
      const aetA = num(form.awayScoreAET)
      if (hasPair(aetH, aetA) && (aetH < homeScore || aetA < awayScore)) {
        return 'نتيجة الوقت الإضافي يجب ألا تقل عن نتيجة الوقت الأصلي'
      }
    }

    return null
  }

  return {
    getOpenPlayScore,
    getRegulationScore,
    getPenaltyScore,
    getResultMethod,
    getWinnerSlug,
    getLoserSlug,
    isTeamWinner,
    getTeamOutcome,
    isDraw,
    getPredictionOutcome,
    formatScoreParts,
    formatScore,
    getOpenPlayGoalTotal,
    getOpenPlayTeamGoals,
    buildResultFields,
    validateResultForm,
  }
}
