<template>
  <div class="portal-page">
    <!-- Hero -->
    <section class="portal-hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="hero-orb orb-1" />
        <div class="hero-orb orb-2" />
        <div class="hero-grid" />
      </div>

      <div class="hero-content">
        <img
          src="/logo.png"
          alt="Green Ball"
          width="88"
          height="88"
          class="hero-logo"
        />
        <h1 class="hero-title">Green Ball</h1>
        <p class="hero-sub">{{ $t("portal.subtitle") }}</p>

        <div class="hero-features">
          <span v-for="f in featureChips" :key="f.key" class="feature-chip">
            <Icon :name="f.icon" size="14" />
            {{ $t(f.label) }}
          </span>
        </div>
      </div>

      <!-- Playable ball strip -->
      <div class="hero-play">
        <BallPhysics>
          <p>{{ $t("portal.playHint") }}</p>
          <span class="empty-hint">{{ $t("home.dragBall") }}</span>
        </BallPhysics>
      </div>
    </section>

    <div class="container">
      <!-- Section header -->
      <div class="section-head">
        <h2>{{ $t("portal.chooseLeague") }}</h2>
        <p>{{ $t("portal.chooseLeagueHint") }}</p>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="skeleton-grid">
        <div v-for="i in 3" :key="i" class="skeleton-card" />
      </div>

      <!-- Empty -->
      <SharedUiFeedbackEmptyState
        v-else-if="error || !leagues.length"
        :title="$t('portal.noLeagues')"
        icon="mdi:trophy-outline"
      />

      <!-- League cards -->
      <div v-else class="leagues-grid">
        <button
          v-for="(league, idx) in leagues"
          :key="league.id"
          type="button"
          class="league-card"
          :style="{
            '--card-accent': league.primary_color || 'var(--primary)',
            '--card-delay': `${idx * 60}ms`,
          }"
          @click="navigateTo(`/${league.slug}`)"
        >
          <div class="card-accent" />
          <div class="card-body">
            <div class="card-logo-wrap">
              <img
                v-if="league.logo"
                :src="league.logo"
                :alt="league.name"
                class="card-logo"
                width="64"
                height="64"
              />
              <div
                v-else
                class="card-logo-fallback"
                :style="{ background: league.primary_color || '#22c55e' }"
              >
                <Icon name="mdi:soccer" size="30" />
              </div>
            </div>
            <div class="card-info">
              <h3 class="card-name">{{ league.name }}</h3>
              <p v-if="league.location" class="card-location">
                <Icon name="mdi:map-marker-outline" size="14" />
                {{ league.location }}
              </p>
              <div class="card-tags">
                <span v-if="league.season_label" class="card-season">
                  {{ league.season_label }}
                </span>
                <span class="card-live">
                  <span class="card-live-dot" />
                  {{ $t("portal.open") }}
                </span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span>{{ $t("portal.enterLeague") }}</span>
            <Icon
              :name="locale === 'ar' ? 'mdi:arrow-left' : 'mdi:arrow-right'"
              size="18"
            />
          </div>
        </button>
      </div>

      <!-- Why Green Ball -->
      <section class="why-section">
        <div class="section-head">
          <h2>{{ $t("portal.whyTitle") }}</h2>
          <p>{{ $t("portal.whyHint") }}</p>
        </div>
        <div class="why-grid">
          <div v-for="item in whyItems" :key="item.key" class="why-card">
            <span class="why-icon" :style="{ background: item.tint }">
              <Icon :name="item.icon" size="22" />
            </span>
            <h3>{{ $t(item.title) }}</h3>
            <p>{{ $t(item.desc) }}</p>
          </div>
        </div>
      </section>

      <!-- CTA strip -->
      <section class="cta-strip">
        <div class="cta-inner">
          <div class="cta-text">
            <Icon name="mdi:cellphone-check" size="28" />
            <div>
              <h3>{{ $t("portal.pwaTitle") }}</h3>
              <p>{{ $t("portal.pwaHint") }}</p>
            </div>
          </div>
          <NuxtLink to="/install" class="cta-btn">
            {{ $t("portal.installApp") }}
            <Icon
              :name="locale === 'ar' ? 'mdi:arrow-left' : 'mdi:arrow-right'"
              size="16"
            />
          </NuxtLink>
        </div>
      </section>

      <!-- Archived seasons -->
      <section v-if="archived.length" class="archive-section">
        <div class="section-head">
          <h2>أرشيف البطولات</h2>
          <p>المواسم السابقة</p>
        </div>
        <div class="archive-grid">
          <NuxtLink
            v-for="s in archived"
            :key="s.id"
            :to="`/${s.league_slug}/seasons/${s.slug}`"
            class="archive-card"
          >
            <div class="archive-trophy">
              <Icon name="mdi:trophy" size="22" />
            </div>
            <div class="archive-body">
              <span class="archive-league">{{ s.league_name }}</span>
              <span class="archive-season">{{ s.name }}</span>
              <span v-if="s.snapshot?.champion" class="archive-champion">
                <Icon name="mdi:crown" size="14" />
                {{ getTeamName(s.snapshot, s.snapshot.champion) }}
              </span>
            </div>
            <Icon name="mdi:chevron-left" size="20" class="archive-arrow" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const { locale, t } = useI18n();
