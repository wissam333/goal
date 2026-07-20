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

      <!-- View toggle -->
      <div class="view-toggle">
        <button
          class="view-btn"
          :class="{ active: viewMode === 'timeline' }"
          @click="viewMode = 'timeline'"
        >
          <Icon name="mdi:timeline" size="14" />
          {{ $t("fixtures.timeline") }}
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <Icon name="mdi:format-list-text" size="14" />
          {{ $t("fixtures.list") }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="!pageReady && !matchesData?.length" class="skeleton-wrap">
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
        <!-- Timeline View -->
        <div v-show="viewMode === 'timeline'" class="timeline">
          <div
            v-for="dateGroup in timeline"
            :key="dateGroup.dateKey"
            class="tl-date-group"
          >
            <div class="tl-date-header">
              <span class="tl-date-badge">{{ dateGroup.dateLabel }}</span>
            </div>
            <div class="tl-matches">
              <div
                v-for="match in dateGroup.matches"
                :key="match.slug"
                class="tl-match"
                :class="`tl-${match.status}`"
                @click="navigateTo(leaguePath(`/matches/${match.slug}`))"
              >
                <div class="tl-line-dot" />
                <div class="tl-time">
                  <template v-if="match.status === 'played'">
                    <span class="tl-time-val">{{
                      showTime ? formatMatchTime(match.date) : "--:--"
                    }}</span>
                  </template>
                  <template v-else-if="match.status === 'live'">
                    <span class="tl-live">
                      <span class="live-dot" /> {{ $t("match.live") }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="tl-time-val">{{
                      showTime ? formatMatchTime(match.date) : "--:--"
                    }}</span>
                  </template>
                </div>
                <div class="tl-card">
                  <div class="tl-card-inner">
                    <div class="tl-team">
                      <span
                        class="tl-team-name"
                        :class="{ winner: isWinner(match, match.homeTeam) }"
                        >{{ getTeamName(match.homeTeam) }}</span
                      >
                      <span
                        class="tl-score"
                        :class="{ winner: isWinner(match, match.homeTeam) }"
                        >{{
                          match.status === "played"
                            ? openPlayScore(match, "home")
                            : ""
                        }}</span
                      >
                    </div>
                    <div class="tl-vs">
                      <template v-if="match.status === 'played'">–</template>
                      <template v-else-if="match.status === 'live'"
                        ><span class="live-dot"
                      /></template>
                      <template v-else>VS</template>
                    </div>
                    <div class="tl-team tl-away">
                      <span
                        class="tl-score"
                        :class="{ winner: isWinner(match, match.awayTeam) }"
                        >{{
                          match.status === "played"
                            ? openPlayScore(match, "away")
                            : ""
                        }}</span
                      >
                      <span
                        class="tl-team-name"
                        :class="{ winner: isWinner(match, match.awayTeam) }"
                        >{{ getTeamName(match.awayTeam) }}</span
                      >
                    </div>
                  </div>
                  <div class="tl-card-footer">
                    <span class="tl-round">{{ matchGroupLabel(match) }}</span>
                    <span v-if="scoreBadge(match)" class="tl-result-badge">{{ scoreBadge(match) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-show="viewMode === 'list'" class="list-view">
          <div
            v-for="match in filteredMatches"
            :key="match.slug"
            class="lv-card"
            :class="`lv-${match.status}`"
            @click="navigateTo(leaguePath(`/matches/${match.slug}`))"
          >
            <div class="lv-meta">
              <span class="lv-date">{{ formatDate(match.date) }}</span>
              <span class="lv-time">{{
                showTime ? formatMatchTime(match.date) : "--:--"
              }}</span>
            </div>
            <div class="lv-teams">
              <div class="lv-row">
                <span
                  class="lv-name"
                  :class="{ winner: isWinner(match, match.homeTeam) }"
                  >{{ getTeamName(match.homeTeam) }}</span
                >
                <span
                  class="lv-score"
                  :class="{ winner: isWinner(match, match.homeTeam) }"
                  >{{
                    match.status === "played" ? openPlayScore(match, "home") : ""
                  }}</span
                >
              </div>
              <div class="lv-row">
                <span
                  class="lv-name"
                  :class="{ winner: isWinner(match, match.awayTeam) }"
                  >{{ getTeamName(match.awayTeam) }}</span
                >
                <span
                  class="lv-score"
                  :class="{ winner: isWinner(match, match.awayTeam) }"
                  >{{
                    match.status === "played" ? openPlayScore(match, "away") : ""
                  }}</span
                >
              </div>
              <div v-if="scoreBadge(match)" class="lv-result-badge">{{ scoreBadge(match) }}</div>
            </div>
            <div class="lv-status">
              <template v-if="match.status === 'live'"
                ><span class="live-dot"
              /></template>
              <template v-else-if="match.status === 'upcoming'"
                ><Icon name="mdi:clock-outline" size="12"
              /></template>
              <template v-else><Icon name="mdi:check" size="12" /></template>
            </div>
            <span class="lv-round">{{ matchGroupLabel(match) }}</span>
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
const { leaguePath } = useCurrentLeague()
const { name: appTitle } = useAppTitle();
const { fetchMatches, fetchTeams } = useLeagueData();

const [
  { data: matchesData, pending, error, refresh: refreshMatches },
  { data: teamsData },
] = await Promise.all([
  useAsyncData("fixtures-matches", () =>
    fetchMatches({ orderBy: { field: "date", dir: "asc" } }),
  ),
  useAsyncData("fixtures-teams", () => fetchTeams()),
]);

const now = ref(0);
const computeStatus = (dateStr) => {
  if (!dateStr) return "upcoming";
  if (!now.value) return "upcoming";
  const matchDate = new Date(dateStr);
  const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
  if (now.value > matchEnd) return "played";
  if (now.value >= matchDate) return "live";
  return "upcoming";
};
const matches = computed(() =>
  (matchesData.value || []).map((m) => ({
    ...m,
    status: m.status === "played" ? "played" : computeStatus(m.date),
  })),
);
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

const viewMode = ref("timeline");

const filteredMatches = computed(() => {
  if (activeFilter.value === "all") return matches.value;
  return matches.value.filter((m) => m.status === activeFilter.value);
});

const { isTeamWinner, getOpenPlayScore, formatScoreParts } = useMatchResult();

const isWinner = (match, teamSlug) => {
  if (match.status !== "played") return false;
  return isTeamWinner(match, teamSlug);
};

const openPlayScore = (match, side) => {
  const s = getOpenPlayScore(match);
  return side === "home" ? (s.home ?? 0) : (s.away ?? 0);
};

const scoreBadge = (match) => {
  if (match.status !== "played") return "";
  const parts = formatScoreParts(match);
  if (parts.pens) return `${parts.pens} ${parts.badge}`.trim();
  if (parts.method === "aet") return parts.badge;
  return "";
};

const KNOCKOUT_LABELS = {
  QF: "bracket.quarterfinal",
  SF: "bracket.semifinal",
  F: "bracket.final",
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = parseISO(dateStr);
    const today = new Date();
    const todayKey = format(today, "yyyy-MM-dd");
    const dateKey = format(d, "yyyy-MM-dd");
    if (dateKey === todayKey) return t("today");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateKey === format(yesterday, "yyyy-MM-dd")) return t("yesterday");
    return format(d, "EEEE d MMMM", { locale: dateFnsLocale.value });
  } catch {
    return "";
  }
};

const matchGroupLabel = (match) => {
  if (!match.group) return "";
  if (KNOCKOUT_LABELS[match.group]) return t(KNOCKOUT_LABELS[match.group]);
  return `${t("standings.group")} ${match.group}`;
};

const timeline = computed(() => {
  const groups = {};
  filteredMatches.value.forEach((m) => {
    const key = m.date ? format(parseISO(m.date), "yyyy-MM-dd") : "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, matches]) => ({
      dateKey,
      dateLabel: formatDateLabel(matches[0].date),
      matches,
    }));
});

// Date formatting
const dateFnsLocale = computed(() => (locale.value === "ar" ? syrianAr : enUS));

const showTime = ref(false);
const pageReady = ref(false);
let refreshTimer = null;
onMounted(async () => {
  showTime.value = true;
  now.value = Date.now();
  await refreshMatches();
  pageReady.value = true;
  refreshTimer = setInterval(() => {
    now.value = Date.now();
  }, 10000);
});
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});

