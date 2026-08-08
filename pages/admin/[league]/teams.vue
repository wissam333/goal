<template>
  <div>
    <SharedUiFeedbackAlert
      v-if="alert.visible"
      v-model="alert.visible"
      :type="alert.type"
      :message="alert.text"
      dismissible
      :duration="4000"
    />

    <SharedUiHeaderPage
      title="الفرق"
      subtitle="إدارة فرق الدوري"
      icon="mdi:shield-outline"
      :is-rtl="true"
    >
      <template #actions>
        <SharedUiButtonBase
          variant="primary"
          icon-left="mdi:shield-plus-outline"
          @click="openAddModal"
        >
          إضافة فريق
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="outline"
          icon-left="mdi:archive-arrow-up-outline"
          @click="openRestoreModal"
        >
          استعادة من الأرشيف
        </SharedUiButtonBase>
      </template>
    </SharedUiHeaderPage>

    <SharedUiTableDataTable
      :columns="teamColumns"
      :data="teams"
      :loading="loading"
      :actions="teamActions"
      status-column-key="group"
      empty-text="لا توجد فرق"
      empty-description="لم تتم إضافة أي فرق بعد. انقر فوق إضافة فريق لإنشاء أول فريق."
      empty-icon="mdi:shield-off-outline"
      @action-click="handleTeamAction"
    >
      <template #cell-title="{ row }">
        <div class="d-flex align-items-center gap-2">
          <NuxtImg
            v-if="row.logo && !logoErrors.has(row.slug)"
            :src="row.logo"
            :alt="row.title"
            class="team-logo-sm"
            width="32"
            height="32"
            @error="logoErrors.add(row.slug)"
          />
          <div
            v-else
            class="team-avatar-sm"
            :style="{ background: row.color }"
          >
            {{ row.title?.charAt(0) }}
          </div>
          <span class="team-name-text">{{ row.title }}</span>
          <span v-if="row.is_struck" class="struck-badge">مشطوب</span>
        </div>
      </template>
      <template #cell-group="{ row, value }">
        <span
          class="group-badge-dt"
          :style="{ background: row.color + '22', color: row.color }"
        >
          {{ value || '-' }}
        </span>
      </template>
    </SharedUiTableDataTable>

    <SharedUiDialogAppModal
      v-model="modal.open"
      :title="modal.isEdit ? 'تعديل فريق' : 'إضافة فريق'"
      max-width="520px"
    >
      <div class="form-grid">
        <AdminImageUpload
          v-model="form.logo"
          label="شعار الفريق"
          :upload="uploadTeamLogo"
        />
        <SharedUiFormBaseInput
          v-model="form.title"
          label="الاسم"
          placeholder="اسم الفريق"
          required
          :error="formErrors.title"
        />
        <SharedUiFormBaseInput
          v-model="form.slug"
          label="الرمز"
          placeholder="slug-team"
          hint="يُملأ تلقائياً من الاسم"
          @focus="slugManuallyEdited = true"
          @input="slugManuallyEdited = true"
        />
        <div class="form-color-group">
          <label class="form-color-label">اللون</label>
          <input
            v-model="form.color"
            type="color"
            class="color-picker"
          />
        </div>
        <SharedUiFormBaseSelect
          v-model="form.group"
          label="المجموعة"
          :options="groupOptions"
          placeholder="اختر المجموعة"
        />
      </div>

      <template #actions>
        <SharedUiButtonBase
          variant="outline"
          @click="modal.open = false"
        >
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          :loading="modal.saving"
          :disabled="modal.saving"
          @click="handleSave"
        >
          {{ modal.isEdit ? 'حفظ التغييرات' : 'إضافة' }}
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="deleteConfirm.open"
      title="تأكيد الحذف"
      max-width="420px"
    >
      <p class="delete-msg">
        هل أنت متأكد من حذف فريق
        <strong>{{ deleteConfirm.team?.title }}</strong>؟
        <br>لا يمكن التراجع عن هذا الإجراء.
      </p>

      <template #actions>
        <SharedUiButtonBase
          variant="outline"
          @click="deleteConfirm.open = false"
        >
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="error"
          :loading="deleteConfirm.deleting"
          :disabled="deleteConfirm.deleting"
          @click="handleDelete"
        >
          حذف
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="strikeConfirm.open"
      :title="strikeConfirm.team?.is_struck ? 'تأكيد إلغاء الشطب' : 'تأكيد الشطب'"
      max-width="420px"
    >
      <p class="delete-msg">
        <template v-if="strikeConfirm.team?.is_struck">
          هل أنت متأكد من إلغاء شطب
          <strong>{{ strikeConfirm.team?.title }}</strong>؟
          <br>ستُحتسب نتائجه في الترتيب من جديد.
        </template>
        <template v-else>
          هل أنت متأكد من شطب
          <strong>{{ strikeConfirm.team?.title }}</strong>؟
          <br>لن تُحتسب نتائجه في الترتيب، وتُعامل المجموعة كأنها منقوصة من فريق.
        </template>
      </p>

      <template #actions>
        <SharedUiButtonBase
          variant="outline"
          @click="strikeConfirm.open = false"
        >
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="error"
          :loading="strikeConfirm.saving"
          :disabled="strikeConfirm.saving"
          @click="handleToggleStrike"
        >
          {{ strikeConfirm.team?.is_struck ? 'إلغاء الشطب' : 'شطب' }}
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="playersModal.open"
      :title="'لاعبو ' + (playersModal.team?.title || '')"
      max-width="560px"
    >
      <div class="players-modal-header">
        <SharedUiButtonBase
          variant="primary"
          size="sm"
          icon-left="mdi:account-plus-outline"
          @click="openPlayerAdd"
        >
          إضافة لاعب
        </SharedUiButtonBase>
      </div>

      <div v-if="playersModal.loading" class="modal-loading">جاري التحميل...</div>
      <SharedUiFeedbackEmptyState
        v-else-if="!playersModal.players.length"
        title="لا يوجد لاعبون"
        description="لم يتم إضافة أي لاعبين لهذا الفريق بعد."
        icon="mdi:account-group-outline"
      />
      <div v-else class="player-list">
        <div v-for="p in playersModal.players" :key="p.slug" class="player-item">
          <div class="player-num" :style="{ background: playersModal.team?.color + '22', color: playersModal.team?.color }">
            {{ p.number || '-' }}
          </div>
          <div class="player-info">
            <span class="player-name">
              {{ p.title }}
              <span v-if="p.captain" class="captain-badge" title="قائد الفريق">👑</span>
            </span>
            <span class="player-position">{{ p.position || '-' }}</span>
          </div>
          <div class="player-stats">
            <span class="stat-badge" title="الأهداف">
              <Icon name="mdi:soccer" size="14" /> {{ p.goals || 0 }}
            </span>
          </div>
          <div class="player-item-actions">
            <button class="player-action-btn edit" title="تعديل" @click="openPlayerEdit(p)">
              <Icon name="mdi:pencil-outline" size="16" />
            </button>
            <button class="player-action-btn delete" title="حذف" @click="confirmPlayerDelete(p)">
              <Icon name="mdi:delete-outline" size="16" />
            </button>
          </div>
        </div>
      </div>

      <template #actions>
        <SharedUiButtonBase variant="outline" @click="playersModal.open = false">
          إغلاق
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="playerForm.open"
      :title="playerForm.isEdit ? 'تعديل لاعب' : 'إضافة لاعب'"
      max-width="520px"
    >
      <div class="form-grid">
        <AdminImageUpload
          v-model="playerForm.photo"
          label="صورة اللاعب"
          :upload="uploadPlayerPhoto"
        />
        <SharedUiFormBaseInput
          v-model="playerForm.title"
          label="الاسم"
          placeholder="أدخل اسم اللاعب"
          required
        />
        <SharedUiFormBaseSelect
          v-model="playerForm.team"
          label="الفريق"
          :options="teamOptionsForPlayers"
          placeholder="اختر الفريق"
        />
        <SharedUiFormBaseInput
          v-model="playerForm.number"
          label="الرقم"
          type="number"
          placeholder="رقم القميص"
        />
        <SharedUiFormBaseSelect
          v-model="playerForm.position"
          label="المركز"
          :options="positions"
          placeholder="اختر المركز"
        />
        <SharedUiFormBaseInput
          v-model="playerForm.goals"
          label="الأهداف"
          type="number"
          placeholder="0"
        />
        <label class="captain-toggle">
          <input v-model="playerForm.captain" type="checkbox" />
          <span>قائد الفريق (كابتن)</span>
        </label>
      </div>
      <template #actions>
        <SharedUiButtonBase variant="neutral" ghost @click="playerForm.open = false">
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          :disabled="!playerForm.title.trim()"
          :loading="playerForm.saving"
          @click="handlePlayerSave"
        >
          {{ playerForm.isEdit ? 'حفظ التعديلات' : 'إضافة' }}
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="playerDelete.open"
      title="حذف لاعب"
      max-width="400px"
    >
      <p class="delete-msg">هل أنت متأكد من حذف اللاعب <strong>{{ playerDelete.player?.title }}</strong>؟</p>
      <template #actions>
        <SharedUiButtonBase variant="neutral" ghost @click="playerDelete.open = false">
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase variant="error" :loading="playerDelete.deleting" @click="handlePlayerDelete">
          حذف
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="managersModal.open"
      :title="'الإداريون - ' + (managersModal.team?.title || '')"
      max-width="560px"
    >
      <div class="players-modal-header">
        <SharedUiButtonBase
          variant="primary"
          size="sm"
          icon-left="mdi:account-plus-outline"
          @click="openManagerAdd"
        >
          إضافة إداري
        </SharedUiButtonBase>
      </div>

      <div v-if="managersModal.loading" class="modal-loading">جاري التحميل...</div>
      <SharedUiFeedbackEmptyState
        v-else-if="!managersModal.managers.length"
        title="لا يوجد إداريون"
        description="لم تتم إضافة أي إداريين لهذا الفريق بعد."
        icon="mdi:account-tie-outline"
      />
      <div v-else class="player-list">
        <div v-for="m in managersModal.managers" :key="m.id" class="player-item">
          <div class="player-info">
            <span class="player-name">{{ m.name }}</span>
            <span v-if="m.role" class="player-position">{{ m.role }}</span>
          </div>
          <div class="player-item-actions">
            <button class="player-action-btn edit" title="تعديل" @click="openManagerEdit(m)">
              <Icon name="mdi:pencil-outline" size="16" />
            </button>
            <button class="player-action-btn delete" title="حذف" @click="confirmManagerDelete(m)">
              <Icon name="mdi:delete-outline" size="16" />
            </button>
          </div>
        </div>
      </div>

      <template #actions>
        <SharedUiButtonBase variant="outline" @click="managersModal.open = false">
          إغلاق
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="managerForm.open"
      :title="managerForm.isEdit ? 'تعديل إداري' : 'إضافة إداري'"
      max-width="520px"
    >
      <div class="form-grid">
        <AdminImageUpload
          v-model="managerForm.image"
          label="صورة الإداري"
          :upload="uploadManagerPhoto"
        />
        <SharedUiFormBaseInput
          v-model="managerForm.name"
          label="الاسم"
          placeholder="أدخل اسم الإداري"
          required
        />
        <SharedUiFormBaseSelect
          v-model="managerForm.role"
          label="المسمى"
          :options="managerRoles"
          placeholder="اختر المسمى (اختياري)"
          clearable
        />
      </div>
      <template #actions>
        <SharedUiButtonBase variant="neutral" ghost @click="managerForm.open = false">
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          :disabled="!managerForm.name.trim()"
          :loading="managerForm.saving"
          @click="handleManagerSave"
        >
          {{ managerForm.isEdit ? 'حفظ التعديلات' : 'إضافة' }}
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="managerDelete.open"
      title="حذف إداري"
      max-width="400px"
    >
      <p class="delete-msg">هل أنت متأكد من حذف الإداري <strong>{{ managerDelete.manager?.name }}</strong>؟</p>
      <template #actions>
        <SharedUiButtonBase variant="neutral" ghost @click="managerDelete.open = false">
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase variant="error" :loading="managerDelete.deleting" @click="handleManagerDelete">
          حذف
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="restoreModal.open"
      title="استعادة فريق من الأرشيف"
      max-width="640px"
    >
      <div v-if="restoreModal.loading" class="modal-loading">جاري تحميل الأرشيف...</div>
      <template v-else-if="!restoreModal.seasons?.length">
        <SharedUiFeedbackEmptyState
          title="لا توجد مواسم مؤرشفة"
          description="قم بأرشفة موسم أولاً من صفحة المواسم."
          icon="mdi:archive-off-outline"
        />
      </template>
      <div v-else class="restore-list">
        <div v-for="season in restoreModal.seasons" :key="season.id" class="restore-season-group">
          <div class="restore-season-header">
            <Icon name="mdi:trophy-outline" size="16" />
            {{ season.name }}
          </div>
          <div v-if="!season._teams?.length" class="restore-empty">لا توجد فرق في هذا الموسم</div>
          <div v-for="t in season._teams" :key="t.slug" class="restore-team-row">
            <div class="restore-team-info">
              <span class="restore-team-name">{{ t.title }}</span>
              <span class="restore-player-count">{{ t.players?.length || 0 }} لاعب</span>
            </div>
            <SharedUiButtonBase
              size="sm"
              variant="primary"
              :loading="restoreModal.restoring === t.slug"
              @click="handleRestore(t)"
            >
              استعادة
            </SharedUiButtonBase>
          </div>
        </div>
      </div>
      <template #actions>
        <SharedUiButtonBase variant="outline" @click="restoreModal.open = false">
          إغلاق
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin-layer2' })

