<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <!-- Brand col -->
        <div class="footer-brand">
          <NuxtLink :to="logoLink" class="footer-logo-wrap">
            <img
              v-if="leagueLogoUrl"
              :src="leagueLogoUrl"
              width="48"
              height="48"
              class="footer-icon"
              alt="Logo"
            />
            <span v-if="showSkeleton" class="skeleton-text skeleton-footer-title" />
            <span v-else-if="displayTitle" class="footer-league-name">{{ displayTitle }}</span>
          </NuxtLink>
          <p class="footer-tagline">{{ $t("footer.tagline") }}</p>
        </div>

        <!-- Quick links -->
        <div class="footer-links-col">
          <h3 class="footer-col-title">{{ $t("footer.quickLinks") }}</h3>
          <nav class="footer-nav">
            <NuxtLink
              v-for="item in navItems"
              :key="item.key"
              :to="item.to"
              class="footer-nav-link"
            >
              {{ $t(item.label) }}
            </NuxtLink>
          </nav>
        </div>

        <!-- Season / platform info -->
        <div class="footer-info-col">
          <h3 class="footer-col-title">
            {{ isLeagueRoute ? $t("footer.season") : $t("footer.platform") }}
          </h3>
          <ul class="footer-info-list">
            <template v-if="isLeagueRoute">
              <li>
                <Icon name="mdi:trophy-outline" size="15" aria-hidden="true" />
                <span>{{ displayTitle }} {{ config.public.season }}</span>
              </li>
              <li>
                <Icon
                  name="mdi:account-group-outline"
                  size="15"
                  aria-hidden="true"
                />
                <span>{{ $t("footer.teamsCount") }} {{ teamCount }}</span>
              </li>
              <li v-if="leagueLocation">
                <span class="footer-location-link">
                  <Icon name="mdi:map-marker-outline" size="15" aria-hidden="true" />
                  <span>{{ leagueLocation }}</span>
                </span>
              </li>
            </template>
            <template v-else>
              <li>
                <Icon name="mdi:soccer" size="15" aria-hidden="true" />
                <span>{{ $t("footer.platformDesc") }}</span>
              </li>
              <li>
                <Icon name="mdi:broadcast" size="15" aria-hidden="true" />
                <span>{{ $t("footer.liveUpdates") }}</span>
              </li>
              <li>
                <NuxtLink to="/install" class="footer-location-link">
                  <Icon name="mdi:cellphone-arrow-down" size="15" aria-hidden="true" />
                  <span>{{ $t("footer.installApp") }}</span>
                </NuxtLink>
              </li>
              <li>
                <a
                  href="https://wa.me/963933446665"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="footer-location-link"
                >
                  <Icon name="mdi:whatsapp" size="15" aria-hidden="true" />
                  <span>{{ $t("footer.contact") }}</span>
                </a>
              </li>
            </template>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <span class="footer-copy">
          © {{ currentYear }} {{ displayTitle }}
        </span>
        <span class="footer-built">
          <a
            href="https://wa.me/963933446665"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-author-link"
            >{{ $t("footer.builtBy") }}</a
          >
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
const config = useRuntimeConfig();
const currentYear = new Date().getFullYear();
const { league, isLeagueRoute, leaguePath, leagueSlug, pending } = useCurrentLeague();

const displayTitle = computed(() => {
  if (!isLeagueRoute.value) return 'Green Ball'
  if (league.value?.name) return league.value.name
  return ''
})

const showSkeleton = computed(() => isLeagueRoute.value && pending.value)

const leagueLogoUrl = computed(() => {
  if (isLeagueRoute.value) return league.value?.logo || ''
  return '/logo.png'
})

const leagueLocation = computed(() => league.value?.location || null)

const logoLink = computed(() => {
  if (isLeagueRoute.value) return leaguePath().replace(/\/+$/, '') || '/'
  return '/'
})

const { fetchTeams } = useLeagueData();
const { data: teamCount, refresh: refreshTeamCount } = await useAsyncData(
  `footer-team-count-${leagueSlug.value || 'portal'}`,
  async () => {
    const teams = await fetchTeams();
    return teams?.length || 0;
  },
);
watch(() => leagueSlug.value, () => refreshTeamCount())

const navItems = computed(() => {
  if (!isLeagueRoute.value) {
    return [
      { key: "home", label: "nav.home", to: "/" },
      { key: "install", label: "footer.installApp", to: "/install" },
      { key: "account", label: "footer.account", to: "/account" },
    ]
  }
  const base = leaguePath().replace(/\/+$/, '')
  return [
    { key: "standings", label: "nav.standings", to: `${base}/standings` },
    { key: "fixtures", label: "nav.fixtures", to: `${base}/fixtures` },
    { key: "bracket", label: "nav.bracket", to: `${base}/bracket` },
    { key: "teams", label: "nav.teams", to: `${base}/teams` },
    { key: "stats", label: "nav.stats", to: `${base}/stats` },
  ]
})
</script>

<style lang="scss" scoped>
.footer {
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 20px 24px;

  @media (max-width: 576px) {
    padding: 32px 14px 20px;
  }
}

// ── Top section ───────────────────────────────────────────────────────────────
.footer-top {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-color);

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

// ── Brand ─────────────────────────────────────────────────────────────────────
.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-decoration: none;
}

.footer-icon {
  width: 120px;
  height: 120px;
  object-fit: contain;
  flex-shrink: 0;
}

.footer-league-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.footer-tagline {
  font-size: 0.83rem;
  color: var(--text-muted);
  line-height: 1.55;
  margin: 0;
  max-width: 260px;
}

// ── Columns ───────────────────────────────────────────────────────────────────
.footer-col-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin: 0 0 14px;
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-nav-link {
  font-size: 0.875rem;
  color: var(--text-sub);
  text-decoration: none;
  padding: 4px 0;
  position: relative;
  width: fit-content;

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    inset-inline-start: 0;
    width: 0;
    height: 2px;
    background: var(--primary);
    border-radius: 1px;
    transition: width 0.25s ease;
  }

  &:hover {
    color: var(--primary);

    &::after {
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    min-height: var(--touch-target);
    display: flex;
    align-items: center;
  }
}

// ── Info list ─────────────────────────────────────────────────────────────────
.footer-info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: var(--text-sub);

    .iconify {
      color: var(--primary);
      flex-shrink: 0;
    }
  }

  .footer-location-link {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-sub);
    text-decoration: none;
    width: fit-content;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      inset-inline-start: 0;
      width: 0;
      height: 2px;
      background: var(--primary);
      border-radius: 1px;
      transition: width 0.25s ease;
    }

    &:hover {
      color: var(--primary);

      &::after {
        width: 100%;
      }
    }
  }
}

// ── Bottom bar ────────────────────────────────────────────────────────────────
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.footer-copy,
.footer-built {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-heart {
  color: #ef4444;
}

.footer-author-link {
  color: var(--primary);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
.skeleton-footer-title {
  display: inline-block;
  width: 160px;
  height: 1.2rem;
  border-radius: 6px;
  background: var(--bg-elevated);
  position: relative;
  overflow: hidden;
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    animation: sk-shimmer 1.5s infinite;
  }
}
@keyframes sk-shimmer {
  100% { transform: translateX(100%); }
}
</style>
