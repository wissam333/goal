<template>
  <div class="mb-5 position-relative">    
    <VField :name="name" v-slot="{ field, meta }">
      <label class="fw-bold w-100 text-start" :for="id" :style="`color: #${color}`" :class="`form-label mb-3   ${!isEn() ? 'rtl' : '' }`" v-if="label">
      {{ label }} 
     <span v-if="astricts == 'true' ?? false" class="astricts">*</span>
     <span v-if="astricts == 'false' ?? false" class="astricts"></span>
    </label>
      <textarea
        v-bind="field"
        class="form-control"
        :id="id"
        :style="`border:1px solid #${color};color: #${color};height: ${height};padding`"
        :rows="rows"
        :class="{
          'rtl': !isEn(),
          'is-valid': meta.valid && meta.touched,
          'is-invalid': !meta.valid && meta.touched,
        }"
        :placeholder="placeholder"
      ></textarea>

      <VErrorMessage :name="name" as="div" class="help is-invalid" />
    </VField>
    <label :for="id" :class="`form-label text-white ${!isEn() ? 'rtl' : '' }`" v-if="label">{{ label }}</label>
  </div>
</template>

<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    default: "text",
    required: true,
  },
  rows: {
    type: String,
    default: "10",
  },
  label: {
    type: String
  },
  placeholder: {
    type: String,
    default: "",
  },
  border_color: {
    type: String,
    default: `fff`
  },
  color: {
    type: String,
    default: `fff`
  },
  label: {
    type: String
  },
});

</script>

<style lang="scss" scoped>
  textarea {
    &.rtl { direction: rtl; }
   }
   .form-floating > label { 
      &.rtl { right: 0; left: unset; }
   }
    .form-check-input:focus { box-shadow: none; }
    .form-check > label { color: #aaa; }
    .form-floating > label { color: #aaa; }
    .form-control {
      height: auto;
      border: none;
      border-bottom: 1px solid #cccccc;
      border-radius: 0px;
      outline: none;
      box-shadow: none; 
      background: #d1d2d272;
      border-radius: 4px;
      font-size: 16px;
      color: #333;
      // background-color: transparent;
      // color: #aaa;
    }
    .help.is-invalid { letter-spacing: .03rem; }
  .form-control:focus,
  .form-control.is-invalid:focus, 
  .was-validated .form-control:invalid:focus {
    box-shadow: none;
  }

  .just-bottom-border {
    border-top: 0;
    border-left: 0;
    border-right: 0;
  }

  .help {
    margin-top: 10px;
    &.is-invalid {
      color: #dc3545;
    }
  }

  .form-control.rtl.is-valid, 
  .was-validated .rtl.form-control:valid,
  .form-control.rtl.is-invalid, 
  .was-validated .rtl.form-control:invalid {
    background-position: left calc(.375em + .1875rem) center;
  }

</style>