// ── Realtime match updates ────────────────────────────────────────────────────
const { subscribe: subFixturesMatches, unsubscribe: unsubFixturesMatches } =
  useRealtime("matches", ["INSERT", "UPDATE", "DELETE"]);
onMounted(() => {
  subFixturesMatches(() => {
    refreshMatches();
  });
});
onUnmounted(() => {
  unsubFixturesMatches();
});

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "d MMM", { locale: dateFnsLocale.value });
  } catch {
    return "";
  }
};

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
    return format(parseISO(dateStr), "h:mm a", { locale: dateFnsLocale.value });
  } catch {
    return "";
  }
};

useSeoMeta({
  title: () => {
    const fallback = locale.value === "ar" ? "دوري القرية" : "Village League";
    const name = appTitle.value || fallback;
    return locale.value === "ar"
      ? `جدول المباريات | ${name}`
      : `Fixtures | ${name}`;
  },
});
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-bottom: calc(var(--bottom-nav-height) + 32px);
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
  gap: 10px;
}
@keyframes sh {
  to {
    background-position: -200% 0;
  }
}
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

// ── Timeline ───────────────────────────────────────────────────────────────────
.timeline {
  padding: 0 0 24px;
}

.tl-date-group {
  margin-bottom: 28px;
  &:last-child {
    margin-bottom: 0;
  }
}

