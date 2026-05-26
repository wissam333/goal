<template>
  <div v-if="ad && visible" class="ad-section">
    <div class="container">
      <div class="ad-card-wrap">
        <a
          v-if="ad.link"
          :href="ad.link"
          target="_blank"
          rel="noopener noreferrer"
          class="ad-card"
        >
          <div class="ad-image">
            <NuxtImg
              v-if="ad.image"
              :src="ad.image"
              :alt="ad.title || ''"
              width="280"
              height="160"
              format="webp"
              loading="lazy"
            />
          </div>
          <div class="ad-body">
            <span v-if="ad.title" class="ad-title">{{ ad.title }}</span>
            <span v-if="ad.description" class="ad-desc">{{
              ad.description
            }}</span>
            <span class="ad-cta">
              <Icon name="mdi:open-in-new" size="14" />
            </span>
          </div>
        </a>
        <div v-else class="ad-card">
          <div class="ad-image">
            <NuxtImg
              v-if="ad.image"
              :src="ad.image"
              :alt="ad.title || ''"
              width="280"
              height="160"
              format="webp"
              loading="lazy"
            />
          </div>
          <div v-if="ad.title || ad.description" class="ad-body">
            <span v-if="ad.title" class="ad-title">{{ ad.title }}</span>
            <span v-if="ad.description" class="ad-desc">{{
              ad.description
            }}</span>
          </div>
        </div>
        <button class="ad-close" title="إغلاق" @click="visible = false">
          <Icon name="mdi:close" size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const { fetchSettings } = useLeagueData();
const ad = ref(null);
const visible = ref(true);

onMounted(async () => {
  const settings = await fetchSettings();
  if (settings?.ad?.image) {
    ad.value = settings.ad;
  }
});
</script>

<style lang="scss" scoped>
.ad-section {
  padding: 16px 0px;
}

.ad-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 12px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
}

.ad-image {
  flex-shrink: 0;
  width: 140px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-elevated);

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 576px) {
    width: 100px;
    height: 70px;
  }
}

.ad-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.ad-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ad-desc {
  font-size: 0.78rem;
  color: var(--text-sub);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ad-card-wrap {
  position: relative;
}

.ad-close {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-muted);
  z-index: 2;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-surface);
    color: var(--text-primary);
    border-color: var(--text-muted);
  }
}

.ad-cta {
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  margin-top: 2px;
}
</style>
