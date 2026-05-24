<template>
  <div class="page-wrap">
    <!-- Loading -->
    <div v-if="pending" class="skeleton-wrap">
      <div class="skeleton-hero" />
      <div class="skeleton-grid">
        <div v-for="i in 8" :key="i" class="skeleton-card" />
      </div>
    </div>

    <!-- Error -->
    <SharedUiFeedbackEmptyState
      v-else-if="error || !team"
      :title="$t('error.noData')"
      icon="mdi:shield-off-outline"
    />

    <template v-else>
      <!-- Team Hero -->
      <div
        class="team-hero"
        :style="team.color ? `background: linear-gradient(145deg, ${team.color}18, var(--bg-page))` : ''"
      >
        <button class="back-btn" @click="navigateTo('/teams')">
          <Icon :name="locale === 'ar' ? 'mdi:arrow-right' : 'mdi:arrow-left'" size="18" />
          {{ $t('nav.teams') }}
        </button>

        <div class="hero-content">
          <div
            class="hero-logo"
            :style="team.color ? `border-color: ${team.color}60; box-shadow: 0 0 30px ${team.color}25` : ''"
          >
            <NuxtImg
              v-if="team.logo"
              :src="team.logo"
              :alt="team.title"
              width="96" height="96"
              format="webp" loading="lazy"
            />
            <span v-else class="hero-initial">{{ team.title?.charAt(0) }}</span>
          </div>
          <h1 class="hero-name">{{ team.title }}</h1>
          <p v-if="team.founded" class="hero-sub">{{ $t('team.founded') }} {{ team.founded }}</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-wrap">
        <SharedUiCardsStats
          :stats="teamStats"
          :columns="4"
        />
      </div>

      <!-- Players section -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:account-group-outline" size="20" />
            {{ $t('team.players') }}
          </h2>
          <span class="section-count">{{ players.length }}</span>
        </div>

        <div v-if="players.length" class="players-grid">
          <div
            v-for="player in players"
            :key="player.slug"
            class="player-card"
            @click="navigateTo(`/players/${player.slug}`)"
          >
            <div class="player-avatar">
              <NuxtImg
                v-if="player.photo"
                :src="player.photo"
                :alt="player.title"
                width="56" height="56"
                format="webp" loading="lazy"
              />
              <span v-else class="avatar-initial">{{ player.title?.charAt(0) }}</span>
            </div>
            <span v-if="player.number" class="player-number">#{{ player.number }}</span>
            <span class="player-name">{{ player.title }}</span>
            <span v-if="player.position" class="player-position">{{ player.position }}</span>
            <div class="player-stats">
              <span class="pstat">
                <Icon name="mdi:soccer" size="12" />
                {{ player.goals || 0 }}
              </span>
              <span class="pstat">
                <Icon name="mdi:shoe-sneaker" size="12" />
                {{ player.assists || 0 }}
              </span>
            </div>
          </div>
        </div>
        <SharedUiFeedbackEmptyState
          v-else
          :title="$t('team.noPlayers')"
          icon="mdi:account-off-outline"
          small
        />
      </div>

      <!-- Recent Results -->
      <div v-if="recentMatches.length" class="section">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:history" size="20" />
            {{ $t('team.results') }}
          </h2>
        </div>
        <div class="matches-list">
          <div
            v-for="match in recentMatches"
            :key="match.slug"
            class="match-row"
            @click="navigateTo(`/matches/${match.slug}`)"
          >
            <span class="match-opp-logo">
              <NuxtImg
                v-if="getOpponentLogo(match)"
                :src="getOpponentLogo(match)"
                width="28" height="28"
                format="webp" loading="lazy"
              />
              <span v-else class="opp-initial">{{ getOpponentName(match)?.charAt(0) }}</span>
            </span>

            <span class="match-opp-name">{{ getOpponentName(match) }}</span>

            <div class="match-score-block">
              <span class="ms-score">{{ getTeamScore(match) }} – {{ getOppScore(match) }}</span>
              <span class="ms-result" :class="`result-${getResult(match).toLowerCase()}`">
                {{ getResult(match) }}
              </span>
            </div>

            <span class="match-date">{{ formatShortDate(match.date) }}</span>
            <Icon :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'" size="16" class="row-arrow" />
          </div>
        </div>
      </div>

      <!-- Upcoming -->
      <div v-if="upcomingMatches.length" class="section">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:calendar-clock-outline" size="20" />
            {{ $t('team.upcoming') }}
          </h2>
        </div>
        <div class="matches-list">
          <div
            v-for="match in upcomingMatches"
            :key="match.slug"
            class="match-row upcoming"
            @click="navigateTo(`/matches/${match.slug}`)"
          >
            <span class="match-opp-logo">
              <NuxtImg
                v-if="getOpponentLogo(match)"
                :src="getOpponentLogo(match)"
                width="28" height="28"
                format="webp" loading="lazy"
              />
              <span v-else class="opp-initial">{{ getOpponentName(match)?.charAt(0) }}</span>
            </span>
            <span class="match-opp-name">{{ getOpponentName(match) }}</span>
            <div class="match-score-block">
              <span class="ms-upcoming">{{ formatMatchDate(match.date) }}</span>
            </div>
            <Icon :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'" size="16" class="row-arrow" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const route = useRoute();
