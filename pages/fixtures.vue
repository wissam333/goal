<template>
  <div class="page-wrap">
    <SharedUiHeaderPage
      :title="$t('nav.fixtures')"
      icon="mdi:calendar-outline"
      :is-rtl="locale === 'ar'"
    />
    <div class="container">

    <!-- Filter bar -->
    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.key"
        class="filter-btn"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        <Icon :name="f.icon" size="15" />
        {{ $t(f.label) }}
        <span v-if="f.count > 0" class="filter-count">{{ f.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="skeleton-wrap">
      <div v-for="i in 3" :key="i" class="skeleton-week">
        <div class="skeleton-week-title" />
        <div v-for="j in 3" :key="j" class="skeleton-match" />
      </div>
    </div>

    <!-- Error / empty -->
    <SharedUiFeedbackEmptyState
      v-else-if="error || !filteredMatches.length"
      :title="$t('error.noData')"
      icon="mdi:calendar-remove-outline"
    />

    <template v-else>
      <div class="bracket-flow">
        <!-- Group Stage -->
        <div class="bracket-row group-row">
          <div v-for="group in groupStage" :key="group.group" class="bracket-stage">
            <div class="stage-header">
              <Icon name="mdi:table" size="14" />
              {{ $t("standings.group") }} {{ group.group }}
            </div>
            <div
              v-for="match in group.matches"
              :key="match.slug"
              class="bracket-match"
              :class="`bracket-${match.status}`"
              @click="navigateTo(`/matches/${match.slug}`)"
            >
              <div class="bm-team">
                <span class="bm-name" :class="{ win: isWinner(match, match.homeTeam) }">{{ getTeamName(match.homeTeam) }}</span>
                <span class="bm-score" :class="{ win: isWinner(match, match.homeTeam) }">{{ match.status === 'played' ? (match.homeScore ?? 0) : '' }}</span>
              </div>
              <div class="bm-team">
                <span class="bm-name" :class="{ win: isWinner(match, match.awayTeam) }">{{ getTeamName(match.awayTeam) }}</span>
                <span class="bm-score" :class="{ win: isWinner(match, match.awayTeam) }">{{ match.status === 'played' ? (match.awayScore ?? 0) : '' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Connector down -->
        <div class="connector-down">
          <div class="connector-line" />
        </div>

        <!-- Knockout Stage -->
        <div v-if="knockoutStage.length" class="bracket-row knockout-row">
          <div v-for="round in knockoutStage" :key="round.label" class="bracket-stage">
            <div class="stage-header" :class="{ 'stage-final': round.isFinal }">
              <Icon :name="round.isFinal ? 'mdi:trophy' : 'mdi:tournament'" size="14" />
              {{ round.label }}
            </div>
            <div
              v-for="match in round.matches"
              :key="match.slug"
              class="bracket-match"
              :class="[`bracket-${match.status}`, { 'match-final': round.isFinal }]"
              @click="navigateTo(`/matches/${match.slug}`)"
            >
              <div class="bm-team">
                <span class="bm-name" :class="{ win: isWinner(match, match.homeTeam) }">{{ getTeamName(match.homeTeam) }}</span>
                <span class="bm-score" :class="{ win: isWinner(match, match.homeTeam) }">{{ match.status === 'played' ? (match.homeScore ?? 0) : match.status === 'upcoming' ? '' : '–' }}</span>
              </div>
              <div class="bm-team">
                <span class="bm-name" :class="{ win: isWinner(match, match.awayTeam) }">{{ getTeamName(match.awayTeam) }}</span>
                <span class="bm-score" :class="{ win: isWinner(match, match.awayTeam) }">{{ match.status === 'played' ? (match.awayScore ?? 0) : match.status === 'upcoming' ? '' : '–' }}</span>
              </div>
              <div class="bm-meta">
                <span v-if="match.status === 'upcoming'" class="bm-time">{{ formatMatchTime(match.date) }}</span>
                <span v-else-if="match.status === 'live'" class="bm-live">
                  <span class="live-dot" /> LIVE
                </span>
                <span v-else class="bm-date">{{ formatMatchDate(match.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup>
import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { syrianAr } from "~/utils/syrianAr";

const { locale, t } = useI18n();
const { fetchMatches, fetchTeams } = useLeagueData();

const [
  { data: matchesData, pending, error },
  { data: teamsData },
] = await Promise.all([
  useAsyncData("fixtures-matches", () =>
    fetchMatches({ orderBy: { field: "date", dir: "asc" } }),
  ),
  useAsyncData("fixtures-teams", () => fetchTeams()),
]);

const matches = computed(() => matchesData.value || []);
const teams = computed(() => teamsData.value || []);

// Team helpers
const teamMap = computed(() => {
  const m = {};
  teams.value.forEach((t) => {
    m[t.slug] = t;
  });
  return m;
});
const getTeamName = (slug) => teamMap.value[slug]?.title || slug;

// Filter
const activeFilter = ref("all");
const filters = computed(() => [
  {
    key: "all",
    label: "fixtures.all",
    icon: "mdi:format-list-bulleted",
    count: matches.value.length,
  },
  {
    key: "upcoming",
    label: "match.upcoming",
    icon: "mdi:clock-outline",
    count: matches.value.filter((m) => m.status === "upcoming").length,
  },
  {
    key: "played",
    label: "match.played",
    icon: "mdi:check-circle-outline",
    count: matches.value.filter((m) => m.status === "played").length,
  },
]);

const filteredMatches = computed(() => {
  if (activeFilter.value === "all") return matches.value;
  return matches.value.filter((m) => m.status === activeFilter.value);
});

const isWinner = (match, teamSlug) => {
  if (match.status !== "played") return false;
  const isHome = match.homeTeam === teamSlug;
  const scored = isHome ? match.homeScore : match.awayScore;
  const conceded = isHome ? match.awayScore : match.homeScore;
  return (scored ?? 0) > (conceded ?? 0);
};

const groupStage = computed(() => {
  const groups = {};
  const groupPattern = /^[A-Z]$/;
  filteredMatches.value.forEach((m) => {
    const g = m.group || 'A';
    if (!groupPattern.test(g)) return;
    if (!groups[g]) groups[g] = [];
    groups[g].push(m);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, matches]) => ({ group, matches }));
});

const knockoutStage = computed(() => {
  const rounds = [];
  const qf = filteredMatches.value.filter(m => m.group === 'QF').sort((a, b) => new Date(a.date) - new Date(b.date));
  const sf = filteredMatches.value.filter(m => m.group === 'SF').sort((a, b) => new Date(a.date) - new Date(b.date));
  const f = filteredMatches.value.filter(m => m.group === 'F').sort((a, b) => new Date(a.date) - new Date(b.date));
  if (qf.length) rounds.push({ label: t('bracket.quarterfinal'), matches: qf, isFinal: false });
  if (sf.length) rounds.push({ label: t('bracket.semifinal'), matches: sf, isFinal: false });
  if (f.length) rounds.push({ label: t('bracket.final'), matches: f, isFinal: true });
  return rounds;
});

// Date formatting
const dateFnsLocale = computed(() => (locale.value === "ar" ? syrianAr : enUS));

const formatMatchDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "EEE, d MMM", {
      locale: syrianAr,
    });
  } catch {
    return "";
  }
};

const formatMatchTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "HH:mm");
  } catch {
    return "";
  }
};

