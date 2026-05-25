<template>
  <div class="page-wrap">

    <div class="container">

      <!-- ── Next Match ─────────────────────────────────── -->
      <div v-if="nextMatch?.slug" class="hero-card">
        <div class="hero-badge">
          <Icon name="mdi:clock-outline" size="14" />
          {{ $t("home.nextMatch") }}
        </div>

        <div class="hero-teams">
          <div class="hero-team">
            <NuxtLink :to="`/teams/${nextMatch.homeTeam}`" class="hero-logo-wrap">
              <template v-if="getTeamLogo(nextMatch.homeTeam)">
                <NuxtImg :src="getTeamLogo(nextMatch.homeTeam)" :alt="getTeamName(nextMatch.homeTeam)" width="64" height="64" class="hero-logo" />
              </template>
              <div v-else class="hero-logo-initial" :style="{ background: getTeamColor(nextMatch.homeTeam) }">
                {{ getTeamName(nextMatch.homeTeam)?.charAt(0) }}
              </div>
            </NuxtLink>
            <span class="hero-team-name">{{ getTeamName(nextMatch.homeTeam) }}</span>
          </div>

          <div class="hero-center">
            <span class="hero-time">{{ formatMatchTime(nextMatch.date) }}</span>
            <span class="hero-date">{{ formatMatchDate(nextMatch.date) }}</span>
            <span v-if="nextMatch.venue" class="hero-venue">
              <Icon name="mdi:map-marker-outline" size="12" />
              {{ nextMatch.venue }}
            </span>
          </div>

          <div class="hero-team">
            <NuxtLink :to="`/teams/${nextMatch.awayTeam}`" class="hero-logo-wrap">
              <template v-if="getTeamLogo(nextMatch.awayTeam)">
                <NuxtImg :src="getTeamLogo(nextMatch.awayTeam)" :alt="getTeamName(nextMatch.awayTeam)" width="64" height="64" class="hero-logo" />
              </template>
              <div v-else class="hero-logo-initial" :style="{ background: getTeamColor(nextMatch.awayTeam) }">
                {{ getTeamName(nextMatch.awayTeam)?.charAt(0) }}
              </div>
            </NuxtLink>
            <span class="hero-team-name">{{ getTeamName(nextMatch.awayTeam) }}</span>
          </div>
        </div>

        <NuxtLink :to="`/matches/${nextMatch.slug}`" class="hero-btn">
          {{ $t("home.viewMatch") }}
          <Icon :name="locale === 'ar' ? 'mdi:arrow-left' : 'mdi:arrow-right'" size="15" />
        </NuxtLink>
      </div>

      <div v-else class="hero-empty">
        <Icon name="game-icons:soccer-ball" size="40" />
        <p>{{ $t("match.noUpcoming") }}</p>
      </div>

      <!-- ── Last Match ────────────────────────────────── -->
      <div v-if="lastMatch?.slug" class="mt-4">
        <div class="section-label">
          <Icon name="mdi:clock-check-outline" size="14" />
          {{ $t("home.lastMatch") }}
        </div>

        <NuxtLink :to="`/matches/${lastMatch.slug}`" class="last-card">
          <div class="last-teams">
            <div class="last-team">
              <template v-if="getTeamLogo(lastMatch.homeTeam)">
                <NuxtImg :src="getTeamLogo(lastMatch.homeTeam)" :alt="getTeamName(lastMatch.homeTeam)" width="28" height="28" class="last-logo" />
              </template>
              <span v-else class="last-logo-initial" :style="{ background: getTeamColor(lastMatch.homeTeam) }">{{ getTeamName(lastMatch.homeTeam)?.charAt(0) }}</span>
              <span class="last-name">{{ getTeamName(lastMatch.homeTeam) }}</span>
            </div>

            <div class="last-score">
              <span class="last-num" :class="{ winner: lastMatch.homeScore > lastMatch.awayScore }">{{ lastMatch.homeScore }}</span>
              <span class="last-sep">–</span>
              <span class="last-num" :class="{ winner: lastMatch.awayScore > lastMatch.homeScore }">{{ lastMatch.awayScore }}</span>
            </div>

            <div class="last-team right">
              <span class="last-name">{{ getTeamName(lastMatch.awayTeam) }}</span>
              <template v-if="getTeamLogo(lastMatch.awayTeam)">
                <NuxtImg :src="getTeamLogo(lastMatch.awayTeam)" :alt="getTeamName(lastMatch.awayTeam)" width="28" height="28" class="last-logo" />
              </template>
              <span v-else class="last-logo-initial" :style="{ background: getTeamColor(lastMatch.awayTeam) }">{{ getTeamName(lastMatch.awayTeam)?.charAt(0) }}</span>
            </div>
          </div>

          <div class="last-meta">
            <span><Icon name="mdi:calendar-outline" size="11" /> {{ formatShortDate(lastMatch.date) }}</span>
            <span v-if="lastMatch.venue"><Icon name="mdi:map-marker-outline" size="11" /> {{ lastMatch.venue }}</span>
          </div>
        </NuxtLink>
      </div>

      <!-- ── Quick Stats ───────────────────────────────── -->
      <div class="mt-4">
        <SharedUiCardsStats :stats="quickStats" :columns="4" />
      </div>

      <!-- ── Standings ─────────────────────────────────── -->
      <div class="mt-4">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:table" size="18" />
            {{ $t("nav.standings") }}
          </h2>
          <NuxtLink to="/standings" class="section-link">
            {{ $t("home.fullTable") }}
            <Icon :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'" size="14" />
          </NuxtLink>
        </div>

        <div class="table-card">
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
              <tr v-for="(team, i) in topStandings" :key="team.slug" class="table-row" @click="navigateTo(`/teams/${team.slug}`)">
                <td><span class="pos-badge" :class="{ 'pos-top': i < 2 }">{{ i + 1 }}</span></td>
                <td class="team-cell">
                  <NuxtImg v-if="team.logo" :src="team.logo" :alt="team.title" width="22" height="22" class="mini-logo" />
                  <span v-else class="mini-logo-initial" :style="{ background: team.color }">{{ team.title?.charAt(0) }}</span>
                  <span>{{ team.title }}</span>
                </td>
                <td class="num-cell">{{ team.P }}</td>
                <td class="pts-cell">{{ team.Pts }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Teams ─────────────────────────────────────── -->
      <div class="mt-4">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:shield-outline" size="18" />
            {{ $t("nav.teams") }}
          </h2>
          <NuxtLink to="/teams" class="section-link">
            {{ $t("home.allTeams") }}
            <Icon :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'" size="14" />
          </NuxtLink>
        </div>

        <div class="row g-2">
          <div v-for="team in teams" :key="team.slug" class="col-6 col-md-3">
            <NuxtLink :to="`/teams/${team.slug}`" class="team-card">
              <NuxtImg v-if="team.logo" :src="team.logo" :alt="team.title" width="44" height="44" class="team-card-logo" />
              <div v-else class="team-card-logo-initial" :style="{ background: team.color }">{{ team.title?.charAt(0) }}</div>
              <span class="team-card-name">{{ team.title }}</span>
              <span class="team-card-pts">{{ getTeamPoints(team.slug) }} <small>{{ $t("standings.points") }}</small></span>
            </NuxtLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const { locale } = useI18n();
const { fetchMatches, fetchTeams, fetchPlayers } = useLeagueData();
const dateLocale = computed(() => (locale.value === "ar" ? ar : enUS));

const [{ data: nextMatch }, { data: lastMatch }, { data: allMatches }, { data: teams }, { data: allPlayers }] = await Promise.all([
  useAsyncData("home-next", () =>
    fetchMatches({ statusIn: ["upcoming", "live"], orderBy: { field: "date", dir: "asc" }, limit: 1 }).then(r => r?.[0] || null),
  ),
  useAsyncData("home-last", () =>
    fetchMatches({ status: "played", orderBy: { field: "date", dir: "desc" }, limit: 1 }).then(r => r?.[0] || null),
  ),
  useAsyncData("home-all-matches", () =>
    fetchMatches({ status: "played" }),
  ),
  useAsyncData("home-teams", () => fetchTeams()),
  useAsyncData("home-players", () => fetchPlayers()),
]);

const teamMap = computed(() => {
  const m = {};
  (teams.value || []).forEach(t => { m[t.slug] = t; });
  return m;
});
const getTeamName = (slug) => teamMap.value[slug]?.title ?? slug;
const getTeamLogo = (slug) => slug ? (teamMap.value[slug]?.logo || null) : null;
const getTeamColor = (slug) => teamMap.value[slug]?.color || '#22c55e';

const formatMatchTime = (dateStr) => {
  if (!dateStr) return "--:--";
  return format(new Date(dateStr), "HH:mm");
};

const formatMatchDate = (dateStr) => {
  if (!dateStr) return "";
  return format(new Date(dateStr), "EEEE d MMMM", { locale: dateLocale.value });
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  return format(new Date(dateStr), "d MMM", { locale: dateLocale.value });
};

const standingsMap = computed(() => {
  const map = {};
  if (!teams.value || !allMatches.value) return map;
  teams.value.forEach((team) => {
    let W = 0, D = 0, L = 0, GF = 0, GA = 0;
    allMatches.value.filter((m) => m.homeTeam === team.slug || m.awayTeam === team.slug).forEach((m) => {
      const isHome = m.homeTeam === team.slug;
      const scored = isHome ? m.homeScore : m.awayScore;
      const conceded = isHome ? m.awayScore : m.homeScore;
      if (scored > conceded) W++;
      else if (scored === conceded) D++;
      else L++;
      GF += scored;
      GA += conceded;
    });
    map[team.slug] = { P: W + D + L, W, D, L, GF, GA, GD: GF - GA, Pts: W * 3 + D };
  });
  return map;
});

const getTeamPoints = (slug) => standingsMap.value[slug]?.Pts ?? 0;

const topStandings = computed(() =>
  [...(teams.value ?? [])].map((t) => ({ ...t, ...(standingsMap.value[t.slug] ?? { P: 0, Pts: 0 }) })).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD).slice(0, 4),
);

