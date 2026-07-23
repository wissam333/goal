<template>
  <div class="page-wrap">
    <div v-if="authLoading" class="loading-state">
      <Icon name="mdi:loading" size="32" class="spin" />
    </div>

    <template v-else-if="!user">
      <SharedUiFeedbackEmptyState
        title="يرجى تسجيل الدخول"
        icon="mdi:account-outline"
      />
    </template>

    <template v-else>
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar">
          <img
            v-if="profile?.avatar_url"
            :src="profile.avatar_url"
            :alt="displayName"
            width="80"
            height="80"
            loading="lazy"
          />
          <span v-else class="profile-initial">{{ displayName?.charAt(0) }}</span>
        </div>
        <h1 class="profile-name">{{ displayName }}</h1>
        <p class="profile-email">{{ user.email }}</p>
        <p class="profile-since">{{ $t('auth.memberSince') }} {{ memberSince }}</p>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-num">{{ predictions.length }}</span>
          <span class="stat-label">{{ $t('auth.predictions') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ votes.length }}</span>
          <span class="stat-label">{{ $t('auth.votes') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ profile?.prediction_points || 0 }}</span>
          <span class="stat-label">{{ $t('auth.points') }}</span>
        </div>
      </div>

      <!-- Predictions -->
      <div class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:chart-line" size="18" />
          {{ $t('auth.predictions') }}
        </h3>
        <div v-if="loadingPredictions" class="mini-loading">
          <Icon name="mdi:loading" size="20" class="spin" />
        </div>
        <div v-else-if="!predictions.length" class="empty-section">
          {{ $t('auth.noPredictionsYet') }}
        </div>
        <div v-else class="list-items">
          <div v-for="p in predictions" :key="p.match_slug + p.created_at" class="list-item">
            <NuxtLink :to="`/matches/${p.match_slug}`" class="list-link">
              <span class="list-match">{{ getMatchTitle(p.match_slug) }}</span>
              <span class="list-team">{{ getTeamName(p.team_slug) }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Votes -->
      <div class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:star-outline" size="18" />
          {{ $t('auth.votes') }}
        </h3>
        <div v-if="loadingVotes" class="mini-loading">
          <Icon name="mdi:loading" size="20" class="spin" />
        </div>
        <div v-else-if="!votes.length" class="empty-section">
          {{ $t('auth.noVotesYet') }}
        </div>
        <div v-else class="list-items">
          <div v-for="v in votes" :key="v.match_slug + v.created_at" class="list-item">
            <NuxtLink :to="`/matches/${v.match_slug}`" class="list-link">
              <span class="list-match">{{ getMatchTitle(v.match_slug) }}</span>
              <span class="list-team">{{ getPlayerName(v.player_slug) }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { format } from "date-fns"
import { syrianAr } from "~/utils/syrianAr"

const auth = useAuth()
const { t, locale } = useI18n()
const { name: appName } = useAppTitle()

const { user, profile, loading: authLoading } = auth
const { getUserVotes } = useVotes()
const { getUserPredictions } = useMatchPredictions()
import { MATCH_LIST_COLS } from '~/composables/useLeagueData'
const { fetchTeams, fetchMatches, fetchPlayers } = useLeagueData()

const predictions = ref([])
const votes = ref([])
const loadingPredictions = ref(true)
const loadingVotes = ref(true)

const teamsMap = ref({})
const matchesBySlug = ref({})
const playersMap = ref({})

const getTeamName = (slug) => teamsMap.value[slug]?.title || slug
const getPlayerName = (slug) => playersMap.value[slug]?.title || slug
const getMatchTitle = (slug) => {
  const m = matchesBySlug.value[slug]
  if (!m) return slug
  return `${getTeamName(m.homeTeam)} vs ${getTeamName(m.awayTeam)}`
}

const displayName = computed(() => {
  return profile.value?.display_name || user.value?.user_metadata?.full_name || user.value?.email || ""
})

const memberSince = computed(() => {
  if (!user.value?.created_at) return ""
  const d = new Date(user.value.created_at)
  if (locale.value === "ar") {
    return format(d, "MMMM yyyy", { locale: syrianAr })
  }
  return format(d, "MMMM yyyy")
})

onMounted(async () => {
  if (user.value) {
    const [allTeams, allMatches, allPlayers, userPredictions, userVotes] = await Promise.all([
      fetchTeams(),
      fetchMatches({ select: MATCH_LIST_COLS }),
      fetchPlayers(),
      getUserPredictions(),
      getUserVotes(),
    ])
    allTeams.forEach(t => teamsMap.value[t.slug] = t)
    allMatches.forEach(m => matchesBySlug.value[m.slug] = m)
    allPlayers.forEach(p => playersMap.value[p.slug] = p)
    predictions.value = userPredictions
    votes.value = userVotes
  }
  loadingPredictions.value = false
  loadingVotes.value = false
})

useSeoMeta({
  title: () => `${t('auth.myAccount')} | ${appName.name || t('leagueName')}`,
})
</script>

<style lang="scss" scoped>
.page-wrap {
  padding: 24px 20px calc(var(--bottom-nav-height) + 32px);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.profile-header {
  text-align: center;
  padding: 24px 0 20px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  overflow: hidden;
  border: 3px solid var(--primary-mid);
  img { width: 100%; height: 100%; object-fit: cover; }
}

.profile-initial {
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary);
}

.profile-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.profile-email {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 2px 0;
}

.profile-since {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 16px 12px;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.section-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.mini-loading {
  display: flex;
  justify-content: center;
  padding: 20px;
  color: var(--text-muted);
}

.empty-section {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 20px 0;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-item {
  border-radius: 10px;
  background: var(--bg-elevated);
  transition: all 0.1s;
  &:hover { background: var(--primary-soft); }
}

.list-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  text-decoration: none;
  color: var(--text-primary);
}

.list-match {
  font-size: 0.82rem;
  font-weight: 600;
}

.list-team {
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
