<template>
  <div class="page-wrap">
    <SharedUiHeaderPage
      :title="$t('nav.bracket')"
      icon="mdi:tournament"
      :is-rtl="locale === 'ar'"
    />
    <div class="container">
      <!-- Loading -->
      <div v-if="pending" class="skeleton-wrap">
        <div class="skeleton-tabs" />
        <div class="skeleton-content" />
      </div>

      <!-- Error -->
      <SharedUiFeedbackEmptyState
        v-else-if="error"
        :title="$t('error.noData')"
        icon="mdi:tournament"
      />

      <template v-else>
        <!-- Tabs -->
        <SharedUiNavigationTabs v-model="activeTab" :tabs="tabs" class="mb-4" />

        <!-- ══════════════ GROUP STAGE ══════════════ -->
        <div v-if="activeTab === 'groups'" class="bracket-content">
          <div v-if="groupNames.length" class="groups-grid">
            <div v-for="group in groupNames" :key="group" class="group-card">
              <div class="group-header">
                <Icon name="mdi:table" size="14" />
                {{ $t("standings.group") }} {{ group }}
              </div>

              <!-- Mini standings -->
              <table class="group-table">
                <thead>
                  <tr>
                    <th class="th-pos">#</th>
                    <th class="th-team">{{ $t("standings.team") }}</th>
                    <th class="th-num">{{ $t("standings.played") }}</th>
                    <th class="th-num">{{ $t("standings.points") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(entry, idx) in getGroupStandings(group)"
                    :key="entry.slug"
                    class="group-row"
                    :class="{ 'row-advance': idx < 2 }"
                    @click="navigateTo(leaguePath('/teams/' + entry.slug))"
                  >
                    <td class="td-pos">
                      <span class="pos-badge" :class="medalClass(idx)">{{ idx + 1 }}</span>
                    </td>
                    <td class="td-team">
                      <NuxtImg
                        v-if="entry.logo"
                        :src="entry.logo"
                        :alt="entry.title"
                        width="22"
                        height="22"
                        format="webp"
                        loading="lazy"
                        class="td-logo"
                        @error="(e) => (e.target.src = '/default-avatar.jpg')"
                      />
                      <span v-else class="td-initial">{{ entry.title?.charAt(0) }}</span>
                      <span class="td-name">{{ entry.title }}</span>
                    </td>
                    <td class="td-num">{{ entry.P }}</td>
                    <td class="td-pts">{{ entry.Pts }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Match list -->
              <div class="group-matches">
                <div
                  v-for="m in getGroupMatches(group)"
                  :key="m.slug"
                  class="gm-row"
                  @click="navigateTo(leaguePath('/matches/' + m.slug))"
                >
                  <span class="gm-team gm-home">{{ getTeamName(m.homeTeam) }}</span>
                  <span class="gm-score">
                    <template v-if="m.status === 'played'">
                      {{ formatScore(m) }}
                    </template>
                    <template v-else>
                      <Icon name="mdi:calendar-clock-outline" size="13" />
                    </template>
                  </span>
                  <span class="gm-team gm-away">{{ getTeamName(m.awayTeam) }}</span>
                </div>
              </div>
            </div>
          </div>

          <SharedUiFeedbackEmptyState
            v-else
            :title="$t('bracket.placeholder')"
            icon="mdi:tournament"
          />
        </div>

        <!-- ══════════════ KNOCKOUT STAGE ══════════════ -->
        <div v-else class="bracket-content">
          <BracketTree
            v-if="bracketRounds.length"
            :rounds="bracketRounds"
            :get-team-name="getTeamName"
            :league-path="leaguePath"
          />
          <div v-else-if="hasLegacyKnockout" class="knockout-wrapper">
            <div class="knockout-bracket" :class="{ 'is-rtl': locale === 'ar' }">
              <div v-if="quarterfinals.length" class="kt-stage">
                <div class="kt-stage-label">{{ $t("bracket.quarterfinal") }}</div>
                <div class="kt-cards">
                  <BracketMatchCard
                    v-for="m in quarterfinals"
                    :key="m.slug"
                    :match="m"
                    :get-team-name="getTeamName"
                    :is-winner="isWinner"
                    @click="navigateTo(leaguePath('/matches/' + m.slug))"
                  />
                </div>
              </div>
              <div v-if="quarterfinals.length && semifinals.length" class="kt-connector-col">
                <BracketConnectorLines :from="quarterfinals.length" :to="semifinals.length" />
              </div>
              <div v-if="semifinals.length" class="kt-stage">
                <div class="kt-stage-label">{{ $t("bracket.semifinal") }}</div>
                <div class="kt-cards">
                  <BracketMatchCard
                    v-for="m in semifinals"
                    :key="m.slug"
                    :match="m"
                    :get-team-name="getTeamName"
                    :is-winner="isWinner"
                    @click="navigateTo(leaguePath('/matches/' + m.slug))"
                  />
                </div>
              </div>
              <div v-if="semifinals.length && finals.length" class="kt-connector-col">
                <BracketConnectorLines :from="semifinals.length" :to="finals.length" />
              </div>
              <div v-if="finals.length" class="kt-stage kt-stage-final">
                <div class="kt-stage-label kt-stage-label-final">
                  <Icon name="mdi:trophy" size="14" />
                  {{ $t("bracket.final") }}
                </div>
                <div class="kt-cards">
                  <BracketMatchCard
                    v-for="m in finals"
                    :key="m.slug"
                    :match="m"
                    :get-team-name="getTeamName"
                    :is-winner="isWinner"
                    :final="true"
                    @click="navigateTo(leaguePath('/matches/' + m.slug))"
                  />
                </div>
              </div>
            </div>
          </div>
          <SharedUiFeedbackEmptyState
            v-else
            :title="$t('bracket.placeholder')"
            icon="mdi:tournament"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { locale, t } = useI18n();
const { leaguePath, leagueSlug } = useCurrentLeague();
const { name: appTitle } = useAppTitle();
const { fetchTeams, fetchMatches, fetchSettings } = useLeagueData();
import { MATCH_LIST_COLS } from '~/composables/useLeagueData'
const { getGroupStandings: _calcGroupStandings } = useStandings();
const activeTab = ref("groups");

const tabs = computed(() => {
  const list = [
    { value: "groups", label: "bracket.groupStage", icon: "mdi:table" },
  ]
  // ponytail: hide knockout for biemra until data is ready
  if (leagueSlug.value !== 'biemra') {
    list.push({ value: "knockout", label: "bracket.knockout", icon: "mdi:trophy-outline" })
  }
  return list
});

const [
  { data: teamsData, pending: teamsPending, refresh: refreshTeams },
  { data: matchesData, pending: matchesPending, error, refresh: refreshMatches },
  { data: settingsData },
] = await Promise.all([
  useAsyncData("bracket-teams", () => fetchTeams()),
  useAsyncData("bracket-matches", () => fetchMatches({ select: MATCH_LIST_COLS })),
  useAsyncData("bracket-settings", () => fetchSettings()),
]);

const draw = computed(() => settingsData.value?.knockout_draw || null)
const { buildBracket } = useKnockoutBracket();
const bracketRounds = computed(() => {
  if (!draw.value || !draw.value.slots?.length) return []
  return buildBracket({ draw: draw.value, teams: teams.value || [], matches: matches.value || [], locale: locale.value }).rounds
})

// Fallback: on client, re-fetch if SSR returned empty (e.g. Supabase unavailable during SSR)
onMounted(() => {
  if (!teamsData.value?.length || !matchesData.value?.length) {
    refreshTeams()
    refreshMatches()
  }
})

const pending = computed(() => teamsPending.value || matchesPending.value);
const teams = computed(() => teamsData.value || []);
const matches = computed(() => matchesData.value || []);

const groupNames = computed(() => {
  const g = new Set(teams.value.map((t) => t.group).filter(Boolean));
  return g.size > 0 ? [...g].sort() : ["A"];
});

const teamMap = computed(() => {
  const m = {};
  teams.value.forEach((t) => { m[t.slug] = t; });
  return m;
});

const getTeamName = (slug) => teamMap.value[slug]?.title || slug;

const getGroupStandings = (group) =>
  _calcGroupStandings(group, teams.value, matches.value);

const getGroupMatches = (group) => {
  const groupTeamSlugs = teams.value
    .filter((t) => (t.group || "A") === group)
    .map((t) => t.slug);
  return matches.value
    .filter(
      (m) =>
        groupTeamSlugs.includes(m.homeTeam) &&
        groupTeamSlugs.includes(m.awayTeam),
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const medalClass = (idx) => {
  if (idx === 0) return "medal-gold";
  if (idx === 1) return "medal-silver";
  return "";
};

const semifinals = computed(() =>
  matches.value
    .filter((m) => m.group === "SF")
    .sort((a, b) => new Date(a.date) - new Date(b.date)),
);

const finals = computed(() =>
  matches.value
    .filter((m) => m.group === "FINAL")
    .sort((a, b) => new Date(a.date) - new Date(b.date)),
);

const quarterfinals = computed(() =>
  matches.value
    .filter((m) => m.group === "QF")
    .sort((a, b) => new Date(a.date) - new Date(b.date)),
);

const hasLegacyKnockout = computed(
  () => quarterfinals.value.length > 0 || semifinals.value.length > 0 || finals.value.length > 0,
);

const { isTeamWinner, formatScore } = useMatchResult();

const isWinner = (match, teamSlug) => {
  if (match.status !== "played") return false;
  return isTeamWinner(match, teamSlug);
};

useSeoMeta({
  title: () => {
    const fallback = locale.value === "ar" ? "دوري القرية" : "Village League"
    const name = appTitle.value || fallback
    return locale.value === "ar" ? `مخطط الدوري | ${name}` : `Bracket | ${name}`
  },
});
</script>

<style lang="scss" scoped>
@use "@/assets/scss/theme/variables.scss" as *;

.page-wrap {
  padding-bottom: calc(var(--bottom-nav-height) + 32px);
}

.mb-4 { margin-bottom: 24px; }

// ── Skeletons ─────────────────────────────────────────────────────────────────
.skeleton-wrap { display: flex; flex-direction: column; gap: 16px; }
.skeleton-tabs { height: 40px; border-radius: 10px; background: var(--bg-elevated); }
.skeleton-content { height: 300px; border-radius: 16px; background: var(--bg-elevated); }

// ══════════════════════════════════════════════════════════════════════════════
// GROUP STAGE
// ══════════════════════════════════════════════════════════════════════════════
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 576px) { grid-template-columns: 1fr; }
}

.group-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 16px;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-soft);
  border-bottom: 1px solid var(--border-color);
  text-transform: uppercase;
  letter-spacing: 0.6px;

  // RTL: flex already mirrors via inherited dir, nothing extra needed
}

// ── Group table ───────────────────────────────────────────────────────────────
.group-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th {
    padding: 8px 10px;
    font-size: 0.67rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-color);
  }
  .th-pos  { width: 32px; text-align: center; }
  // text-align: start/end are RTL-aware natively
  .th-team { text-align: start; }
  .th-num  { width: 38px; text-align: center; }
}

