<template>
  <div>
    <SharedUiFeedbackAlert
      v-if="alert.show"
      v-model="alert.show"
      :type="alert.type"
      :title="alert.title"
      :message="alert.message"
      dismissible
      :duration="4000"
    />

    <div class="matches-actions">
      <SharedUiButtonBase
        variant="primary"
        icon-left="mdi:calendar-plus-outline"
        @click="openAddModal"
      >
        إضافة مباراة
      </SharedUiButtonBase>
    </div>

    <SharedUiTableDataTable
      :columns="matchColumns"
      :data="matchesDisplay"
      :loading="loading"
      :actions="matchActions"
      status-column-key="computedStatus"
      empty-text="لا توجد مباريات"
      empty-description="لم يتم إضافة أي مباريات بعد. أضف مباراة جديدة للبدء."
      empty-icon="mdi:calendar-remove"
      @action-click="handleMatchAction"
    >
      <template #cell-matchTitle="{ row }">
        <div class="d-flex align-items-center gap-1">
          <span class="team-label">{{ row.homeTitle }}</span>
          <span class="vs-text">vs</span>
          <span class="team-label">{{ row.awayTitle }}</span>
        </div>
      </template>
      <template #cell-group="{ value }">
        <span v-if="value === 'QF'" class="round-badge">ربع النهائي</span>
        <span v-else-if="value === 'SF'" class="round-badge">نصف النهائي</span>
        <span v-else-if="value === 'F'" class="round-badge final">النهائي</span>
        <span v-else class="round-badge group">المجموعة {{ value }}</span>
      </template>
      <template #cell-score="{ row }">
        <span v-if="row.computedStatus === 'played'" class="score-text">
          {{ row.homeScore }} - {{ row.awayScore }}
        </span>
        <span v-else class="text-muted">—</span>
      </template>
      <template #cell-date="{ value }">
        <span class="date-text">{{ formatDate(value) }}</span>
      </template>
      <template #cell-computedStatus="{ row }">
        <span class="status-dt" :class="row.computedStatus">{{ statusLabel(row.computedStatus) }}</span>
      </template>
    </SharedUiTableDataTable>

    <SharedUiDialogAppModal
      v-model="modalOpen"
      :title="editingMatch ? 'تعديل المباراة' : 'إضافة مباراة جديدة'"
      maxWidth="640px"
    >
      <form @submit.prevent="handleSave" class="modal-form">
        <div class="form-grid">
          <SharedUiFormBaseInput
            v-model="form.date"
            label="التاريخ"
            type="datetime-local"
          />
          <SharedUiFormBaseSelect
            v-model="form.group"
            label="الدور"
            :options="groupOptions"
            placeholder="اختر الدور"
          />
          <SharedUiFormBaseInput
            v-model="form.venue"
            label="الملعب"
            placeholder="الملعب الرئيسي"
          />
          <SharedUiFormBaseSelect
            v-model="form.homeTeam"
            label="الفريق المضيف"
            :options="filteredTeamOptions"
            placeholder="اختر الفريق"
          />
          <SharedUiFormBaseSelect
            v-model="form.awayTeam"
            label="الفريق الضيف"
            :options="filteredTeamOptions"
            placeholder="اختر الفريق"
          />
          <template v-if="form.date && isPastMatch(form.date)">
            <SharedUiFormBaseInput
              v-model="form.homeScore"
              label="نتيجة المضيف"
              type="number"
              placeholder="0"
            />
            <SharedUiFormBaseInput
              v-model="form.awayScore"
              label="نتيجة الضيف"
              type="number"
              placeholder="0"
            />
          </template>
          <template v-if="form.homeTeam && form.awayTeam">
            <div class="motm-field-wrap">
              <SharedUiFormBaseSelect
                v-model="form.motmWinner"
                label="أفضل لاعب (MOTM)"
                :options="motmPlayerOptions"
                placeholder="اختر أفضل لاعب"
                searchable
                clearable
              />
            </div>
          </template>
        </div>

        <div v-if="form.date && isPastMatch(form.date) && goalScorers.length" class="goal-scorers-section">
          <div class="goal-scorers-header">
            <span class="goal-title">مسجلو الأهداف</span>
            <span class="goal-hint">اختياري</span>
          </div>
          <div v-for="(gs, i) in goalScorers" :key="i" class="goal-scorer-row">
            <SharedUiFormBaseSelect
              v-model="gs.player"
              :options="goalScorerPlayerOptions"
              placeholder="اللاعب"
              searchable
              size="sm"
              @change="(val) => onPlayerSelect(i, val)"
            />
            <SharedUiFormBaseInput
              v-model="gs.minute"
              type="number"
              placeholder="دقيقة"
              size="sm"
            />
            <button class="goal-remove" type="button" @click="removeGoalScorer(i)" title="إزالة">
              <Icon name="mdi:close" size="14" />
            </button>
          </div>
        </div>
      </form>

      <template #actions>
        <SharedUiButtonBase
          variant="outline"
          @click="modalOpen = false"
        >
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ editingMatch ? 'حفظ التعديلات' : 'إضافة' }}
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="albumModal.open"
      :title="'ألبوم الصور: ' + (albumModal.match ? (albumModal.match.title || getMatchTitle(albumModal.match)) : '')"
      maxWidth="640px"
    >
      <div v-if="!albumModal.photos.length" class="album-empty">
        <Icon name="mdi:camera-off-outline" size="40" class="album-empty-icon" />
        <span>لا توجد صور في الألبوم</span>
      </div>

      <div v-else class="album-grid-admin">
        <div v-for="(photo, i) in albumModal.photos" :key="i" class="album-item-admin">
          <img :src="photo" alt="" class="album-img-admin" />
          <button class="album-remove-btn" @click="removeAlbumPhoto(i)" title="إزالة">
            <Icon name="mdi:close" size="16" />
          </button>
        </div>
      </div>

      <div class="album-actions-row">
        <SharedUiButtonBase
          variant="outline"
          icon-left="mdi:camera-plus-outline"
          @click="addAlbumPhoto"
        >
          إضافة صورة
        </SharedUiButtonBase>
      </div>

      <template #actions>
        <SharedUiButtonBase
          variant="outline"
          @click="albumModal.open = false"
        >
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          icon-left="mdi:content-save-outline"
          @click="saveAlbum"
        >
          حفظ الألبوم
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })

