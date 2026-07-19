<template>
  <div>
    <SharedUiHeaderPage
      title="المواسم"
      icon="mdi:trophy-outline"
      :is-rtl="true"
    />

    <!-- ── Loading ── -->
    <template v-if="loading">
      <div class="sk-list">
        <div v-for="i in 3" :key="i" class="sk-row" />
      </div>
    </template>

    <!-- ── Detail View ── -->
    <template v-else-if="seasonDetail">
      <button class="back-btn" @click="seasonDetail = null">
        <Icon name="mdi:arrow-right" size="18" />
        العودة للمواسم
      </button>

      <!-- Header -->
      <div class="detail-header">
        <h2 class="detail-title">{{ seasonDetail.name }}</h2>
        <span class="detail-badge archived">مؤرشف</span>
      </div>

      <!-- Champion -->
      <div v-if="snapshot.champion" class="champion-banner">
        <div class="champion-trophy">
          <Icon name="mdi:trophy" size="32" />
        </div>
        <div class="champion-info">
          <span class="champion-label">البطل</span>
          <span class="champion-name">{{ getTeamName(snapshot.champion) }}</span>
        </div>
        <div v-if="snapshot.runnerUp" class="runnerup-info">
          <span class="runnerup-label">الوصيف</span>
          <span class="runnerup-name">{{ getTeamName(snapshot.runnerUp) }}</span>
        </div>
      </div>

      <!-- Groups -->
      <div v-for="group in groupsList" :key="group" class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:table" size="16" />
          {{ $t('standings.group') }} {{ group }}
        </h3>

        <!-- Teams in this group -->
        <div class="group-teams-list">
          <div v-for="t in getGroupTeams(group)" :key="t.slug" class="group-team-card">
            <span class="gt-title">{{ t.title }}</span>
            <div class="gt-players">
              <span v-for="p in t.players" :key="p" class="gt-player">{{ p }}</span>
              <span v-if="!t.players?.length" class="gt-player gt-player-empty">—</span>
            </div>
          </div>
        </div>

        <!-- Standings -->
        <table class="group-standings">
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
            <tr v-for="(s, i) in getGroupStandings(group)" :key="s.slug">
              <td class="td-rank">{{ i + 1 }}</td>
              <td class="td-team">{{ s.title }}</td>
              <td class="td-num">{{ s.P }}</td>
              <td class="td-num">{{ s.W }}</td>
              <td class="td-num">{{ s.D }}</td>
              <td class="td-num">{{ s.L }}</td>
              <td class="td-num">{{ s.GF }}</td>
              <td class="td-num">{{ s.GA }}</td>
              <td class="td-num" :class="gdClass(s.GD)">{{ s.GD > 0 ? '+' : '' }}{{ s.GD }}</td>
              <td class="td-pts">{{ s.Pts }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Match results -->
        <div class="group-matches">
          <div v-for="m in getGroupMatches(group)" :key="m.homeTeam + m.awayTeam" class="gm-row">
            <span class="gm-team">{{ getTeamName(m.homeTeam) }}</span>
            <span class="gm-score">{{ m.homeScore }}–{{ m.awayScore }}</span>
            <span class="gm-team gm-team-away">{{ getTeamName(m.awayTeam) }}</span>
          </div>
          <div v-if="!getGroupMatches(group).length" class="gm-empty">لا توجد مباريات</div>
        </div>
      </div>

      <!-- Knockout -->
      <div v-if="knockoutMatches.length" class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:trophy-outline" size="16" />
          الأدوار الإقصائية
        </h3>

        <div v-for="round in knockoutRounds" :key="round.key" class="ko-round">
          <div class="ko-round-label">
            <Icon name="mdi:chevron-double-down" size="14" />
            {{ round.label }}
          </div>
          <div class="ko-matches">
            <div v-for="m in round.matches" :key="m.homeTeam + m.awayTeam" class="ko-match">
              <div class="ko-teams">
                <div class="ko-team" :class="{ 'ko-win': isKnockoutWinner(m, m.homeTeam) }">
                  <span class="ko-name">{{ getTeamName(m.homeTeam) }}</span>
                  <span class="ko-score" :class="{ 'ko-score-win': isKnockoutWinner(m, m.homeTeam) }">{{ m.homeScore }}</span>
                </div>
                <div class="ko-team" :class="{ 'ko-win': isKnockoutWinner(m, m.awayTeam) }">
                  <span class="ko-score" :class="{ 'ko-score-win': isKnockoutWinner(m, m.awayTeam) }">{{ m.awayScore }}</span>
                  <span class="ko-name">{{ getTeamName(m.awayTeam) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── List View ── -->
    <template v-else>
      <button class="create-btn" @click="showCreateModal = true">
        <Icon name="mdi:plus-circle-outline" size="18" />
        بدء موسم جديد
      </button>

      <div class="table-card">
        <table class="seasons-table">
          <thead>
            <tr>
              <th>الموسم</th>
              <th>الحالة</th>
              <th>تاريخ البداية</th>
              <th>تاريخ الأرشفة</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in seasons" :key="s.id" class="s-row" @click="openSeason(s)">
              <td class="s-name">{{ s.name }}</td>
              <td>
                <span v-if="s.is_active" class="status-badge active">نشط</span>
                <span v-else class="status-badge archived">مؤرشف</span>
              </td>
              <td class="s-date">{{ formatDate(s.started_at) }}</td>
              <td class="s-date">{{ s.archived_at ? formatDate(s.archived_at) : '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!seasons.length" class="table-empty">
          <Icon name="mdi:trophy-off-outline" size="32" />
          <span>لا توجد مواسم</span>
        </div>
      </div>
    </template>

    <!-- ── Create Modal ── -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-card">
          <h3 class="modal-title">بدء موسم جديد</h3>
          <p class="modal-desc">سيتم أرشفة الموسم الحالي وحذف جميع بيانات المباريات واللاعبين والصور والتصويتات. لا يمكن التراجع عن هذا الإجراء.</p>

          <label class="modal-label">اسم الموسم الجديد</label>
          <input v-model="newSeasonName" class="modal-input" placeholder="مثال: صيف 2026" />

          <div class="modal-actions">
            <button class="modal-btn modal-btn-cancel" @click="showCreateModal = false">إلغاء</button>
            <button class="modal-btn modal-btn-confirm" :disabled="!newSeasonName.trim() || saving" @click="handleStartSeason">
              <Icon v-if="saving" name="mdi:loading" size="16" class="spin" />
              {{ saving ? 'جاري الأرشفة...' : 'تأكيد وبدء موسم جديد' }}
            </button>
          </div>
          <p v-if="errorMsg" class="modal-error">{{ errorMsg }}</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
definePageMeta({ layout: "admin-layer2" })
const { locale } = useI18n()
const seasonsApi = useSeasons()

const loading = ref(true)
const seasons = ref([])
const seasonDetail = ref(null)
const snapshot = ref(null)
const showCreateModal = ref(false)
const newSeasonName = ref("")
const saving = ref(false)
const errorMsg = ref("")

onMounted(async () => {
  seasons.value = await seasonsApi.getSeasons()
  loading.value = false
})

const openSeason = async (s) => {
  if (s.is_active) return
  const full = await seasonsApi.getSeason(s.slug)
  if (full) {
    seasonDetail.value = full
    snapshot.value = full.snapshot
  }
}

const groupsList = computed(() => snapshot.value?.groups || [])

const snapshotTeams = computed(() => snapshot.value?.teams || [])

const snapshotMatches = computed(() => snapshot.value?.matches || [])

const getTeamName = (slug) => {
  if (!slug) return ""
  const t = snapshotTeams.value.find(t => t.slug === slug)
  return t?.title || slug
}

const getGroupTeams = (group) =>
  snapshotTeams.value.filter(t => snapshotMatches.value.some(m => (m.homeTeam === t.slug || m.awayTeam === t.slug) && m.group === group))

const getGroupMatches = (group) =>
  snapshotMatches.value.filter(m => m.group === group)

const { calculateStandings } = useStandings()

const getGroupStandings = (group) => {
  const teams = getGroupTeams(group)
  const matches = getGroupMatches(group)
  return calculateStandings(teams, matches)
}

const gdClass = (gd) => (gd > 0 ? "gd-pos" : gd < 0 ? "gd-neg" : "")

const knockoutRounds = computed(() => {
  const rounds = []
  const groups = ["QF", "SF", "F"]
  const labels = { QF: "ربع النهائي", SF: "نصف النهائي", F: "النهائي" }
  for (const g of groups) {
    const matches = snapshotMatches.value.filter(m => m.group === g)
    if (matches.length) rounds.push({ key: g, label: labels[g], matches })
  }
  return rounds
})

const knockoutMatches = computed(() => snapshotMatches.value.filter(m => ["QF", "SF", "F"].includes(m.group)))

const isKnockoutWinner = (match, teamSlug) => {
  if (!match) return false
  const isHome = match.homeTeam === teamSlug
  const scored = isHome ? match.homeScore : match.awayScore
  const conceded = isHome ? match.awayScore : match.homeScore
  return (scored ?? 0) > (conceded ?? 0)
}

const formatDate = (d) => {
  if (!d) return ""
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString(locale.value === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })
  } catch { return d }
}

const handleStartSeason = async () => {
  if (!newSeasonName.value.trim()) return
  saving.value = true
  errorMsg.value = ""
  try {
    await seasonsApi.startNewSeason(newSeasonName.value.trim())
    showCreateModal.value = false
    newSeasonName.value = ""
    seasons.value = await seasonsApi.getSeasons()
  } catch (e) {
    errorMsg.value = e.message || "فشل بدء الموسم الجديد"
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
// ── Skeletons ──
.sk-list { display: flex; flex-direction: column; gap: 10px; }
.sk-row { height: 52px; border-radius: 10px; background: var(--bg-elevated); }

// ── Back button ──
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; margin-bottom: 16px;
  border: 1px solid var(--border-color); border-radius: 8px;
  background: var(--bg-surface); color: var(--text-muted);
  cursor: pointer; font-size: 0.8rem;
  transition: all 0.15s;
  &:hover { border-color: var(--primary); color: var(--primary); }
}

// ── Create button ──
.create-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; margin-bottom: 16px;
  border: none; border-radius: 10px;
  background: var(--primary); color: #fff;
  cursor: pointer; font-size: 0.85rem; font-weight: 600;
  transition: all 0.15s;
  &:hover { background: color-mix(in srgb, var(--primary) 85%, #000); }
}

// ── Seasons table ──
.table-card {
  background: var(--bg-surface); border-radius: 12px;
  border: 1px solid var(--border-color); overflow: hidden;
}
.seasons-table {
  width: 100%; border-collapse: collapse;
  th {
    padding: 10px 14px; font-size: 0.72rem; font-weight: 700;
    color: var(--text-muted); text-align: start;
    background: var(--bg-elevated); border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
  }
  td { padding: 10px 14px; font-size: 0.85rem; border-bottom: 1px solid var(--border-color); }
  tr:last-child td { border-bottom: none; }
}
.s-row {
  cursor: pointer; transition: background 0.12s;
  &:hover { background: var(--bg-elevated); }
}
.s-name { font-weight: 700; color: var(--text-primary); }
.s-date { color: var(--text-muted); font-size: 0.8rem; }
.status-badge {
  display: inline-flex; padding: 3px 10px; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700;
  &.active { background: var(--primary-soft); color: var(--primary); }
  &.archived { background: var(--bg-elevated); color: var(--text-muted); }
}
.table-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 32px; color: var(--text-muted);
}

// ── Detail header ──
.detail-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
}
.detail-title { font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.detail-badge {
  padding: 3px 12px; border-radius: 999px; font-size: 0.7rem; font-weight: 700;
  &.archived { background: var(--bg-elevated); color: var(--text-muted); }
}

// ── Champion banner ──
.champion-banner {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 24px; margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.02));
  border: 1px solid rgba(234,179,8,0.25);
  border-radius: 16px;
}
.champion-trophy { color: #ca8a04; flex-shrink: 0; }
.champion-info { flex: 1; }
.champion-label { display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px; }
.champion-name { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }
.runnerup-info { text-align: end; }
.runnerup-label { display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px; }
.runnerup-name { font-size: 0.95rem; font-weight: 700; color: var(--text-sub); }

// ── Section card ──
.section-card {
  background: var(--bg-surface); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 18px; margin-bottom: 16px;
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.9rem; font-weight: 700; color: var(--text-primary);
  margin: 0 0 14px;
}

// ── Group teams ──
.group-teams-list {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px; margin-bottom: 16px;
}
.group-team-card {
  padding: 10px 12px; border-radius: 10px;
  background: var(--bg-elevated); border: 1px solid var(--border-color);
}
.gt-title { display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.gt-players { display: flex; flex-direction: column; gap: 1px; }
.gt-player { font-size: 0.72rem; color: var(--text-muted); }
.gt-player-empty { color: var(--border-color); }

// ── Standings ──
.group-standings {
  width: 100%; border-collapse: collapse; margin-bottom: 12px;
  font-size: 0.8rem;
  th {
    padding: 6px 4px; font-size: 0.65rem; font-weight: 700;
    color: var(--text-muted); text-align: center;
    border-bottom: 1px solid var(--border-color);
  }
  th.th-team { text-align: right; }
  th.th-pts { color: var(--primary); }
  td { padding: 6px 4px; text-align: center; border-bottom: 1px solid var(--border-color); }
  td.td-rank { font-weight: 700; color: var(--text-muted); width: 24px; }
  td.td-num { font-weight: 600; color: var(--text-primary); }
  td.td-team { text-align: right; font-weight: 600; color: var(--text-primary); }
  td.td-pts { font-weight: 800; color: var(--primary); }
  tr:last-child td { border-bottom: none; }
}
.gd-pos { color: var(--success) !important; }
.gd-neg { color: var(--danger) !important; }

// ── Group matches ──
.group-matches {
  display: flex; flex-direction: column; gap: 4px;
  border-top: 1px solid var(--border-color); padding-top: 10px;
}
.gm-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 8px;
  background: var(--bg-elevated);
}
.gm-team { flex: 1; font-size: 0.78rem; font-weight: 600; color: var(--text-primary); text-align: end; }
.gm-team-away { text-align: start; }
.gm-score {
  flex-shrink: 0; font-weight: 800; font-size: 0.82rem;
  color: var(--primary); min-width: 36px; text-align: center;
}
.gm-empty { font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 8px; }

// ── Knockout ──
.ko-round { margin-bottom: 16px; }
.ko-round:last-child { margin-bottom: 0; }
.ko-round-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.72rem; font-weight: 800; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.ko-matches { display: flex; flex-direction: column; gap: 8px; }
.ko-match {
  background: var(--bg-elevated); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 8px 14px;
}
.ko-teams { display: flex; flex-direction: column; gap: 2px; }
.ko-team {
  display: flex; align-items: center; gap: 10px;
  padding: 4px 6px; border-radius: 6px;
  transition: background 0.12s;
  &.ko-win { background: var(--primary-soft); }
}
.ko-name {
  flex: 1; font-size: 0.82rem; font-weight: 600; color: var(--text-primary);
}
.ko-score {
  flex-shrink: 0; font-size: 0.85rem; font-weight: 700;
  color: var(--text-muted); min-width: 24px; text-align: center;
  &.ko-score-win { color: var(--primary); font-weight: 800; }
}

// ── Modal ──
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-card {
  background: var(--bg-surface); border-radius: 16px;
  padding: 24px; max-width: 440px; width: 100%;
}
.modal-title { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0 0 8px; }
.modal-desc { font-size: 0.82rem; color: var(--danger); margin: 0 0 16px; line-height: 1.5; }
.modal-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.modal-input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border-color);
  border-radius: 10px; font-size: 0.9rem; background: var(--bg-page);
  color: var(--text-primary); margin-bottom: 16px;
  &:focus { outline: none; border-color: var(--primary); }
}
.modal-actions { display: flex; gap: 10px; }
.modal-btn {
  flex: 1; padding: 10px 16px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  border: none; transition: all 0.15s;
}
.modal-btn-cancel { background: var(--bg-elevated); color: var(--text-muted); }
.modal-btn-confirm {
  background: var(--primary); color: #fff;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: color-mix(in srgb, var(--primary) 85%, #000); }
}
.modal-error { color: var(--danger); font-size: 0.8rem; margin-top: 10px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
