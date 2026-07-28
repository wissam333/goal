<template>
  <div>
    <template v-if="loading">
      <div class="page-skeleton">
        <div class="sk-title" />
        <div class="sk-row" />
        <div class="sk-row" />
        <div class="sk-table" />
      </div>
    </template>

    <template v-else-if="!season">
      <SharedUiFeedbackEmptyState
        title="الموسم غير موجود"
        icon="mdi:trophy-off-outline"
      />
    </template>

    <template v-else>
      <SharedUiHeaderPage
        :title="season.name"
        icon="mdi:trophy-outline"
        :is-rtl="true"
      />

      <!-- Champion -->
      <div v-if="snapshot.champion" class="champion-banner">
        <div class="champion-trophy"><Icon name="mdi:trophy" size="32" /></div>
        <div class="champion-info">
          <span class="champion-label">البطل</span>
          <span class="champion-name">{{ teamName(snapshot.champion) }}</span>
        </div>
        <div v-if="snapshot.runnerUp" class="runnerup-section">
          <span class="runnerup-label">الوصيف</span>
          <span class="runnerup-name">{{ teamName(snapshot.runnerUp) }}</span>
        </div>
      </div>

      <!-- Groups -->
      <div v-for="group in groups" :key="group" class="section-card">
        <h3 class="section-title">{{ $t('standings.group') }} {{ group }}</h3>

        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th class="th-team">الفريق</th>
              <th>ل</th><th>ف</th><th>ت</th><th>خ</th>
              <th>له</th><th>عليه</th><th>فارق</th>
              <th class="th-pts">نقاط</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in standings(group)" :key="s.slug">
              <td class="td-rank">{{ i + 1 }}</td>
              <td class="td-team">{{ s.title }}</td>
              <td class="td-num">{{ s.P }}</td>
              <td class="td-num">{{ s.W }}</td>
              <td class="td-num">{{ s.D }}</td>
              <td class="td-num">{{ s.L }}</td>
              <td class="td-num">{{ s.GF }}</td>
              <td class="td-num">{{ s.GA }}</td>
              <td class="td-num" :class="{ 'gd-pos': s.GD > 0, 'gd-neg': s.GD < 0 }">{{ s.GD > 0 ? '+' : '' }}{{ s.GD }}</td>
              <td class="td-pts">{{ s.Pts }}</td>
            </tr>
          </tbody>
        </table>

        <div class="group-matches">
          <div v-for="m in groupMatches(group)" :key="m.homeTeam + m.awayTeam" class="gm-row">
            <span class="gm-team">{{ teamName(m.homeTeam) }}</span>
            <span class="gm-score">{{ formatScore(m) }}</span>
            <span class="gm-team gm-team-away">{{ teamName(m.awayTeam) }}</span>
          </div>
          <div v-if="!groupMatches(group).length" class="gm-empty">لا توجد مباريات</div>
        </div>
      </div>

      <!-- Knockout -->
      <div v-if="knockoutMatches.length" class="section-card">
        <h3 class="section-title">الأدوار الإقصائية</h3>
        <div v-for="m in knockoutMatches" :key="m.homeTeam + m.awayTeam" class="ko-match">
          <div class="ko-teams">
            <span class="ko-team" :class="{ 'ko-winner': winner(m, m.homeTeam) }">{{ teamName(m.homeTeam) }}</span>
            <span class="ko-score">{{ formatScore(m) }}</span>
            <span class="ko-team" :class="{ 'ko-winner': winner(m, m.awayTeam) }">{{ teamName(m.awayTeam) }}</span>
          </div>
          <span class="ko-round-badge">{{ m.group }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabase()
const locale = useI18n().locale

const loading = ref(true)
const season = ref(null)
const snapshot = ref({ teams: [], matches: [], groups: [] })

const groups = computed(() => snapshot.value?.groups || [])
const groupTeams = computed(() => snapshot.value?.teams || [])
const groupMatchesArr = computed(() => snapshot.value?.matches || [])
const knockoutMatches = computed(() => groupMatchesArr.value.filter(m => ['QF', 'SF', 'FINAL'].includes(m.group)))

const { isTeamWinner, formatScore, getWinnerSlug, getOpenPlayScore, getTeamOutcome } = useMatchResult()
const teamName = (slug) => groupTeams.value.find(t => t.slug === slug)?.title || slug
const winner = (m, team) => isTeamWinner(m, team)

const groupMatches = (group) => groupMatchesArr.value.filter(m => m.group === group)

const standings = (group) => {
  const matches = groupMatches(group)
  const map = {}
  for (const t of groupTeams.value) {
    map[t.slug] = { slug: t.slug, title: t.title, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 }
  }
  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue
    const h = map[m.homeTeam]; const a = map[m.awayTeam]
    if (!h || !a) continue
    h.P++; a.P++
    const open = getOpenPlayScore(m)
    h.GF += open.home || 0; h.GA += open.away || 0
    a.GF += open.away || 0; a.GA += open.home || 0
    const w = getWinnerSlug(m)
    if (w === m.homeTeam) { h.W++; h.Pts += 3; a.L++ }
    else if (w === m.awayTeam) { a.W++; a.Pts += 3; h.L++ }
    else { h.D++; a.D++; h.Pts++; a.Pts++ }
  }
  return Object.values(map).map(s => ({ ...s, GD: s.GF - s.GA })).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

onMounted(async () => {
  if (!supabase) { loading.value = false; return }
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('slug', route.params.slug)
    .eq('league_id', (await supabase.from('leagues').select('id').eq('slug', route.params.league).maybeSingle()).data?.id)
    .maybeSingle()
  if (data) {
    season.value = data
    snapshot.value = data.snapshot || { teams: [], matches: [], groups: [] }
  }
  loading.value = false
})

useSeoMeta({
  title: () => season.value?.name || 'الموسم',
  ogTitle: () => season.value?.name || 'الموسم',
})
</script>

<style lang="scss" scoped>
.page-skeleton { display: flex; flex-direction: column; gap: 12px; padding-top: 20px; }
.sk-title { height: 28px; width: 200px; border-radius: 8px; background: var(--bg-elevated); }
.sk-row { height: 20px; border-radius: 6px; background: var(--bg-elevated); }
.sk-table { height: 160px; border-radius: 10px; background: var(--bg-elevated); }
.champion-banner {
  display: flex; align-items: center; gap: 16px;
  padding: 20px; border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff; margin-bottom: 16px;
}
.champion-trophy { flex-shrink: 0; }
.champion-info { flex: 1; }
.champion-label { font-size: 0.7rem; font-weight: 600; opacity: 0.8; text-transform: uppercase; }
.champion-name { display: block; font-size: 1.1rem; font-weight: 800; }
.runnerup-section { text-align: end; }
.runnerup-label { font-size: 0.7rem; font-weight: 600; opacity: 0.8; }
.runnerup-name { display: block; font-size: 0.9rem; font-weight: 700; }
.section-card {
  background: var(--bg-surface); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 16px; margin-bottom: 12px;
}
.section-title {
  font-size: 0.85rem; font-weight: 700; color: var(--text-primary);
  margin: 0 0 12px;
}
.standings-table {
  width: 100%; border-collapse: collapse; font-size: 0.75rem;
  th { padding: 6px 4px; text-align: center; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); white-space: nowrap; }
  td { padding: 6px 4px; text-align: center; border-bottom: 1px solid var(--border-color); }
  .th-team, .td-team { text-align: start; padding-inline-start: 8px; }
  .th-pts { color: var(--primary); }
  .td-pts { font-weight: 800; color: var(--primary); }
  .gd-pos { color: var(--primary); }
  .gd-neg { color: #ef4444; }
}
.group-matches { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
.gm-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; background: var(--bg-page); }
.gm-team { flex: 1; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
.gm-team-away { text-align: end; }
.gm-score { font-size: 0.85rem; font-weight: 800; color: var(--primary); white-space: nowrap; }
.gm-empty { font-size: 0.75rem; color: var(--text-muted); padding: 8px; text-align: center; }
.ko-match {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px; background: var(--bg-page); margin-bottom: 6px;
}
.ko-teams { flex: 1; display: flex; align-items: center; gap: 8px; }
.ko-team { flex: 1; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
.ko-winner { color: var(--primary); }
.ko-score { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; }
.ko-round-badge { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); padding: 2px 8px; border-radius: 999px; background: var(--bg-elevated); }
</style>
