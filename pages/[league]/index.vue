<template>
  <div class="page-wrap">
    <div class="container">
      <template v-if="pending">
        <div class="skeleton-hero" />
        <div class="skeleton-table">
          <div v-for="i in 4" :key="i" class="skeleton-row" />
        </div>
        <div class="skeleton-grid">
          <div v-for="i in 8" :key="i" class="skeleton-card" />
        </div>
      </template>
      <template v-else>
      <!-- ── Champion Celebration ──────────────────────── -->
      <div v-if="champion" class="hero-card champion-card">
        <div class="confetti-container">
          <div v-for="i in 30" :key="i" class="confetti-piece" :style="confettiStyle(i)" />
        </div>
        <div class="champion-glow" />
        <div class="hero-badge champion-badge">
          <Icon name="mdi:trophy" size="14" />
          {{ $t("home.champion") }}
        </div>
        <div class="champion-team">
          <NuxtLink :to="leaguePath(`/teams/${champion}`)" class="hero-logo-wrap">
            <template v-if="getTeamLogo(champion)">
              <NuxtImg
                :src="getTeamLogo(champion)"
                :alt="getTeamName(champion)"
                width="80"
                height="80"
                class="hero-logo champion-logo"
              />
            </template>
            <div
              v-else
              class="hero-logo-initial champion-initial"
              :style="{ background: getTeamColor(champion) }"
            >
              {{ getTeamName(champion)?.charAt(0) }}
            </div>
          </NuxtLink>
          <span class="champion-name">{{ getTeamName(champion) }}</span>
          <span class="champion-congrats">{{ $t("home.congrats") }}</span>
        </div>
        <NuxtLink :to="leaguePath(`/matches/${finalMatch.slug}`)" class="hero-btn">
          {{ $t("home.viewMatch") }}
          <Icon
            :name="locale === 'ar' ? 'mdi:arrow-left' : 'mdi:arrow-right'"
            size="15"
          />
        </NuxtLink>
      </div>

      <!-- ── Next Match ─────────────────────────────────── -->
      <div v-else-if="nextMatch?.slug" class="hero-card">
        <div v-if="!nextMatchIsLive" class="hero-badge">
          <Icon name="mdi:clock-outline" size="14" />
          {{ $t("home.nextMatch") }}
        </div>

        <div class="hero-teams">
          <div class="hero-team">
            <NuxtLink
              :to="leaguePath(`/teams/${nextMatch.homeTeam}`)"
              class="hero-logo-wrap"
            >
              <template v-if="getTeamLogo(nextMatch.homeTeam)">
                <NuxtImg
                  :src="getTeamLogo(nextMatch.homeTeam)"
                  :alt="getTeamName(nextMatch.homeTeam)"
                  width="64"
                  height="64"
                  class="hero-logo"
                />
              </template>
              <div
                v-else
                class="hero-logo-initial"
                :style="{ background: getTeamColor(nextMatch.homeTeam) }"
              >
                {{ getTeamName(nextMatch.homeTeam)?.charAt(0) }}
              </div>
            </NuxtLink>
            <span class="hero-team-name">{{
              getTeamName(nextMatch.homeTeam)
            }}</span>
          </div>

          <div class="hero-center">
            <template v-if="nextMatchIsLive">
              <span class="hero-live">
                <span class="live-dot" /> {{ $t('match.live') }}
              </span>
              <span v-if="nextMatch.homeScore != null" class="hero-live-score">
                {{ nextMatch.homeScore }} - {{ nextMatch.awayScore }}
              </span>
            </template>
            <template v-else>
              <span class="hero-time">{{ showTime ? formatMatchTime(nextMatch.date) : '--:--' }}</span>
              <span class="hero-date">{{ showTime ? formatMatchDate(nextMatch.date) : '' }}</span>
              <span v-if="showTime && countdownText" class="hero-countdown">{{ countdownText }}</span>
            </template>
            <span v-if="nextMatch.venue" class="hero-venue">
              <Icon name="mdi:map-marker-outline" size="12" />
              {{ nextMatch.venue }}
            </span>
          </div>

          <div class="hero-team">
            <NuxtLink
              :to="leaguePath(`/teams/${nextMatch.awayTeam}`)"
              class="hero-logo-wrap"
            >
              <template v-if="getTeamLogo(nextMatch.awayTeam)">
                <NuxtImg
                  :src="getTeamLogo(nextMatch.awayTeam)"
                  :alt="getTeamName(nextMatch.awayTeam)"
                  width="64"
                  height="64"
                  class="hero-logo"
                />
              </template>
              <div
                v-else
                class="hero-logo-initial"
                :style="{ background: getTeamColor(nextMatch.awayTeam) }"
              >
                {{ getTeamName(nextMatch.awayTeam)?.charAt(0) }}
              </div>
            </NuxtLink>
            <span class="hero-team-name">{{
              getTeamName(nextMatch.awayTeam)
            }}</span>
          </div>
        </div>

        <NuxtLink :to="leaguePath(`/matches/${nextMatch.slug}`)" class="hero-btn">
          {{ $t("home.viewMatch") }}
          <Icon
            :name="locale === 'ar' ? 'mdi:arrow-left' : 'mdi:arrow-right'"
            size="15"
          />
        </NuxtLink>
      </div>

      <!-- ── Empty / No Matches ────────────────────────── -->
      <BallPhysics v-else>
        <span class="empty-icon" aria-hidden="true">⚽</span>
        <p>{{ $t("match.noUpcoming") }}</p>
        <span class="empty-hint">{{ $t("home.dragBall") }}</span>
      </BallPhysics>

      <!-- ── League snapshot ───────────────────────────── -->
      <div class="stats-strip mt-4">
        <div class="stat-pill">
          <Icon name="mdi:shield-outline" size="16" />
          <div class="stat-pill-body">
            <span class="stat-pill-val">{{ leagueStats.teams }}</span>
            <span class="stat-pill-label">{{ $t("home.stats.teams") }}</span>
          </div>
        </div>
        <div class="stat-pill">
          <Icon name="mdi:soccer" size="16" />
          <div class="stat-pill-body">
            <span class="stat-pill-val">{{ leagueStats.played }}</span>
            <span class="stat-pill-label">{{ $t("home.stats.played") }}</span>
          </div>
        </div>
        <div class="stat-pill">
          <Icon name="mdi:soccer-field" size="16" />
          <div class="stat-pill-body">
            <span class="stat-pill-val">{{ leagueStats.goals }}</span>
            <span class="stat-pill-label">{{ $t("home.stats.goals") }}</span>
          </div>
        </div>
        <div class="stat-pill stat-pill-leader">
          <Icon name="mdi:trophy-outline" size="16" />
          <div class="stat-pill-body">
            <span class="stat-pill-val" :title="leagueStats.leader || ''">{{ leagueStats.leader || '—' }}</span>
            <span class="stat-pill-label">{{ $t("home.stats.leader") }}</span>
          </div>
        </div>
      </div>

      <!-- ── Last Match ────────────────────────────────── -->
      <div v-if="lastMatch?.slug" class="mt-4">
        <div class="section-label">
          <Icon name="mdi:clock-check-outline" size="14" />
          {{ $t("home.lastMatch") }}
        </div>

        <NuxtLink :to="leaguePath(`/matches/${lastMatch.slug}`)" class="last-card">
          <div class="last-teams">
            <div class="last-team">
              <template v-if="getTeamLogo(lastMatch.homeTeam)">
                <NuxtImg
                  :src="getTeamLogo(lastMatch.homeTeam)"
                  :alt="getTeamName(lastMatch.homeTeam)"
                  width="28"
                  height="28"
                  class="last-logo"
                />
              </template>
              <span
                v-else
                class="last-logo-initial"
                :style="{ background: getTeamColor(lastMatch.homeTeam) }"
                >{{ getTeamName(lastMatch.homeTeam)?.charAt(0) }}</span
              >
              <span class="last-name">{{
                getTeamName(lastMatch.homeTeam)
              }}</span>
            </div>

            <div class="last-score">
              <span
                class="last-num"
                :class="{ winner: lastMatch.homeScore > lastMatch.awayScore }"
                >{{ lastMatch.homeScore }}</span
              >
              <span class="last-sep">–</span>
              <span
                class="last-num"
                :class="{ winner: lastMatch.awayScore > lastMatch.homeScore }"
                >{{ lastMatch.awayScore }}</span
              >
            </div>

            <div class="last-team right">
              <span class="last-name">{{
                getTeamName(lastMatch.awayTeam)
              }}</span>
              <template v-if="getTeamLogo(lastMatch.awayTeam)">
                <NuxtImg
                  :src="getTeamLogo(lastMatch.awayTeam)"
                  :alt="getTeamName(lastMatch.awayTeam)"
                  width="28"
                  height="28"
                  class="last-logo"
                />
              </template>
              <span
                v-else
                class="last-logo-initial"
                :style="{ background: getTeamColor(lastMatch.awayTeam) }"
                >{{ getTeamName(lastMatch.awayTeam)?.charAt(0) }}</span
              >
            </div>
          </div>

          <div class="last-meta">
            <span
              ><Icon name="mdi:calendar-outline" size="11" />
              {{ formatShortDate(lastMatch.date) }}</span
            >
            <span v-if="lastMatch.venue"
              ><Icon name="mdi:map-marker-outline" size="11" />
              {{ lastMatch.venue }}</span
            >
          </div>
        </NuxtLink>
      </div>

      <!-- ── Standings ─────────────────────────────────── -->
      <div class="mt-4">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:table" size="18" />
            {{ $t("nav.standings") }}
          </h2>
          <NuxtLink :to="leaguePath('/standings')" class="section-link">
            {{ $t("home.fullTable") }}
            <Icon
              :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'"
              size="14"
            />
          </NuxtLink>
        </div>

        <div v-if="topStandings.length" class="standings-card">
          <table class="mini-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="th-team">{{ $t("standings.team") }}</th>
                <th>{{ $t("standings.played") }}</th>
                <th>{{ $t("standings.points") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(team, i) in topStandings"
                :key="team.slug"
                class="table-row"
                @click="navigateTo(leaguePath(`/teams/${team.slug}`))"
              >
                <td>
                  <span class="pos-badge" :class="{ 'pos-top': i < 2 }">{{
                    i + 1
                  }}</span>
                </td>
                <td class="team-cell">
                  <NuxtImg
                    v-if="team.logo"
                    :src="team.logo"
                    :alt="team.title"
                    width="22"
                    height="22"
                    class="mini-logo"
                  />
                  <span
                    v-else
                    class="mini-logo-initial"
                    :style="{ background: team.color }"
                    >{{ team.title?.charAt(0) }}</span
                  >
                  <span>{{ team.title }}</span>
                </td>
                <td class="num-cell">{{ team.P }}</td>
                <td class="pts-cell">{{ team.Pts }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-panel">
          <Icon name="mdi:table-off" size="22" />
          <p>{{ $t("home.noStandings") }}</p>
        </div>
      </div>

      <!-- ── Teams ─────────────────────────────────────── -->
      <div class="mt-4">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:shield-outline" size="18" />
            {{ $t("nav.teams") }}
          </h2>
          <NuxtLink :to="leaguePath('/teams')" class="section-link">
            {{ $t("home.allTeams") }}
            <Icon
              :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'"
              size="14"
            />
          </NuxtLink>
        </div>

        <div v-if="teams?.length" class="row g-2">
          <div
            v-for="team in teams.slice(0, 8)"
            :key="team.slug"
            class="col-6 col-md-3"
          >
            <NuxtLink :to="leaguePath(`/teams/${team.slug}`)" class="team-card">
              <NuxtImg
                v-if="team.logo"
                :src="team.logo"
                :alt="team.title"
                width="44"
                height="44"
                loading="lazy"
                class="team-card-logo"
              />
              <div
                v-else
                class="team-card-logo-initial"
                :style="{ background: team.color }"
              >
                {{ team.title?.charAt(0) }}
              </div>
              <span class="team-card-name">{{ team.title }}</span>
              <span class="team-card-pts"
                >{{ getTeamPoints(team.slug) }}
                <small>{{ $t("standings.points") }}</small></span
              >
            </NuxtLink>
          </div>
        </div>
        <div v-else class="empty-panel">
          <Icon name="mdi:shield-off-outline" size="22" />
          <p>{{ $t("home.noTeams") }}</p>
        </div>
      </div>

      <!-- ── Quick explore ─────────────────────────────── -->
      <div class="mt-4 mb-2">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:compass-outline" size="18" />
            {{ $t("home.explore") }}
          </h2>
        </div>
        <div class="quick-grid">
          <NuxtLink
            v-for="item in quickLinks"
            :key="item.key"
            :to="leaguePath(item.to)"
            class="quick-card"
          >
            <span class="quick-icon" :style="{ background: item.tint }">
              <Icon :name="item.icon" size="20" />
            </span>
            <span class="quick-label">{{ $t(item.label) }}</span>
            <Icon
              class="quick-arrow"
              :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'"
              size="16"
            />
          </NuxtLink>
        </div>
      </div>

      <!-- Mini ball game when there IS a next match (fun footer filler) -->
      <div v-if="nextMatch?.slug || champion" class="mt-4">
        <div class="section-label">
          <Icon name="mdi:gamepad-variant-outline" size="14" />
          {{ $t("home.playBall") }}
        </div>
        <BallPhysics>
          <p>{{ $t("home.dragBall") }}</p>
        </BallPhysics>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup>
import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { syrianAr } from "~/utils/syrianAr";

const { locale } = useI18n();
const { leaguePath } = useCurrentLeague()
const { fetchMatches, fetchTeams } = useLeagueData();
const notifCenter = useNotificationCenter()
const { subscribe: subMatches, unsubscribe: unsubMatches } = useRealtime('matches', ['INSERT', 'UPDATE'])
const dateLocale = computed(() => (locale.value === "ar" ? syrianAr : enUS));

const [
  { data: nextMatch, pending: nextPending, refresh: refreshNext },
  { data: lastMatch, pending: lastPending, refresh: refreshLast },
  { data: allMatches, pending: matchesPending, refresh: refreshAll },
  { data: teams, pending: teamsPending, refresh: refreshTeams },
  { data: finalMatch, pending: finalPending, refresh: refreshFinal },
] = await Promise.all([
  useAsyncData("home-next", () =>
    fetchMatches({
      statusIn: ["upcoming", "live"],
      orderBy: { field: "date", dir: "asc" },
      limit: 1,
    }).then((r) => r?.[0] || null),
  ),
  useAsyncData("home-last", () =>
    fetchMatches({
      status: "played",
      orderBy: { field: "date", dir: "desc" },
      limit: 1,
    }).then((r) => r?.[0] || null),
  ),
  useAsyncData("home-all-matches", () => fetchMatches({ status: "played" })),
  useAsyncData("home-teams", () => fetchTeams()),
  useAsyncData("home-final", () =>
    fetchMatches({ group: "F" }).then((r) => r?.[0] || null),
  ),
]);

// ── Skeleton guard: show skeleton until client confirms fresh data ──
const pageReady = ref(false)
let refreshTimer = null
let resultTimer = null
onMounted(async () => {
  showTime.value = true
  // Force fresh data on every page load to avoid stale SSR content
  await Promise.allSettled([
    refreshNext(), refreshLast(), refreshAll(), refreshTeams(), refreshFinal(),
  ])
  pageReady.value = true
  // Reactive timer for auto-live status
  now.value = Date.now()
  refreshTimer = setInterval(() => { now.value = Date.now() }, 10000)
  // Realtime: auto-refresh when matches change
  subMatches(() => {
    refreshNext()
    refreshLast()
  })
  // Fallback poll every 60s in case Realtime misses an update
  resultTimer = setInterval(() => {
    refreshNext()
    refreshLast()
  }, 60000)
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (resultTimer) clearInterval(resultTimer)
  unsubMatches()
})

const pending = computed(() => nextPending.value || lastPending.value || matchesPending.value || teamsPending.value || finalPending.value || !pageReady.value);

// ── Reactive time-based status ──
const now = ref(0)
const computeStatus = (dateStr) => {
  if (!dateStr) return 'upcoming'
  if (!now.value) return 'upcoming'
  const matchDate = new Date(dateStr)
  const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000)
  if (now.value > matchEnd) return 'played'
  if (now.value >= matchDate) return 'live'
  return 'upcoming'
}
const nextMatchIsLive = computed(() => nextMatch.value ? computeStatus(nextMatch.value.date) === 'live' : false)

const countdownText = computed(() => {
  if (!nextMatch.value?.date || !now.value || nextMatchIsLive.value) return ''
  const diff = new Date(nextMatch.value.date).getTime() - now.value
  if (diff <= 0) return ''
  const totalMin = Math.floor(diff / 60000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const mins = totalMin % 60
  if (days > 0) return locale.value === 'ar' ? `${days}ي ${hours}س` : `${days}d ${hours}h`
  if (hours > 0) return locale.value === 'ar' ? `${hours}س ${mins}د` : `${hours}h ${mins}m`
  return locale.value === 'ar' ? `${mins}د` : `${mins}m`
})

const champion = computed(() => {
  if (!finalMatch.value || finalMatch.value.status !== "played") return null;
  const home = finalMatch.value.homeScore ?? 0;
  const away = finalMatch.value.awayScore ?? 0;
  if (home === away) return null;
  return home > away ? finalMatch.value.homeTeam : finalMatch.value.awayTeam;
});

const teamMap = computed(() => {
  const m = {};
  (teams.value || []).forEach((t) => {
    m[t.slug] = t;
  });
  return m;
});
const getTeamName = (slug) => teamMap.value[slug]?.title ?? slug;
const getTeamLogo = (slug) => (slug ? teamMap.value[slug]?.logo || null : null);
const getTeamColor = (slug) => teamMap.value[slug]?.color || "#22c55e";

const showTime = ref(false)

const formatMatchTime = (dateStr) => {
  if (!dateStr) return "--:--";
  try {
    return format(parseISO(dateStr), "h:mm a", { locale: dateLocale.value });
  } catch { return "--:--"; }
};

const formatMatchDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "EEEE d MMMM", { locale: dateLocale.value });
  } catch { return ""; }
};