.tl-date-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 8px 0;
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
}

.tl-date-badge {
  display: inline-flex;
  background: var(--primary);
  color: #fff;
  border-radius: 999px;
  padding: 6px 18px;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.tl-matches {
  position: relative;
  padding-inline-start: 24px;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    inset-inline-start: 10px;
    width: 2px;
    background: var(--border-color);
    border-radius: 2px;
  }
}

.tl-match {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  cursor: pointer;
  position: relative;
  transition: transform 0.15s;
  &:last-child {
    margin-bottom: 0;
  }
  &:active {
    transform: scale(0.98);
  }
}

.tl-line-dot {
  position: absolute;
  inset-inline-start: -19px;
  top: 22px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 2px solid var(--border-color);
  z-index: 1;
  .tl-live & {
    border-color: #16a34a;
    background: #16a34a;
  }
  .tl-played & {
    border-color: var(--primary);
    background: var(--primary);
  }
}

.tl-time {
  flex-shrink: 0;
  width: 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 4px;
}

.tl-time-val {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
}

.tl-live {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 0.62rem;
  font-weight: 800;
  color: #16a34a;
  letter-spacing: 0.3px;
  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #16a34a;
    animation: pulse-green 1.5s infinite;
  }
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

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
  animation: pulse-green 1.5s infinite;
}

.tl-card {
  flex: 1;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.15s;
  .tl-live & {
    border-color: rgba(22, 163, 74, 0.3);
  }
  .tl-upcoming & {
    border-color: var(--border-color);
  }
  &:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  }
}

.tl-card-inner {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  gap: 8px;
}

.tl-team {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  &.tl-away {
    justify-content: flex-end;
  }
}

.tl-team-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
  &.winner { color: var(--primary); }
}


.tl-score {
  font-size: 1.15rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  min-width: 20px;
  text-align: center;
  direction: ltr;
  &.winner { color: var(--primary); }
}


.tl-vs {
  flex-shrink: 0;
  width: 28px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  .live-dot {
    display: inline-block;
    margin: 0 auto;
  }
}

.tl-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 14px;
  border-top: 1px solid var(--border-color);
}

.tl-round {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
}

.tl-result-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #ca8a04;
  white-space: nowrap;
}

// ── View toggle ─────────────────────────────────────────────────────────────────
.view-toggle {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background: var(--bg-elevated);
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
}
.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &.active {
    background: var(--bg-surface);
    color: var(--primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
}

// ── List View ─────────────────────────────────────────────────────────────────
.list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
}
.lv-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: var(--primary);
  }
  &:active {
    transform: scale(0.98);
  }
  &.lv-live {
    border-color: rgba(22, 163, 74, 0.4);
  }
}
.lv-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  gap: 2px;
  flex-shrink: 0;
}
.lv-date {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
}
.lv-time {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}
.lv-teams {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.lv-result-badge {
  font-size: 0.62rem;
  font-weight: 800;
  color: #ca8a04;
  margin-top: 2px;
}
.lv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.lv-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
  &.winner { color: var(--primary); }
}

.lv-score {
  font-size: 0.95rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  min-width: 20px;
  text-align: center;
  direction: ltr;
  &.winner { color: var(--primary); }
}

.lv-status {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
  color: var(--text-muted);
  .live-dot {
    margin: 0 auto;
  }
}
.lv-round {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 6px;
  padding: 2px 6px;
  flex-shrink: 0;
  white-space: nowrap;
}

@media (min-width: 600px) {
  .tl-team-name {
    font-size: 0.9rem;
  }
  .tl-score {
    font-size: 1.2rem;
  }
  .tl-time {
    width: 60px;
  }
  .tl-time-val {
    font-size: 0.85rem;
  }
}
</style>