useSeoMeta({
  title: () =>
    locale.value === "ar"
      ? "جدول المباريات | دوري القرية"
      : "Fixtures | Village League",
});
</script>

<style lang="scss" scoped>
.page-wrap { padding-bottom: calc(var(--bottom-nav-height) + 32px); }

// ── Filter bar ─────────────────────────────────────────────────────────────────
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }
}

.filter-count {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 0.7rem;
  font-weight: 700;

  .filter-btn:not(.active) & {
    background: var(--bg-elevated);
    color: var(--text-muted);
  }
}

// ── Skeletons ──────────────────────────────────────────────────────────────────
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@keyframes sh {
  to { background-position: -200% 0; }
}

.skeleton-match {
  height: 72px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}

// ── Bracket Flowchart ──────────────────────────────────────────────────────────
.bracket-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 8px 0 24px;
}

.bracket-row {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

.bracket-stage {
  flex: 1;
  max-width: 340px;
  min-width: 0;
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 10px;
  padding: 6px 12px;
  background: var(--primary-soft);
  border-radius: 8px;
  letter-spacing: 0.3px;
}

.stage-final {
  color: #ca8a04;
  background: rgba(234, 179, 8, 0.12);
}

// ── Match card ─────────────────────────────────────────────────────────────────
.bracket-match {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 8px;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 3px 12px rgba(0,0,0,0.06);
  }

  &.bracket-live {
    border-color: var(--primary);
    background: rgba(34,197,94,0.03);
  }

  &.match-final {
    border-color: rgba(234,179,8,0.3);
    background: linear-gradient(135deg, rgba(234,179,8,0.04), transparent);
  }
}

