<template>
  <div class="admin-img-upload">
    <label v-if="label" class="upload-label">{{ label }}</label>

    <!-- Preview -->
    <div v-if="modelValue" class="upload-preview">
      <img :src="modelValue" :alt="label" class="preview-img" />
      <button class="remove-btn" @click="$emit('update:modelValue', null)" title="إزالة">
        <Icon name="mdi:close" size="16" />
      </button>
    </div>

    <!-- Drop zone -->
    <div
      v-else
      class="upload-zone"
      :class="{ dragover: dragging }"
      @click="openPicker"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <Icon name="mdi:camera-plus-outline" size="28" />
      <span class="zone-text">{{ hint || 'اختر صورة' }}</span>
      <span class="zone-sub">أو اسحب وأفلت</span>
      <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: "" },
  hint: { type: String, default: "" },
  maxWidth: { type: Number, default: 800 },
  maxSizeMB: { type: Number, default: 0.5 },
})

const emit = defineEmits(["update:modelValue"])

const dragging = ref(false)
const fileInput = ref(null)
const { compressAndEncode } = useImageCompression()

const openPicker = () => fileInput.value?.click()

const onDrop = async (e) => {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await handleFile(file)
}

const onFileChange = async (e) => {
  const file = e.target?.files?.[0]
  if (file) await handleFile(file)
  if (fileInput.value) fileInput.value.value = ""
}

const handleFile = async (file) => {
  if (!file || !file.type.startsWith("image/")) return
  try {
    const base64 = await compressAndEncode(file, {
      maxSizeMB: props.maxSizeMB,
      maxWidthOrHeight: props.maxWidth,
    })
    emit("update:modelValue", base64)
  } catch {
    console.error("Image compression failed")
  }
}
</script>

<style lang="scss" scoped>
.admin-img-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.upload-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}
.upload-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid var(--border-color);
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-btn {
  position: absolute;
  top: 4px; inset-inline-end: 4px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.5);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  &:hover { background: rgba(239,68,68,0.8); }
}
.upload-zone {
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s;
  position: relative;
  &:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-soft); }
  &.dragover { border-color: var(--primary); background: var(--primary-soft); }
}
.zone-text { font-size: 0.75rem; font-weight: 600; }
.zone-sub { font-size: 0.65rem; }
.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
