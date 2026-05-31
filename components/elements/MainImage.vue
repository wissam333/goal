<template>
  <!-- <div> -->
  <ElementsVPlaceLoad
    v-if="!loaded"
    :width="width"
    class="mainImg"
    :classes="loadClasses"
    :light="light"
  />
  <NuxtImg
    format="webp"
    placeholder
    v-if="loaded"
    :id="id"
    :class="classes"
    :src="src"
    :alt="alt"
    class="mainImg"
    @error="activeVPlaceLoad"
    :sytle="style"
  />
</template>

<script setup>
const {
  src,
  width,
  height,
  id,
  classes,
  style,
  loadClasses,
  light,
  alt = "Image",
} = defineProps([
  "src",
  "id",
  "classes",
  "style",
  "width",
  "height",
  "loadClasses",
  "light",
  "alt",
]);
const loaded = ref(false);

const activeVPlaceLoad = (e) => {
  void("error loading image");
  loaded.value = false;
};

onMounted(() => {
  useCheckIfImageRendered(src, (exists) => {
    if (exists) loaded.value = true;
    else loaded.value = false;
  });
});
</script>

<style lang="scss" scoped>
.mainImg {
  height: 700px;
  @media (max-width: 991px) {
    height: 300px;
  }
}
</style>