const admin = useAdminData()
const { prefixSlug, unprefixSlug } = useCurrentLeague()
const leagueSlug = computed(() => route.params.league)

const teams = ref([])
const loading = ref(true)
const alert = reactive({ visible: false, type: 'success', text: '' })
const modal = reactive({ open: false, isEdit: false, saving: false, editingSlug: null })
const deleteConfirm = reactive({ open: false, deleting: false, team: null })
const strikeConfirm = reactive({ open: false, saving: false, team: null })

const defaultForm = () => ({
  title: '',
  slug: '',
  color: '#22c55e',
  group: '',
  logo: null,
})

const form = reactive(defaultForm())
const formErrors = reactive({ title: '' })
let slugManuallyEdited = false
watch(() => form.title, (val) => {
  if (!slugManuallyEdited && !modal.isEdit) {
    form.slug = generateSlug(val || '')
  }
})

const settings = ref({ groups: ["A", "B"] })

const groupOptions = computed(() =>
  (settings.value.groups || ["A", "B"]).map(g => ({
    label: `${g}`,
    value: g,
  }))
)

const allPlayers = ref([])

const playersModal = reactive({
  open: false,
  loading: false,
  team: null,
  players: [],
})

const logoErrors = ref(new Set())

const teamColumns = [
  { key: 'title', label: 'الفريق', sortable: true },
  { key: 'group', label: 'المجموعة', align: 'center', width: '100px' },
]

