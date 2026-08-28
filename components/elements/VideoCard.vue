<template>
  <div
    class="vc-wrap"
    :class="[`vc-${aspect}`, { 'vc-live': playing }]"
  >
    <!-- Playing: native iframe (YouTube + Facebook embed). FB needs a wide frame to use its reliable desktop player -->
    <div v-if="playing" class="vc-track">
        <iframe
          :key="'f' + loadKey"
          :src="frameSrc"
          class="vc-frame"
          :class="{ 'vc-is-fb': isFacebook }"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowfullscreen
          frameborder="0"
          scrolling="no"
        ></iframe>
    </div>

    <!-- Poster (cover before play) -->
    <div v-if="!playing" class="vc-poster" @click="play">
      <img v-if="poster.image" :src="poster.image" class="vc-poster-img" :alt="poster.title || ''" loading="lazy" @load="onPosterLoad" />
      <div v-else class="vc-poster-fallback" :class="`vc-cover--${platform}`">
        <span v-if="isFacebook" class="vc-brand"><Icon name="mdi:facebook" size="16" /></span>
        <span v-else class="vc-brand"><Icon name="mdi:youtube" size="16" /></span>
      </div>
      <span class="vc-play-badge"><Icon name="mdi:play" size="30" /></span>
      <span v-if="poster.image" class="vc-watch">{{ isFacebook ? $t('match.watchOnFacebook') : $t('match.watchOnYouTube') }}</span>
      <span v-if="poster.title" class="vc-title">{{ poster.title }}</span>
    </div>

    <!-- Facebook embed note -->
    <p v-if="isFacebook" class="vc-note">{{ $t('match.embedNote') }}</p>

    <!-- controls -->
    <div class="vc-controls">
      <div class="vc-aspect">
        <button
          v-for="opt in aspectOptions"
          :key="opt.key"
          class="vc-ctl"
          :class="{ 'is-active': aspect === opt.key }"
          :title="opt.title"
          @click.stop="setAspect(opt.key)"
        >{{ opt.label }}</button>
        <button
          v-if="isFacebook"
          class="vc-ctl"
          :title="$t('match.openExternal')"
          @click.stop="openExternal"
        ><Icon name="mdi:open-in-new" size="14" /></button>
      </div>
      <a
        class="vc-external"
        :href="originalUrl"
        target="_blank"
        rel="noopener noreferrer"
        :title="$t('match.openExternal')"
      >
        <Icon name="mdi:open-in-new" size="14" />
      </a>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  url: { type: String, default: "" },
  embedUrl: { type: String, default: "" },
})

const { cleanFbUrl, buildEmbedUrl } = useVideoEmbed()

const isFacebook = computed(() =>
  /facebook\.com|fb\.watch|fb\.com/.test(props.url || props.embedUrl)
)
const isYoutube = computed(() =>
  /youtube\.com\/embed|youtube\.com|youtu\.be/.test(props.embedUrl || props.url)
)
const platform = computed(() => (isFacebook.value ? 'fb' : isYoutube.value ? 'yt' : 'other'))

const cleanHref = computed(() => cleanFbUrl(props.url || props.embedUrl))
const originalUrl = computed(() => cleanHref.value || props.embedUrl)
const embedSrc = computed(() => props.embedUrl || props.url)

const playing = ref(false)
const aspect = ref('wide')
const loadKey = ref(0)
const poster = ref({ image: null, title: null })
let fetched = false

const aspectKey = 'league-vid-aspect'

onMounted(() => {
  try {
    const a = localStorage.getItem(aspectKey)
    if (['wide', 'tall', 'fit'].includes(a)) aspect.value = a
  } catch {}
  fetchPoster()
})

const aspectOptions = [
  { key: 'wide', label: '16:9', title: '16:9' },
  { key: 'tall', label: '9:16', title: '9:16' },
  { key: 'fit', label: 'Fit', title: 'Fit' },
]

const frameSrc = ref('')

const setAspect = (key) => {
  aspect.value = key
  try { localStorage.setItem(aspectKey, key) } catch {}
}

const onPosterLoad = (e) => {
  // auto-switch to tall for portrait video (fixes big-width issue); skip for FB (needs a wide player)
  try {
    const img = e.target
    if (!isFacebook.value && img.naturalWidth && img.naturalHeight && img.naturalWidth < img.naturalHeight && aspect.value === 'wide') {
      aspect.value = 'tall'
    }
  } catch {}
}

const play = () => {
  playing.value = true
  loadKey.value++
  frameSrc.value = embedSrc.value || buildEmbedUrl(originalUrl.value)
}

const openExternal = () => {
  window.open(originalUrl.value, '_blank', 'noopener')
}

const fetchPoster = async () => {
  if (fetched || isFacebook.value === false) return
  fetched = true
  try {
    const { image, title } = await $fetch(`/api/video-poster?url=${encodeURIComponent(originalUrl.value)}`)
    if (image) poster.value.image = image
    if (title) poster.value.title = title
  } catch {}
}
</script>

<style scoped>
.vc-wrap {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}
.vc-wrap.vc-wide { aspect-ratio: 16 / 9; }
.vc-wrap.vc-tall { aspect-ratio: 9 / 16; max-height: 70vh; }
.vc-wrap.vc-fit { height: min(70vh, 680px); }

.vc-track {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.vc-track::-webkit-scrollbar { display: none; }

.vc-frame {
  position: relative;
  flex: 0 0 auto;
  min-width: 560px;
  height: 100%;
  border: 0;
}
/* FB needs a wide frame to use its reliable desktop player, even for portrait videos */
.vc-frame.vc-is-fb { min-width: 560px; }
/* Non-FB (YouTube) portrait can remain narrow-tall */
.vc-wrap.vc-tall .vc-frame:not(.vc-is-fb) { min-width: 320px; max-height: 70vh; }

.vc-poster {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  cursor: pointer;
  color: #fff;
  background: #000;
  overflow: hidden;
}
.vc-poster-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.vc-poster-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vc-cover--fb { background: linear-gradient(135deg, #1877f2, #0a59c6); }
.vc-cover--yt { background: linear-gradient(135deg, #ff0000, #c00); }
.vc-cover--other { background: #141414; }

.vc-play-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #000;
  padding-inline-start: 5px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  z-index: 2;
}
.vc-watch {
  position: relative;
  z-index: 2;
  margin-bottom: 34px;
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 12px;
  border-radius: 999px;
}
.vc-title {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 26px 12px 8px;
  font-size: 0.78rem;
  text-align: center;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
}

.vc-controls {
  position: absolute;
  inset-inline: 0;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: linear-gradient(rgba(0,0,0,0.55), transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.vc-wrap:hover .vc-controls { opacity: 1; pointer-events: auto; }

.vc-aspect {
  display: flex;
  gap: 6px;
  align-items: center;
}
.vc-ctl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  min-width: 30px;
  padding: 0 7px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}
.vc-ctl.is-active {
  background: #fff;
  color: #111;
}
.vc-external {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  min-width: 30px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.vc-note {
  margin: 8px 2px 0;
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--text-muted, #888);
  text-align: center;
}
</style>