const admin = useAdminData()

const teams = ref([])
const players = ref([])
const matches = ref([])
const votesData = ref([])
const loading = ref(true)

const modalOpen = ref(false)
const editingMatch = ref(null)
const saving = ref(false)

const alert = reactive({ show: false, type: 'success', title: '', message: '' })

const computeStatus = (dateStr) => {
  if (!dateStr) return 'upcoming'
  const syriaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Damascus' })
  const now = new Date(syriaTime)
  const matchDate = new Date(dateStr)
  const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000)
  if (now > matchEnd) return 'played'
  if (now >= matchDate) return 'live'
  return 'upcoming'
}

const isPastMatch = (dateStr) => {
  return computeStatus(dateStr) === 'played'
}

const form = reactive({
  date: '',
  group: '',
  venue: 'الملعب الرئيسي',
  homeTeam: '',
  awayTeam: '',
  homeScore: null,
  awayScore: null,
  motmWinner: '',
})

const defaultForm = () => ({
  date: '',
  group: '',
  venue: 'الملعب الرئيسي',
  homeTeam: '',
  awayTeam: '',
  homeScore: null,
  awayScore: null,
  motmWinner: '',
})

const loadData = async () => {
  loading.value = true
  teams.value = await admin.getTeams()
  players.value = await admin.getPlayers()
  matches.value = await admin.getMatches()
  const s = await admin.getSettings()
  if (s?.groups?.length) settings.value.groups = [...s.groups]
  loading.value = false
}