const teamActions = [
  { key: 'players', icon: 'mdi:account-group-outline', label: 'اللاعبون', class: 'btn-info' },
  { key: 'managers', icon: 'mdi:account-tie-outline', label: 'الإداريون', class: 'btn-info' },
  { key: 'edit', icon: 'mdi:pencil-outline', label: 'تعديل', class: 'btn-warning' },
  { key: 'strike', icon: 'mdi:minus-circle-outline', label: 'شطب', class: 'btn-danger' },
  { key: 'delete', icon: 'mdi:delete-outline', label: 'حذف', class: 'btn-danger' },
]

const handleTeamAction = ({ action, row }) => {
  if (action.key === 'players') showTeamPlayers(row)
  else if (action.key === 'managers') showTeamManagers(row)
  else if (action.key === 'edit') openEditModal(row)
  else if (action.key === 'strike') confirmStrike(row)
  else if (action.key === 'delete') confirmDelete(row)
}

const confirmStrike = (row) => {
  strikeConfirm.team = row
  strikeConfirm.open = true
}

const handleToggleStrike = async () => {
  if (!strikeConfirm.team) return
  const row = strikeConfirm.team
  const next = !row.is_struck
  strikeConfirm.saving = true
  try {
    await admin.saveTeam({ slug: row.slug, title: row.title, is_struck: next })
    await loadData()
    strikeConfirm.open = false
    showAlert('success', next ? `تم شطب ${row.title} — لن تُحتسب نتائجه في الترتيب` : `تم إلغاء الشطب عن ${row.title}`)
  } catch (e) {
    showAlert('error', 'حدث خطأ أثناء الشطب')
  } finally {
    strikeConfirm.saving = false
  }
}

