<template>
  <div class="page-wrap">
    <!-- ── Next Match Hero ──────────────────────────────────────────────────── -->
    <section class="hero-section">
      <div v-if="upcoming?.slug" class="next-match-card">
        <div class="next-match-badge">
          <Icon name="mdi:clock-outline" size="13" aria-hidden="true" />
          {{ $t("match.upcoming") }} · {{ $t("match.week") }}
          {{ upcoming.week }}
        </div>

        <div class="teams-row">
          <!-- Home team -->
          <div class="team-side">
            <NuxtLink
              :to="`/teams/${upcoming.homeTeam}`"
              class="team-logo-wrap"
            >
              <NuxtImg
                :src="`/teams/${upcoming.homeTeam}.svg`"
                :alt="upcoming.homeTeam"
                width="72"
                height="72"
                class="team-logo"
              />
            </NuxtLink>
            <span class="team-name">{{ getTeamName(upcoming.homeTeam) }}</span>
          </div>

          <!-- Score / Time -->
          <div class="match-center">
            <div v-if="upcoming.status === 'played'" class="score-display">
              <span class="score">{{ upcoming.homeScore }}</span>
              <span class="score-sep">–</span>
              <span class="score">{{ upcoming.awayScore }}</span>
            </div>
            <div
              v-else-if="upcoming.status === 'live'"
              class="score-display live"
            >
              <span class="live-dot" aria-hidden="true" />
              <span class="score">{{ upcoming.homeScore }}</span>
              <span class="score-sep">–</span>
              <span class="score">{{ upcoming.awayScore }}</span>
            </div>
            <div v-else class="match-time-display">
              <span class="match-time">{{
                formatMatchTime(upcoming.date)
              }}</span>
              <span class="match-date">{{
                formatMatchDate(upcoming.date)
              }}</span>
            </div>
            <div class="match-venue">
              <Icon
                name="mdi:map-marker-outline"
                size="13"
                aria-hidden="true"
              />
              {{ upcoming.venue }}
            </div>
          </div>

          <!-- Away team -->
          <div class="team-side">
            <NuxtLink
              :to="`/teams/${upcoming.awayTeam}`"
              class="team-logo-wrap"
            >
              <NuxtImg
                :src="`/teams/${upcoming.awayTeam}.svg`"
                :alt="upcoming.awayTeam"
                width="72"
                height="72"
                class="team-logo"
              />
            </NuxtLink>
            <span class="team-name">{{ getTeamName(upcoming.awayTeam) }}</span>
          </div>
        </div>

        <NuxtLink :to="`/matches/${upcoming.slug}`" class="hero-cta">
          {{ $t("match.viewDetails") }}
          <Icon name="mdi:arrow-left" size="16" aria-hidden="true" />
        </NuxtLink>
      </div>

      <!-- No upcoming match -->
      <div v-else class="no-match-hero">
        <Icon
          name="game-icons:soccer-ball"
          size="48"
          class="no-match-icon"
          aria-hidden="true"
        />
        <p>{{ $t("match.noUpcoming") }}</p>
      </div>
    </section>

    <!-- ── Results Ticker ────────────────────────────────────────────────────── -->
    <section v-if="recentMatches?.length" class="ticker-section">
      <div class="ticker-label">
        <Icon name="mdi:lightning-bolt" size="14" aria-hidden="true" />
        {{ $t("home.latestResults") }}
      </div>
      <ElementsMarquee
        :duration="recentMatches.length * 8 + 's'"
        :pause-on-hover="true"
      >
        <NuxtLink
          v-for="m in recentMatches"
          :key="m.slug"
          :to="`/matches/${m.slug}`"
          class="ticker-pill"
        >
          <span class="ticker-team">{{ getTeamName(m.homeTeam) }}</span>
          <span class="ticker-score"
            >{{ m.homeScore }} – {{ m.awayScore }}</span
          >
          <span class="ticker-team">{{ getTeamName(m.awayTeam) }}</span>
        </NuxtLink>
      </ElementsMarquee>
    </section>

    <!-- ── Quick Stats ────────────────────────────────────────────────────────── -->
    <section class="section">
      <SharedUiCardsStats :stats="quickStats" :columns="4" />
    </section>

    <!-- ── Standings Preview ──────────────────────────────────────────────────── -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">
          <Icon name="mdi:table" size="20" aria-hidden="true" />
          {{ $t("nav.standings") }}
        </h2>
        <NuxtLink to="/standings" class="section-link">
          {{ $t("home.fullTable") }}
          <Icon name="mdi:arrow-left" size="15" aria-hidden="true" />
        </NuxtLink>
      </div>

      <div class="standings-preview">
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
              class="mini-table-row"
              @click="navigateTo(`/teams/${team.slug}`)"
            >
              <td class="pos-cell">
                <span class="pos-num" :class="{ 'pos-top': i < 2 }">{{
                  i + 1
                }}</span>
              </td>
              <td class="team-cell">
                <NuxtImg
                  :src="`/teams/${team.slug}.svg`"
                  :alt="team.title"
                  width="24"
                  height="24"
                  class="mini-logo"
                />
                <span>{{ team.title }}</span>
              </td>
              <td class="num-cell">{{ team.P }}</td>
              <td class="pts-cell">{{ team.Pts }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── Team Cards ─────────────────────────────────────────────────────────── -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">
          <Icon name="mdi:shield-outline" size="20" aria-hidden="true" />
          {{ $t("nav.teams") }}
        </h2>
        <NuxtLink to="/teams" class="section-link">
          {{ $t("home.allTeams") }}
          <Icon name="mdi:arrow-left" size="15" aria-hidden="true" />
        </NuxtLink>
      </div>

      <ElementsStaggeredReveal>
        <div class="teams-grid">
          <NuxtLink
            v-for="team in teams"
            :key="team.slug"
            :to="`/teams/${team.slug}`"
            class="team-card"
          >
            <NuxtImg
              :src="`/teams/${team.slug}.svg`"
              :alt="team.title"
              width="56"
              height="56"
              class="team-card-logo"
            />
            <span class="team-card-name">{{ team.title }}</span>
            <span class="team-card-pts">
              {{ getTeamPoints(team.slug) }}
              <small>{{ $t("standings.points") }}</small>
            </span>
          </NuxtLink>
        </div>
      </ElementsStaggeredReveal>
    </section>
  </div>
</template>

<script setup>
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const { locale } = useI18n();
const dateLocale = computed(() => (locale.value === "ar" ? ar : enUS));

// ── Data fetching ─────────────────────────────────────────────────────────────
const [
  { data: upcoming },
  { data: recentMatches },
  { data: allMatches },
  { data: teams },
  { data: allPlayers },
] = await Promise.all([
  useAsyncData("home-upcoming", () =>
    queryCollection("matches")
      .where("status", "IN", ["upcoming", "live"])
      .order("date", "ASC")
      .limit(1)
      .first().catch(() => null),
  ),
  useAsyncData("home-recent", () =>
    queryCollection("matches")
      .where("status", "=", "played")
      .order("date", "DESC")
      .limit(6)
      .all().then(r => r || []).catch(() => []),
  ),
  useAsyncData("home-all-matches", () =>
    queryCollection("matches").where("status", "=", "played").all().then(r => r || []).catch(() => []),
  ),
  useAsyncData("home-teams", () => queryCollection("teams").all().then(r => r || []).catch(() => [])),
  useAsyncData("home-players", () => queryCollection("players").all().then(r => r || []).catch(() => [])),
]);

// ── Helpers ───────────────────────────────────────────────────────────────────
const getTeamName = (slug) =>
  teams.value?.find((t) => t.slug === slug)?.title ?? slug;

const formatMatchTime = (dateStr) => {
  if (!dateStr) return "--:--";
  return format(new Date(dateStr), "HH:mm", { locale: dateLocale.value });
};

const formatMatchDate = (dateStr) => {
  if (!dateStr) return "";
  return format(new Date(dateStr), "EEEE d MMMM", { locale: dateLocale.value });
};

// ── Standings calculation ─────────────────────────────────────────────────────
const standingsMap = computed(() => {
  const map = {};
  if (!teams.value || !allMatches.value) return map;

  teams.value.forEach((team) => {
    let W = 0,
      D = 0,
      L = 0,
      GF = 0,
      GA = 0;
    allMatches.value
      .filter((m) => m.homeTeam === team.slug || m.awayTeam === team.slug)
      .forEach((m) => {
        const isHome = m.homeTeam === team.slug;
        const scored = isHome ? m.homeScore : m.awayScore;
        const conceded = isHome ? m.awayScore : m.homeScore;
        GF += scored;
        GA += conceded;
        if (scored > conceded) W++;
        else if (scored === conceded) D++;
        else L++;
      });
    map[team.slug] = {
      P: W + D + L,
      W,
      D,
      L,
      GF,
      GA,
      GD: GF - GA,
      Pts: W * 3 + D,
    };
  });
  return map;
});

const getTeamPoints = (slug) => standingsMap.value[slug]?.Pts ?? 0;

const topStandings = computed(() =>
  [...(teams.value ?? [])]
    .map((t) => ({ ...t, ...(standingsMap.value[t.slug] ?? { P: 0, Pts: 0 }) }))
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD)
    .slice(0, 4),
);