onMounted(() => {
  loadData()
})

const goalScorers = ref([])

const loadVotes = async (matchSlug) => {
  if (!matchSlug) return
  const supabase = useSupabase()
  const { data } = await supabase.from("votes").select("player_slug").eq("match_slug", matchSlug)
  votesData.value = data || []
}

const adjustGoalScorers = () => {
  const total = (parseInt(form.homeScore) || 0) + (parseInt(form.awayScore) || 0)
  while (goalScorers.value.length < total) {
    goalScorers.value.push({ player: '', team: '', minute: '' })
  }
  if (goalScorers.value.length > total) {
    goalScorers.value.splice(total)
  }
}

const removeGoalScorer = (index) => {
  goalScorers.value.splice(index, 1)
}

const onPlayerSelect = (index, playerSlug) => {
  if (playerSlug) {
    const player = players.value.find(p => p.slug === playerSlug)
    goalScorers.value[index].team = player?.team || ''
  }
}

const syncPlayerGoals = async () => {
  const allMatches = await admin.getMatches()
  const goalCount = {}
  for (const m of allMatches) {
    if (m.goalScorers?.length) {
      for (const g of m.goalScorers) {
        if (g.player) {
          goalCount[g.player] = (goalCount[g.player] || 0) + 1
        }
      }
    }
  }
  for (const p of players.value) {
    const newGoals = goalCount[p.slug] || 0
    if (p.goals !== newGoals) {
      await admin.savePlayer({ ...p, goals: newGoals })
    }
  }
}

watch([() => form.homeScore, () => form.awayScore], adjustGoalScorers)

const goalScorerPlayerOptions = computed(() => {
  if (!form.homeTeam && !form.awayTeam) return []
  const home = teams.value.find(t => t.slug === form.homeTeam)
  const away = teams.value.find(t => t.slug === form.awayTeam)
  const homePlayers = players.value.filter(p => p.team === form.homeTeam)
  const awayPlayers = players.value.filter(p => p.team === form.awayTeam)
  return [
    {
      label: home?.title || form.homeTeam,
      options: homePlayers.map(p => ({
        label: `${p.title}${p.number ? ' (' + p.number + ')' : ''}`,
        value: p.slug,
      })),
    },
    {
      label: away?.title || form.awayTeam,
      options: awayPlayers.map(p => ({
        label: `${p.title}${p.number ? ' (' + p.number + ')' : ''}`,
        value: p.slug,
      })),
    },
  ]
})

onMounted(loadData)