const positions = [
  { label: 'مهاجم', value: 'مهاجم' },
  { label: 'وسط', value: 'وسط' },
  { label: 'مدافع', value: 'مدافع' },
  { label: 'حارس', value: 'حارس' },
]

const teamOptionsForPlayers = computed(() =>
  teams.value.map(t => ({ label: t.title, value: t.slug }))
)

const playerForm = reactive({
  open: false,
  isEdit: false,
  saving: false,
  editingSlug: null,
  slug: '',
  title: '',
  team: '',
  number: null,
  position: '',
  goals: 0,
  appearances: 0,
  photo: null,
  captain: false,
})

const playerDefaultForm = (teamSlug) => ({
  slug: '',
  title: '',
  team: teamSlug || '',
  number: null,
  position: '',
  goals: 0,
  appearances: 0,
  photo: null,
  captain: false,
})

const playerDelete = reactive({
  open: false,
  deleting: false,
  player: null,
})

// ── Managers ──────────────────────────────────────────────────
const allManagers = ref([])

const managersModal = reactive({
  open: false,
  loading: false,
  team: null,
  managers: [],
})

const managerForm = reactive({
  open: false,
  isEdit: false,
  saving: false,
  editingId: null,
  name: '',
  image: null,
  role: '',
})

const managerRoles = [
  { label: 'مدرب', value: 'مدرب' },
  { label: 'مساعد مدرب', value: 'مساعد مدرب' },
  { label: 'طبيب', value: 'طبيب' },
  { label: 'إداري', value: 'إداري' },
]

