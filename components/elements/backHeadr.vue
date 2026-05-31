<template>
  <div class="image-container" :style="{ width: width, height: height }">
    <Skeleton v-if="!loaded" class="skeleton-loader"></Skeleton>
    <!-- Main image -->
    <NuxtImg
      v-if="loaded"
      format="webp"
      loading="lazy"
      placeholder
      :id="id"
      :class="classes"
      :src="src"
      :alt="alt"
      @error="activeVPlaceLoad"
      :style="style"
    />
  </div>
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
.image-container {
  position: absolute;
  width: 100%;
  height: 476px;
  overflow: hidden;
  @media (max-width: 991px) {
    height: 100%;
  }
  img {
    object-fit: cover;
    width: 100%;
  }
}

.skeleton-loader {
  position: absolute !important;
  width: 100% !important;
  height: 100% !important;
  top: 0 !important;
}
</style>