const quickStats = computed(() => {
  const played = allMatches.value?.length ?? 0;
  const totalGoals = allMatches.value?.reduce((acc, m) => acc + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0) ?? 0;
  const playerMap = {};
  (allPlayers.value || []).forEach((p) => { playerMap[p.slug] = p.title; });
  const scorerMap = {};
  allMatches.value?.forEach((m) => { m.goalScorers?.forEach((g) => { scorerMap[g.player] = (scorerMap[g.player] ?? 0) + 1; }); });
  const topScorer = Object.entries(scorerMap).sort((a, b) => b[1] - a[1])[0];
  const topScorerName = topScorer ? (playerMap[topScorer[0]] || topScorer[0]) : "-";
  return [
    { key: "played", label: "home.stats.played", value: played, icon: "game-icons:soccer-ball", color: "success" },
    { key: "goals", label: "home.stats.goals", value: totalGoals, icon: "mdi:bullseye-arrow", color: "warning" },
    { key: "topScorer", label: "home.stats.topScorer", value: topScorer ? topScorer[1] : 0, icon: "mdi:star-outline", color: "primary", description: topScorerName },
  ];
});

useSeoMeta({ title: () => (locale.value === "ar" ? "الرئيسية" : "Home") });
</script>

<style lang="scss" scoped>
.page-wrap { padding-bottom: calc(var(--bottom-nav-height) + 24px); }