const managerDefaultForm = () => ({ name: '', image: null, role: '' })

const managerDelete = reactive({
  open: false,
  deleting: false,
  manager: null,
})

const showTeamManagers = async (team) => {
  managersModal.team = team
  managersModal.loading = true
  managersModal.open = true
  if (!allManagers.value.length) allManagers.value = await admin.getManagers()
  managersModal.managers = allManagers.value.filter(m => m.team_slug === team.slug)
  managersModal.loading = false
}

const refreshTeamManagers = () => {
  if (managersModal.team) {
    managersModal.managers = allManagers.value.filter(m => m.team_slug === managersModal.team.slug)
  }
}

const openManagerAdd = () => {
  Object.assign(managerForm, managerDefaultForm(), { open: true, isEdit: false, saving: false, editingId: null })
}

const openManagerEdit = (manager) => {
  Object.assign(managerForm, {
    open: true,
    isEdit: true,
    saving: false,
    editingId: manager.id,
    name: manager.name,
    image: manager.image,
    role: manager.role || '',
  })
}

const handleManagerSave = async () => {
  if (!managerForm.name.trim()) return
  managerForm.saving = true
  const payload = {
    name: managerForm.name.trim(),
    team_slug: managersModal.team.slug,
    image: managerForm.image || '',
    role: managerForm.role,
  }
  if (managerForm.editingId) payload.id = managerForm.editingId
  try {
    await admin.saveManager(payload)
    managerForm.open = false
    allManagers.value = await admin.getManagers()
    refreshTeamManagers()
    showAlert('success', managerForm.isEdit ? 'تم تحديث الإداري بنجاح' : 'تمت إضافة الإداري بنجاح')
  } catch {
    showAlert('error', 'حدث خطأ أثناء الحفظ')
  } finally {
    managerForm.saving = false
  }
}

const confirmManagerDelete = (manager) => {
  managerDelete.manager = manager
  managerDelete.open = true
}

const handleManagerDelete = async () => {
  if (!managerDelete.manager) return
  managerDelete.deleting = true
  try {
    await admin.deleteManager(managerDelete.manager.id)
    managerDelete.open = false
    managerDelete.manager = null
    allManagers.value = await admin.getManagers()
    refreshTeamManagers()
    showAlert('success', 'تم حذف الإداري بنجاح')
  } catch {
    showAlert('error', 'حدث خطأ أثناء الحذف')
  } finally {
    managerDelete.deleting = false
  }
}

const uploadManagerPhoto = async (blob) => {
  return admin.uploadToStorage(blob, 'manager-images', `manager-${Date.now()}`)
}

const restoreModal = reactive({
  open: false,
  loading: false,
  seasons: [],
  restoring: null,
})

const showTeamPlayers = async (team) => {
  playersModal.team = team
  playersModal.loading = true
  playersModal.open = true
  if (!allPlayers.value.length) allPlayers.value = await admin.getPlayers()
  playersModal.players = allPlayers.value.filter(p => p.team === team.slug)
  playersModal.loading = false
}

const refreshTeamPlayers = () => {
  if (playersModal.team) {
    playersModal.players = allPlayers.value.filter(p => p.team === playersModal.team.slug)
  }
}

