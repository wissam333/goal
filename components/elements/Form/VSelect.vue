<template>
  <div class="select-wrapper">
    <label
      v-if="label"
      :for="id"
      class="fw w-100 form-label mb-3"
      :class="{ rtl: $i18n.locale === 'ar' }"
      :style="{ color: `#${color}`, opacity: 1, fontWeight: 'bold' }"
    >
      {{ label }}
      <span v-if="astricts === 'true'" class="astricts text-danger">*</span>
    </label>

    <Field
      :name="name"
      :id="id"
      as="select"
      class="form-control just-bottom-border"
      :style="{ border: `1px solid #${border_color}`, color: `#${color}` }"
      @change="handleSelectChange"
      v-slot="{ value }"
    >
      <option value="" disabled selected>
        {{ placeholder }}
      </option>

      <option
        v-for="item in items"
        :key="item.id || item.nameEn"
        :value="value2 ? item.nameEn : item.id"
        :selected="value == (value2 ? item.nameEn : item.id)"
        style="color: #000 !important"
      >
        {{ getOptionLabel(item) }}
      </option>

        
    </Field>


    <ErrorMessage :name="name" as="div" class="help is-invalid" />
  </div>
</template>

<script setup>
import { Field, ErrorMessage } from "vee-validate";

const emit = defineEmits(["cities", "isLoaded"]);
const { api } = useRuntimeConfig();

const props = defineProps({
  value2: { type: Boolean, default: false },
  way2: { type: Boolean, default: false },
  items: { required: true },
  name: { type: String, required: true },
  id: { type: String, default: "text", required: true },
  label: { type: String },
  placeholder: { type: String, default: "" },
  border_color: { type: String, default: "57585a" },
  color: { type: String, default: "57585a" },
  astricts: { type: String, default: "false" },
});

/**
 * Logic Improvement: Abstracted label translation
 * Maintains "way2" and "useTranslate" logic for backward compatibility
 */
const getOptionLabel = (item) => {
  if (props.way2) {
    return useI18n().locale.value === "ar" ? item.arabicName : item.englishName;
  }
  // Ensure useTranslate composable is available globally as in your reference
  return useTranslate(item, "name");
};

/**
 * Optimized API Logic
 * Preserves the exact behavior for 'countries' -> 'cities' dependency
 */
const handleSelectChange = async (event) => {
  const selectedValue = event.target.value;

  if (props.name === "countries" && selectedValue) {
    emit("isLoaded", true);

    try {
      const { data, error } = await useGetSiteApi().GetById(
        api.CitiesByCountryApi,
        selectedValue
      );

      if (error.value && error.value.statusCode === 401) {
        await useReauthorization().reAuthorize();
      }

      if (data.value) {
        emit("cities", data.value);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
    } finally {
      emit("isLoaded", false);
    }
  }
};
</script>

<style lang="scss" scoped>
.form-label {
  &.rtl {
    text-align: right;
  }
}

.form-control {
  background: #d1d2d272;
  border-radius: 4px;
  font-size: 16px;
  color: #000;
  height: 54px;
  width: 100%;
  appearance: select; /* Ensures default arrow shows on all browsers */

  &:focus {
    border-color: #495057;
    box-shadow: 0 0 0 0.2rem rgba(154, 33, 55, 0.25);
    outline: none;
  }

  &.rtl {
    direction: rtl;
  }
}

.just-bottom-border {
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
}

.help.is-invalid {
  margin-top: 10px;
  color: #dc3545;
  font-size: 14px;
}

.astricts.text-danger {
  color: #dc3545 !important;
  font-size: 18px !important;
  margin: 0 4px;
}

/* Fix for Select Background Icons in RTL */
.form-control.rtl.is-invalid {
  background-position: left calc(0.375em + 0.1875rem) center;
}
</style>