.container { padding-top: 24px; }

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
  .iconify { color: var(--primary); }
}

.section-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  &:hover { text-decoration: underline; }
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
  :root.dark & { background: linear-gradient(160deg, #0a1a0f 0%, #0d1f14 60%, #0e1a12 100%); }
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
    background-image: linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.04;
  }

  @media (max-width: 480px) { padding: 24px 16px; border-radius: 16px; }
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

.hero-teams {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  position: relative;
  z-index: 1;
  @media (max-width: 480px) { gap: 12px; }
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
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
  @media (max-width: 480px) { width: 48px; height: 48px; }
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
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  @media (max-width: 480px) { width: 48px; height: 48px; font-size: 1.2rem; }
}

.hero-team-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  line-height: 1.2;
  :root.dark & { color: #fff; }
  @media (max-width: 480px) { font-size: 0.78rem; }
}

.hero-center {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.hero-time {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  :root.dark & { color: #fff; }
  @media (max-width: 480px) { font-size: 1.4rem; }
}

.hero-date {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
  :root.dark & { color: rgba(255,255,255,0.55); }
}

.hero-venue {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: var(--text-muted);
  :root.dark & { color: rgba(255,255,255,0.4); }
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
  &:hover { background: color-mix(in srgb, var(--primary) 85%, #000); }
}

.hero-empty {
  background: linear-gradient(160deg, #e8f5e9, #c8e6c9);
  border-radius: 20px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  :root.dark & { background: linear-gradient(160deg, #0a1a0f, #0d1f14); color: rgba(255,255,255,0.3); }
  p { margin: 0; font-size: 0.9rem; }
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
  &:hover { border-color: var(--primary); }
  &:active { transform: scale(0.99); }
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
  &.right { justify-content: flex-end; }
}

.last-logo { width: 28px; height: 28px; object-fit: contain; border-radius: 6px; flex-shrink: 0; }
.last-logo-initial { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: #fff; flex-shrink: 0; }

.last-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
  @media (max-width: 480px) { font-size: 0.8rem; max-width: 70px; }
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
  &.winner { color: var(--primary); }
}

.last-sep { font-size: 1rem; color: var(--text-muted); font-weight: 400; }

.last-meta {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  font-size: 0.72rem;
  color: var(--text-muted);
  span { display: flex; align-items: center; gap: 4px; }
}

// ── Standings ──────────────────────────────────────────────
.table-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  thead tr {
    background: var(--bg-elevated);
    th { padding: 10px 14px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); text-align: center; }
    th:first-child { width: 36px; }
    th.th-team { text-align: start; }
  }
}

.table-row {
  cursor: pointer;
  border-top: 1px solid var(--border-color);
  transition: background 0.1s;
  &:hover { background: var(--bg-elevated); }
  td { padding: 10px 14px; text-align: center; }
  td:nth-child(2) { text-align: start; }
}

.pos-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px; border-radius: 6px;
  font-size: 0.78rem; font-weight: 700;
  background: var(--bg-elevated); color: var(--text-muted);
  &.pos-top { background: var(--primary-soft); color: var(--primary); }
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.mini-logo { width: 22px; height: 22px; object-fit: contain; border-radius: 4px; }
.mini-logo-initial { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 0.6rem; font-weight: 700; color: #fff; flex-shrink: 0; }
.num-cell { font-size: 0.85rem; color: var(--text-muted); }
.pts-cell { font-size: 0.9rem; font-weight: 700; color: var(--primary); }

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
  &:hover { border-color: var(--primary); }
  &:active { transform: scale(0.97); background: var(--bg-elevated); }
}

.team-card-logo { width: 44px; height: 44px; object-fit: contain; }
.team-card-logo-initial { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1rem; font-weight: 800; color: #fff; }
.team-card-name { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); text-align: center; }
.team-card-pts {
  font-size: 1rem;
  font-weight: 800;
  color: var(--primary);
  display: flex;
  align-items: baseline;
  gap: 2px;
  small { font-size: 0.62rem; font-weight: 500; color: var(--text-muted); }
}
</style>