const confettiStyle = (i) => {
  const colors = ['#f59e0b','#22c55e','#ef4444','#3b82f6','#a855f7','#ec4899','#14b8a6'];
  const s = (n) => { const x = Math.sin(n) * 10000; return x - Math.floor(x); };
  return {
    left: `${s(i * 1) * 100}%`,
    animationDelay: `${s(i * 7) * 3}s`,
    animationDuration: `${2 + s(i * 13) * 3}s`,
    backgroundColor: colors[i % colors.length],
    width: `${6 + s(i * 5) * 8}px`,
    height: `${6 + s(i * 11) * 8}px`,
    borderRadius: s(i * 3) > 0.5 ? '50%' : '2px',
  };
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "d MMM", { locale: dateLocale.value });
  } catch { return ""; }
};

const { standingsMap: _standingsMap } = useStandings();

const standingsData = computed(() =>
  _standingsMap(teams.value || [], allMatches.value || []),
);

const getTeamPoints = (slug) => standingsData.value[slug]?.Pts ?? 0;

const topStandings = computed(() =>
  [...(teams.value ?? [])]
    .map((t) => ({ ...t, ...(standingsData.value[t.slug] ?? { P: 0, Pts: 0, GD: 0 }) }))
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD)
    .slice(0, 4),
);

