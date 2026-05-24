<template>
  <div v-if="images?.length" class="album">
    <div v-if="title" class="album-title">{{ title }}</div>
    <div class="album-grid" :class="`cols-${Math.min(columns, 4)}`">
      <a
        v-for="(img, i) in images"
        :key="i"
        :data-fancybox="galleryId"
        :href="img"
        :data-caption="captions?.[i] || ''"
        class="album-item"
      >
        <img
          :src="img"
          loading="lazy"
          class="album-thumb"
          @error="onImgError"
        />
      </a>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  images: { type: Array, default: () => [] },
  title: { type: String, default: "" },
  columns: { type: Number, default: 3 },
  captions: { type: Array, default: () => [] },
})

const galleryId = computed(() => `album-${Math.random().toString(36).slice(2, 8)}`)

const onImgError = (e) => {
  e.target.src = '/default-avatar.jpg'
  e.target.onerror = null
}
</script>

<style scoped>
.album {
  margin-top: 1rem;
}
.album-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}
.album-grid {
  display: grid;
  gap: 8px;
}
.cols-1 { grid-template-columns: 1fr; }
.cols-2 { grid-template-columns: repeat(2, 1fr); }
.cols-3 { grid-template-columns: repeat(3, 1fr); }
.cols-4 { grid-template-columns: repeat(4, 1fr); }
.album-item {
  display: block;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.album-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.album-thumb {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  display: block;
}
@media (max-width: 640px) {
  .cols-3, .cols-4 { grid-template-columns: repeat(2, 1fr); }
}
</style>
