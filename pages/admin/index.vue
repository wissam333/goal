<template>
  <div>
    <SharedUiHeaderPage
      title="لوحة التحكم"
      icon="mdi:view-dashboard-outline"
      :is-rtl="true"
    />

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="sk-stats">
        <div v-for="i in 4" :key="i" class="sk-stat" />
      </div>
      <div class="sk-actions">
        <div v-for="i in 3" :key="i" class="sk-action" />
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <SharedUiCardsStats
        :stats="dashboardStats"
        :columns="4"
        class="mb-4"
      />
      <div class="quick-actions">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="qa-card"
        >
          <div class="qa-icon" :style="{ background: action.color }">
            <Icon :name="action.icon" size="24" />
          </div>
          <div class="qa-info">
            <span class="qa-label">{{ action.label }}</span>
            <span class="qa-count">{{ action.count }}</span>
          </div>
        </NuxtLink>
      </div>

    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: "admin" });
const admin = useAdminData();

const teams = ref([]);
const players = ref([]);
const matches = ref([]);
const settings = ref(null);
const loading = ref(true);

onMounted(async () => {
  teams.value = await admin.getTeams();
  players.value = await admin.getPlayers();
  matches.value = await admin.getMatches();
  settings.value = await admin.getSettings();
  loading.value = false;
});

const dashboardStats = computed(() => [
  {
    key: "teams",
    label: "الفرق",
    value: teams.value.length,
    icon: "mdi:shield-outline",
    color: "primary",
  },
  {
    key: "players",
    label: "اللاعبون",
    value: players.value.length,
    icon: "mdi:account-group-outline",
    color: "success",
  },
  {
    key: "matches",
    label: "المباريات",
    value: matches.value.length,
    icon: "mdi:calendar-outline",
    color: "warning",
  },
  {
    key: "played",
    label: "المُقامة",
    value: matches.value.filter((m) => m.status === "played").length,
    icon: "mdi:check-circle-outline",
    color: "info",
  },
]);

const quickActions = computed(() => [
  {
    to: "/admin/teams",
    icon: "mdi:shield-plus-outline",
    label: "إدارة الفرق",
    count: teams.value.length,
    color: "var(--primary)",
  },
  {
    to: "/admin/matches",
    icon: "mdi:calendar-plus-outline",
    label: "إدارة المباريات",
    count: matches.value.length,
    color: "#f97316",
  },
  {
    to: "/admin/settings",
    icon: "mdi:cog-outline",
    label: "الإعدادات",
    count: settings.value?.season || "2026",
    color: "#8b5cf6",
  },
]);

</script>

<style lang="scss" scoped>
/* page-wrap removed — layout provides container padding */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 28px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}
.qa-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: var(--bg-surface);
  border-radius: 14px;
  text-decoration: none;
  border: 1px solid var(--border-color);
  transition: all 0.15s;
  &:hover {
    border-color: var(--primary);
    transform: translateY(-1px);
  }
}
.qa-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #fff;
  flex-shrink: 0;
}
.qa-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.qa-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}
.qa-count {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-muted);
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
.sk-stats,
.sk-actions {
  display: grid;
  gap: 12px;
}
.sk-stats { grid-template-columns: repeat(4, 1fr); margin-bottom: 24px; }
.sk-actions { grid-template-columns: repeat(2, 1fr); margin-bottom: 28px; }
.sk-stat,
.sk-action {
  background: var(--bg-elevated);
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}
.sk-stat { height: 100px; }
.sk-action { height: 84px; }
.sk-stat::after,
.sk-action::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    transparent 0,
    rgba(255 255 255 / 0.08) 20%,
    rgba(255 255 255 / 0.15) 60%,
    transparent
  );
  animation: sk-shimmer 1.8s infinite;
}
@keyframes sk-shimmer {
  100% { transform: translateX(100%); }
}
@media (max-width: 480px) {
  .sk-stats { grid-template-columns: repeat(2, 1fr); }
  .sk-actions { grid-template-columns: 1fr; }
}
</style>
