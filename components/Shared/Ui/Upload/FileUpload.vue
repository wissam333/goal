<template>
  <div class="upload-section">
    <div class="upload-list">
      <div v-for="(item, index) in items" :key="index" class="upload-entry">
        <!-- Drop Area -->
        <div
          class="drop-area"
          :class="{
            'has-file': !!item.uploadRequest || !!item.url,
            dragging: item.dragging,
          }"
          @dragover.prevent="item.dragging = true"
          @dragleave="item.dragging = false"
          @drop.prevent="(e) => handleDrop(e, index)"
          @click="!item.uploadRequest && !item.url && triggerInput(index)"
        >
          <!-- Empty state -->
          <div v-if="!item.uploadRequest && !item.url" class="upload-box">
            <div class="upload-icon">
              <Icon name="mdi:file-plus-outline" size="28" />
            </div>
            <p class="upload-hint">{{ $t("dragOrClickFile") }}</p>
            <span class="upload-sub">{{ $t("fileFormatsHint") }}</span>
          </div>

          <!-- Uploaded state (new or existing) -->
          <div v-else class="file-uploaded-box">
            <div class="file-icon-wrap" :class="getExtClass(item.extension)">
              <Icon :name="getExtIcon(item.extension)" size="32" />
            </div>
            <div class="file-meta">
              <span class="file-title">{{ getFileName(item) }}</span>
              <span class="file-ext">{{ item.extension?.toUpperCase() }}</span>
            </div>

            <!-- Action Buttons - Always visible -->
            <div class="file-actions">
              <!-- View Button - Always show when file exists -->
              <a
                v-if="item.url || item.uploadRequest"
                :href="getFileUrl(item)"
                target="_blank"
                class="action-btn view-btn"
                @click.stop
                :title="$t('viewFile')"
              >
                <Icon name="mdi:eye-outline" size="14" />
              </a>

              <!-- Delete Entry Button - Always visible -->
              <button
                class="action-btn delete-entry-btn"
                type="button"
                @click.stop="removeItem(index)"
                :title="$t('deleteEntry')"
              >
                <Icon name="mdi:delete-outline" size="14" />
              </button>
            </div>
          </div>

          <input
            :ref="(el) => setInputRef(el, index)"
            type="file"
            class="hidden-input"
            :accept="acceptedTypes"
            @change="(e) => handleFileChange(e, index)"
          />
        </div>

        <!-- Name field -->
        <div class="mt-2">
          <SharedUiFormBaseInput
            v-model="item.name"
            :label="$t('fileName')"
            :placeholder="$t('enterFileName')"
            icon-left="mdi:tag-outline"
          />
        </div>
      </div>
    </div>

    <button type="button" class="add-btn" @click.prevent="addItem">
      <Icon name="mdi:plus" />
      {{ $t("addFile") }}
    </button>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const acceptedTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  maxFileSizeMB: {
    type: Number,
    default: 20,
  },
});

const emit = defineEmits(["update:modelValue"]);
const { $toast } = useNuxtApp();
const { t } = useI18n();

const inputRefs = ref({});
const setInputRef = (el, index) => {
  if (el) inputRefs.value[index] = el;
};

// Helper to extract extension from URL
const getExtensionFromUrl = (url) => {
  if (!url) return "";
  const match = url.match(/\.([^./]+)$/);
  return match ? "." + match[1].toLowerCase() : "";
};

const items = ref(
  props.modelValue.length
    ? props.modelValue.map((att) => ({
        id: att.id || 0,
        name: att.name || "",
        url: att.url || "",
        extension: att.extension || getExtensionFromUrl(att.url) || "",
        dragging: false,
        uploadRequest: att.uploadRequest || null,
      }))
    : [],
);

// Get filename for display
const getFileName = (item) => {
  if (item.name) return item.name;
  if (item.uploadRequest?.fileName) return item.uploadRequest.fileName;
  if (item.url) {
    const parts = item.url.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[^/.]+$/, ""); // Remove extension
  }
  return t("file");
};

