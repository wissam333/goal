<template>
    <!-- <div> -->
    <ElementsVPlaceLoad v-if="!loaded" :width="width" :height="height" :classes="loadClasses" :light="light" />
    <NuxtImg 
        format="webp" loading="lazy"
        v-if="loaded" :id="id" :class="classes" :src="src" :alt="alt" @error="activeVPlaceLoad" :sytle="style"
    />
</template>

<script setup>
const { src, width, height, id, classes, style, loadClasses, light, alt = 'Image' } = defineProps(['src', 'id', 'classes', 'style', 'width', 'height', 'loadClasses', 'light', 'alt']);
const loaded = ref(false);

const activeVPlaceLoad = (e) => {
    console.log('error loading image');
    loaded.value = false
}

onMounted(() => {
    useCheckIfImageRendered(src, (exists) => {
        if (exists) loaded.value = true;
        else loaded.value = false
    });
})

</script>