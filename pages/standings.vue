<template>
  <div class="page-wrap">
    <SharedUiHeaderPage
      :title="$t('nav.standings')"
      icon="mdi:table"
      :is-rtl="locale === 'ar'"
    />
    <div class="container">
      <!-- Loading -->
      <div v-if="pending" class="skeleton-wrap">
        <div v-for="i in 8" :key="i" class="skeleton-row" />
      </div>

      <!-- Error -->
      <SharedUiFeedbackEmptyState
        v-else-if="error || !teams?.length"
        :title="$t('error.noData')"
        icon="mdi:alert-circle-outline"
      />

      <template v-else>
        <!-- Group Tabs -->
        <SharedUiNavigationTabs
          v-if="groups.length > 1"
          v-model="activeGroup"
          :tabs="groupTabs"
          scrollable
          class="mb-4"
        />

        <!-- Standings Table -->
        <div class="standings-card">
          <div class="table-responsive">
            <table class="standings-table">
              <thead>
                <tr>
                  <th class="col-pos">#</th>
                  <th class="col-team">{{ $t("standings.team") }}</th>
                  <th class="col-num">{{ $t("standings.played") }}</th>
                  <th class="col-num">{{ $t("standings.won") }}</th>
                  <th class="col-num pc-only">{{ $t("standings.drawn") }}</th>
                  <th class="col-num pc-only">{{ $t("standings.lost") }}</th>
                  <th class="col-num pc-only">{{ $t("standings.gf") }}</th>
                  <th class="col-num pc-only">{{ $t("standings.ga") }}</th>
                  <th class="col-num pc-only">{{ $t("standings.gd") }}</th>
                  <th class="col-pts">{{ $t("standings.points") }}</th>
                  <th class="col-form">{{ $t("standings.form") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, idx) in currentGroupStandings"
                  :key="entry.slug"
                  class="standings-row"
                  :class="{
                    'zone-advance': idx < 2,
                    'zone-danger': idx >= currentGroupStandings.length - 1,
                  }"
                  @click="navigateTo(`/teams/${entry.slug}`)"
                >
                  <td class="col-pos">
                    <span class="pos-num" :class="posClass(idx)">{{ idx + 1 }}</span>
                  </td>
                  <td class="col-team">
                    <div class="team-cell">
                      <div
                        class="team-logo"
                        :style="entry.color ? `background: ${entry.color}22; border-color: ${entry.color}44` : ''"
                      >
                        <NuxtImg
                          v-if="entry.logo"
                          :src="entry.logo"
                          :alt="entry.title"
                          width="28" height="28" format="webp" loading="lazy"
                        />
                        <span v-else class="team-initial">{{ entry.title?.charAt(0) }}</span>
                      </div>
                      <span class="team-name">{{ entry.title }}</span>
                    </div>
                  </td>
                  <td class="col-num">{{ entry.P }}</td>
                  <td class="col-num">{{ entry.W }}</td>
                  <td class="col-num pc-only">{{ entry.D }}</td>
                  <td class="col-num pc-only">{{ entry.L }}</td>
                  <td class="col-num pc-only">{{ entry.GF }}</td>
                  <td class="col-num pc-only">{{ entry.GA }}</td>
                  <td class="col-num pc-only" :class="entry.GD > 0 ? 'text-green' : entry.GD < 0 ? 'text-red' : ''">
                    {{ entry.GD > 0 ? "+" : "" }}{{ entry.GD }}
                  </td>
                  <td class="col-pts">
                    <span class="pts-badge">{{ entry.Pts }}</span>
                  </td>
                  <td class="col-form">
                    <div class="form-pills">
                      <span v-for="(result, fi) in entry.form" :key="fi" class="form-pill" :class="`form-${result.toLowerCase()}`">{{ result }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-legend">
            <span class="legend-item advance"><span class="legend-dot" /> {{ $t("standings.advance") }}</span>
            <span class="legend-item danger"><span class="legend-dot danger" /> {{ $t("standings.danger") }}</span>
          </div>
        </div>

        <div v-if="groups.length > 1" class="row g-3 mt-2">
          <div v-for="group in groups" :key="group" class="col-md-6">
            <div class="group-mini-card" @click="activeGroup = group">
              <div class="group-mini-title">{{ $t("standings.group") }} {{ group }}</div>
              <div class="group-mini-leaders">
                <div v-for="(entry, i) in getGroupStandings(group).slice(0, 2)" :key="entry.slug" class="group-leader">
                  <span class="leader-pos">{{ i + 1 }}</span>
                  <span class="leader-name">{{ entry.title }}</span>
                  <span class="leader-pts">{{ entry.Pts }}</span>
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
const { locale, t } = useI18n();
const { name: appTitle } = useAppTitle();
const { fetchTeams, fetchMatches } = useLeagueData();

const [
  { data: teamsData, pending: teamsPending, error: teamsError },
  { data: matchesData, pending: matchesPending, error: matchesError },
] = await Promise.all([
  useAsyncData("standings-teams", () => fetchTeams()),
  useAsyncData("standings-matches", () => fetchMatches()),
]);

const pending = computed(() => teamsPending.value || matchesPending.value);
const error = computed(() => teamsError.value || matchesError.value);
const teams = computed(() => teamsData.value || []);
const matches = computed(() => matchesData.value || []);

// Groups
const groups = computed(() => {
  const g = new Set(teams.value.map((t) => t.group).filter(Boolean));
  return g.size > 0 ? [...g].sort() : ["A"];
});

const activeGroup = ref(groups.value[0] || "A");

const groupTabs = computed(() =>
  groups.value.map((g) => ({
    value: g,
    label: `${t("standings.group")} ${g}`,
  })),
);

// Standings calculation
const calculateStandings = (teamList, allMatches) => {
  return teamList
    .map((team) => {
      const teamMatches = allMatches.filter(
        (m) =>
          (m.homeTeam === team.slug || m.awayTeam === team.slug) &&
          m.status === "played",
      );

      let W = 0,
        D = 0,
        L = 0,
        GF = 0,
        GA = 0;
      const formResults = [];

      const sorted = [...teamMatches].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );

      sorted.forEach((m) => {
        const isHome = m.homeTeam === team.slug;
        const scored = isHome ? m.homeScore || 0 : m.awayScore || 0;
        const conceded = isHome ? m.awayScore || 0 : m.homeScore || 0;
        GF += scored;
        GA += conceded;
        if (scored > conceded) {
          W++;
          formResults.push("W");
        } else if (scored === conceded) {
          D++;
          formResults.push("D");
        } else {
          L++;
          formResults.push("L");
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
        form: formResults.slice(0, 5).reverse(),
      };
    })
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);
};

const getGroupStandings = (group) => {
  const groupTeams = teams.value.filter((t) => (t.group || "A") === group);
  return calculateStandings(groupTeams, matches.value);
};

const currentGroupStandings = computed(() =>
  getGroupStandings(activeGroup.value),
);

// Position styling
const posClass = (idx) => {
  if (idx === 0) return "pos-gold";
  if (idx === 1) return "pos-silver";
  if (idx === 2) return "pos-bronze";
  return "";
};

// SEO
useSeoMeta({
  title: () => {
    const fallback = locale.value === "ar" ? "دوري القرية" : "Village League"
    const name = appTitle.value || fallback
    return locale.value === "ar" ? `جدول الترتيب | ${name}` : `Standings | ${name}`
  },
});
</script>

<style lang="scss" scoped>
.page-wrap { padding-bottom: calc(var(--bottom-nav-height) + 32px); }

// ── Skeletons ──────────────────────────────────────────────────────────────────
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-row {
  height: 52px;
  border-radius: 10px;
  background: var(--bg-elevated);
  animation: shimmer 1.4s linear infinite;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

// ── Card ───────────────────────────────────────────────────────────────────────
.standings-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
}

// ── Table ──────────────────────────────────────────────────────────────────────
.table-responsive {
  overflow-x: auto;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  thead tr {
    background: var(--bg-elevated);
    border-bottom: 2px solid var(--border-color);
  }

  th {
    padding: 12px 10px;
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    white-space: nowrap;
    text-align: center;
  }

  th.col-team {
    text-align: start;
  }
}

.standings-row {
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: var(--bg-elevated);
  }

  &.zone-advance {
    border-inline-start: 3px solid var(--primary);
  }
  &.zone-danger {
    border-inline-start: 3px solid #ef4444;
  }

  td {
    padding: 12px 10px;
    text-align: center;
    color: var(--text-primary);
    vertical-align: middle;
  }

  td.col-team {
    text-align: start;
  }
}