const sortedMatches = computed(() => {
  return [...matches.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const matchesDisplay = computed(() =>
  sortedMatches.value.map(m => ({
    ...m,
    matchTitle: getMatchTitle(m),
    homeTitle: getTeamTitle(m.homeTeam),
    awayTitle: getTeamTitle(m.awayTeam),
    computedStatus: computeStatus(m.date),
  }))
)

const getMatchTitle = (match) => {
  const home = teams.value.find(t => t.slug === match.homeTeam)
  const away = teams.value.find(t => t.slug === match.awayTeam)
  if (!home || !away) return ''
  const prefix = match.group === 'QF' ? 'ربع النهائي: ' : match.group === 'SF' ? 'نصف النهائي: ' : match.group === 'F' ? 'النهائي: ' : ''
  return `${prefix}${home.title} vs ${away.title}`
}

const motmPlayerOptions = computed(() => {
  if (!form.homeTeam && !form.awayTeam) return []
  const voteCount = {}
  votesData.value.forEach(v => {
    voteCount[v.player_slug] = (voteCount[v.player_slug] || 0) + 1
  })
  const home = teams.value.find(t => t.slug === form.homeTeam)
  const away = teams.value.find(t => t.slug === form.awayTeam)
  const homePlayers = players.value.filter(p => p.team === form.homeTeam)
  const awayPlayers = players.value.filter(p => p.team === form.awayTeam)
  return [
    {
      label: home?.title || form.homeTeam,
      options: homePlayers.map(p => ({
        label: `${p.title} (${p.number})`,
        value: p.slug,
        badge: voteCount[p.slug] ? `${voteCount[p.slug]} صوت` : '0',
      })),
    },
    {
      label: away?.title || form.awayTeam,
      options: awayPlayers.map(p => ({
        label: `${p.title} (${p.number})`,
        value: p.slug,
        badge: voteCount[p.slug] ? `${voteCount[p.slug]} صوت` : '0',
      })),
    },
  ]
})

const settings = ref({ groups: ["A", "B"] })

const groupOptions = computed(() => {
  const groups = (settings.value.groups || ["A", "B"]).map(g => ({
    label: `المجموعة ${g}`,
    value: g,
  }))
  return [
    ...groups,
    { label: 'ربع النهائي', value: 'QF' },
    { label: 'نصف النهائي', value: 'SF' },
    { label: 'النهائي', value: 'F' },
  ]
})

function computeStandingsForGroup(group) {
  const groupTeams = teams.value.filter(t => t.group === group)
  if (!groupTeams.length) return []
  const table = {}
  groupTeams.forEach(t => { table[t.slug] = { slug: t.slug, pts: 0, gf: 0, ga: 0 } })
  const groupMatches = matches.value.filter(m => m.group === group && m.homeScore != null)
  for (const m of groupMatches) {
    const h = table[m.homeTeam]; const a = table[m.awayTeam]
    if (!h || !a) continue
    const hg = Number(m.homeScore); const ag = Number(m.awayScore)
    h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg
    if (hg > ag) { h.pts += 3 } else if (hg < ag) { a.pts += 3 } else { h.pts += 1; a.pts += 1 }
  }
  return Object.values(table).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga))
}

function getQualifiedTeams() {
  const groups = settings.value.groups || ['A', 'B']
  const slugs = []
  for (const g of groups) {
    const standings = computeStandingsForGroup(g)
    slugs.push(...standings.slice(0, 2).map(t => t.slug))
  }
  return slugs
}

function getStageWinners(stage) {
  return matches.value
    .filter(m => m.group === stage && m.homeScore != null)
    .map(m => Number(m.homeScore) > Number(m.awayScore) ? m.homeTeam : m.awayTeam)
}

function getStageParticipants(stage) {
  const set = new Set()
  for (const m of matches.value.filter(m => m.group === stage)) {
    set.add(m.homeTeam); set.add(m.awayTeam)
  }
  return [...set]
}

const filteredTeamOptions = computed(() => {
  if (!form.group) return teams.value.map(t => ({ label: t.title, value: t.slug }))

  const isGroupStage = !['QF', 'SF', 'F'].includes(form.group)
  if (isGroupStage) {
    return teams.value
      .filter(t => t.group === form.group)
      .map(t => ({ label: t.title, value: t.slug }))
  }

  let eligible = []
  if (form.group === 'QF') {
    eligible = getQualifiedTeams()
  } else if (form.group === 'SF') {
    const winners = getStageWinners('QF')
    eligible = winners.length ? winners : getStageParticipants('QF')
  } else if (form.group === 'F') {
    const winners = getStageWinners('SF')
    eligible = winners.length ? winners : getStageParticipants('SF')
  }

  const current = [form.homeTeam, form.awayTeam].filter(Boolean)
  return teams.value
    .filter(t => eligible.includes(t.slug) || current.includes(t.slug))
    .map(t => ({ label: t.title, value: t.slug }))
})

const matchColumns = [
  { key: 'matchTitle', label: 'المباراة', sortable: true },
  { key: 'group', label: 'الدور', align: 'center', width: '110px' },
  { key: 'score', label: 'النتيجة', align: 'center', width: '90px' },
  { key: 'date', label: 'التاريخ', sortable: true },
  { key: 'computedStatus', label: 'الحالة', align: 'center', width: '100px' },
]

const matchActions = [
  { key: 'album', icon: 'mdi:image-multiple-outline', label: 'الألبوم', class: 'btn-info' },
  { key: 'edit', icon: 'mdi:pencil-outline', label: 'تعديل', class: 'btn-warning' },
  { key: 'delete', icon: 'mdi:delete-outline', label: 'حذف', class: 'btn-danger' },
]

const albumModal = reactive({
  open: false,
  match: null,
  photos: [],
})

const handleMatchAction = ({ action, row }) => {
  if (action.key === 'album') openAlbumModal(row)
  else if (action.key === 'edit') openEditModal(row)
  else if (action.key === 'delete') confirmDelete(row)
}

const openAlbumModal = (row) => {
  const match = matches.value.find(m => m.slug === row.slug)
  if (!match) return
  albumModal.match = match
  albumModal.photos = [...(match.photos || [])]
  albumModal.open = true
}

const addAlbumPhoto = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const { compressAndEncode } = useImageCompression()
      const base64 = await compressAndEncode(file, { maxSizeMB: 1, maxWidthOrHeight: 1600 })
      albumModal.photos.push(base64)
    } catch {
      showAlert('error', 'خطأ', 'فشل ضغط الصورة')
    }
  }
  input.click()
}