const { locale, t } = useI18n();
const slug = computed(() => route.params.slug);

const { data: team, pending: teamPending, error: teamError } = await useAsyncData(
  `team-${slug.value}`,
  () => queryCollection('teams').where('slug', '=', slug.value).first().catch(() => null)
);

const { data: playersData, pending: playersPending } = await useAsyncData(
  `team-players-${slug.value}`,
  () => queryCollection('players').where('team', '=', slug.value).all().then(r => r || []).catch(() => [])
);

const { data: matchesData, pending: matchesPending } = await useAsyncData(
  `team-matches-${slug.value}`,
  () => queryCollection('matches').all().then(r => r || []).catch(() => [])
);

const { data: teamsData } = await useAsyncData(
  `all-teams-${slug.value}`,
  () => queryCollection('teams').all().then(r => r || []).catch(() => [])
);

const pending = computed(() => teamPending.value || playersPending.value || matchesPending.value);
const error = computed(() => teamError.value);
const players = computed(() => playersData.value || []);
const allMatches = computed(() => matchesData.value || []);
const allTeams = computed(() => teamsData.value || []);

// Team map
const teamMap = computed(() => {
  const m = {};
  allTeams.value.forEach(t => { m[t.slug] = t; });
  return m;
});

// Team matches
const teamMatches = computed(() =>
  allMatches.value.filter(m =>
    m.homeTeam === slug.value || m.awayTeam === slug.value
  )
);

const recentMatches = computed(() =>
  teamMatches.value
    .filter(m => m.status === 'played')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
);

const upcomingMatches = computed(() =>
  teamMatches.value
    .filter(m => m.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
);

// Stats calculation
const teamStats = computed(() => {
  let W = 0, D = 0, L = 0, GF = 0, GA = 0;
  teamMatches.value.filter(m => m.status === 'played').forEach(m => {
    const isHome = m.homeTeam === slug.value;
    const scored = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
    const conceded = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
    GF += scored; GA += conceded;
    if (scored > conceded) W++;
    else if (scored === conceded) D++;
    else L++;
  });
  const Pts = W * 3 + D;
  return [
    { key: 'pts',  label: 'standings.points', icon: 'mdi:trophy-outline',      value: Pts,  color: 'primary' },
    { key: 'wins', label: 'standings.won',     icon: 'mdi:check-circle-outline', value: W,    color: 'success' },
    { key: 'draw', label: 'standings.drawn',   icon: 'mdi:minus-circle-outline', value: D,    color: 'info'    },
    { key: 'loss', label: 'standings.lost',    icon: 'mdi:close-circle-outline', value: L,    color: 'danger'  },
  ];
});

// Match helpers
const getOpponentSlug = (match) =>
  match.homeTeam === slug.value ? match.awayTeam : match.homeTeam;

const getOpponentName = (match) =>
  teamMap.value[getOpponentSlug(match)]?.title || getOpponentSlug(match);

const getOpponentLogo = (match) =>
  teamMap.value[getOpponentSlug(match)]?.logo || null;

const getTeamScore = (match) =>
  match.homeTeam === slug.value ? (match.homeScore ?? 0) : (match.awayScore ?? 0);

const getOppScore = (match) =>
  match.homeTeam === slug.value ? (match.awayScore ?? 0) : (match.homeScore ?? 0);

const getResult = (match) => {
  const ts = getTeamScore(match);
  const os = getOppScore(match);
  if (ts > os) return 'W';
  if (ts === os) return 'D';
  return 'L';
};

// Date formatting
const dateFnsLocale = computed(() => locale.value === 'ar' ? ar : enUS);
const formatShortDate = (d) => {
  try { return format(parseISO(d), 'd MMM', { locale: dateFnsLocale.value }); }
  catch { return d; }
};
const formatMatchDate = (d) => {
  try { return format(parseISO(d), 'EEE d MMM · HH:mm', { locale: dateFnsLocale.value }); }
  catch { return d; }
};

useSeoMeta({
  title: () => team.value ? `${team.value.title} | دوري القرية` : 'Team',
});
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-bottom: 90px;
  max-width: 900px;
  margin: 0 auto;
  padding-top: 64px;
}