// ── Quick stats ───────────────────────────────────────────────────────────────
const quickStats = computed(() => {
  const played = allMatches.value?.length ?? 0;
  const totalGoals =
    allMatches.value?.reduce(
      (acc, m) => acc + (m.homeScore ?? 0) + (m.awayScore ?? 0),
      0,
    ) ?? 0;

  const playerMap = {};
  (allPlayers.value || []).forEach((p) => {
    playerMap[p.slug] = p.title;
  });

  const scorerMap = {};
  allMatches.value?.forEach((m) => {
    m.goalScorers?.forEach((g) => {
      scorerMap[g.player] = (scorerMap[g.player] ?? 0) + 1;
    });
  });
  const topScorer = Object.entries(scorerMap).sort((a, b) => b[1] - a[1])[0];
  const topScorerName = topScorer ? (playerMap[topScorer[0]] || topScorer[0]) : "-";

  return [
    {
      key: "played",
      label: "home.stats.played",
      value: played,
      icon: "game-icons:soccer-ball",
      color: "success",
    },
    {
      key: "goals",
      label: "home.stats.goals",
      value: totalGoals,
      icon: "mdi:bullseye-arrow",
      color: "warning",
    },
    {
      key: "topScorer",
      label: "home.stats.topScorer",
      value: topScorer ? topScorer[1] : 0,
      icon: "mdi:star-outline",
      color: "primary",
      description: topScorerName,
    },
    {
      key: "week",
      label: "home.stats.currentWeek",
      value: Math.max(...(allMatches.value?.map((m) => m.week) ?? [0])),
      icon: "mdi:calendar-week",
      color: "info",
    },
  ];
});