// Columns
.col-pos {
  width: 36px;
}
.col-team {
  min-width: 130px;
}
.col-num {
  width: 36px;
  font-size: 0.85rem;
}
.col-pts {
  width: 50px;
}
.col-form {
  width: 90px;
}

.pc-only {
  @media (max-width: 640px) {
    display: none;
  }
}

// ── Position badge ─────────────────────────────────────────────────────────────
.pos-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  background: var(--bg-elevated);
  color: var(--text-muted);

  &.pos-gold {
    background: rgba(234, 179, 8, 0.15);
    color: #ca8a04;
  }
  &.pos-silver {
    background: rgba(148, 163, 184, 0.15);
    color: #64748b;
  }
  &.pos-bronze {
    background: rgba(180, 83, 9, 0.12);
    color: #c2410c;
  }
}

// ── Team cell ──────────────────────────────────────────────────────────────────
.team-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.team-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.team-initial {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
}

.team-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

// ── Points badge ───────────────────────────────────────────────────────────────
.pts-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 800;
  font-size: 0.9rem;
}

// ── Form pills ─────────────────────────────────────────────────────────────────
.form-pills {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.form-pill {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;

  &.form-w {
    background: rgba(34, 197, 94, 0.15);
    color: #16a34a;
  }
  &.form-d {
    background: rgba(148, 163, 184, 0.15);
    color: #64748b;
  }
  &.form-l {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
  }
}

// ── Goal diff color ────────────────────────────────────────────────────────────
.text-green {
  color: #16a34a;
  font-weight: 600;
}
.text-red {
  color: #dc2626;
  font-weight: 600;
}

// ── Legend ─────────────────────────────────────────────────────────────────────
.table-legend {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 20px;
  background: var(--bg-elevated);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--primary);
  &.danger {
    background: #ef4444;
  }
}

// ── All groups summary row ─────────────────────────────────────────────────────
.all-groups-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.group-mini-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
}

.group-mini-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--primary);
  margin-bottom: 10px;
}

.group-leader {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.leader-pos {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  width: 16px;
  flex-shrink: 0;
}

.leader-name {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.leader-pts {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--primary);
}

@media (max-width: 576px) {
  .standings-table th,
  .standings-table td {
    padding: 10px 6px;
  }
  .team-name {
    font-size: 0.8rem;
  }
}
</style>
