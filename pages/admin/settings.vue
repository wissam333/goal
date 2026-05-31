<template>
  <div>
    <SharedUiHeaderPage
      title="الإعدادات"
      icon="mdi:cog-outline"
      :is-rtl="true"
    />

    <SharedUiFeedbackAlert
      v-model="alert.show"
      :type="alert.type"
      :title="alert.title"
      :message="alert.text"
      dismissible
      :duration="3000"
    />

    <template v-if="loading">
      <div class="settings-card">
        <div class="sk-title" />
        <div class="sk-input" />
        <div class="sk-input" />
        <div class="sk-actions" />
      </div>
      <div class="settings-card">
        <div class="sk-title" />
        <div class="sk-desc" />
        <div class="sk-tags">
          <div class="sk-tag" />
          <div class="sk-tag" />
        </div>
        <div class="sk-actions" />
      </div>
      <div class="settings-card">
        <div class="sk-title" />
        <div class="sk-desc" />
        <div class="sk-input" />
        <div class="sk-input" />
        <div class="sk-input" />
        <div class="sk-actions" />
      </div>
    </template>

    <template v-else>
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
      <p class="form-desc">سيظهر الإعلان في أعلى جميع صفحات الموقع. اترك الحقول فارغة لإخفاء الإعلان</p>

      <div class="ad-layout">
        <div class="ad-form-fields">
          <AdminImageUpload
            v-model="adForm.image"
            label="صورة الإعلان"
            :upload="(blob) => admin.uploadToStorage(blob, 'ads', 'ad-banner')"
          />
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
        </div>

        <div class="ad-preview-box">
          <h4 class="preview-label">معاينة</h4>
          <div class="ad-preview">
            <div v-if="adForm.image" class="preview-img-wrap">
              <img :src="adForm.image" alt="إعلان" class="preview-img" />
            </div>
            <div class="preview-texts">
              <span v-if="adForm.title" class="preview-title">{{ adForm.title }}</span>
              <span v-if="adForm.description" class="preview-desc">{{ adForm.description }}</span>
              <span v-if="!adForm.image && !adForm.title && !adForm.description" class="preview-empty">سيظهر الإعلان هنا</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <SharedUiButtonBase
          variant="primary"
          :loading="savingAd"
          :disabled="savingAd"
          @click="handleSaveAd"
        >
          حفظ الإعلان
        </SharedUiButtonBase>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="form-section-title">إشعار فوري</h3>
      <p class="form-desc">أرسل إشعارًا فوريًا لجميع المشتركين</p>
      <SharedUiFormBaseInput
        v-model="notifForm.title"
        label="العنوان"
        placeholder="مثلا: مباراة جديدة"
        required
      />
      <SharedUiFormBaseInput
        v-model="notifForm.body"
        label="النص"
        placeholder="مثلا: تمت إضافة مباراة الأهلي والاتحاد"
      />
      <SharedUiFormBaseInput
        v-model="notifForm.url"
        label="الرابط (اختياري)"
        placeholder="/fixtures"
      />
      <div class="form-actions">
        <SharedUiButtonBase
          variant="primary"
          :loading="sendingNotif"
          :disabled="sendingNotif || !notifForm.title"
          @click="handleSendNotification"
        >
          إرسال الإشعار
        </SharedUiButtonBase>
      </div>
    </div>
    </template>

  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })

const admin = useAdminData()
const alert = reactive({ show: false, type: 'success', title: '', text: '' })
const loading = ref(true)
const savingAd = ref(false)

const showAlert = (type, title, text) => {
  alert.type = type
  alert.title = title
  alert.text = text
  alert.show = false
  nextTick(() => { alert.show = true })
}

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
  try {
    await admin.saveSettings({ groups: form.groups })
    showAlert('success', '✅ تم الحفظ', 'تم حفظ المجموعات بنجاح')
  } catch {
    showAlert('error', '❌ خطأ', 'فشل حفظ المجموعات')
  }
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
  loading.value = false
})

const handleSave = async () => {
  try {
    await admin.saveSettings({ ...form })
    showAlert('success', '✅ تم الحفظ', 'تم حفظ الإعدادات بنجاح')
  } catch {
    showAlert('error', '❌ خطأ', 'فشل حفظ الإعدادات')
  }
}

const handleSaveAd = async () => {
  savingAd.value = true
  try {
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
    showAlert('success', '✅ تم الحفظ', 'تم حفظ الإعلان بنجاح')
  } catch {
    showAlert('error', '❌ خطأ', 'فشل حفظ الإعلان')
  } finally {
    savingAd.value = false
  }
}

const notifForm = reactive({
  title: "",
  body: "",
  url: "/",
})
const sendingNotif = ref(false)

const handleSendNotification = async () => {
  if (!notifForm.title.trim()) return
  sendingNotif.value = true
  try {
    const res = await $fetch('/api/notifications/send', {
      method: 'POST',
      body: {
        title: notifForm.title.trim(),
        body: notifForm.body.trim(),
        url: notifForm.url.trim() || '/',
      },
    })
    showAlert('success', '✅ تم الإرسال', `تم إرسال الإشعار إلى ${res.sent} مشترك`)
    notifForm.title = ""
    notifForm.body = ""
    notifForm.url = "/"
  } catch (err) {
    const msg = err?.data?.statusMessage || err?.message || 'فشل إرسال الإشعار'
    showAlert('error', '❌ خطأ', msg)
  } finally {
    sendingNotif.value = false
  }
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
  margin: 4px 0 0;
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

// ── Ad section ─────────────────────────────────────────────────
.ad-layout {
  display: flex;
  gap: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.ad-form-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ad-preview-box {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 640px) {
    width: 100%;
  }
}

.preview-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0;
}

.ad-preview {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.preview-img-wrap {
  width: 100%;
  max-height: 100px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

.preview-texts {
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.preview-empty {
  font-size: 0.72rem;
  color: var(--text-muted);
  opacity: 0.5;
  padding: 24px 0;
}

// ── Skeleton ──────────────────────────────────────────────────
.sk-title {
  height: 20px; width: 120px; border-radius: 6px;
  background: var(--bg-elevated); position: relative; overflow: hidden;
}
.sk-desc {
  height: 14px; width: 240px; border-radius: 4px;
  background: var(--bg-elevated); position: relative; overflow: hidden;
}
.sk-input {
  height: 42px; border-radius: 8px;
  background: var(--bg-elevated); position: relative; overflow: hidden;
}
.sk-actions {
  height: 36px; width: 120px; border-radius: 8px; align-self: flex-end;
  background: var(--bg-elevated); position: relative; overflow: hidden;
}
.sk-tags {
  display: flex; gap: 8px;
}
.sk-tag {
  height: 34px; width: 50px; border-radius: 8px;
  background: var(--bg-elevated); position: relative; overflow: hidden;
}
.sk-title::after, .sk-desc::after, .sk-input::after,
.sk-actions::after, .sk-tag::after {
  content: ""; position: absolute; inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(90deg,
    transparent 0, rgba(255 255 255 / 0.08) 20%,
    rgba(255 255 255 / 0.15) 60%, transparent);
  animation: sk-shimmer 1.8s infinite;
}
@keyframes sk-shimmer {
  100% { transform: translateX(100%); }
}
</style>