const openPlayerAdd = () => {
  Object.assign(playerForm, playerDefaultForm(playersModal.team?.slug || ''), { open: true, isEdit: false, saving: false, editingSlug: null })
}

const openPlayerEdit = (player) => {
  Object.assign(playerForm, {
    open: true,
    isEdit: true,
    saving: false,
    editingSlug: player.slug,
    slug: player.slug,
    title: player.title,
    team: player.team,
    number: player.number,
    position: player.position,
    goals: player.goals,
    appearances: player.appearances,
    photo: player.photo,
    captain: player.captain || false,
  })
}

const makeSlug = (title, team) => {
  const base = title.trim().replace(/\s+/g, '-')
  return team ? `${team}-${base}` : base
}

const handlePlayerSave = async () => {
  if (!playerForm.title.trim()) return
  playerForm.saving = true
  const payload = {
    slug: playerForm.editingSlug || makeSlug(playerForm.title, playerForm.team),
    title: playerForm.title.trim(),
    team: playerForm.team,
    number: playerForm.number ? Number(playerForm.number) : null,
    position: playerForm.position,
    goals: Number(playerForm.goals) || 0,
    appearances: Number(playerForm.appearances) || 0,
    photo: playerForm.photo,
    captain: !!playerForm.captain,
  }
  try {
    await admin.savePlayer(payload)
    playerForm.open = false
    allPlayers.value = await admin.getPlayers()
    refreshTeamPlayers()
    showAlert('success', playerForm.isEdit ? 'تم تحديث اللاعب بنجاح' : 'تمت إضافة اللاعب بنجاح')
  } catch {
    showAlert('error', 'حدث خطأ أثناء الحفظ')
  } finally {
    playerForm.saving = false
  }
}

const confirmPlayerDelete = (player) => {
  playerDelete.player = player
  playerDelete.open = true
}

const handlePlayerDelete = async () => {
  if (!playerDelete.player) return
  playerDelete.deleting = true
  try {
    await admin.deletePlayer(playerDelete.player.slug)
    playerDelete.open = false
    playerDelete.player = null
    allPlayers.value = await admin.getPlayers()
    refreshTeamPlayers()
    showAlert('success', 'تم حذف اللاعب بنجاح')
  } catch {
    showAlert('error', 'حدث خطأ أثناء الحذف')
  } finally {
    playerDelete.deleting = false
  }
}

const showAlert = (type, text) => {
  alert.type = type
  alert.text = text
  alert.visible = false
  nextTick(() => { alert.visible = true })
}

const uploadTeamLogo = async (blob) => {
  const name = prefixSlug(form.slug || generateSlug(form.title))
  return await admin.uploadToStorage(blob, 'team-logos', name)
}

const uploadPlayerPhoto = async (blob) => {
  const name = playerForm.editingSlug || makeSlug(playerForm.title, playerForm.team)
  return await admin.uploadToStorage(blob, 'player-photos', name)
}

const loadData = async () => {
  loading.value = true
  teams.value = await admin.getTeams()
  const s = await admin.getSettings()
  if (s?.groups?.length) settings.value.groups = [...s.groups]
  loading.value = false
}