const leagueStats = computed(() => {
  const list = teams.value || []
  const matches = allMatches.value || []
  const goals = matches.reduce(
    (sum, m) => sum + (Number(m.homeScore) || 0) + (Number(m.awayScore) || 0),
    0,
  )
  const leader = topStandings.value[0]
  return {
    teams: list.length,
    played: matches.length,
    goals,
    leader: leader?.title || null,
  }
})

const quickLinks = [
  { key: 'fixtures', to: '/fixtures', label: 'nav.fixtures', icon: 'mdi:calendar-month-outline', tint: 'rgba(34,197,94,0.12)' },
  { key: 'standings', to: '/standings', label: 'nav.standings', icon: 'mdi:table', tint: 'rgba(59,130,246,0.12)' },
  { key: 'stats', to: '/stats', label: 'nav.stats', icon: 'mdi:chart-bar', tint: 'rgba(168,85,247,0.12)' },
  { key: 'bracket', to: '/bracket', label: 'nav.bracket', icon: 'mdi:tournament', tint: 'rgba(245,158,11,0.12)' },
]

useSeoMeta({ title: () => (locale.value === "ar" ? "الرئيسية" : "Home") });
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-bottom: calc(var(--bottom-nav-height) + 24px);
}

.container {
  padding-top: 24px;
}

