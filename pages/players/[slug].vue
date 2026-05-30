<template>
  <div class="page-wrap">
    <!-- Loading -->
    <div v-if="pending" class="skeleton-wrap">
      <div class="skeleton-hero" />
      <div class="skeleton-body">
        <div v-for="i in 4" :key="i" class="skeleton-stat" />
      </div>
    </div>

    <!-- Error -->
    <SharedUiFeedbackEmptyState
      v-else-if="error || !player"
      :title="$t('error.noData')"
      icon="mdi:account-off-outline"
    />

    <template v-else>
      <!-- Hero -->
      <div class="player-hero">
        <button class="back-btn" @click="navigateTo(`/teams/${player.team}`)">
          <Icon
            :name="locale === 'ar' ? 'mdi:arrow-right' : 'mdi:arrow-left'"
            size="18"
          />
          {{ teamName }}
        </button>

        <div class="hero-inner">
          <!-- Avatar -->
          <div class="hero-avatar">
            <img
              v-if="player.photo"
              :src="player.photo"
              :alt="player.title"
              width="100"
              height="100"
              loading="lazy"
              @error="onImgError"
            />
            <span v-else class="avatar-initial">{{
              player.title?.charAt(0)
            }}</span>
            <span v-if="player.number" class="hero-number"
              >#{{ player.number }}</span
            >
          </div>

          <!-- Info -->
          <div class="hero-info">
            <h1 class="hero-name">{{ player.title }}</h1>
            <div class="hero-badges">
              <span v-if="player.position" class="badge-pos">{{
                player.position
              }}</span>
              <span
                v-if="teamName"
                class="badge-team"
                @click="navigateTo(`/teams/${player.team}`)"
              >
                <img
                  v-if="teamLogo"
                  :src="teamLogo"
                  width="16"
                  height="16"
                  loading="lazy"
                  @error="onImgError"
                />
                {{ teamName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Stats row -->
        <div class="stats-section">
          <SharedUiCardsStats :stats="playerStats" :columns="4" />
        </div>

        <!-- Season progress -->
        <div class="section-card">
          <h3 class="section-title">
            <Icon name="mdi:progress-clock" size="18" />
            {{ $t("player.seasonProgress") }}
          </h3>
          <div class="progress-row">
            <span class="progress-label">
              {{ playedMatches }} / {{ totalSeasonMatches }}
              {{ $t("fixtures.matches") }}
            </span>
            <SharedUiIndicatorsProgress
              :value="seasonProgressPct"
              color="primary"
            />
            <span class="progress-pct">{{ seasonProgressPct }}%</span>
          </div>
        </div>

        <!-- Match history -->
        <div class="section-card">
          <h3 class="section-title">
            <Icon name="mdi:soccer-field" size="18" />
            {{ $t("player.matchHistory") }}
          </h3>

          <div v-if="playerMatches.length" class="match-history">
            <div
              v-for="match in playerMatches"
              :key="match.slug"
              class="history-row"
              @click="navigateTo(`/matches/${match.slug}`)"
            >
              <!-- Result badge -->
              <span
                class="h-result"
                :class="`result-${getResult(match).toLowerCase()}`"
              >
                {{ getResult(match) }}
              </span>

              <!-- Opponent -->
              <div class="h-opponent">
                <span class="h-opp-name">{{ getOpponentName(match) }}</span>
                <span class="h-score"
                  >{{ getTeamScore(match) }} – {{ getOppScore(match) }}</span
                >
              </div>

              <!-- Goals this match -->
              <div class="h-goals">
                <span
                  v-for="i in getGoalsInMatch(match)"
                  :key="i"
                  class="h-goal-icon"
                >
                  <Icon name="mdi:soccer" size="14" />
                </span>
              </div>

              <!-- MOTM -->
              <span v-if="match.motmWinner === player.slug" class="h-motm">
                <Icon name="mdi:star" size="14" />
                MOTM
              </span>

              <!-- Date -->
              <span class="h-date">{{ formatShortDate(match.date) }}</span>

              <Icon
                :name="
                  locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'
                "
                size="16"
                class="h-arrow"
              />
            </div>
          </div>
          <SharedUiFeedbackEmptyState
            v-else
            :title="$t('player.noMatches')"
            icon="mdi:calendar-remove-outline"
            small
          />
        </div>

        <!-- Share -->
        <div class="share-section">
          <div class="share-label">{{ $t("player.share") }}</div>
          <div class="share-row">
            <button v-if="supportsShare" class="share-btn native" title="Share" @click="nativeShare">
              <Icon name="mdi:share-variant" size="20" />
            </button>
            <button class="share-btn whatsapp" title="WhatsApp" @click="sharePlatform('whatsapp')">
              <Icon name="mdi:whatsapp" size="20" />
            </button>
            <button class="share-btn messenger" title="Messenger" @click="sharePlatform('messenger')">
              <Icon name="mdi:facebook-messenger" size="20" />
            </button>
            <button class="share-btn facebook" title="Facebook" @click="sharePlatform('facebook')">
              <Icon name="mdi:facebook" size="20" />
            </button>
            <button class="share-btn telegram" title="Telegram" @click="sharePlatform('telegram')">
              <Icon name="mdi:telegram" size="20" />
            </button>
            <button class="share-btn twitter" title="Twitter" @click="sharePlatform('twitter')">
              <Icon name="mdi:twitter" size="20" />
            </button>
            <button class="share-btn copy" title="Copy link" @click="copyLink">
              <Icon name="mdi:link-variant" size="20" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { syrianAr } from "~/utils/syrianAr";

const route = useRoute();
const { locale, t } = useI18n();
const { fetchPlayer, fetchMatches, fetchTeams } = useLeagueData();
const slug = computed(() => route.params.slug);

// Phase 1: player + all teams (teams is tiny)
const {
  data: player,
  pending: playerPending,
  error: playerError,
} = await useAsyncData(`player-${slug.value}`, () => fetchPlayer(slug.value));
const { data: teamsData } = await useAsyncData(
  `player-teams-${slug.value}`,
  () => fetchTeams(),
);

// Phase 2: matches filtered by player's team
const teamSlug = player.value?.team;

const { data: matchesData, pending: matchesPending } = await useAsyncData(
  `player-matches-${slug.value}`,
  () => (teamSlug ? fetchMatches({ team: teamSlug }) : []),
);

const pending = computed(() => playerPending.value || matchesPending.value);
const error = computed(() => playerError.value);
const allMatches = computed(() => matchesData.value || []);
const playedMatches_data = computed(() =>
  allMatches.value.filter((m) => m.status === "played"),
);
const teams = computed(() => teamsData.value || []);

// Team info
const teamMap = computed(() => {
  const m = {};
  teams.value.forEach((t) => {
    m[t.slug] = t;
  });
  return m;
});
const teamObj = computed(() =>
  player.value ? teamMap.value[player.value.team] : null,
);
const teamName = computed(() => teamObj.value?.title || "");
const teamLogo = computed(() => teamObj.value?.logo || null);

// Player's matches (games their team played)
const playerMatches = computed(() => {
  if (!player.value) return [];
  return playedMatches_data.value
    .filter(
      (m) =>
        m.homeTeam === player.value.team || m.awayTeam === player.value.team,
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
});

const playedMatches = computed(() => playerMatches.value.length);
const totalSeasonMatches = computed(() => allMatches.value.length || 1);
const seasonProgressPct = computed(() =>
  Math.round((playedMatches.value / totalSeasonMatches.value) * 100),
);

// Goals in a specific match
const getGoalsInMatch = (match) => {
  if (!player.value || !match.goalScorers) return 0;
  return match.goalScorers.filter((g) => g.player === player.value.slug).length;
};

// MOTM wins
const motmWins = computed(
  () =>
    playedMatches_data.value.filter((m) => m.motmWinner === slug.value).length,
);

// Cards
const playerCards = computed(() => {
  let y = 0,
    r = 0;
  for (const m of playedMatches_data.value) {
    for (const c of m.cards || []) {
      if (c.player === slug.value) {
        if (c.type === "red") r++;
        else y++;
      }
    }
  }
  return { yellow: y, red: r };
});

// Stats
const playerStats = computed(() => [
  {
    key: "goals",
    label: "player.goals",
    icon: "mdi:soccer",
    value: player.value?.goals || 0,
    color: "success",
  },
  {
    key: "apps",
    label: "player.appearances",
    icon: "mdi:calendar-check-outline",
    value: player.value?.appearances || playedMatches.value,
    color: "primary",
  },
  {
    key: "motm",
    label: "player.motmWins",
    icon: "mdi:star-outline",
    value: motmWins.value,
    color: "warning",
  },
  {
    key: "yellows",
    label: "player.yellows",
    icon: "mdi:square-rounded-outline",
    value: playerCards.value.yellow,
    color: "warning",
  },
  {
    key: "reds",
    label: "player.reds",
    icon: "mdi:square-rounded",
    value: playerCards.value.red,
    color: "error",
  },
]);

// Match helpers
const getOpponentSlug = (match) =>
  match.homeTeam === player.value?.team ? match.awayTeam : match.homeTeam;

const getOpponentName = (match) =>
  teamMap.value[getOpponentSlug(match)]?.title || getOpponentSlug(match);

const getTeamScore = (match) =>
  match.homeTeam === player.value?.team
    ? (match.homeScore ?? 0)
    : (match.awayScore ?? 0);

const getOppScore = (match) =>
  match.homeTeam === player.value?.team
    ? (match.awayScore ?? 0)
    : (match.homeScore ?? 0);

const getResult = (match) => {
  const ts = getTeamScore(match);
  const os = getOppScore(match);
  if (ts > os) return "W";
  if (ts === os) return "D";
  return "L";
};

// Date formatting
const dateFnsLocale = computed(() => (locale.value === "ar" ? syrianAr : enUS));
const formatShortDate = (d) => {
  try {
    return format(parseISO(d), "d MMM", { locale: dateFnsLocale.value });
  } catch {
    return d;
  }
};

// Share
const shareText = () => {
  if (!player.value) return "";
  const name = player.value.title;
  const goals = player.value.goals || 0;
  const team = teamName.value;
  return locale.value === "ar"
    ? `${name} 🌟 | ${team} | ${goals} أهداف هذا الموسم`
    : `${name} 🌟 | ${team} | ${goals} goals this season`;
};

const supportsShare = typeof navigator !== "undefined" && !!navigator.share;

const nativeShare = async () => {
  try {
    await navigator.share({ title: document.title, text: shareText(), url: window.location.href });
  } catch {}
};

const sharePlatform = (platform) => {
  const text = shareText() + "\n" + window.location.href;
  const url = window.location.href;
  const urls = {
    messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=291494419107518`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText())}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText())}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText() + "\n" + url)}`,
  };
  window.open(urls[platform], "_blank", "width=600,height=500");
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = window.location.href;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

const onImgError = (e) => {
  e.target.src = "/default-avatar.jpg";
  e.target.onerror = null;
};

useSeoMeta({
  title: () =>
    player.value
      ? `${player.value.title} | ${locale.value === "ar" ? "دوري القرية" : "Village League"}`
      : "Player",
});
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-bottom: calc(var(--bottom-nav-height) + 32px);
}

@keyframes sh {
  to {
    background-position: -200% 0;
  }
}
.skeleton-wrap {
  padding: 20px;
}
.skeleton-hero {
  height: 180px;
  border-radius: 16px;
  margin-bottom: 20px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}
.skeleton-body {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.skeleton-stat {
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}

// ── Player hero ────────────────────────────────────────────────────────────────
.player-hero {
  padding: 20px 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(to bottom, var(--bg-elevated), transparent);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0;
  margin-bottom: 20px;
  transition: color 0.15s;
  &:hover {
    color: var(--primary);
  }
}

.hero-inner {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-avatar {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid var(--primary);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}
.avatar-initial {
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary);
}

.hero-number {
  position: absolute;
  bottom: -4px;
  inset-inline-end: -4px;
  background: var(--primary);
  color: #fff;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 0.7rem;
  font-weight: 800;
  border: 2px solid var(--bg-page);
}

.hero-info {
  flex: 1;
}
.hero-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge-pos {
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 7px;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-weight: 700;
}
.badge-team {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 7px;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    border-color: var(--primary);
  }
  img {
    border-radius: 3px;
  }
}

// ── Stats ──────────────────────────────────────────────────────────────────────
.stats-section {
  padding: 20px;
}

// ── Section cards ──────────────────────────────────────────────────────────────
.section-card {
  margin: 0 20px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

// ── Progress ───────────────────────────────────────────────────────────────────
.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.progress-pct {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  min-width: 36px;
  text-align: end;
}

// ── Match history ──────────────────────────────────────────────────────────────
.match-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  &:hover {
    background: var(--bg-surface);
    border: 1px solid var(--primary);
  }
}

.h-result {
  font-size: 0.68rem;
  font-weight: 800;
  border-radius: 5px;
  padding: 3px 7px;
  flex-shrink: 0;
  &.result-w {
    background: rgba(34, 197, 94, 0.15);
    color: #16a34a;
  }
  &.result-d {
    background: rgba(148, 163, 184, 0.15);
    color: #64748b;
  }
  &.result-l {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
  }
}

.h-opponent {
  flex: 1;
}
.h-opp-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}
.h-score {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.h-goals {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--primary);
}
.h-goal-icon {
  display: flex;
  align-items: center;
}

.h-motm {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(234, 179, 8, 0.12);
  color: #ca8a04;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 0.65rem;
  font-weight: 800;
}

.h-date {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.h-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-inline-start: auto;
}

// ── Share ──────────────────────────────────────────────────────────────────────
.share-section {
  margin-top: 12px;
}

.share-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
  margin-bottom: 8px;
}

.share-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.share-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  color: #fff;

  &:hover { transform: translateY(-2px); }
  &:active { transform: scale(0.95); }

  &.native    { background: var(--primary); &:hover { background: color-mix(in srgb, var(--primary) 85%, #000); } }
  &.messenger { background: #006AFF; &:hover { background: #0052cc; } }
  &.whatsapp  { background: #25D366; &:hover { background: #1da851; } }
  &.facebook  { background: #1877F2; &:hover { background: #166fe5; } }
  &.telegram  { background: #0088cc; &:hover { background: #0077b5; } }
  &.twitter   { background: #1DA1F2; &:hover { background: #1a8cd8; } }
  &.copy      { background: var(--text-muted); &:hover { background: var(--text-sub); } }
}

// ── Mobile ─────────────────────────────────────────────────────────────────────
@media (max-width: 576px) {
  .stats-section {
    padding: 14px;
  }
  .section-card {
    margin: 0 14px 14px;
    padding: 16px;
  }
  .hero-inner {
    flex-direction: column;
    text-align: center;
  }
  .hero-badges {
    justify-content: center;
  }
  .hero-name {
    font-size: 1.2rem;
  }
  .share-row {
    padding: 4px 14px 0;
  }
}
</style>