// ── SEO ───────────────────────────────────────────────────────────────────────
useSeoMeta({ title: () => (locale.value === "ar" ? "الرئيسية" : "Home") });
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-top: var(--header-height);
  padding-bottom: calc(var(--bottom-nav-height) + 24px);

  @media (max-width: 991.98px) {
    padding-top: var(--header-height-mobile);
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────
.hero-section {
  background: linear-gradient(160deg, #0a1a0f 0%, #0d1f14 60%, #0e1a12 100%);
  padding: 40px 20px 48px;
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

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    inset-inline: 0;
    height: 60px;
    background: linear-gradient(to bottom, transparent, var(--bg-page));
  }
}

.next-match-card {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.next-match-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--primary-soft);
  color: var(--primary);
  border: 1px solid var(--primary-mid);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.teams-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  @media (max-width: 480px) {
    gap: 10px;
  }
}

.team-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.team-logo-wrap {
  display: block;
}

.team-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));

  @media (max-width: 480px) {
    width: 52px;
    height: 52px;
  }
}

.team-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.2;

  @media (max-width: 480px) {
    font-size: 0.78rem;
  }
}

.match-center {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 120px;

  @media (max-width: 480px) {
    min-width: 80px;
  }
}

.score-display {
  display: flex;
  align-items: center;
  gap: 8px;

  &.live .score {
    color: var(--primary);
  }
}

.score {
  font-size: 3rem;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  line-height: 1;

  @media (max-width: 480px) {
    font-size: 2.2rem;
  }
}

.score-sep {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 300;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.match-time-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.match-time {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;

  @media (max-width: 480px) {
    font-size: 1.6rem;
  }
}

.match-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
}

.match-venue {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  background: var(--primary);
  color: #fff;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--primary) 85%, #000);
    transform: translateY(-2px);
  }
}

.no-match-hero {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.4);

  .no-match-icon {
    display: block;
    margin: 0 auto 12px;
    opacity: 0.3;
  }
  p {
    font-size: 0.9rem;
    margin: 0;
  }
}

// ── Ticker ────────────────────────────────────────────────────────────────────
.ticker-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
}

.ticker-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  flex-shrink: 0;
  padding-inline-end: 12px;
  border-inline-end: 1px solid var(--border-color);
}

.ticker-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-sub);
  text-decoration: none;
  white-space: nowrap;
  margin-inline-end: 10px;
  transition: all 0.15s;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}

.ticker-score {
  font-weight: 700;
  color: var(--primary);
}

// ── Sections ──────────────────────────────────────────────────────────────────
.section {
  padding: 32px 20px;
  max-width: 1280px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
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
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// ── Mini Standings Table ──────────────────────────────────────────────────────
.standings-preview {
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
      padding: 10px 16px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      text-align: start;
    }
  }
}

.mini-table-row {
  cursor: pointer;
  border-top: 1px solid var(--border-color);
  transition: background 0.12s;

  td {
    padding: 12px 16px;
  }

  &:hover {
    background: var(--bg-elevated);
  }
}

.pos-cell {
  width: 40px;
}
.pos-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated);

  &.pos-top {
    background: var(--primary-soft);
    color: var(--primary);
  }
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.mini-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.num-cell {
  font-size: 0.875rem;
  color: var(--text-muted);
  text-align: center;
}

.pts-cell {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary);
  text-align: center;
}

// ── Teams Grid ────────────────────────────────────────────────────────────────
.teams-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.team-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.12);
  }
}

.team-card-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.team-card-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.team-card-pts {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--primary);
  display: flex;
  align-items: baseline;
  gap: 3px;

  small {
    font-size: 0.68rem;
    font-weight: 500;
    color: var(--text-muted);
  }
}
</style>