// ── Skeleton ────────────────────────────────────────────
.skeleton-hero {
  height: 200px;
  border-radius: 20px;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}
.skeleton-table {
  display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 20px;
}
.skeleton-row {
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.skeleton-card {
  height: 100px;
  border-radius: 14px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}
@keyframes sh { to { background-position: -200% 0; } }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  .iconify {
    color: var(--primary);
  }
}

.section-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

// ── Next Match ─────────────────────────────────────────────
.hero-card {
  background: linear-gradient(160deg, #e8f5e9 0%, #c8e6c9 60%, #e8f5e9 100%);
  border-radius: 20px;
  :root.dark & {
    background: linear-gradient(160deg, #0a1a0f 0%, #0d1f14 60%, #0e1a12 100%);
  }
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--primary) 1px, transparent 1px),
      linear-gradient(90deg, var(--primary) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.04;
  }

  @media (max-width: 480px) {
    padding: 24px 16px;
    border-radius: 16px;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--primary-soft);
  color: var(--primary);
  border: 1px solid var(--primary-mid);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.hero-badge-live {
  background: rgba(22,163,74,0.12);
  color: #16a34a;
  border-color: rgba(22,163,74,0.25);
}

.live-dot-sm {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
  animation: pulse-green 1.5s infinite;
}

// ── Champion Card ──────────────────────────────────────
.champion-card {
  background: linear-gradient(160deg, #fef9c3 0%, #fde047 60%, #fef9c3 100%) !important;
  :root.dark & {
    background: linear-gradient(160deg, #1a1500 0%, #2a2200 60%, #1a1500 100%) !important;
  }
  padding: 40px 24px !important;
}

.champion-badge {
  background: rgba(234,179,8,0.15) !important;
  color: #ca8a04 !important;
  border-color: rgba(234,179,8,0.3) !important;
  z-index: 2 !important;
}

.champion-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}

.champion-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 2;
}

.champion-logo {
  width: 80px !important;
  height: 80px !important;
  border-radius: 16px !important;
  animation: champ-bounce 2s ease-in-out infinite;
}

.champion-initial {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  font-size: 2rem;
  animation: champ-bounce 2s ease-in-out infinite;
}

.champion-name {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: 0.5px;
  :root.dark & {
    color: #fde047;
  }
}

.champion-congrats {
  font-size: 1rem;
  font-weight: 700;
  color: #ca8a04;
}

// ── Confetti ─────────────────────────────────────────
.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  animation-name: confetti-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0.9;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(720deg);
    opacity: 0;
  }
}

