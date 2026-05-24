<template>
  <div class="mb-2 position-relative">
    <Field :name="name" v-slot="{ field, meta }">
      <label
        v-if="label"
        :for="id"
        class="w-100 form-label mb-3"
        :class="{ rtl: $i18n.locale === 'ar' }"
        :style="{ color: `#${color}` }"
      >
        {{ label }}
        <span v-if="astricts === 'true'" class="astricts">*</span>
      </label>

      <div class="input-frame">
        <input
          v-bind="field"
          :id="id"
          :placeholder="placeholder"
          :type="inputType"
          :autocomplete="autocomplete"
          :disabled="disabled"
          class="form-control"
          :class="{
            rtl: $i18n.locale === 'ar',
            'is-valid': meta.valid && meta.touched,
            'is-invalid': !meta.valid && meta.touched,
            'disabled-input': disabled,
          }"
          :style="{
            color: `#${color}`,
            height: height,
            borderColor:
              meta.touched && !meta.valid ? '#dc3545' : `#${border_color}`,
          }"
        />

        <span
          v-if="activePasswordEye"
          class="show-hide-password pcc"
          :class="{ rtl: $i18n.locale === 'ar' }"
        >
          <i
            v-if="!isPasswordVisible"
            class="fa fa-eye fa-fw"
            @click="togglePassword(true)"
          ></i>
          <i
            v-else
            class="fa fa-eye-slash fa-fw"
            @click="togglePassword(false)"
          ></i>
        </span>
      </div>

      <ErrorMessage
        :name="name"
        as="div"
        class="help w-100 is-invalid"
      />
    </Field>
  </div>
</template>

<script setup>
import { Field, ErrorMessage } from "vee-validate";
import { ref, computed } from "vue";

const props = defineProps({
  type: { type: String, default: "text", required: true },
  name: { type: String, required: true },
  id: { type: String, default: "text", required: true },
  label: { type: String },
  placeholder: { type: String, default: "" },
  autocomplete: { type: String, default: "true" },
  activePasswordEye: { type: Boolean, default: false },
  astricts: { type: String, default: "false" },
  border_color: { type: String, default: "57585a" },
  color: { type: String, default: "57585a" },
  height: { type: String, default: "54px" },
  disabled: { type: Boolean, default: false },
});

// State management for password toggle
const isPasswordVisible = ref(false);

// Compute input type based on current visibility toggle
const inputType = computed(() => {
  if (props.type === "password" && isPasswordVisible.value) return "text";
  return props.type;
});

// Methods (Maintained as functions to avoid logic break)
const togglePassword = (visible) => {
  isPasswordVisible.value = visible;
};

// Kept for backward compatibility if any parent tries to call them via template refs
const showPassword = () => (isPasswordVisible.value = true);
const hidePassword = () => (isPasswordVisible.value = false);

// Expose methods just in case parents use template refs
defineExpose({ showPassword, hidePassword });
</script>

<style lang="scss" scoped>
/* Scoped variables for compatibility */
$second: #313193; // Adjust to your theme color

input {
  &.rtl {
    direction: rtl;
    text-align: right;
  }
}

.form-label {
  font-weight: bold;
  &.rtl {
    text-align: right;
  }
}

.form-control {
  background: #d1d2d272;
  border-radius: 4px;
  font-size: 16px;
  border: 1px solid #31319359;
  color: #333;
  transition: all 0.3s ease;

  &.disabled-input {
    color: #777 !important;
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #00000099 !important;
  }

  &:focus {
    border-color: $second;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
}

.input-frame {
  position: relative;

  .show-hide-password {
    position: absolute;
    color: #11118a;
    top: 50%;
    transform: translateY(-50%);
    right: 20px;
    z-index: 5;

    i {
      cursor: pointer;
      transition: 0.3s;
      &:hover {
        opacity: 0.7;
      }
    }

    &.rtl {
      right: auto;
      left: 20px;
    }
  }
}

.astricts {
  color: #dc3545 !important;
  font-size: 18px !important;
  vertical-align: middle;
}

.help.is-invalid {
  margin-top: 8px;
  color: #dc3545;
  font-size: 13px;
}
</style>
