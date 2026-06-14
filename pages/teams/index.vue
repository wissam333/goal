<template>
  <div class="page-wrap">
    <SharedUiHeaderPage
      :title="$t('nav.teams')"
      icon="mdi:shield-outline"
      :is-rtl="locale === 'ar'"
    />
    <div class="container">
      <!-- Loading -->
      <div v-if="pending" class="skeleton-grid">
        <div v-for="i in 8" :key="i" class="skeleton-card" />
      </div>

      <!-- Error -->
      <SharedUiFeedbackEmptyState
        v-else-if="error || !teams?.length"
        :title="$t('error.noData')"
        icon="mdi:shield-off-outline"
      />

      <template v-else>
        <!-- Stats summary -->
        <SharedUiCardsStats :stats="summaryStats" :columns="4" class="mb-4" />

        <!-- Teams grid -->
        <div class="teams-grid">
          <div
            v-for="(team, idx) in teamsWithStats"
            :key="team.slug"
            class="team-card"
            :style="{ animationDelay: `${idx * 0.07}s` }"
            @click="navigateTo(`/teams/${team.slug}`)"
          >
            <!-- Card header with team color -->
            <div
              class="card-header"
              :style="
                team.color
                  ? `background: linear-gradient(135deg, ${team.color}22, ${team.color}08)`
                  : ''
              "
            >
              <div
                class="card-logo"
                :style="team.color ? `border-color: ${team.color}40` : ''"
              >
                <NuxtImg
                  v-if="team.logo"
                  :src="team.logo"
                  :alt="team.title"
                  width="60"
                  height="60"
                  format="webp"
                  loading="lazy"
                />
                <span v-else class="logo-initial">{{
                  team.title?.charAt(0)
                }}</span>
              </div>

              <!-- Form dots -->
              <div class="card-form">
                <span
                  v-for="(r, fi) in team.form"
                  :key="fi"
                  class="form-dot"
                  :class="`form-${r.toLowerCase()}`"
                  :title="r"
                />
              </div>
            </div>

            <!-- Card body -->
            <div class="card-body">
              <h3 class="card-name">{{ team.title }}</h3>

              <!-- W/D/L row -->
              <div class="card-wdl">
                <span class="wdl-item win">
                  <span class="wdl-num">{{ team.W }}</span>
                  <span class="wdl-label">{{ $t("standings.won") }}</span>
                </span>
                <span class="wdl-sep" />
                <span class="wdl-item draw">
                  <span class="wdl-num">{{ team.D }}</span>
                  <span class="wdl-label">{{ $t("standings.drawn") }}</span>
                </span>
                <span class="wdl-sep" />
                <span class="wdl-item loss">
                  <span class="wdl-num">{{ team.L }}</span>
                  <span class="wdl-label">{{ $t("standings.lost") }}</span>
                </span>
              </div>

              <!-- Points chip -->
              <div class="card-pts">
                <span class="pts-value">{{ team.Pts }}</span>
                <span class="pts-label">{{ $t("standings.points") }}</span>
              </div>
            </div>

            <!-- Arrow -->
            <Icon
              :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'"
              size="16"
              class="card-arrow"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { locale, t } = useI18n();
const appTitle = useAppTitle();
const { fetchTeams, fetchMatches } = useLeagueData();

const {
  data: teamsData,
  pending: teamsPending,
  error: teamsError,
} = useAsyncData("teams-list", () => fetchTeams());
const { data: matchesData, pending: matchesPending } = useAsyncData(
  "teams-matches",
  () => fetchMatches(),
);

const pending = computed(() => teamsPending.value || matchesPending.value);
const error = computed(() => teamsError.value);
const teams = computed(() => teamsData.value || []);
const matches = computed(() => matchesData.value || []);