@keyframes champ-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.hero-teams {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  position: relative;
  z-index: 1;
  @media (max-width: 480px) {
    gap: 12px;
  }
}

.hero-team {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hero-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
  }
}

.hero-logo-initial {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
    font-size: 1.2rem;
  }
}

.hero-team-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  line-height: 1.2;
  :root.dark & {
    color: #fff;
  }
  @media (max-width: 480px) {
    font-size: 0.78rem;
  }
}

.hero-center {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.hero-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 800;
  color: #16a34a;
  background: rgba(22,163,74,0.1);
  padding: 6px 16px;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  animation: pulse-green 1.5s infinite;
}

.hero-live-score {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: 2px;
  line-height: 1;
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.7); }
}

.hero-time {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  :root.dark & {
    color: #fff;
  }
  @media (max-width: 480px) {
    font-size: 1.4rem;
  }
}

.hero-date {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
  :root.dark & {
    color: rgba(255, 255, 255, 0.55);
  }
}

.hero-venue {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: var(--text-muted);
  :root.dark & {
    color: rgba(255, 255, 255, 0.4);
  }
}

.hero-countdown {
  margin-top: 2px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  background: var(--primary);
  color: #fff;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
  position: relative;
  z-index: 1;
  &:hover {
    background: color-mix(in srgb, var(--primary) 85%, #000);
  }
}



// ── Last Match ─────────────────────────────────────────────
.last-card {
  display: block;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px 20px;
  text-decoration: none;
  transition: all 0.15s;
  &:hover {
    border-color: var(--primary);
  }
  &:active {
    transform: scale(0.99);
  }
}

.last-teams {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-team {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  &.right {
    justify-content: flex-end;
  }
}

.last-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 6px;
  flex-shrink: 0;
}
.last-logo-initial {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.last-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
  @media (max-width: 480px) {
    font-size: 0.8rem;
    max-width: 70px;
  }
}

.last-score {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.last-num {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  min-width: 22px;
  text-align: center;
  &.winner {
    color: var(--primary);
  }
}

.last-sep {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 400;
}

.last-meta {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  font-size: 0.72rem;
  color: var(--text-muted);
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

// ── League snapshot ────────────────────────────────────────
.stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-pill-leader {
  @media (max-width: 640px) {
    grid-column: 1 / -1;
  }
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  min-width: 0;
  .iconify {
    flex-shrink: 0;
    color: var(--primary);
    opacity: 0.9;
  }
}

.stat-pill-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}

.stat-pill-val {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.stat-pill-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 2px;
}

// ── Standings ──────────────────────────────────────────────
.standings-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  thead tr {
    background: var(--bg-elevated);
    th {
      padding: 10px 14px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      text-align: center;
    }
    th:first-child {
      width: 36px;
    }
    th.th-team {
      text-align: start;
    }
  }
}

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 16px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-color);
  border-radius: 16px;
  color: var(--text-muted);
  text-align: center;
  .iconify {
    opacity: 0.55;
  }
  p {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 500;
  }
}

