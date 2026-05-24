<template>
  <div class="page-wrap">
    <SharedUiHeaderPage
      :title="$t('nav.stats')"
      icon="mdi:chart-bar"
      :is-rtl="locale === 'ar'"
    />

    <div class="container">

    <!-- Loading -->
    <div v-if="pending" class="skeleton-wrap">
      <div class="skeleton-section" />
      <div class="skeleton-section" />
      <div class="skeleton-section" />
    </div>

    <!-- Error -->
    <SharedUiFeedbackEmptyState
      v-else-if="error"
      :title="$t('error.noData')"
      icon="mdi:chart-bar"
    />

    <template v-else>
      <!-- ① Match Stats row -->
      <div class="section">
        <SharedUiCardsStats :stats="matchStats" :columns="4" />
      </div>

      <!-- ② Top Scorers -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:soccer" size="20" />
            {{ $t('stats.topScorer') }}
          </h2>
        </div>

        <div v-if="topScorers.length" class="rank-list">
          <div
            v-for="(p, i) in topScorers"
            :key="p.slug"
            class="rank-row"
            :class="`rank-${i}`"
            @click="navigateTo(`/players/${p.slug}`)"
          >
            <div class="rank-pos">
              <span v-if="i < 3" class="medal" :class="`medal-${['gold','silver','bronze'][i]}`">
                <Icon :name="['mdi:medal','mdi:medal','mdi:medal'][i]" size="16" />
              </span>
              <span v-else class="rank-num">{{ i + 1 }}</span>
            </div>

            <div class="rank-avatar">
              <img
                v-if="p.photo"
                :src="p.photo"
                :alt="p.title"
                width="40" height="40"
                loading="lazy"
                @error="onImgError"
              />
              <span v-else class="rank-initial">{{ p.title?.charAt(0) }}</span>
            </div>

            <div class="rank-info">
              <span class="rank-name">{{ p.title }}</span>
              <span class="rank-team">{{ getTeamName(p.team) }}</span>
            </div>

            <div class="rank-stat">
              <span class="rank-value">{{ p.goals || 0 }}</span>
              <span class="rank-label">{{ $t('player.goals') }}</span>
            </div>
          </div>
        </div>
        <SharedUiFeedbackEmptyState
          v-else
          :title="$t('error.noData')"
          icon="mdi:soccer"
          small
        />
      </div>

      <!-- ③ MOTM Leaders -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:star-outline" size="20" />
            {{ $t('stats.motmLeader') }}
          </h2>
        </div>

        <div v-if="motmLeaders.length" class="rank-list compact">
          <div
            v-for="(p, i) in motmLeaders"
            :key="p.slug"
            class="rank-row"
            @click="navigateTo(`/players/${p.slug}`)"
          >
            <div class="rank-pos">
              <span v-if="i < 3" class="medal" :class="`medal-${['gold','silver','bronze'][i]}`">
                <Icon :name="['mdi:medal','mdi:medal','mdi:medal'][i]" size="14" />
              </span>
              <span v-else class="rank-num">{{ i + 1 }}</span>
            </div>
            <div class="rank-avatar small">
              <img
                v-if="p.photo"
                :src="p.photo"
                :alt="p.title"
                width="32" height="32"
                loading="lazy"
                @error="onImgError"
              />
              <span v-else class="rank-initial">{{ p.title?.charAt(0) }}</span>
            </div>
            <div class="rank-info">
              <span class="rank-name">{{ p.title }}</span>
              <span class="rank-team">{{ getTeamName(p.team) }}</span>
            </div>
            <div class="rank-stat">
              <span class="rank-value">{{ p.motmWins }}</span>
              <span class="rank-label">
                <Icon name="mdi:star" size="12" />
              </span>
            </div>
          </div>
        </div>
        <SharedUiFeedbackEmptyState
          v-else
          :title="$t('error.noData')"
          icon="mdi:star-outline"
          small
        />
      </div>

      <!-- ④ Season Photo Album -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">
            <Icon name="mdi:image-multiple-outline" size="20" />
            {{ $t('stats.album') }}
          </h2>
          <span v-if="albumPhotos.length" class="section-count">
            {{ albumPhotos.length }} {{ $t('match.album') }}
          </span>
        </div>

        <ElementsAlbum v-if="albumPhotos.length" :images="albumPhotos" :columns="3" />
        <SharedUiFeedbackEmptyState
          v-else
          :title="$t('match.noPhotos')"
          icon="mdi:camera-off-outline"
          small
        />
      </div>
    </template>
    </div>
  </div>
</template>

<script setup>
const { locale } = useI18n();

const { data: playersData, pending: playersPending, error: playersError } = await useAsyncData(
  'stats-players', () => queryCollection('players').all().then(r => r || []).catch(() => [])
);
const { data: matchesData, pending: matchesPending } = await useAsyncData(
  'stats-matches', () => queryCollection('matches').where('status', '=', 'played').all().then(r => r || []).catch(() => [])
);
const { data: teamsData } = await useAsyncData(
  'stats-teams', () => queryCollection('teams').all().then(r => r || []).catch(() => [])
);