.bm-team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
}

.bm-name {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;

  &.win {
    color: var(--primary);
  }
}

.bm-score {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  min-width: 22px;
  text-align: center;
  direction: ltr;

  &.win {
    color: var(--primary);
  }
}

.bm-meta {
  text-align: center;
  font-size: 0.68rem;
  color: var(--text-muted);
  padding-top: 4px;
  border-top: 1px solid var(--border-color);
  margin-top: 4px;
}

.bm-time {
  font-weight: 600;
  color: var(--text-primary);
}

.bm-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: #16a34a;
  font-size: 0.65rem;
  letter-spacing: 0.5px;
}

.bm-date {
  color: var(--text-muted);
}

// ── Connector ──────────────────────────────────────────────────────────────────
.connector-down {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 100%;
  position: relative;
}

.connector-line {
  width: 2px;
  height: 100%;
  background: var(--border-color);
  position: relative;

  &::before, &::after {
    content: '';
    position: absolute;
    left: 50%;
    width: 40%;
    height: 2px;
    background: var(--border-color);
  }

  &::before {
    top: 0;
    transform: translateX(-50%);
  }

  &::after {
    bottom: 0;
    transform: translateX(-50%);
  }
}

// ── Group row ──────────────────────────────────────────────────────────────────
@media (min-width: 640px) {
  .group-row .bracket-stage {
    flex: 0 1 340px;
  }

  .knockout-row .bracket-stage {
    flex: 0 1 300px;
  }
}

@media (max-width: 639px) {
  .bracket-row {
    flex-direction: column;
    align-items: stretch;
  }

  .bracket-stage {
    max-width: 100%;
    flex: none !important;
  }

  .connector-down {
    height: 24px;
  }
}

// ── Skeleton overrides ─────────────────────────────────────────────────────────
.skeleton-week-title {
  height: 28px;
  width: 120px;
  border-radius: 8px;
  background: var(--bg-elevated);
}

.skeleton-match {
  height: 72px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}

.round-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.round-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 700;
}

.round-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

// ── Matches list ───────────────────────────────────────────────────────────────
.matches-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match-row {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.18s;
  display: grid;
  grid-template-columns: 52px 1fr auto 20px;
  align-items: center;
  gap: 12px;

  &:hover {
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &.match-upcoming {
    border-inline-start: 3px solid var(--primary);
  }
  &.match-live {
    border-inline-start: 3px solid #22c55e;
    background: rgba(34, 197, 94, 0.03);
  }
}

// ── Status ─────────────────────────────────────────────────────────────────────
.match-status {
  text-align: center;
}

.status-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border-radius: 6px;
  padding: 3px 7px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
  animation: pulse-green 1.5s infinite;
}

@keyframes pulse-green {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.7);
  }
}

.status-ft {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 6px;
  padding: 3px 7px;
}

.status-time {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

// ── Teams ──────────────────────────────────────────────────────────────────────
.match-teams {
  display: flex;
  align-items: center;
  gap: 10px;
}

.match-team {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;

  &.home {
    justify-content: flex-end;
  }
  &.away {
    justify-content: flex-start;
  }
}

.match-team-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.match-team-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.logo-initial {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
}

// ── Score ──────────────────────────────────────────────────────────────────────
.match-score {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;
}

.score-home,
.score-away {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  min-width: 20px;
  text-align: center;
  &.score-winner {
    color: var(--primary);
  }
}

.score-sep {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 1rem;
}

.score-vs {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 6px;
  padding: 4px 8px;
}

// ── Meta ───────────────────────────────────────────────────────────────────────
.match-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.meta-venue,
.meta-date {
  font-size: 0.72rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}

// ── Chevron ────────────────────────────────────────────────────────────────────
.row-chevron {
  color: var(--text-muted);
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .match-row {
    grid-template-columns: 44px 1fr;
    grid-template-rows: auto auto;
    gap: 8px;
    padding: 12px 12px;
  }

  .match-meta {
    grid-column: 2;
    flex-direction: row;
    justify-content: flex-start;
  }
  .row-chevron {
    display: none;
  }
  .match-team-name {
    max-width: 70px;
    font-size: 0.8rem;
  }
  .score-home,
  .score-away {
    font-size: 1.1rem;
  }
}
</style>
