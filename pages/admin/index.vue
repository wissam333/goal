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
      <SharedUiCardsStats :stats="dashboardStats" :columns="4" class="mb-4" />
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

      <!-- ── Teams Standings ─────────────────────────────── -->
      <div class="section-header">
        <h3 class="section-title">
          <Icon name="mdi:shield-outline" size="18" />
          ترتيب الفرق
        </h3>
        <div class="section-controls">
          <select v-model="groupFilter" class="group-filter-select">
            <option value="">جميع المجموعات</option>
            <option v-for="g in groupOptions" :key="g" :value="g">
              المجموعة {{ g }}
            </option>
          </select>
        </div>
      </div>

      <div class="table-card">
        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th class="th-team">الفريق</th>
              <th>ل</th>
              <th>ف</th>
              <th>ت</th>
              <th>خ</th>
              <th>له</th>
              <th>عليه</th>
              <th>فارق</th>
              <th class="th-pts">نقاط</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in sortedTeams" :key="t.slug">
              <td class="td-rank">{{ i + 1 }}</td>
              <td class="td-team">
                <div class="td-team-inner">
                  <NuxtImg
                    v-if="t.logo"
                    :src="t.logo"
                    :alt="t.title"
                    width="22"
                    height="22"
                    class="td-logo"
                  />
                  <span
                    v-else
                    class="td-logo-init"
                    :style="{ background: t.color }"
                    >{{ t.title?.charAt(0) }}</span
                  >
                  <span class="td-name">{{ t.title }}</span>
                </div>
              </td>
              <td class="td-num">{{ t.stats.P }}</td>
              <td class="td-num">{{ t.stats.W }}</td>
              <td class="td-num">{{ t.stats.D }}</td>
              <td class="td-num">{{ t.stats.L }}</td>
              <td class="td-num">{{ t.stats.GF }}</td>
              <td class="td-num">{{ t.stats.GA }}</td>
              <td class="td-num" :class="gdClass(t.stats.GD)">
                {{ t.stats.GD > 0 ? "+" : "" }}{{ t.stats.GD }}
              </td>
              <td class="td-pts">{{ t.stats.Pts }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!sortedTeams.length" class="table-empty">
          <Icon name="mdi:shield-off-outline" size="32" />
          <span>لا توجد فرق</span>
        </div>
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
const groupFilter = ref("");
const groupOptions = ref([]);

onMounted(async () => {
  teams.value = await admin.getTeams();
  players.value = await admin.getPlayers();
  matches.value = await admin.getMatches();
  settings.value = await admin.getSettings();
  groupOptions.value = settings.value?.groups || [];
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

const standings = computed(() => {
  const m = matches.value.filter((x) => x.status === "played");
  const map = {};
  for (const t of teams.value) {
    map[t.slug] = { W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0, P: 0 };
  }
  for (const match of m) {
    if (!map[match.homeTeam] || !map[match.awayTeam]) continue;
    const hg = match.homeScore ?? 0;
    const ag = match.awayScore ?? 0;
    if (hg > ag) {
      map[match.homeTeam].W++;
      map[match.homeTeam].Pts += 3;
      map[match.awayTeam].L++;
    } else if (hg < ag) {
      map[match.awayTeam].W++;
      map[match.awayTeam].Pts += 3;
      map[match.homeTeam].L++;
    } else {
      map[match.homeTeam].D++;
      map[match.awayTeam].D++;
      map[match.homeTeam].Pts++;
      map[match.awayTeam].Pts++;
    }
    map[match.homeTeam].GF += hg;
    map[match.homeTeam].GA += ag;
    map[match.awayTeam].GF += ag;
    map[match.awayTeam].GA += hg;
  }
  for (const s of Object.values(map)) {
    s.P = s.W + s.D + s.L;
    s.GD = s.GF - s.GA;
  }
  return map;
});

const sortedTeams = computed(() => {
  const filtered = groupFilter.value
    ? teams.value.filter((t) => t.group === groupFilter.value)
    : teams.value;
  return [...filtered]
    .map((t) => ({
      ...t,
      stats: standings.value[t.slug] || {
        P: 0,
        W: 0,
        D: 0,
        L: 0,
        GF: 0,
        GA: 0,
        GD: 0,
        Pts: 0,
      },
    }))
    .sort(
      (a, b) =>
        b.stats.Pts - a.stats.Pts ||
        b.stats.GD - a.stats.GD ||
        b.stats.GF - a.stats.GF ||
        a.title?.localeCompare(b.title),
    );
});

const gdClass = (gd) => (gd > 0 ? "gd-pos" : gd < 0 ? "gd-neg" : "");
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
.sk-stats {
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 24px;
}
.sk-actions {
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 28px;
}
.sk-stat,
.sk-action {
  background: var(--bg-elevated);
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}
.sk-stat {
  height: 100px;
}
.sk-action {
  height: 84px;
}
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
  100% {
    transform: translateX(100%);
  }
}
@media (max-width: 480px) {
  .sk-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .sk-actions {
    grid-template-columns: 1fr;
  }
}

// ── Standings Table ────────────────────────────────────────────────────────────
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
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
.section-controls {
  display: flex;
  gap: 8px;
}
.group-filter-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}
.table-card {
  background: var(--bg-surface);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-bottom: 24px;
}
.standings-table {
  width: 100%;
  border-collapse: collapse;
  th {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    padding: 10px 6px;
    text-align: center;
    white-space: nowrap;
    border-bottom: 1px solid var(--border-color);
    user-select: none;
  }
  th.th-team {
    text-align: right;
  }
  th.th-pts {
    color: var(--primary);
  }
  td {
    padding: 10px 6px;
    font-size: 0.85rem;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
  }
  td.td-rank {
    font-weight: 700;
    color: var(--text-muted);
    width: 28px;
  }
  td.td-team {
    text-align: right;
    min-width: 140px;
  }
  .td-team-inner {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .td-logo,
  .td-logo-init {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .td-logo-init {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
  }
  .td-name {
    font-weight: 600;
    color: var(--text-primary);
  }
  .td-num {
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
  td.td-pts {
    font-weight: 800;
    color: var(--primary);
    font-size: 0.95rem;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:hover {
    background: var(--bg-hover);
  }
}
.gd-pos {
  color: var(--success) !important;
}
.gd-neg {
  color: var(--danger) !important;
}
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--text-muted);
}
</style>
