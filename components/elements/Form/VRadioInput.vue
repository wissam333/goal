<template>
  <div class="form-check form-switch form-check-inline custom-switch-wrapper">
    <Field :name="name" :type="type" :value="value" v-slot="{ field }">
      <label v-if="label" :for="id" class="form-check-label fw-bold">
        {{ label }}
      </label>

      <input
        v-bind="field"
        class="form-check-input pointer-cursor"
        :id="id"
        :type="type"
        :name="name"
        :value="value"
        :checked="field.checked"
      />

      <ErrorMessage :name="name" as="div" class="help is-invalid" />
    </Field>
  </div>
</template>

<script setup>
import { Field, ErrorMessage } from "vee-validate";

const props = defineProps({
  type: {
    type: String,
    default: "checkbox", // Usually checkboxes or radio for switches
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    default: "switch-id",
    required: true,
  },
  label: {
    type: String,
  },
  value: {
    type: [String, Boolean], // Expanded to support boolean toggles better
  },
});
</script>

<style lang="scss" scoped>
/* Maintained your specific color branding */
$error-red: #dc3545;

.pointer-cursor {
  cursor: pointer;
}

.form-check-input {
  &:checked {
    background-color: $main;
    border-color: $main;
  }

  &:focus {
    box-shadow: none;
    border-color: rgba($main, 0.5);
  }
}

.form-check-label {
  color: $main;
  cursor: pointer;
  user-select: none;
  margin-inline-start: 8px;
}

.help {
  margin-top: 5px;
  font-size: 0.85rem;

  &.is-invalid {
    color: $error-red;
    display: block; // Ensures it breaks to a new line under the switch
    width: 100%;
  }
}

/* Cleaning up unused styles from original for better performance */
.form-control {
  &:focus {
    box-shadow: none;
  }
}
</style>