const { getLeagues } = useLeagues();
const supabase = useSupabase()
const leagues = ref([]);
const archived = ref([]);
const pending = ref(true);
const error = ref(null);

const getTeamName = (snapshot, slug) => snapshot?.teams?.find(t => t.slug === slug)?.title || slug

const featureChips = [
  { key: "live", icon: "mdi:broadcast", label: "portal.chipLive" },
  { key: "table", icon: "mdi:table", label: "portal.chipStandings" },
  { key: "predict", icon: "mdi:crystal-ball", label: "portal.chipPredict" },
  { key: "push", icon: "mdi:bell-outline", label: "portal.chipPush" },
];

const whyItems = [
  {
    key: "realtime",
    icon: "mdi:lightning-bolt",
    tint: "rgba(34,197,94,0.14)",
    title: "portal.whyRealtime",
    desc: "portal.whyRealtimeDesc",
  },
  {
    key: "predict",
    icon: "mdi:gesture-tap",
    tint: "rgba(59,130,246,0.14)",
    title: "portal.whyPredict",
    desc: "portal.whyPredictDesc",
  },
  {
    key: "mobile",
    icon: "mdi:cellphone",
    tint: "rgba(168,85,247,0.14)",
    title: "portal.whyMobile",
    desc: "portal.whyMobileDesc",
  },
  {
    key: "arabic",
    icon: "mdi:abjad-arabic",
    tint: "rgba(245,158,11,0.14)",
    title: "portal.whyArabic",
    desc: "portal.whyArabicDesc",
  },
];

const locationCount = computed(() => {
  const set = new Set(
    (leagues.value || []).map((l) => l.location).filter(Boolean),
  );
  return set.size || leagues.value.length;
});

onMounted(async () => {
  try {
    leagues.value = await getLeagues();
    if (supabase) {
      const { data } = await supabase
        .from('seasons')
        .select('id, name, slug, snapshot, league_id, archived_at, leagues!inner(slug, name)')
        .not('is_active', 'eq', true)
        .not('snapshot', 'is', null)
        .order('archived_at', { ascending: false })
      if (data) {
        archived.value = data.map(s => ({
          ...s,
          league_slug: s.leagues?.slug,
          league_name: s.leagues?.name,
          leagues: undefined,
        }))
      }
    }
  } catch {
    error.value = true;
  } finally {
    pending.value = false;
  }
});

useSeoMeta({
  title: "Green Ball — منصة الدوريات",
  ogTitle: "Green Ball",
  ogDescription: () => t("portal.subtitle"),
  ogImage: "/logo.png",
});
</script>

<style lang="scss" scoped>
.portal-page {
  min-height: 100%;
  padding-bottom: calc(var(--bottom-nav-height, 0px) + 8px);
}

// ── Hero ───────────────────────────────────────────────────
.portal-hero {
  position: relative;
  padding: 36px 16px 8px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
  &.orb-1 {
    width: 280px;
    height: 280px;
    top: -40px;
    left: 50%;
    transform: translateX(-60%);
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--primary) 35%, transparent),
      transparent 70%
    );
  }
  &.orb-2 {
    width: 200px;
    height: 200px;
    top: 80px;
    right: 5%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--primary) 18%, transparent),
      transparent 70%
    );
  }
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(
      color-mix(in srgb, var(--primary) 8%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--primary) 8%, transparent) 1px,
      transparent 1px
    );
  background-size: 36px 36px;
  mask-image: linear-gradient(to bottom, black 30%, transparent 95%);
  opacity: 0.5;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  max-width: 560px;
  margin: 0 auto 20px;
}

