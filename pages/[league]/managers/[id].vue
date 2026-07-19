<template>
  <div class="page-wrap">
    <div v-if="pending" class="skeleton-wrap">
      <div class="skeleton-hero" />
    </div>

    <SharedUiFeedbackEmptyState
      v-else-if="error || !manager"
      :title="$t('error.noData')"
      icon="mdi:account-tie-off-outline"
    />

    <template v-else>
      <div class="manager-hero">
        <button class="back-btn" @click="navigateTo(leaguePath('/teams'))">
          <Icon :name="locale === 'ar' ? 'mdi:arrow-right' : 'mdi:arrow-left'" size="18" />
          {{ $t('nav.teams') }}
        </button>

        <div class="hero-content">
          <div class="manager-avatar-large">
            <a v-if="manager.image" :href="manager.image" data-fancybox="manager-photo">
              <NuxtImg
                :src="manager.image"
                :alt="manager.name"
                width="120" height="120"
                format="webp"
              />
            </a>
            <span v-else class="avatar-initial">{{ manager.name?.charAt(0) }}</span>
          </div>
          <h1 class="manager-name">{{ manager.name }}</h1>
          <span v-if="manager.role" class="manager-role">{{ manager.role }}</span>
          <NuxtLink v-if="team" :to="leaguePath(`/teams/${team.slug}`)" class="manager-team">
            <Icon name="mdi:shield-outline" size="14" />
            {{ team.title }}
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const route = useRoute();
const { locale } = useI18n();
const { leaguePath } = useCurrentLeague();
const { fetchManager, fetchTeam } = useLeagueData();

const id = computed(() => Number(route.params.id));

const [
  { data: manager, pending, error },
  { data: team },
] = await Promise.all([
  useAsyncData(`manager-${id.value}`, () => fetchManager(id.value)),
  useAsyncData(`manager-team-${id.value}`, async () => {
    const m = await fetchManager(id.value);
    if (!m) return null;
    return fetchTeam(m.team_slug);
  }),
]);

useSeoMeta({
  title: () => manager.value?.name || 'Manager',
});
</script>

<style scoped>
.page-wrap { padding-bottom: calc(var(--bottom-nav-height) + 32px); }
.skeleton-wrap { padding: 24px; }
.skeleton-hero {
  height: 300px; border-radius: 20px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%; animation: sh 1.4s linear infinite;
}
@keyframes sh { to { background-position: -200% 0; } }

.manager-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 24px 32px;
  position: relative;
}
.back-btn {
  position: absolute; top: 16px; inset-inline-start: 16px;
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--bg-surface); border: 1px solid var(--border-color);
  border-radius: 10px; padding: 6px 12px;
  font-size: 0.82rem; font-weight: 600; color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--primary); color: var(--primary); }
}
.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.manager-avatar-large {
  width: 120px; height: 120px; border-radius: 50%;
  border: 3px solid var(--border-color);
  background: var(--bg-elevated);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-initial { font-size: 2.5rem; font-weight: 800; color: var(--primary); }
}
.manager-name { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.manager-role {
  display: inline-flex;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 999px;
  padding: 4px 14px;
  font-size: 0.85rem;
  font-weight: 700;
}
.manager-team {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  &:hover { color: var(--primary); }
}
</style>
