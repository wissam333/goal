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
      <SharedUiNavigationTabs
        v-model="activeTab"
        :tabs="tabs"
        class="mb-4"
      />

      <!-- Group Stage -->
      <div v-if="activeTab === 'groups'" class="bracket-content">
        <div v-if="groupNames.length" class="groups-grid">
          <div
            v-for="group in groupNames"
            :key="group"
            class="group-card"
          >
            <div class="group-header">
              {{ $t('standings.group') }} {{ group }}
            </div>

            <!-- Mini standings -->
            <table class="group-table">
              <thead>
                <tr>
                  <th class="th-pos">#</th>
                  <th class="th-team">{{ $t('standings.team') }}</th>
                  <th class="th-num">{{ $t('standings.played') }}</th>
                  <th class="th-num">{{ $t('standings.points') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, idx) in getGroupStandings(group)"
                  :key="entry.slug"
                  class="group-row"
                  :class="{ 'row-advance': idx < 2 }"
                  @click="navigateTo(`/teams/${entry.slug}`)"
                >
                  <td class="td-pos">
                    <span class="pos-badge" :class="medalClass(idx)">{{ idx + 1 }}</span>
                  </td>
                  <td class="td-team">
                    <NuxtImg
                      v-if="entry.logo"
                      :src="entry.logo"
                      :alt="entry.title"
                      width="22" height="22"
                      format="webp" loading="lazy"
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

            <!-- Match grid -->
            <div class="group-matches">
              <div
                v-for="m in getGroupMatches(group)"
                :key="m.slug"
                class="gm-row"
                @click="navigateTo(`/matches/${m.slug}`)"
              >
                <span class="gm-home">{{ getTeamName(m.homeTeam) }}</span>
                <span class="gm-score">
                  <template v-if="m.status === 'played'">
                    {{ m.homeScore }}–{{ m.awayScore }}
                  </template>
                  <template v-else>
                    <Icon name="mdi:calendar-clock-outline" size="12" />
                  </template>
                </span>
                <span class="gm-away">{{ getTeamName(m.awayTeam) }}</span>
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

      <!-- Knockout Stage -->
      <div v-else class="bracket-content">
        <!-- Check if knockout data exists -->
        <div v-if="hasKnockout" class="knockout-bracket">
          <!-- Semi-finals -->
          <div class="ko-round">
            <div class="ko-round-label">{{ $t('bracket.semifinal') }}</div>
            <div class="ko-matches">
              <div
                v-for="(m, i) in semifinals"
                :key="i"
                class="ko-match"
                @click="navigateTo(`/matches/${m.slug}`)"
              >
                <div class="ko-team" :class="{ winner: isWinner(m, m.homeTeam) }">
                  <span class="ko-name">{{ getTeamName(m.homeTeam) }}</span>
                  <span class="ko-score">{{ m.homeScore ?? '-' }}</span>
                </div>
                <div class="ko-vs">VS</div>
                <div class="ko-team" :class="{ winner: isWinner(m, m.awayTeam) }">
                  <span class="ko-score">{{ m.awayScore ?? '-' }}</span>
                  <span class="ko-name">{{ getTeamName(m.awayTeam) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Final -->
          <div class="ko-round final-round">
            <div class="ko-round-label final-label">{{ $t('bracket.final') }}</div>
            <div class="ko-matches">
              <div
                v-for="(m, i) in finals"
                :key="i"
                class="ko-match final-match"
                @click="navigateTo(`/matches/${m.slug}`)"
              >
                <div class="ko-team" :class="{ winner: isWinner(m, m.homeTeam) }">
                  <span class="ko-name">{{ getTeamName(m.homeTeam) }}</span>
                  <span class="ko-score">{{ m.homeScore ?? '-' }}</span>
                </div>
                <div class="ko-vs">
                  <Icon name="mdi:trophy" size="20" class="trophy-icon" />
                </div>
                <div class="ko-team" :class="{ winner: isWinner(m, m.awayTeam) }">
                  <span class="ko-score">{{ m.awayScore ?? '-' }}</span>
                  <span class="ko-name">{{ getTeamName(m.awayTeam) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SharedUiFeedbackEmptyState
          v-else
          :title="$t('bracket.placeholder')"
          icon="mdi:tournament"
        >
          <p>{{ $t('bracket.placeholder') }}</p>
        </SharedUiFeedbackEmptyState>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup>
const { locale, t } = useI18n();
const activeTab = ref('groups');

const tabs = computed(() => [
  { value: 'groups', label: 'bracket.groupStage', icon: 'mdi:table' },
  { value: 'knockout', label: 'bracket.knockout', icon: 'mdi:trophy-outline' },
]);

const { data: teamsData, pending: teamsPending } = await useAsyncData(
  'bracket-teams', () => queryCollection('teams').all().then(r => r || []).catch(() => [])
);
const { data: matchesData, pending: matchesPending, error } = await useAsyncData(
  'bracket-matches', () => queryCollection('matches').all().then(r => r || []).catch(() => [])
);


const pending = computed(() => teamsPending.value || matchesPending.value);
const teams = computed(() => teamsData.value || []);
const matches = computed(() => matchesData.value || []);

const groupNames = computed(() => {
  const g = new Set(teams.value.map(t => t.group).filter(Boolean));
  return g.size > 0 ? [...g].sort() : ['A'];
});

const teamMap = computed(() => {
  const m = {};
  teams.value.forEach(t => { m[t.slug] = t; });
  return m;
});

const getTeamName = (slug) => teamMap.value[slug]?.title || slug;

const calculateStandings = (teamList) => {
  return teamList.map(team => {
    const teamMatches = matches.value.filter(m =>
      (m.homeTeam === team.slug || m.awayTeam === team.slug) && m.status === 'played'
    );
    let W = 0, D = 0, L = 0;
    teamMatches.forEach(m => {
      const isHome = m.homeTeam === team.slug;
      const scored = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
      const conceded = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      if (scored > conceded) W++;
      else if (scored === conceded) D++;
      else L++;
    });
    const P = W + D + L;
    return { ...team, P, Pts: W * 3 + D };
  }).sort((a, b) => b.Pts - a.Pts);
};

const getGroupStandings = (group) => {
  const groupTeams = teams.value.filter(t => (t.group || 'A') === group);
  return calculateStandings(groupTeams);
};

const getGroupMatches = (group) => {
  const groupTeamSlugs = teams.value
    .filter(t => (t.group || 'A') === group)
    .map(t => t.slug);
  return matches.value.filter(m =>
    groupTeamSlugs.includes(m.homeTeam) && groupTeamSlugs.includes(m.awayTeam)
  ).sort((a, b) => new Date(a.date) - new Date(b.date));
};

const medalClass = (idx) => {
  if (idx === 0) return 'medal-gold';
  if (idx === 1) return 'medal-silver';
  return '';
};

const semifinals = computed(() =>
  matches.value.filter(m => m.group === 'SF')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
);

const finals = computed(() =>
  matches.value.filter(m => m.group === 'F')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
);

const hasKnockout = computed(() => semifinals.value.length > 0 || finals.value.length > 0);

const isWinner = (match, teamSlug) => {
  if (match.status !== 'played') return false;
  const isHome = match.homeTeam === teamSlug;
  const scored = isHome ? match.homeScore : match.awayScore;
  const conceded = isHome ? match.awayScore : match.homeScore;
  return (scored ?? 0) > (conceded ?? 0);
};

useSeoMeta({
  title: () => locale.value === 'ar' ? 'مخطط الدوري | دوري القرية' : 'Bracket | Village League',
});
</script>

<style lang="scss" scoped>
.page-wrap { padding-bottom: calc(var(--bottom-nav-height) + 32px); }
.container { padding-top: 20px; }

.mb-4 { margin-bottom: 24px; }

// ── Skeletons ──────────────────────────────────────────────────────────────────
.skeleton-wrap { display: flex; flex-direction: column; gap: 16px; }
.skeleton-tabs { height: 40px; border-radius: 10px; background: var(--bg-elevated); }
.skeleton-content { height: 300px; border-radius: 16px; background: var(--bg-elevated); }

// ── Groups grid ────────────────────────────────────────────────────────────────
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.group-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.group-header {
  padding: 12px 16px;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-soft);
  border-bottom: 1px solid var(--border-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// ── Group table ────────────────────────────────────────────────────────────────
.group-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th {
    padding: 8px 10px;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-color);
  }
  .th-pos { width: 32px; text-align: center; }
  .th-team { text-align: start; }
  .th-num { width: 36px; text-align: center; }
}

.group-row {
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.12s;

  &:hover { background: var(--bg-elevated); }
  &:last-child { border-bottom: none; }

  &.row-advance {
    background: rgba(34, 197, 94, 0.04);
  }

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
.medal-gold { background: rgba(234,179,8,0.15); color: #ca8a04; }
.medal-silver { background: rgba(148,163,184,0.15); color: #64748b; }

.td-team { display: flex; align-items: center; gap: 8px; }
.td-logo { width: 22px; height: 22px; object-fit: contain; border-radius: 4px; }
.td-initial { font-size: 0.75rem; font-weight: 800; color: var(--primary); }
.td-name { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
.td-num { text-align: center; color: var(--text-muted); }
.td-pts { text-align: center; font-weight: 800; color: var(--primary); }

// ── Group matches ──────────────────────────────────────────────────────────────
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

.gm-home { flex: 1; text-align: end; font-weight: 500; color: var(--text-primary); }
.gm-away { flex: 1; font-weight: 500; color: var(--text-primary); }
.gm-score {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--primary);
  min-width: 32px;
  text-align: center;
}

// ── Knockout bracket ───────────────────────────────────────────────────────────
.knockout-bracket {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  padding: 20px 0;
}

.ko-round {
  width: 100%;
  max-width: 400px;
}

.ko-round-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.final-label {
  color: #ca8a04;
  font-size: 0.85rem;
}

.ko-matches {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ko-match {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
}

.final-match {
  border-color: rgba(234,179,8,0.3);
  background: linear-gradient(135deg, rgba(234,179,8,0.04), transparent);

  &:hover { border-color: #ca8a04; }
}

.ko-team {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.ko-name { flex: 1; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
.ko-score {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-muted);
  min-width: 24px;
  text-align: center;
}

.ko-team.winner .ko-name { color: var(--primary); }
.ko-team.winner .ko-score { color: var(--primary); }

.ko-vs {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  padding: 2px 0;
}

.trophy-icon { color: #ca8a04; }

@media (max-width: 576px) {
  .groups-grid { grid-template-columns: 1fr; }
}
</style>