.hero-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse-dot 1.6s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.75);
  }
}

.hero-logo {
  border-radius: 18px;
  box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 25%, transparent);
}

.hero-title {
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  font-weight: 900;
  color: var(--text-primary);
  margin: 4px 0 0;
  letter-spacing: -0.02em;
}

.hero-sub {
  font-size: 0.98rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
  max-width: 360px;
}

.hero-features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-sub);
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  .iconify {
    color: var(--primary);
  }
}

.hero-play {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto 8px;
}

// ── Layout ─────────────────────────────────────────────────
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 8px 16px 32px;
}

.pstat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  .iconify {
    color: var(--primary);
    flex-shrink: 0;
  }
  strong {
    display: block;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
  }
  span {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
  }
}

.section-head {
  margin-bottom: 16px;
  h2 {
    margin: 0 0 4px;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
}

.skeleton-grid {
  display: grid;
  gap: 14px;
}

.skeleton-card {
  height: 148px;
  border-radius: 18px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}

@keyframes sh {
  to {
    background-position: -200% 0;
  }
}

// ── League cards ───────────────────────────────────────────
.leagues-grid {
  display: grid;
  gap: 14px;
}

.league-card {
  width: 100%;
  text-align: start;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
  background: var(--bg-surface);
  padding: 0;
  font: inherit;
  color: inherit;
  animation: card-in 0.45s ease both;
  animation-delay: var(--card-delay, 0ms);

  &:hover {
    border-color: var(--card-accent, var(--primary));
    box-shadow: 0 8px 28px
      color-mix(in srgb, var(--card-accent, var(--primary)) 18%, transparent);
    transform: translateY(-3px);
  }

  &:active {
    transform: translateY(-1px) scale(0.995);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-accent {
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--card-accent, var(--primary)),
    color-mix(in srgb, var(--card-accent, var(--primary)) 40%, transparent)
  );
}

.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 18px 14px;
}

.card-logo-wrap {
  flex-shrink: 0;
}

.card-logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-logo-fallback {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.card-location {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-season {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary);
  background: var(--primary-soft);
  padding: 3px 10px;
  border-radius: 20px;
}

.card-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 3px 10px;
  border-radius: 20px;
}

.card-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-top: 1px solid var(--border-color);
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--card-accent, var(--primary));
  background: color-mix(
    in srgb,
    var(--card-accent, var(--primary)) 4%,
    transparent
  );
}

// ── Why section ────────────────────────────────────────────
.why-section {
  margin-top: 40px;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.why-card {
  padding: 18px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  h3 {
    margin: 12px 0 6px;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  p {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--text-muted);
  }
}

.why-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}

// ── CTA ────────────────────────────────────────────────────
.cta-strip {
  margin-top: 28px;
}

.cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px;
  border-radius: 18px;
  background:
    radial-gradient(
      ellipse 80% 120% at 0% 50%,
      color-mix(in srgb, var(--primary) 16%, transparent),
      transparent 55%
    ),
    var(--bg-surface);
  border: 1px solid var(--border-color);
}

.cta-text {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  .iconify {
    color: var(--primary);
    flex-shrink: 0;
  }
  h3 {
    margin: 0 0 2px;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.15s,
    transform 0.12s;
  &:hover {
    background: color-mix(in srgb, var(--primary) 85%, #000);
  }
  &:active {
    transform: scale(0.98);
  }
}

.archive-section { margin-top: 32px; }
.archive-grid {
  display: flex; flex-direction: column; gap: 8px;
}
.archive-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  text-decoration: none;
  transition: all 0.15s;
  &:hover { border-color: var(--primary); background: var(--primary-soft); }
}
.archive-trophy {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, #f59e0b 16%, transparent);
  color: #f59e0b;
}
.archive-body {
  flex: 1; display: flex; flex-direction: column; gap: 2px;
  min-width: 0;
}
.archive-league {
  font-size: 0.7rem; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.3px;
}
.archive-season {
  font-size: 0.85rem; font-weight: 700; color: var(--text-primary);
}
.archive-champion {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.75rem; font-weight: 600; color: #f59e0b;
}
.archive-arrow {
  flex-shrink: 0; color: var(--text-muted);
}
</style>