.group-row {
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.12s;

  &:hover { background: var(--bg-elevated); }
  &:last-child { border-bottom: none; }
  &.row-advance { background: rgba(34, 197, 94, 0.05); }

  td { padding: 8px 10px; }
  .td-pos { text-align: center; }
}

.pos-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  background: var(--bg-elevated);
  color: var(--text-muted);
}
.medal-gold   { background: rgba(234, 179, 8, 0.15); color: #ca8a04; }
.medal-silver { background: rgba(148, 163, 184, 0.15); color: #64748b; }

.td-team {
  display: flex;
  align-items: center;
  gap: 8px;
  // flex row direction follows the inherited dir automatically
}
.td-logo    { width: 22px; height: 22px; object-fit: contain; border-radius: 4px; }
.td-initial { font-size: 0.75rem; font-weight: 800; color: var(--primary); }
.td-name    { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
.td-num     { text-align: center; color: var(--text-muted); }
.td-pts     { text-align: center; font-weight: 800; color: var(--primary); }

// ── Group match rows ──────────────────────────────────────────────────────────
.group-matches {
  border-top: 1px solid var(--border-color);
  padding: 8px;
}

.gm-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 0.78rem;

  &:hover { background: var(--bg-elevated); }
}

.gm-team { flex: 1; font-weight: 500; color: var(--text-primary); }

// In LTR: home on left → text-align end (right); away on right → text-align start (left)
// In RTL: row is mirrored by dir, so we keep start/end — browser handles it
.gm-home { text-align: end; }
.gm-away { text-align: start; }

.gm-score {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--primary);
  min-width: 36px;
  text-align: center;
  background: var(--primary-soft);
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 0.8rem;
}

// ══════════════════════════════════════════════════════════════════════════════
// KNOCKOUT BRACKET
// ══════════════════════════════════════════════════════════════════════════════
.knockout-bracket {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  padding: 24px 4px;
  -webkit-overflow-scrolling: touch;
  min-height: 320px;
  scrollbar-width: thin;

  // RTL: reverse the bracket flow so QF is on the right, Final on the left
  &.is-rtl { flex-direction: row-reverse; }
}

.kt-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  min-width: 160px;
  max-width: 200px;

  @media (max-width: 520px) {
    min-width: 130px;
    max-width: 150px;
  }
}

.kt-stage-label {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 14px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;

  @media (max-width: 520px) {
    font-size: 0.58rem;
    margin-bottom: 10px;
  }
}

.kt-stage-label-final { color: #ca8a04; font-size: 0.76rem; }

.kt-cards {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  flex: 1;
  gap: 16px;
  width: 100%;

  @media (max-width: 520px) { gap: 10px; }
}

.kt-connector-col {
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  padding-top: 36px; // offset for the round label height above

  @media (max-width: 520px) {
    width: 28px;
    padding-top: 28px;
  }
}
</style>
