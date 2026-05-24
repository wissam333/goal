<template>
  <div class="upload-section">
    <div class="upload-list">
      <div v-for="(item, index) in items" :key="index" class="upload-entry">
        <!-- Drop / Preview Area -->
        <div
          class="drop-area"
          :class="{ 'has-file': !!item.previewUrl, dragging: item.dragging }"
          @dragover.prevent="item.dragging = true"
          @dragleave="item.dragging = false"
          @drop.prevent="(e) => handleDrop(e, index)"
          @click="!item.previewUrl && triggerInput(index)"
        >
          <!-- Empty state -->
          <div v-if="!item.previewUrl" class="upload-box">
            <div class="upload-icon">
              <Icon name="mdi:video-plus" size="28" />
            </div>
            <p class="upload-hint">{{ $t("dragOrClickVideo") }}</p>
            <span class="upload-sub">{{ $t("videoFormatsHint") }}</span>
          </div>

          <!-- Video preview -->
          <div v-else class="video-preview-wrap">
            <video
              :src="getImageSrc(item.previewUrl)"
              controls
              class="video-player"
            />
            <button
              class="remove-btn"
              type="button"
              @click.stop="removeItem(index)"
            >
              <Icon name="mdi:close" size="16" />
            </button>
          </div>

          <input
            :ref="(el) => setInputRef(el, index)"
            type="file"
            class="hidden-input"
            accept="video/*"
            @change="(e) => handleFileChange(e, index)"
          />
        </div>

        <!-- Progress bar while processing -->
        <div v-if="item.processing" class="processing-bar mt-2">
          <div class="processing-bar-inner"></div>
          <span class="processing-label">{{ $t("processing") }}...</span>
        </div>

        <!-- File info row -->
        <div v-if="item.previewUrl" class="file-info mt-1">
          <Icon name="mdi:video-outline" size="14" class="text-muted" />
          <span class="file-name text-muted">{{ item.fileName }}</span>
        </div>

        <!-- Name field -->
        <div class="mt-2">
          <SharedUiFormBaseInput
            v-model="item.name"
            :label="$t('videoName')"
            :placeholder="$t('enterVideoName')"
            icon-left="mdi:tag-outline"
          />
        </div>
      </div>
    </div>

    <!-- Add button -->
    <button type="button" class="add-btn" @click.prevent="addItem">
      <Icon name="mdi:plus" />
      {{ $t("addVideo") }}
    </button>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  maxFileSizeMB: {
    type: Number,
    default: 100,
  },
});

const emit = defineEmits(["update:modelValue"]);
const { $toast } = useNuxtApp();
const { t } = useI18n();

const inputRefs = ref({});
const setInputRef = (el, index) => {
  if (el) inputRefs.value[index] = el;
};

const items = ref(
  props.modelValue.length
    ? props.modelValue.map((att) => ({
        id: att.id || 0,
        name: att.name || "",
        url: att.url || "",
        previewUrl: att.url || null,
        fileName: att.name || "",
        dragging: false,
        processing: false,
        uploadRequest: att.uploadRequest || null,
      }))
    : [],
);

const addItem = () => {
  items.value.push({
    id: 0,
    name: "",
    url: "",
    previewUrl: null,
    fileName: "",
    dragging: false,
    processing: false,
    uploadRequest: null,
  });
};

const removeItem = (index) => {
  items.value.splice(index, 1);
  emitUpdate();
};

const triggerInput = (index) => {
  inputRefs.value[index]?.click();
};

const handleDrop = (e, index) => {
  items.value[index].dragging = false;
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    $toast.error(t("videosOnly"));
    return;
  }
  processFile(file, index);
};

const handleFileChange = (e, index) => {
  const file = e.target.files?.[0];
  if (file) processFile(file, index);
  e.target.value = "";
};

const processFile = async (file, index) => {
  if (file.size > props.maxFileSizeMB * 1024 * 1024) {
    $toast.error(t("fileTooLarge", { size: props.maxFileSizeMB }));
    return;
  }

  items.value[index].processing = true;

  try {
    const base64 = await toBase64(file);
    const extension = "." + file.name.split(".").pop().toLowerCase();

    items.value[index] = {
      ...items.value[index],
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      name: items.value[index].name || file.name.replace(/\.[^/.]+$/, ""),
      processing: false,
      uploadRequest: {
        fileName: file.name.replace(/\.[^/.]+$/, ""),
        extension,
        uploadType: 1,
        data: base64,
      },
    };
    emitUpdate();
  } catch (err) {
    items.value[index].processing = false;
    $toast.error(t("fileReadError"));
  }
};

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const emitUpdate = () => {
  emit(
    "update:modelValue",
    items.value.map((item) => ({
      id: item.id || 0,
      name: item.name,
      url: item.url || "",
      type: 1,
      uploadRequest: item.uploadRequest,
    })),
  );
};

// In your script setup
const getImageSrc = (previewUrl) => {
  if (!previewUrl) return "";
  // If it's a blob URL (starts with blob:) or data URL (starts with data:), use as-is
  if (previewUrl.startsWith("blob:") || previewUrl.startsWith("data:")) {
    return previewUrl;
  }
  // Otherwise it's a path, prepend apiBase
  return apiBase + previewUrl;
};

watch(items, emitUpdate, { deep: true });
</script>

<style lang="scss" scoped>
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.upload-entry {
  display: flex;
  flex-direction: column;
}

.drop-area {
  position: relative;
  width: 100%;
  height: 180px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  background: var(--bg-elevated);

  &:hover,
  &.dragging {
    border-color: var(--primary);
    background: var(--primary-soft);
  }

  &.has-file {
    border-style: solid;
    cursor: default;
    border-color: var(--border-color);
    height: auto;
    min-height: 180px;
  }
}

.upload-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1rem;
  text-align: center;

  .upload-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: var(--primary-soft);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .upload-hint {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-sub);
    margin: 0;
  }

  .upload-sub {
    font-size: 0.72rem;
    color: var(--text-muted);
  }
}

.video-preview-wrap {
  width: 100%;
  position: relative;

  .video-player {
    width: 100%;
    border-radius: 10px;
    display: block;
    max-height: 220px;
  }

  .remove-btn {
    position: absolute;
    top: 6px;
    inset-inline-end: 6px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #dc3545;
    }
  }
}

.processing-bar {
  position: relative;
  height: 4px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;

  &-inner {
    position: absolute;
    inset: 0;
    background: var(--primary);
    animation: slide 1.2s ease-in-out infinite;
  }

  .processing-label {
    display: block;
    font-size: 0.75rem;
    color: var(--primary);
    margin-top: 4px;
  }
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;

  .file-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    color: var(--text-muted);
  }
}

.hidden-input {
  display: none;
}

.add-btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--primary-soft);
  color: var(--primary);
  border: none;
  border-radius: 8px;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--primary);
    color: #fff;
  }
}
</style>
