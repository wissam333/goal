<template>
  <div>
    <SharedUiHeaderPage
      title="لوحة التحكم"
      icon="mdi:view-dashboard-outline"
      :is-rtl="true"
    />

    <!-- Stats -->
    <SharedUiCardsStats
      v-if="!loading"
      :stats="dashboardStats"
      :columns="4"
      class="mb-4"
    />

    <!-- Quick actions -->
    <div v-if="!loading" class="quick-actions">
      <NuxtLink v-for="action in quickActions" :key="action.to" :to="action.to" class="qa-card">
        <div class="qa-icon" :style="{ background: action.color }">
          <Icon :name="action.icon" size="24" />
        </div>
        <div class="qa-info">
          <span class="qa-label">{{ action.label }}</span>
          <span class="qa-count">{{ action.count }}</span>
        </div>
      </NuxtLink>
    </div>

    <!-- Publish -->
    <div class="publish-section">
      <h3 class="section-title">نشر التغييرات</h3>
      <p class="publish-desc">بعد إجراء التعديلات، انقر لنشر التغييرات على الموقع</p>
      <div class="publish-row">
        <SharedUiFormBaseInput v-model="hookUrl" placeholder="رابط النشر من Vercel (اختياري)" size="sm" class="hook-input" />
        <SharedUiButtonBase
          variant="success"
          icon-left="mdi:rocket-launch"
          :loading="publishing"
          @click="handlePublish"
        >
          نشر
        </SharedUiButtonBase>
      </div>
      <span v-if="publishMsg" class="publish-msg" :class="{ error: publishError }">{{ publishMsg }}</span>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })
const admin = useAdminData()

const DEFAULT_HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_v2as9FW28UNLGCKsm3jKRhllC7H8/4RsaK5dU22"
const hookUrl = ref(import.meta.client ? localStorage.getItem("league_vercel_hook") || DEFAULT_HOOK : DEFAULT_HOOK)
const publishing = ref(false)
const publishMsg = ref("")
const publishError = ref(false)

const teams = ref([])
const players = ref([])
const matches = ref([])
const settings = ref(null)
const loading = ref(true)

onMounted(async () => {
  teams.value = await admin.getTeams()
  players.value = await admin.getPlayers()
  matches.value = await admin.getMatches()
  settings.value = await admin.getSettings()
  loading.value = false
})

const dashboardStats = computed(() => [
  { key: "teams", label: "الفرق", value: teams.value.length, icon: "mdi:shield-outline", color: "primary" },
  { key: "players", label: "اللاعبون", value: players.value.length, icon: "mdi:account-group-outline", color: "success" },
  { key: "matches", label: "المباريات", value: matches.value.length, icon: "mdi:calendar-outline", color: "warning" },
  { key: "played", label: "المُقامة", value: matches.value.filter(m => m.status === "played").length, icon: "mdi:check-circle-outline", color: "info" },
])

const quickActions = computed(() => [
  { to: "/admin/teams", icon: "mdi:shield-plus-outline", label: "إدارة الفرق", count: teams.value.length, color: "var(--primary)" },
  { to: "/admin/matches", icon: "mdi:calendar-plus-outline", label: "إدارة المباريات", count: matches.value.length, color: "#f97316" },
  { to: "/admin/settings", icon: "mdi:cog-outline", label: "الإعدادات", count: settings.value?.season || "2026", color: "#8b5cf6" },
])

const handlePublish = async () => {
  if (hookUrl.value) localStorage.setItem("league_vercel_hook", hookUrl.value)
  publishing.value = true
  publishMsg.value = ""
  publishError.value = false
  const result = await admin.publish()
  publishing.value = false
  if (result.error) {
    publishError.value = true
    publishMsg.value = result.error
  } else {
    publishMsg.value = "✅ تم بدء النشر بنجاح!"
  }
}
</script>

<style lang="scss" scoped>
/* page-wrap removed — layout provides container padding */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 28px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
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
  &:hover { border-color: var(--primary); transform: translateY(-1px); }
}
.qa-icon {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  color: #fff;
  flex-shrink: 0;
}
.qa-info { display: flex; flex-direction: column; gap: 2px; }
.qa-label { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
.qa-count { font-size: 1.3rem; font-weight: 700; color: var(--text-muted); }
.section-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
.publish-section {
  background: var(--bg-surface);
  border-radius: 14px;
  padding: 20px;
  border: 1px solid var(--border-color);
}
.publish-desc { font-size: 0.82rem; color: var(--text-muted); margin: 0 0 14px; }
.publish-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hook-input { flex: 1; }
.publish-msg {
  display: block;
  margin-top: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
  &.error { color: #ef4444; }
}
</style>
