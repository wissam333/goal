<template>
  <div class="page-wrap">
    <SharedUiHeaderPage
      :title="$t('nav.fixtures')"
      icon="mdi:calendar-outline"
      :is-rtl="locale === 'ar'"
    />

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
      <div v-for="week in weekGroups" :key="week.number" class="week-section">
        <!-- Week header -->
        <div class="week-header">
          <span class="week-badge">
            <Icon name="mdi:flag-checkered" size="14" />
            {{ $t("match.week") }} {{ week.number }}
          </span>
          <span class="week-count"
            >{{ week.matches.length }} {{ $t("fixtures.matches") }}</span
          >
        </div>

        <!-- Match rows -->
        <div class="matches-list">
          <div
            v-for="match in week.matches"
            :key="match.slug"
            class="match-row"
            :class="{
              'match-upcoming': match.status === 'upcoming',
              'match-live': match.status === 'live',
              'match-played': match.status === 'played',
            }"
            @click="navigateTo(`/matches/${match.slug}`)"
          >
            <!-- Status badge -->
            <div class="match-status">
              <span v-if="match.status === 'live'" class="status-live">
                <span class="live-dot" />
                LIVE
              </span>
              <span v-else-if="match.status === 'played'" class="status-ft"
                >FT</span
              >
              <span v-else class="status-time">{{
                formatMatchTime(match.date)
              }}</span>
            </div>

            <!-- Teams + Score -->
            <div class="match-teams">
              <!-- Home team -->
              <div class="match-team home">
                <span class="match-team-name">{{
                  getTeamName(match.homeTeam)
                }}</span>
                <div class="match-team-logo">
                  <NuxtImg
                    v-if="getTeamLogo(match.homeTeam)"
                    :src="getTeamLogo(match.homeTeam)"
                    :alt="getTeamName(match.homeTeam)"
                    width="28"
                    height="28"
                    format="webp"
                    loading="lazy"
                  />
                  <span v-else class="logo-initial">{{
                    getTeamName(match.homeTeam)?.charAt(0)
                  }}</span>
                </div>
              </div>

              <!-- Score / VS -->
              <div class="match-score">
                <template v-if="match.status !== 'upcoming'">
                  <span
                    class="score-home"
                    :class="{
                      'score-winner': match.homeScore > match.awayScore,
                    }"
                  >
                    {{ match.homeScore ?? 0 }}
                  </span>
                  <span class="score-sep">–</span>
                  <span
                    class="score-away"
                    :class="{
                      'score-winner': match.awayScore > match.homeScore,
                    }"
                  >
                    {{ match.awayScore ?? 0 }}
                  </span>
                </template>
                <span v-else class="score-vs">VS</span>
              </div>

              <!-- Away team -->
              <div class="match-team away">
                <div class="match-team-logo">
                  <NuxtImg
                    v-if="getTeamLogo(match.awayTeam)"
                    :src="getTeamLogo(match.awayTeam)"
                    :alt="getTeamName(match.awayTeam)"
                    width="28"
                    height="28"
                    format="webp"
                    loading="lazy"
                  />
                  <span v-else class="logo-initial">{{
                    getTeamName(match.awayTeam)?.charAt(0)
                  }}</span>
                </div>
                <span class="match-team-name">{{
                  getTeamName(match.awayTeam)
                }}</span>
              </div>
            </div>

            <!-- Match meta -->
            <div class="match-meta">
              <span v-if="match.venue" class="meta-venue">
                <Icon name="mdi:map-marker-outline" size="13" />
                {{ match.venue }}
              </span>
              <span class="meta-date">{{ formatMatchDate(match.date) }}</span>
            </div>

            <!-- Chevron -->
            <Icon
              :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'"
              size="18"
              class="row-chevron"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const { locale, t } = useI18n();

const {
  data: matchesData,
  pending,
  error,
} = await useAsyncData("fixtures-matches", () =>
  queryCollection("matches").sort("date", 1).all().then(r => r || []).catch(() => []),
);

const { data: teamsData } = await useAsyncData("fixtures-teams", () =>
  queryCollection("teams").all().then(r => r || []).catch(() => []),
);

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
const getTeamLogo = (slug) => teamMap.value[slug]?.logo || null;

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

// Group by week
const weekGroups = computed(() => {
  const map = {};
  filteredMatches.value.forEach((m) => {
    const w = m.week || 1;
    if (!map[w]) map[w] = [];
    map[w].push(m);
  });
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([number, matches]) => ({ number: Number(number), matches }));
});

// Date formatting
const dateFnsLocale = computed(() => (locale.value === "ar" ? ar : enUS));

const formatMatchDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "EEE, d MMM", {
      locale: dateFnsLocale.value,
    });
  } catch {
    return dateStr;
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
.page-wrap {
  padding: var(--page-padding);
  padding-bottom: calc(var(--bottom-nav-height) + 34px);
  padding-top: calc(var(--header-height) + 16px);
  max-width: 860px;
  margin: 0 auto;

  @media (max-width: 576px) {
    padding: var(--page-padding-mobile);
    padding-bottom: calc(var(--bottom-nav-height) + 34px);
    padding-top: calc(var(--header-height-mobile) + 14px);
  }
}

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
.skeleton-week {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skeleton-week-title {
  height: 28px;
  width: 120px;
  border-radius: 8px;
  background: var(--bg-elevated);
  @keyframes sh {
    to {
      background-position: -200% 0;
    }
  }
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
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

// ── Week section ───────────────────────────────────────────────────────────────
.week-section {
  margin-bottom: 28px;
}

.week-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.week-badge {
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

.week-count {
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
