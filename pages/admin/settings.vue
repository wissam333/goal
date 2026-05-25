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
})

onMounted(async () => {
  const s = await admin.getSettings()
  if (s) {
    form.name = s.name || ""
    form.season = s.season || ""
  }
})

const handleSave = async () => {
  await admin.saveSettings({ ...form })
  alert.show = true
  alert.type = "success"
  alert.text = "✅ تم حفظ الإعدادات"
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
</style>
