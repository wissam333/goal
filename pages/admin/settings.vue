<template>
  <div>
    <SharedUiHeaderPage
      title="الإعدادات"
      icon="mdi:cog-outline"
      :is-rtl="true"
    />

    <SharedUiFeedbackAlert
      v-if="alert.show"
      :type="alert.type"
      :message="alert.text"
      dismissible
      :duration="3000"
      @update:model-value="alert.show = false"
    />

    <div class="settings-card">
      <h3 class="form-section-title">إعدادات الدوري</h3>

      <SharedUiFormBaseInput
        v-model="form.name"
        label="اسم الدوري"
        placeholder="دوري القرية السنوي"
        required
      />
      <SharedUiFormBaseInput
        v-model="form.season"
        label="الموسم"
        placeholder="2026"
        required
      />

      <div class="form-actions">
        <SharedUiButtonBase variant="primary" @click="handleSave">
          حفظ الإعدادات
        </SharedUiButtonBase>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="form-section-title">المجموعات</h3>
      <p class="form-desc">حدد مجموعات دور المجموعات (A, B, C...). المجموعات المضافة هنا ستظهر عند إضافة فرق ومباريات جديدة</p>
      <div class="groups-editor">
        <div class="groups-tags">
          <div v-for="(g, i) in form.groups" :key="i" class="group-tag">
            <span>{{ g }}</span>
            <button class="group-tag-remove" @click="removeGroup(i)" type="button">&times;</button>
          </div>
        </div>
        <div class="groups-add-row">
          <SharedUiFormBaseInput
            v-model="newGroup"
            placeholder="حرف المجموعة (مثل C)"
            class="groups-input"
          />
          <SharedUiButtonBase variant="outline" @click="addGroup">
            إضافة
          </SharedUiButtonBase>
        </div>
      </div>
      <div class="form-actions">
        <SharedUiButtonBase variant="primary" @click="handleSaveGroups">
          حفظ المجموعات
        </SharedUiButtonBase>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="form-section-title">الإعلان / البانر</h3>
      <p class="form-desc">سيظهر الإعلان في أعلى جميع صفحات الموقع. اترك الصورة فارغة لإخفاء الإعلان</p>

      <AdminImageUpload v-model="adForm.image" label="صورة الإعلان" />
      <SharedUiFormBaseInput
        v-model="adForm.title"
        label="عنوان الإعلان"
        placeholder="راعي البطولة"
      />
      <SharedUiFormBaseInput
        v-model="adForm.description"
        label="وصف الإعلان"
        placeholder="شركة ABC"
      />
      <SharedUiFormBaseInput
        v-model="adForm.link"
        label="رابط الإعلان (اختياري)"
        placeholder="https://example.com"
        hint="عند الضغط على الإعلان يذهب المستخدم لهذا الرابط"
      />

      <div class="form-actions">
        <SharedUiButtonBase variant="primary" @click="handleSaveAd">
          حفظ الإعلان
        </SharedUiButtonBase>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="form-section-title">النشر التلقائي</h3>
      <p class="form-desc">عند ضبط رابط النشر، يمكنك النشر من الصفحة الرئيسية للوحة التحكم</p>
      <SharedUiFormBaseInput
        v-model="hookUrl"
        label="رابط نشر Vercel"
        placeholder="https://api.vercel.com/v1/integrations/deploy/..."
        hint="اختياري — يستخدم لنشر التغييرات على الموقع"
      />
      <div class="form-actions">
        <SharedUiButtonBase variant="outline" @click="saveHookUrl">
          حفظ الرابط
        </SharedUiButtonBase>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })

const admin = useAdminData()
const alert = reactive({ show: false, type: 'success', text: '' })

const DEFAULT_HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_v2as9FW28UNLGCKsm3jKRhllC7H8/4RsaK5dU22"
const hookUrl = ref(import.meta.client ? localStorage.getItem("league_vercel_hook") || DEFAULT_HOOK : DEFAULT_HOOK)

const form = reactive({
  name: "",
  season: "",
  groups: ["A", "B"],
})

const newGroup = ref("")

const addGroup = () => {
  const val = newGroup.value.trim().toUpperCase()
  if (!val) return
  if (form.groups.includes(val)) {
    newGroup.value = ""
    return
  }
  form.groups.push(val)
  newGroup.value = ""
}

const removeGroup = (index) => {
  form.groups.splice(index, 1)
}

const handleSaveGroups = async () => {
  if (!form.groups.length) {
    form.groups = ["A"]
  }
  await admin.saveSettings({ groups: form.groups })
  alert.show = true
  alert.type = "success"
  alert.text = "✅ تم حفظ المجموعات"
}

const adForm = reactive({
  image: null,
  title: "",
  description: "",
  link: "",
})

onMounted(async () => {
  const s = await admin.getSettings()
  if (s) {
    form.name = s.name || ""
    form.season = s.season || ""
    form.groups = s.groups?.length ? [...s.groups] : ["A", "B"]
    if (s.ad) {
      adForm.image = s.ad.image || null
      adForm.title = s.ad.title || ""
      adForm.description = s.ad.description || ""
      adForm.link = s.ad.link || ""
    }
  }
})

const handleSave = async () => {
  await admin.saveSettings({ ...form })
  alert.show = true
  alert.type = "success"
  alert.text = "✅ تم حفظ الإعدادات"
}

const handleSaveAd = async () => {
  const s = await admin.getSettings()
  const ad = {
    image: adForm.image || null,
    title: adForm.title || "",
    description: adForm.description || "",
    link: adForm.link || "",
  }
  await admin.saveSettings({
    name: s?.name || form.name,
    season: s?.season || form.season,
    ad,
  })
  alert.show = true
  alert.type = "success"
  alert.text = "✅ تم حفظ الإعلان"
}

const saveHookUrl = () => {
  if (import.meta.client) localStorage.setItem("league_vercel_hook", hookUrl.value)
  alert.show = true
  alert.type = "success"
  alert.text = "✅ تم حفظ رابط النشر"
}
</script>

<style lang="scss" scoped>
.settings-card {
  background: var(--bg-surface);
  border-radius: 14px;
  padding: 24px;
  border: 1px solid var(--border-color);
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.form-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: -8px 0 0;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}
.groups-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.groups-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.group-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-soft, rgba(34,197,94,0.1));
  color: var(--primary, #22c55e);
  border: 1px solid var(--primary-mid, rgba(34,197,94,0.2));
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 700;
  font-size: 0.9rem;
}
.group-tag-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.group-tag-remove:hover {
  color: #ef4444;
}
.groups-add-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.groups-input {
  flex: 1;
}
</style>
