<template>
  <section class="empty-data">
    <div class="row">
      <div class="col-12 col-sm-10 col-md-6 col-lg-4 mx-auto">
        <h5 class="text-center shadow-sm p-3 mb-5 bg-body rounded pt-5">
          {{ mes == '' ?  $t('no-data')  : mes }}
        </h5>
      </div>
    </div>
  </section>
</template>

<script setup>
  // const { marginTop, marginBottom } = defineProps(['marginTop', 'marginBottom'])

  const props = defineProps({
  mes: {
    type: String,
    default: "",
  },

});
// console.log(value);


</script>