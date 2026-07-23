<template>
  <div>
    <SharedUiHeaderPage
      title="الدوريات"
      icon="mdi:format-list-group"
      :is-rtl="true"
    >
      <template #actions>
        <SharedUiButtonBase
          variant="primary"
          icon-left="mdi:plus-circle-outline"
          @click="openCreate"
        >
          إضافة دوري
        </SharedUiButtonBase>
      </template>
    </SharedUiHeaderPage>

    <SharedUiTableDataTable
      :columns="columns"
      :data="list"
      :loading="loading"
      empty-text="لا توجد دوريات"
      empty-description="لم تتم إضافة أي دوري بعد."
      empty-icon="mdi:format-list-group"
    >
      <template #cell-name="{ row }">
        <div class="d-flex align-items-center gap-2 league-row" @click="selectLeague(row)">
          <img v-if="row.logo" :src="row.logo" class="l-logo-img" />
          <div v-else class="l-logo-placeholder">{{ row.name?.charAt(0) }}</div>
          <div>
            <div class="fw-700">{{ row.name }}</div>
            <div v-if="row.description" class="text-muted text-sm">{{ row.description }}</div>
          </div>
        </div>
      </template>
      <template #cell-status="{ row }">
        <span v-if="row.is_active" class="status-badge active">نشط</span>
        <span v-else class="status-badge inactive">غير نشط</span>
      </template>
      <template #cell-actions="{ row }">
        <SharedUiButtonBase
          variant="ghost"
          icon-left="mdi:pencil-outline"
          size="sm"
          @click="openEdit(row)"
        />
        <SharedUiButtonBase
          variant="ghost"
          icon-left="mdi:delete-outline"
          size="sm"
          class="text-danger"
          @click="handleDelete(row)"
        />
      </template>
    </SharedUiTableDataTable>

    <SharedUiDialogAppModal
      v-model="showModal"
      :title="isEdit ? 'تعديل الدوري' : 'دوري جديد'"
      max-width="520px"
    >
      <div class="form-grid">
        <AdminImageUpload
          v-model="form.logo"
          label="شعار الدوري"
          :upload="(blob) => admin.uploadToStorage(blob, 'league-logos')"
        />
        <AdminImageUpload
          v-model="form.cover_image"
          label="صورة الغلاف"
          :upload="(blob) => admin.uploadToStorage(blob, 'league-covers')"
        />
        <SharedUiFormBaseInput
          v-model="form.name"
          label="الاسم"
          placeholder="اسم الدوري"
          required
        />
        <SharedUiFormBaseInput
          v-model="form.slug"
          label="الرابط (slug)"
          placeholder="al-jarwiyya"
          hint="يُستخدم في رابط الدوري"
        />
        <label class="input-label">الوصف</label>
        <textarea
          v-model="form.description"
          class="form-textarea"
          placeholder="وصف قصير"
          rows="2"
        />
        <SharedUiFormBaseInput
          v-model="form.location"
          label="الموقع"
          placeholder="مثال: ملعب القرية"
        />
        <div class="form-row-inline">
          <label class="checkbox-label">
            <input v-model="form.is_active" type="checkbox" />
            نشط
          </label>
          <SharedUiFormBaseInput
            v-model.number="form.sort_order"
            label="الترتيب"
            type="number"
            min="0"
            class="sort-input"
          />
        </div>
      </div>
      <template #actions>
        <SharedUiButtonBase variant="outline" @click="showModal = false">إلغاء</SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          :loading="saving"
          :disabled="!form.name.trim()"
          @click="handleSave"
        >
          حفظ
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>
  </div>
</template>

<script setup>
definePageMeta({ layout: "admin-layer1" })

const { getAllLeagues, saveLeague, deleteLeague } = useLeagues()

const list = ref([])
const loading = ref(true)
const showModal = ref(false)
const isEdit = ref(false)
const saving = ref(false)

const columns = [
  { key: 'name', label: 'الاسم', sortable: true },
  { key: 'slug', label: 'الرابط' },
  { key: 'status', label: 'الحالة' },
  { key: 'sort_order', label: 'الترتيب', sortable: true },
  { key: 'actions', label: '', width: '100px' },
]

const form = reactive({
  id: null, name: '', slug: '', description: '',
  location: '', cover_image: '', logo: '',
  is_active: true, sort_order: 0,
})

onMounted(async () => {
  list.value = await getAllLeagues()
  loading.value = false
})

function openCreate() {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', slug: '', description: '', location: '', cover_image: '', logo: '', is_active: true, sort_order: 0 })
  showModal.value = true
}

function openEdit(l) {
  isEdit.value = true
  Object.assign(form, {
    id: l.id, name: l.name, slug: l.slug,
    description: l.description || '', location: l.location || '',
    cover_image: l.cover_image || '', logo: l.logo || '',
    is_active: l.is_active ?? true, sort_order: l.sort_order ?? 0,
  })
  showModal.value = true
}

function selectLeague(l) {
  navigateTo(`/admin/${l.slug}/teams`)
}

async function handleSave() {
  if (!form.name.trim()) return
  saving.value = true
  try {
    const payload = { ...form }
    if (!payload.id) delete payload.id
    await saveLeague(payload)
    showModal.value = false
    list.value = await getAllLeagues()
  } catch (e) {
    alert(e.message || 'فشل الحفظ')
  } finally {
    saving.value = false
  }
}

async function handleDelete(l) {
  if (!confirm(`حذف الدوري "${l.name}"؟ لا يمكن التراجع.`)) return
  try {
    await deleteLeague(l.id)
    list.value = await getAllLeagues()
  } catch (e) {
    alert(e.message || 'فشل الحذف')
  }
}


</script>

<style lang="scss" scoped>
.league-row {
  cursor: pointer;
  &:hover { opacity: 0.8; }
}
.l-logo-img {
  width: 40px; height: 40px; border-radius: 8px; object-fit: cover;
}
.l-logo-placeholder {
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: var(--primary-soft); color: var(--primary);
  font-size: 0.9rem; font-weight: 800; flex-shrink: 0;
}
.fw-700 { font-weight: 700; }
.text-muted { color: var(--text-muted); }
.text-sm { font-size: 0.78rem; }
.text-danger { color: #ef4444; }
.status-badge {
  display: inline-flex; padding: 3px 10px; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700;
  &.active { background: var(--primary-soft); color: var(--primary); }
  &.inactive { background: var(--bg-elevated); color: var(--text-muted); }
}
.form-grid { display: flex; flex-direction: column; gap: 12px; }
.form-row-inline {
  display: flex; align-items: flex-end; gap: 16px;
  .checkbox-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.85rem; font-weight: 600; color: var(--text-primary);
    white-space: nowrap;
  }
  .sort-input { max-width: 100px; }
}
.input-label {
  display: block; font-size: 0.85rem; font-weight: 600;
  color: var(--text-primary); margin-bottom: 4px;
}
.form-textarea {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border-color);
  border-radius: 10px; font-size: 0.9rem; background: var(--bg-page);
  color: var(--text-primary); resize: vertical;
  &:focus { outline: none; border-color: var(--primary); }
}
</style>
