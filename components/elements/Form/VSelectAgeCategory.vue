<template>
    <div class="mb-5">
      <label
      style="opacity: 1;"
        :for="id"
        :style="`color: #${color}`"
        :class="`  w-100 text-start  form-label mb-2 ${!isEn() ? 'rtl' : ''}`"
        
      >
        {{ label }}
        <span v-if="astricts == 'true' ?? false" class="astricts">*</span>
       <span v-if="astricts == 'false' ?? false" class="astricts"></span>
  
      </label>
      <VField
        :name="name"
        v-slot="{ value }"
        class="form-control just-bottom-border mt-1"
        :style="`border:1px solid #${color}; color: #${color};`"
        :id="id"
        as="select"
        @change="getCitiesForCountry($event, name)"
      >
        <option value="" disabled>
          {{ placeholder }}
        </option>
        <!-- <option v-for="item in items" :key="item" :value="item" :selected="value && value.includes(item)">{{ useTranslate(item, 'Name') }}</option> -->
        <option
          v-for="item in items"
          :key="item"
          :value="item.id"
          :style="` color: #000;`"
          :selected="value && value == item.id"
        >
          {{ isEn() ? item.en_title : item.ar_title }}
        </option>
      </VField>
      <VErrorMessage :name="name" as="div" class="help is-invalid" />
      
    </div>
  </template>
  
  <script setup>
  const emit = defineEmits(["cities", "isLoaded"]);
  const { apiBase, api } = useRuntimeConfig();
  const props = defineProps({
    items: {
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      default: "text",
      required: true,
    },
    label: {
      type: String,
    },
    placeholder: {
      type: String,
      default: "",
    },
    border_color: {
      type: String,
      default: `000`,
    },
    color: {
      type: String,
      default: `000`,
    },
    astricts: {
      type: String,
      default: `false`,
    },
  });
  
  const getCitiesForCountry = async (event, name) => {
    if (name == "countries") {
      emit("isLoaded", true);
      let countryId = event.target.value;
      const { data, error, pending, refresh } = await useGetSiteApi().GetById(
        api.CitiesByCountryApi,
        countryId
      );
  
      // refetch the token if 401 error occure
      if (error.value && error.value.statusCode == 401) {
        await useReauthorization().reAuthorize();
      }
      // Emit The Value When Fetching It
      if (data.value) {
        emit("cities", data.value);
        emit("isLoaded", false);
      }
    }
  };
  </script>
  
  <style lang="scss" scoped>
  input {
    &.rtl {
      direction: rtl;
    }
  }
  .form-floating > label {
    &.rtl {
      right: 0;
      left: unset;
    }
  }
  .form-check-input:focus {
    box-shadow: none;
  }
  .form-check > label {
    color: #aaa;
  }
  .form-floating > label {
    color: #aaa;
  }
  .form-control {
    height: 54px;
    border: none;
    // border-bottom: 1px solid #46cc11;
    border-radius: 0px;
    outline: none;
    box-shadow: none;
    background-color: transparent;
    // color: #07c85b;
  }
  .form-control:not(:placeholder-shown) {
    padding-top: 0.625rem;
  }
  .help.is-invalid {
    letter-spacing: 0.03rem;
  }
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
    background-position: left calc(0.375em + 0.1875rem) center;
  }
  </style>
  