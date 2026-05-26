<template>
  <div
    class="drop-area"
    @drop="handleDrop"
    @dragover.prevent
    @click="handleAreaClick"
  >
    <div v-if="!previewImage" class="upload-box">
      <label for="fileInput" class="upload-icon">
        <font-awesome class="text-white" :icon="['fas', 'upload']" />
      </label>
      <input
        id="fileInput"
        type="file"
        style="display: none"
        accept="image/*"
        @change="handleFileInput"
      />
      <h5 class="fw-bold">{{ dropMessage }}</h5>
    </div>

    <div v-else class="image-preview-container">
      <div class="image-preview">
        <img :src="previewImage" alt="Uploaded image" />
        <button class="remove-image-btn" @click.stop="removeImage">
          <font-awesome :icon="['fas', 'times']" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const { $awn } = useNuxtApp();
const { locale } = useI18n();

const props = defineProps({
  fileName: {
    type: String,
    default: "",
  },
  maxFileSizeMB: {
    type: Number,
    default: 2,
  },
  question: {
    type: Object,
    default: null,
  },
  ans: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["file-uploaded", "file-error", "file-removed"]);

const uploadedFileName = ref(props.fileName);
const previewImage = ref("");

const handleAreaClick = () => {
  if (!previewImage.value) {
    document.getElementById("fileInput")?.click();
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    processFile(file);
  } else {
    showError(
      locale.value === "ar"
        ? "الرجاء إسقاط ملف صورة فقط"
        : "Please drop an image file only"
    );
  }
};

const handleFileInput = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    processFile(file);
  } else {
    showError(
      locale.value === "ar"
        ? "الرجاء اختيار ملف صورة فقط"
        : "Please select an image file only"
    );
  }
  event.target.value = ""; // Reset input
};

const processFile = (file) => {
  if (file && file.size <= props.maxFileSizeMB * 1024 * 1024) {
    uploadedFileName.value = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      previewImage.value = reader.result;
      const base64String = reader.result.split(",")[1];
      emit(
        "file-uploaded",
        {
          file,
          fileName: file.name,
          base64: base64String,
          url: reader.result,
        },
        props.question,
        props.ans
      );
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      showError(
        locale.value === "ar"
          ? "خطأ في قراءة الملف. يُرجى المحاولة مرة أخرى."
          : "Error reading file. Please try again."
      );
    };
    reader.readAsDataURL(file);
  } else {
    showError(
      locale.value === "ar"
        ? `حجم الملف يتجاوز الحد الأقصى المسموح به (${props.maxFileSizeMB}MB). يُرجى اختيار ملف أصغر.`
        : `File size exceeds the maximum allowed (${props.maxFileSizeMB}MB). Please select a smaller file.`
    );
  }
};

const removeImage = () => {
  previewImage.value = "";
  uploadedFileName.value = "";
  emit("file-removed", props.question, props.ans);
};

const showError = (message) => {
  $awn.alert(message);
  emit("file-error", message);
};

const dropMessage = computed(() => {
  return uploadedFileName.value
    ? `${locale.value === "ar" ? "تم الرفع:" : "Uploaded:"} ${
        uploadedFileName.value
      }`
    : locale.value === "ar"
    ? "اسحب وأفلِت صورة هنا أو انقر للاختيار"
    : "Drag & drop an image here or click to select";
});
</script>

<style lang="scss" scoped>
.drop-area {
  position: relative;
  width: 100%;
  height: 300px;
  border: 2px dashed $gold;
  border-radius: 6px;
  text-align: center;
  transition: all 0.2s linear;
  cursor: pointer;

  &:hover {
    box-shadow: 0px 2px 6px rgba(4, 119, 81, 0.3);
  }

  .upload-box {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .upload-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 45px;
      height: 45px;
      margin-bottom: 5px;
      background-color: $gold;
      border-radius: 6px;

      &:hover {
        cursor: pointer;
      }
    }
  }

  .image-preview-container {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    .image-preview {
      max-width: 100%;
      max-height: 100%;

      img {
        max-width: 100%;
        max-height: 240px;
        object-fit: contain;
        border-radius: 4px;
      }

      .remove-image-btn {
        position: absolute;
        top: 10px;
        inset-inline-start: 10px;
        width: 34px;
        height: 34px;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        font-size: 12px;

        &:hover {
          background-color: #cc0000;
        }
      }
    }
  }
}
</style>