// Calculate per-team stats
const calculateTeamStats = (team) => {
  const teamMatches = matches.value.filter(
    (m) => m.homeTeam === team.slug || m.awayTeam === team.slug,
  );
  let W = 0,
    D = 0,
    L = 0,
    GF = 0,
    GA = 0;
  const form = [];
  [...teamMatches]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((m) => {
      const isHome = m.homeTeam === team.slug;
      const scored = isHome ? m.homeScore || 0 : m.awayScore || 0;
      const conceded = isHome ? m.awayScore || 0 : m.homeScore || 0;
      GF += scored;
      GA += conceded;
      if (scored > conceded) {
        W++;
        form.push("W");
      } else if (scored === conceded) {
        D++;
        form.push("D");
      } else {
        L++;
        form.push("L");
      }
    });
  return {
    ...team,
    P: W + D + L,
    W,
    D,
    L,
    GF,
    GA,
    GD: GF - GA,
    Pts: W * 3 + D,
    form: form.slice(0, 5).reverse(),
  };
};

const teamsWithStats = computed(() =>
  teams.value
    .map(calculateTeamStats)
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD),
);

// Summary stats
const summaryStats = computed(() => [
  {
    key: "teams",
    label: "stats.totalTeams",
    icon: "mdi:shield-outline",
    value: teams.value.length,
    color: "primary",
  },
  {
    key: "played",
    label: "standings.played",
    icon: "mdi:soccer-field",
    value: matches.value.length,
    color: "success",
  },
  {
    key: "goals",
    label: "stats.totalGoals",
    icon: "mdi:soccer",
    value: matches.value.reduce(
      (sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0),
      0,
    ),
    color: "warning",
  },
  {
    key: "avg",
    label: "stats.avgGoals",
    icon: "mdi:chart-bar",
    value: matches.value.length
      ? (
          matches.value.reduce(
            (s, m) => s + (m.homeScore || 0) + (m.awayScore || 0),
            0,
          ) / matches.value.length
        ).toFixed(1)
      : "0",
    color: "info",
  },
]);

useSeoMeta({
  title: () => {
    const fallback = locale.value === "ar" ? "دوري القرية" : "Village League";
    const name = appTitle.value || fallback;
    return locale.value === "ar" ? `الفرق | ${name}` : `Teams | ${name}`;
  },
});
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-bottom: calc(var(--bottom-nav-height) + 34px);
}

.mb-4 {
  margin-bottom: 24px;
}

// ── Skeletons ──────────────────────────────────────────────────────────────────
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.skeleton-card {
  height: 200px;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}

@keyframes sh {
  to {
    background-position: -200% 0;
  }
}

// ── Teams grid ─────────────────────────────────────────────────────────────────
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}

.team-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  animation: card-in 0.4s ease both;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ── Card header ────────────────────────────────────────────────────────────────
.card-header {
  background: var(--bg-elevated);
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--border-color);
}

.card-logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  border: 2px solid var(--border-color);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
.logo-initial {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary);
}

.card-form {
  display: flex;
  gap: 4px;
}
.form-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  &.form-w {
    background: rgba(34, 197, 94, 0.7);
  }
  &.form-d {
    background: rgba(148, 163, 184, 0.5);
  }
  &.form-l {
    background: rgba(239, 68, 68, 0.6);
  }
}

// ── Card body ──────────────────────────────────────────────────────────────────
.card-body {
  padding: 14px 16px 16px;
}

.card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px;
  text-align: center;
}

.card-wdl {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}
.wdl-sep {
  width: 1px;
  height: 24px;
  background: var(--border-color);
}
.wdl-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 36px;
}
.wdl-num {
  font-size: 1.1rem;
  font-weight: 800;
}
.wdl-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
}
.wdl-item.win .wdl-num {
  color: #16a34a;
}
.wdl-item.draw .wdl-num {
  color: var(--text-muted);
}
.wdl-item.loss .wdl-num {
  color: #dc2626;
}

.card-pts {
  text-align: center;
  background: var(--primary-soft);
  border-radius: 10px;
  padding: 8px;
}
.pts-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--primary);
  display: block;
  line-height: 1;
}
.pts-label {
  font-size: 0.65rem;
  color: var(--primary);
  opacity: 0.7;
  text-transform: uppercase;
}

// ── Arrow ──────────────────────────────────────────────────────────────────────
.card-arrow {
  position: absolute;
  bottom: 12px;
  inset-inline-end: 12px;
  color: var(--text-muted);
  opacity: 0;
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.team-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(2px);
}

@media (max-width: 576px) {
  .teams-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .card-logo {
    width: 52px;
    height: 52px;
  }
  .card-name {
    font-size: 0.88rem;
  }
}
</style>