@keyframes sh { to { background-position: -200% 0; } }
.skeleton-hero {
  height: 220px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%; animation: sh 1.4s linear infinite;
}
.skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px; }
.skeleton-card {
  height: 120px; border-radius: 12px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%; animation: sh 1.4s linear infinite;
}

// ── Team Hero ──────────────────────────────────────────────────────────────────
.team-hero {
  padding: 20px 20px 28px;
  position: relative;
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 0.82rem; font-weight: 500;
  padding: 0; margin-bottom: 20px;
  transition: color 0.15s;
  &:hover { color: var(--primary); }
}

.hero-content { text-align: center; }

.hero-logo {
  width: 96px; height: 96px; border-radius: 20px;
  border: 2px solid var(--border-color);
  background: var(--bg-surface);
  margin: 0 auto 14px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: contain; }
}
.hero-initial { font-size: 2.2rem; font-weight: 900; color: var(--primary); }

.hero-name { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0 0 6px; }
.hero-sub { font-size: 0.8rem; color: var(--text-muted); margin: 0; }

// ── Stats ──────────────────────────────────────────────────────────────────────
.stats-wrap { padding: 20px; }

// ── Section ────────────────────────────────────────────────────────────────────
.section {
  padding: 0 20px 24px;
}

.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0;
}

.section-count {
  background: var(--bg-elevated);
  color: var(--text-muted);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.8rem; font-weight: 700;
}

// ── Players grid ───────────────────────────────────────────────────────────────
.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.player-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.18s;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  position: relative;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--primary);
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  }
}

.player-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-elevated);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; margin-bottom: 4px;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.avatar-initial { font-size: 1.1rem; font-weight: 800; color: var(--primary); }

.player-number {
  position: absolute; top: 8px; inset-inline-end: 8px;
  font-size: 0.65rem; font-weight: 700;
  color: var(--primary); background: var(--primary-soft);
  border-radius: 5px; padding: 1px 5px;
}
.player-name { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
.player-position { font-size: 0.68rem; color: var(--text-muted); }

.player-stats {
  display: flex; gap: 8px; margin-top: 4px;
}
.pstat {
  display: flex; align-items: center; gap: 3px;
  font-size: 0.72rem; color: var(--text-muted); font-weight: 600;
}

// ── Match rows ─────────────────────────────────────────────────────────────────
.matches-list { display: flex; flex-direction: column; gap: 8px; }

.match-row {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer; transition: all 0.15s;

  &:hover { border-color: var(--primary); background: var(--bg-elevated); }
  &.upcoming { border-inline-start: 3px solid var(--primary); }
}

.match-opp-logo {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--bg-elevated); border: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
  img { width: 100%; height: 100%; object-fit: contain; }
}
.opp-initial { font-size: 0.78rem; font-weight: 700; color: var(--primary); }

.match-opp-name {
  flex: 1; font-size: 0.88rem; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.match-score-block { text-align: center; }
.ms-score { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.ms-result {
  display: block; font-size: 0.65rem; font-weight: 800;
  border-radius: 4px; padding: 1px 5px; margin-top: 2px;
  &.result-w { background: rgba(34,197,94,0.15); color: #16a34a; }
  &.result-d { background: rgba(148,163,184,0.15); color: #64748b; }
  &.result-l { background: rgba(239,68,68,0.15); color: #dc2626; }
}
.ms-upcoming { font-size: 0.78rem; color: var(--primary); font-weight: 600; }

.match-date { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; }
.row-arrow { color: var(--text-muted); flex-shrink: 0; margin-inline-start: auto; }

// ── Mobile ─────────────────────────────────────────────────────────────────────
@media (max-width: 576px) {
  .page-wrap { padding-top: 56px; }
  .stats-wrap { padding: 14px; }
  .section { padding: 0 14px 20px; }
  .players-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .hero-name { font-size: 1.3rem; }
}
</style>