const pending = computed(() => playersPending.value || matchesPending.value);
const error = computed(() => playersError.value);
const players = computed(() => playersData.value || []);
const matches = computed(() => matchesData.value || []);
const teams = computed(() => teamsData.value || []);

const teamMap = computed(() => {
  const m = {};
  teams.value.forEach(t => { m[t.slug] = t; });
  return m;
});
const getTeamName = (slug) => teamMap.value[slug]?.title || slug;

// ── Top Scorers ────────────────────────────────────────────────────────────────
const topScorers = computed(() =>
  [...players.value]
    .filter(p => (p.goals || 0) > 0)
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))
    .slice(0, 10)
);

// ── MOTM Leaders ───────────────────────────────────────────────────────────────
const motmLeaders = computed(() => {
  const motmCount = {};
  matches.value.forEach(m => {
    if (m.motmWinner) {
      motmCount[m.motmWinner] = (motmCount[m.motmWinner] || 0) + 1;
    }
  });

  return players.value
    .map(p => ({ ...p, motmWins: motmCount[p.slug] || 0 }))
    .filter(p => p.motmWins > 0)
    .sort((a, b) => b.motmWins - a.motmWins)
    .slice(0, 5);
});

// ── Match Stats ────────────────────────────────────────────────────────────────
const totalGoals = computed(() =>
  matches.value.reduce((s, m) => s + (m.homeScore || 0) + (m.awayScore || 0), 0)
);

const avgGoals = computed(() =>
  matches.value.length ? (totalGoals.value / matches.value.length).toFixed(1) : '0'
);

const mostGoalsMatch = computed(() => {
  if (!matches.value.length) return null;
  return matches.value.reduce((best, m) => {
    const g = (m.homeScore || 0) + (m.awayScore || 0);
    return g > (best?.goals || 0) ? { ...m, goals: g } : best;
  }, null);
});

const cleanSheets = computed(() => {
  let count = 0;
  matches.value.forEach(m => {
    if (m.homeScore === 0) count++;
    if (m.awayScore === 0) count++;
  });
  return count;
});

const matchStats = computed(() => [
  {
    key: 'total', label: 'stats.totalMatches', icon: 'game-icons:soccer-ball',
    value: matches.value.length, color: 'primary',
  },
  {
    key: 'goals', label: 'stats.totalGoals', icon: 'mdi:bullseye-arrow',
    value: totalGoals.value, color: 'success',
  },
  {
    key: 'avg', label: 'stats.avgGoals', icon: 'mdi:chart-bar',
    value: avgGoals.value, color: 'info',
  },
  {
    key: 'clean', label: 'stats.cleanSheets', icon: 'mdi:shield-check-outline',
    value: cleanSheets.value, color: 'warning',
  },
]);

// ── Album ──────────────────────────────────────────────────────────────────────
const albumPhotos = computed(() => {
  const photos = [];
  matches.value.forEach(m => {
    if (m.photos?.length) {
      m.photos.forEach(p => photos.push(p));
    }
  });
  return photos;
});

const onImgError = (e) => {
  e.target.src = '/default-avatar.jpg'
  e.target.onerror = null
}

useSeoMeta({
  title: () => locale.value === 'ar' ? 'الإحصائيات | دوري القرية' : 'Stats | Village League',
});
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-bottom: calc(var(--bottom-nav-height) + 32px);
}

.container { padding-top: 20px; max-width: 860px; }

// ── Skeletons ──────────────────────────────────────────────────────────────────
.skeleton-wrap { display: flex; flex-direction: column; gap: 20px; }
.skeleton-section {
  height: 160px; border-radius: 16px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
  @keyframes sh { to { background-position: -200% 0; } }
}

// ── Sections ───────────────────────────────────────────────────────────────────
.section { margin-bottom: 28px; }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-count {
  background: var(--bg-elevated);
  color: var(--text-muted);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.75rem;
  font-weight: 700;
}

// ── Rank List ──────────────────────────────────────────────────────────────────
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--primary);
    background: var(--bg-elevated);
  }

  &.rank-0 { border-color: rgba(234,179,8,0.25); background: rgba(234,179,8,0.03); }
  &.rank-1 { border-color: rgba(148,163,184,0.25); background: rgba(148,163,184,0.03); }
  &.rank-2 { border-color: rgba(180,83,9,0.25); background: rgba(180,83,9,0.03); }
}

.rank-pos {
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.rank-num {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.medal {
  display: inline-flex;
  align-items: center;

  &.medal-gold .iconify { color: #ca8a04; }
  &.medal-silver .iconify { color: #94a3b8; }
  &.medal-bronze .iconify { color: #c2410c; }
}

.rank-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }

  &.small { width: 32px; height: 32px; }
}

.rank-initial {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--primary);
}

.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.rank-team {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.rank-stat {
  text-align: center;
}

.rank-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.rank-label {
  font-size: 0.65rem;
  color: var(--text-muted);
}

// ── Album ──────────────────────────────────────────────────────────────────────
.album-grid {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
}

@media (max-width: 576px) {
  .section { margin-bottom: 20px; }
}
</style>