// ── Quick explore ──────────────────────────────────────────
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  text-decoration: none;
  transition: border-color 0.15s, transform 0.12s, background 0.15s;
  min-width: 0;
  &:hover {
    border-color: var(--primary);
    background: var(--bg-elevated);
  }
  &:active {
    transform: scale(0.98);
  }
}

.quick-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.quick-label {
  flex: 1;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0.7;
}

.table-row {
  cursor: pointer;
  border-top: 1px solid var(--border-color);
  transition: background 0.1s;
  &:hover {
    background: var(--bg-elevated);
  }
  td {
    padding: 10px 14px;
    text-align: center;
  }
  td:nth-child(2) {
    text-align: start;
  }
}

.pos-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--bg-elevated);
  color: var(--text-muted);
  &.pos-top {
    background: var(--primary-soft);
    color: var(--primary);
  }
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.mini-logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
  border-radius: 4px;
}
.mini-logo-initial {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.num-cell {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.pts-cell {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary);
}

// ── Teams ──────────────────────────────────────────────────
.team-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.15s;
  height: 100%;
  &:hover {
    border-color: var(--primary);
  }
  &:active {
    transform: scale(0.97);
    background: var(--bg-elevated);
  }
}

.team-card-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}
.team-card-logo-initial {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}
.team-card-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}
.team-card-pts {
  font-size: 1rem;
  font-weight: 800;
  color: var(--primary);
  display: flex;
  align-items: baseline;
  gap: 2px;
  small {
    font-size: 0.62rem;
    font-weight: 500;
    color: var(--text-muted);
  }
}
</style>
