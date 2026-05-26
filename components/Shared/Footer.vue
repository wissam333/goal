<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <!-- Brand col -->
        <div class="footer-brand">
          <NuxtLink to="/" class="footer-logo-wrap">
            <Icon name="game-icons:soccer-ball" size="24" class="footer-icon" />
            <span class="footer-league-name">{{ $t("leagueName") }}</span>
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

        <!-- Season info -->
        <div class="footer-info-col">
          <h3 class="footer-col-title">{{ $t("footer.season") }}</h3>
          <ul class="footer-info-list">
            <li>
              <Icon name="mdi:trophy-outline" size="15" aria-hidden="true" />
              <span>{{ $t("leagueName") }} {{ config.public.season }}</span>
            </li>
            <li>
              <Icon
                name="mdi:account-group-outline"
                size="15"
                aria-hidden="true"
              />
              <span>{{ $t("footer.teamsCount") }} {{ teamCount }}</span>
            </li>
            <li>
              <Icon
                name="mdi:map-marker-outline"
                size="15"
                aria-hidden="true"
              />
              <span>{{ $t("footer.location") }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <span class="footer-copy">
          © {{ currentYear }} {{ $t("leagueName") }}
        </span>
        <span class="footer-built">
          <!-- <Icon
            name="mdi:heart"
            size="13"
            class="footer-heart"
            aria-hidden="true"
          /> -->
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
const config = useRuntimeConfig();
const currentYear = new Date().getFullYear();

const { fetchTeams } = useLeagueData();
const { data: teamCount } = await useAsyncData(
  'footer-team-count',
  async () => {
    const teams = await fetchTeams();
    return teams?.length || 0;
  }
);

const navItems = [
  { key: "standings", label: "nav.standings", to: "/standings" },
  { key: "fixtures", label: "nav.fixtures", to: "/fixtures" },
  { key: "bracket", label: "nav.bracket", to: "/bracket" },
  { key: "teams", label: "nav.teams", to: "/teams" },
  { key: "stats", label: "nav.stats", to: "/stats" },
];
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
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.footer-icon {
  color: var(--primary);
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
  transition: color 0.15s;
  padding: 4px 0;

  &:hover {
    color: var(--primary);
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
</style>