const removeAlbumPhoto = (index) => {
  albumModal.photos.splice(index, 1)
}

const saveAlbum = async () => {
  if (!albumModal.match) return
  try {
    const match = { ...albumModal.match, photos: albumModal.photos }
    await admin.saveMatch(match)
    albumModal.open = false
    await loadData()
    showAlert('success', 'تم الحفظ', 'تم تحديث ألبوم الصور بنجاح')
  } catch {
    showAlert('error', 'خطأ', 'فشل حفظ الألبوم')
  }
}

const getTeamTitle = (slug) => {
  const team = teams.value.find(t => t.slug === slug)
  return team ? team.title : slug
}

const statusLabel = (status) => {
  const labels = { upcoming: 'قادمة', played: 'مُقامة', live: 'مباشر' }
  return labels[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const generateSlug = () => {
  const prefix = form.group === 'QF' ? 'qf' : form.group === 'SF' ? 'sf' : form.group === 'F' ? 'f' : `g${(form.group || 'a').toLowerCase()}`
  return `${prefix}-${form.homeTeam}-vs-${form.awayTeam}`
}

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingMatch.value = null
  votesData.value = []
  goalScorers.value = []
}

const openAddModal = () => {
  resetForm()
  modalOpen.value = true
}

const toLocalDateTimeStr = (iso) => {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const openEditModal = (match) => {
  editingMatch.value = match
  form.date = match.date ? toLocalDateTimeStr(match.date) : ''
  form.group = match.group
  form.venue = match.venue || 'الملعب الرئيسي'
  form.homeTeam = match.homeTeam
  form.awayTeam = match.awayTeam
  form.homeScore = match.homeScore
  form.awayScore = match.awayScore
  form.motmWinner = match.motmWinner || ''
  if (match.goalScorers?.length) {
    goalScorers.value = JSON.parse(JSON.stringify(match.goalScorers))
  } else {
    goalScorers.value = []
  }
  loadVotes(match.slug)
  modalOpen.value = true
}

const showAlert = (type, title, message) => {
  alert.type = type
  alert.title = title
  alert.message = message
  alert.show = true
}

const handleSave = async () => {
  if (!form.homeTeam || !form.awayTeam) {
    showAlert('error', 'خطأ', 'يرجى اختيار الفريق المضيف والفريق الضيف')
    return
  }
  if (form.homeTeam === form.awayTeam) {
    showAlert('error', 'خطأ', 'يجب أن يختلف الفريق المضيف عن الفريق الضيف')
    return
  }

  const matchDate = form.date ? new Date(form.date).toISOString() : null
  const matchStatus = computeStatus(matchDate)
  saving.value = true
  const matchObj = {
    slug: editingMatch.value?.slug || generateSlug(),
    title: generateTitle(),
    date: matchDate,
    group: form.group || 'A',
    venue: form.venue || 'الملعب الرئيسي',
    status: matchStatus,
    homeTeam: form.homeTeam,
    awayTeam: form.awayTeam,
    homeScore: matchStatus === 'played' ? Number(form.homeScore) : null,
    awayScore: matchStatus === 'played' ? Number(form.awayScore) : null,
    goalScorers: editingMatch.value?.goalScorers || [],
    motmWinner: form.motmWinner || null,
    photos: editingMatch.value?.photos || [],
  }

  // Override with edited goal scorers
  if (goalScorers.value.length) {
    matchObj.goalScorers = goalScorers.value.map(g => ({
      player: g.player,
      team: g.team,
      minute: g.minute ? Number(g.minute) : null,
    }))
  }

  try {
    await admin.saveMatch(matchObj)
    // Auto-update player goal stats from all matches
    await syncPlayerGoals()
    modalOpen.value = false
    await loadData()
    showAlert('success', 'تم الحفظ', editingMatch.value ? 'تم تحديث المباراة بنجاح' : 'تمت إضافة المباراة بنجاح')
  } catch {
    showAlert('error', 'خطأ', 'فشل حفظ المباراة')
  } finally {
    saving.value = false
  }
}

const generateTitle = () => {
  const home = teams.value.find(t => t.slug === form.homeTeam)
  const away = teams.value.find(t => t.slug === form.awayTeam)
  if (!home || !away) return ''
  const prefix = form.group === 'QF' ? 'ربع النهائي: ' : form.group === 'SF' ? 'نصف النهائي: ' : form.group === 'F' ? 'النهائي: ' : ''
  return `${prefix}${home.title} vs ${away.title}`
}

const confirmDelete = (match) => {
  if (!confirm(`هل أنت متأكد من حذف مباراة ${match.title || match.matchTitle}؟`)) return
  handleDelete(match)
}

const handleDelete = async (match) => {
  try {
    await admin.deleteMatch(match.slug)
    await loadData()
    showAlert('success', 'تم الحذف', 'تم حذف المباراة بنجاح')
  } catch {
    showAlert('error', 'خطأ', 'فشل حذف المباراة')
  }
}
</script>

<style lang="scss" scoped>
.matches-actions {
  margin-bottom: 20px;
}

.team-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.vs-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  margin: 0 2px;
}

.score-text {
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.date-text {
  font-size: 0.8rem;
  color: var(--text-sub);
  white-space: nowrap;
}

.round-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-muted);
  white-space: nowrap;

  &.final {
    background: rgba(234, 179, 8, 0.12);
    color: #ca8a04;
  }

  &.group {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
  }
}

.status-dt {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 99px;
  white-space: nowrap;
  display: inline-block;

  &.upcoming {
    background: rgba(37, 99, 235, 0.12);
    color: #2563eb;
  }
  &.played {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }
  &.live {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }
}

.modal-form {
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
}

.motm-field-wrap {
  grid-column: 1 / -1;
  margin-top: 8px;
}

.text-muted {
  color: var(--text-muted);
}

.album-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 16px;
  color: var(--text-muted);
}

.album-empty-icon {
  opacity: 0.4;
}

.album-grid-admin {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.album-item-admin {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--border-color);
}

.album-img-admin {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.album-remove-btn {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.album-remove-btn:hover {
  background: rgba(239,68,68,0.85);
}

.album-actions-row {
  display: flex;
  gap: 10px;
}

.goal-scorers-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-scorers-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.goal-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.goal-scorer-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-scorer-row > :first-child {
  flex: 1;
}

.goal-scorer-row > :nth-child(2) {
  width: 90px;
  flex-shrink: 0;
}

.goal-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 0.15s;
}

.goal-remove:hover {
  background: rgba(239,68,68,0.1);
  color: #ef4444;
  border-color: #ef4444;
}
</style>