const generateSlug = (title) => {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

const openAddModal = () => {
  Object.assign(form, defaultForm())
  Object.assign(formErrors, { title: '' })
  modal.isEdit = false
  modal.editingSlug = null
  modal.open = true
  slugManuallyEdited = false
}

const openEditModal = (team) => {
  Object.assign(form, {
    title: team.title,
    slug: unprefixSlug(team.slug),
    color: team.color || '#22c55e',
    group: team.group || '',
    logo: team.logo || null,
  })
  Object.assign(formErrors, { title: '' })
  modal.isEdit = true
  modal.editingSlug = team.slug
  modal.open = true
  slugManuallyEdited = true
}

const handleSave = async () => {
  formErrors.title = ''

  if (!form.title.trim()) {
    formErrors.title = 'الاسم مطلوب'
    return
  }

  const cleanSlug = form.slug.trim() || generateSlug(form.title)

  if (!form.group) {
    form.group = 'A'
  }

  modal.saving = true
  try {
    const teamObj = {
      slug: prefixSlug(cleanSlug),
      title: form.title.trim(),
      color: form.color,
      logo: form.logo,
      group: form.group,
    }

    if (modal.isEdit) {
      const supabase = useSupabase()
      const oldSlug = modal.editingSlug
      const newSlug = teamObj.slug
      if (oldSlug !== newSlug) {
        const { error: insErr } = await supabase.from('teams').insert({ ...teamObj, slug: newSlug })
        if (insErr) throw insErr
        await supabase.from('managers').update({ team_slug: newSlug }).eq('team_slug', oldSlug)
        await supabase.from('matches').update({ homeTeam: newSlug }).eq('homeTeam', oldSlug)
        await supabase.from('matches').update({ awayTeam: newSlug }).eq('awayTeam', oldSlug)
        await supabase.from('players').update({ team: newSlug }).eq('team', oldSlug)
        const { error: delErr } = await supabase.from('teams').delete().eq('slug', oldSlug)
        if (delErr) throw delErr
      } else {
        const { error } = await supabase.from('teams').update(teamObj).eq('slug', oldSlug)
        if (error) throw error
      }
    } else {
      await admin.saveTeam(teamObj)
    }
    modal.open = false
    await loadData()
    showAlert('success', modal.isEdit ? 'تم تحديث الفريق بنجاح' : 'تمت إضافة الفريق بنجاح')
  } catch (e) {
    showAlert('error', 'حدث خطأ أثناء الحفظ')
  } finally {
    modal.saving = false
  }
}

const confirmDelete = (team) => {
  deleteConfirm.team = team
  deleteConfirm.open = true
}

const handleDelete = async () => {
  if (!deleteConfirm.team) return
  deleteConfirm.deleting = true
  try {
    await admin.deleteTeam(deleteConfirm.team.slug)
    deleteConfirm.open = false
    deleteConfirm.team = null
    await loadData()
    showAlert('success', 'تم حذف الفريق بنجاح')
  } catch (e) {
    showAlert('error', 'حدث خطأ أثناء الحذف')
  } finally {
    deleteConfirm.deleting = false
  }
}

const openRestoreModal = async () => {
  restoreModal.open = true
  restoreModal.loading = true
  try {
    const seasonsApi = useSeasons()
    const all = await seasonsApi.getSeasons()
    const archived = all.filter(s => !s.is_active && s.snapshot?.teams?.length)
    for (const s of archived) {
      s._teams = s.snapshot.teams
    }
    restoreModal.seasons = archived
  } catch {
    restoreModal.seasons = []
  } finally {
    restoreModal.loading = false
  }
}

const handleRestore = async (archivedTeam) => {
  restoreModal.restoring = archivedTeam.slug
  try {
    await admin.saveTeam({ slug: archivedTeam.slug, title: archivedTeam.title })
    const players = archivedTeam.players || []
    for (const name of players) {
      const slug = name.trim().replace(/\s+/g, '-')
      await admin.savePlayer({ slug, title: name.trim(), team: archivedTeam.slug })
    }
    showAlert('success', `تمت استعادة فريق ${archivedTeam.title} مع ${players.length} لاعب`)
    await loadData()
  } catch {
    showAlert('error', 'حدث خطأ أثناء استعادة الفريق')
  } finally {
    restoreModal.restoring = null
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.teams-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.team-logo-sm {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  flex-shrink: 0;
}

.team-avatar-sm {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #fff;
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.team-name-text {
  font-weight: 600;
  color: var(--text-primary);
}

.struck-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.group-badge-dt {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 99px;
  display: inline-flex;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-color-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-color-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.color-picker {
  width: 48px;
  height: 48px;
  padding: 2px;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-surface);
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
  }
}

.delete-msg {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.7;
}

.modal-loading {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.players-modal-header {
  margin-bottom: 12px;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border-radius: 10px;
}

.player-num {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.player-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.player-position {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.player-stats {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.player-item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.restore-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 420px;
  overflow-y: auto;
}

.restore-season-group {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 12px;
}

.restore-season-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color);
}

.restore-empty {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-align: center;
  padding: 12px;
}

.restore-team-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--border-color);

  &:last-child { border-bottom: none; }
}

.restore-team-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.restore-team-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.restore-player-count {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.player-action-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &.edit:hover {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  &.delete:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
}

.captain-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  input { width: 18px; height: 18px; cursor: pointer; }
}

.captain-badge {
  font-size: 1rem;
  margin-right: 4px;
}
</style>