// Get full file URL for viewing
const getFileUrl = (item) => {
  if (item.uploadRequest) {
    // For newly uploaded files (base64), create a blob URL
    if (item.uploadRequest.data) {
      const byteCharacters = atob(item.uploadRequest.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/octet-stream" });
      return URL.createObjectURL(blob);
    }
  }

  // For existing files from server
  if (item.url) {
    if (item.url.startsWith("http")) return item.url;
    return apiBase + item.url;
  }

  return "#";
};

const addItem = () => {
  items.value.push({
    id: 0,
    name: "",
    url: "",
    extension: "",
    dragging: false,
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
  if (file) processFile(file, index);
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

  try {
    const base64 = await toBase64(file);
    const extension = "." + file.name.split(".").pop().toLowerCase();

    items.value[index] = {
      ...items.value[index],
      extension,
      name: items.value[index].name || file.name.replace(/\.[^/.]+$/, ""),
      url: "", // Clear any existing URL
      uploadRequest: {
        fileName: file.name.replace(/\.[^/.]+$/, ""),
        extension,
        uploadType: 2,
        data: base64,
      },
    };
    emitUpdate();
  } catch {
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

const getExtIcon = (ext) => {
  const map = {
    ".pdf": "mdi:file-pdf-box",
    ".doc": "mdi:file-word-box",
    ".docx": "mdi:file-word-box",
    ".xls": "mdi:file-excel-box",
    ".xlsx": "mdi:file-excel-box",
    ".ppt": "mdi:file-powerpoint-box",
    ".pptx": "mdi:file-powerpoint-box",
    ".zip": "mdi:folder-zip",
    ".rar": "mdi:folder-zip",
    ".txt": "mdi:file-document-outline",
  };
  return map[ext] || "mdi:file-outline";
};

const getExtClass = (ext) => {
  if ([".pdf"].includes(ext)) return "ext-pdf";
  if ([".doc", ".docx"].includes(ext)) return "ext-word";
  if ([".xls", ".xlsx"].includes(ext)) return "ext-excel";
  if ([".ppt", ".pptx"].includes(ext)) return "ext-ppt";
  if ([".zip", ".rar"].includes(ext)) return "ext-zip";
  return "ext-default";
};

const emitUpdate = () => {
  emit(
    "update:modelValue",
    items.value.map((item) => ({
      id: item.id || 0,
      name: item.name,
      url: item.url || "",
      extension: item.extension || "",
      type: 2,
      uploadRequest: item.uploadRequest,
    })),
  );
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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

.file-uploaded-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  text-align: center;
  position: relative;

  .file-meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;

    .file-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
      word-break: break-all;
      max-width: 160px;
    }

    .file-ext {
      font-size: 0.7rem;
      color: var(--text-sub);
    }
  }

  .file-actions {
    position: absolute;
    top: 6px;
    inset-inline-end: 6px;
    display: flex;
    gap: 4px;
    background: var(--bg-surface);
    border-radius: 20px;
    padding: 2px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

    .action-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;

      &.view-btn {
        background: var(--primary-soft);
        color: var(--primary);
        text-decoration: none;

        &:hover {
          background: var(--primary);
          color: #fff;
        }
      }

      &.delete-entry-btn {
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;

        &:hover {
          background: #dc3545;
          color: #fff;
        }
      }
    }
  }
}

.file-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.ext-pdf {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  &.ext-word {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
  }
  &.ext-excel {
    background: rgba(22, 163, 74, 0.1);
    color: #16a34a;
  }
  &.ext-ppt {
    background: rgba(234, 88, 12, 0.1);
    color: #ea580c;
  }
  &.ext-zip {
    background: rgba(161, 98, 7, 0.1);
    color: #a16207;
  }
  &.ext-default {
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
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
