<template>
  <div class="page-wrap">
    <!-- Back button -->
    <div class="back-row">
      <button class="back-btn" @click="navigateTo('/fixtures')">
        <Icon :name="locale === 'ar' ? 'mdi:arrow-right' : 'mdi:arrow-left'" size="18" />
        {{ $t('fixtures.back') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="skeleton-hero" />

    <!-- Error -->
    <SharedUiFeedbackEmptyState
      v-else-if="error || !match"
      :title="$t('error.noData')"
      icon="mdi:soccer-field"
    />

    <template v-else>
      <!-- ① Scoreboard Hero -->
      <div
        class="scoreboard-hero"
        :class="`status-${match.status}`"
      >
        <!-- Background pitch lines -->
        <div class="pitch-bg" aria-hidden="true">
          <div class="pitch-circle" />
          <div class="pitch-line" />
        </div>

        <!-- Status badge -->
        <div class="hero-status">
          <span v-if="match.status === 'live'" class="badge-live">
            <span class="live-dot" /> LIVE
          </span>
          <span v-else-if="match.status === 'played'" class="badge-ft">FT</span>
          <span v-else class="badge-upcoming">
            {{ $t('match.upcoming') }} · {{ formatMatchDate(match.date) }}
          </span>
        </div>

        <!-- Teams + Score -->
        <div class="hero-teams">
          <!-- Home -->
          <div class="hero-team home" @click="navigateTo(`/teams/${match.homeTeam}`)">
            <div class="hero-logo">
              <NuxtImg
                v-if="homeTeam?.logo"
                :src="homeTeam.logo"
                :alt="homeTeam.title"
                width="64" height="64"
                format="webp" loading="lazy"
              />
              <span v-else class="hero-initial">{{ homeTeam?.title?.charAt(0) }}</span>
            </div>
            <span class="hero-team-name">{{ homeTeam?.title }}</span>
            <span class="hero-team-label">{{ $t('match.home') }}</span>
          </div>

          <!-- Score -->
          <div class="hero-score">
            <template v-if="match.status !== 'upcoming'">
              <span class="score-num" :class="{ winner: match.homeScore > match.awayScore }">
                {{ match.homeScore ?? 0 }}
              </span>
              <span class="score-dash">–</span>
              <span class="score-num" :class="{ winner: match.awayScore > match.homeScore }">
                {{ match.awayScore ?? 0 }}
              </span>
            </template>
            <template v-else>
              <!-- Countdown -->
              <div class="countdown">
                <div class="countdown-unit">
                  <span class="countdown-num">{{ countdown.hours }}</span>
                  <span class="countdown-label">{{ $t('match.hours') }}</span>
                </div>
                <span class="countdown-sep">:</span>
                <div class="countdown-unit">
                  <span class="countdown-num">{{ countdown.minutes }}</span>
                  <span class="countdown-label">{{ $t('match.minutes') }}</span>
                </div>
                <span class="countdown-sep">:</span>
                <div class="countdown-unit">
                  <span class="countdown-num">{{ countdown.seconds }}</span>
                  <span class="countdown-label">{{ $t('match.seconds') }}</span>
                </div>
              </div>
            </template>

            <!-- Week + Venue -->
            <div class="score-meta">
              <span>{{ $t('match.week') }} {{ match.week }}</span>
              <span v-if="match.venue">· {{ match.venue }}</span>
            </div>
          </div>

          <!-- Away -->
          <div class="hero-team away" @click="navigateTo(`/teams/${match.awayTeam}`)">
            <div class="hero-logo">
              <NuxtImg
                v-if="awayTeam?.logo"
                :src="awayTeam.logo"
                :alt="awayTeam.title"
                width="64" height="64"
                format="webp" loading="lazy"
              />
              <span v-else class="hero-initial">{{ awayTeam?.title?.charAt(0) }}</span>
            </div>
            <span class="hero-team-name">{{ awayTeam?.title }}</span>
            <span class="hero-team-label">{{ $t('match.away') }}</span>
          </div>
        </div>
      </div>

      <!-- ② Goal Scorers -->
      <div v-if="match.goalScorers?.length" class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:soccer" size="18" />
          {{ $t('match.goals') }}
        </h3>
        <div class="goals-grid">
          <!-- Home goals -->
          <div class="goals-col goals-home">
            <div
              v-for="goal in homeGoals"
              :key="`${goal.player}-${goal.minute}`"
              class="goal-item"
            >
              <span class="goal-player">{{ getPlayerName(goal.player) }}</span>
              <span class="goal-minute">{{ goal.minute }}'</span>
              <Icon name="mdi:soccer" size="14" class="goal-icon" />
            </div>
          </div>
          <!-- Divider -->
          <div class="goals-divider" />
          <!-- Away goals -->
          <div class="goals-col goals-away">
            <div
              v-for="goal in awayGoals"
              :key="`${goal.player}-${goal.minute}`"
              class="goal-item away"
            >
              <Icon name="mdi:soccer" size="14" class="goal-icon" />
              <span class="goal-minute">{{ goal.minute }}'</span>
              <span class="goal-player">{{ getPlayerName(goal.player) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ③ Man of the Match — Vote -->
      <div v-if="match.status === 'played' && match.motmCandidates?.length" class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:star-outline" size="18" />
          {{ $t('match.motm') }}
        </h3>

        <!-- Winner already decided -->
        <div v-if="match.motmWinner" class="motm-winner">
          <div class="winner-glow" />
          <div class="winner-avatar">
            <NuxtImg
              v-if="getPlayerPhoto(match.motmWinner)"
              :src="getPlayerPhoto(match.motmWinner)"
              :alt="getPlayerName(match.motmWinner)"
              width="80" height="80"
              format="webp" loading="lazy"
            />
            <span v-else class="winner-initial">{{ getPlayerName(match.motmWinner)?.charAt(0) }}</span>
          </div>
          <Icon name="mdi:star" size="24" class="winner-star" />
          <span class="winner-name">{{ getPlayerName(match.motmWinner) }}</span>
          <span class="winner-label">{{ $t('match.motm') }}</span>

          <!-- Show final vote results -->
          <div v-if="voteResults && Object.keys(voteResults).length" class="vote-results">
            <div
              v-for="candidate in match.motmCandidates"
              :key="candidate"
              class="vote-result-row"
            >
              <span class="vr-name">{{ getPlayerName(candidate) }}</span>
              <SharedUiIndicatorsProgress
                :value="getVotePercent(candidate)"
                color="primary"
                class="vr-bar"
              />
              <span class="vr-pct">{{ getVotePercent(candidate) }}%</span>
            </div>
          </div>
        </div>

        <!-- Active voting -->
        <div v-else>
          <p v-if="!alreadyVoted" class="vote-prompt">{{ $t('match.votePrompt') }}</p>
          <p v-else class="vote-done-msg">
            <Icon name="mdi:check-circle" size="16" />
            {{ $t('match.voted') }}
          </p>

          <div class="vote-candidates">
            <div
              v-for="candidate in match.motmCandidates"
              :key="candidate"
              class="candidate-card"
              :class="{ voted: alreadyVoted && votedFor === candidate }"
            >
              <div class="candidate-avatar">
                <NuxtImg
                  v-if="getPlayerPhoto(candidate)"
                  :src="getPlayerPhoto(candidate)"
                  :alt="getPlayerName(candidate)"
                  width="56" height="56"
                  format="webp" loading="lazy"
                />
                <span v-else class="cand-initial">{{ getPlayerName(candidate)?.charAt(0) }}</span>
              </div>
              <span class="candidate-name">{{ getPlayerName(candidate) }}</span>
              <span class="candidate-team">{{ getPlayerTeamName(candidate) }}</span>

              <!-- Vote button or result -->
              <template v-if="alreadyVoted">
                <SharedUiIndicatorsProgress
                  :value="getVotePercent(candidate)"
                  color="primary"
                  class="mt-2"
                />
                <span class="cand-pct">{{ getVotePercent(candidate) }}%</span>
              </template>
              <SharedUiButtonBase
                v-else
                variant="outline"
                size="sm"
                icon-left="mdi:thumb-up-outline"
                :loading="votingFor === candidate"
                @click="castVote(candidate)"
              >
                {{ $t('match.vote') }}
              </SharedUiButtonBase>
            </div>
          </div>
        </div>
      </div>

      <!-- ④ Photo Album -->
      <div v-if="match.photos?.length" class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:image-multiple-outline" size="18" />
          {{ $t('match.album') }}
        </h3>
        <ElementsImagegallery :images="match.photos" />
      </div>
      <div v-else-if="match.status === 'played'" class="section-card empty-album">
        <Icon name="mdi:camera-off-outline" size="32" class="empty-icon" />
        <span>{{ $t('match.noPhotos') }}</span>
      </div>

      <!-- ⑤ Video -->
      <div v-if="match.videoUrl" class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:play-circle-outline" size="18" />
          {{ $t('match.video') }}
        </h3>
        <div class="video-wrap">
          <iframe
            :src="embedUrl(match.videoUrl)"
            allowfullscreen
            loading="lazy"
            frameborder="0"
          />
        </div>
      </div>

      <!-- ⑥ Head to Head -->
      <div v-if="h2h.total > 0" class="section-card">
        <h3 class="section-title">
          <Icon name="mdi:history" size="18" />
          {{ $t('match.h2h') }}
        </h3>
        <div class="h2h-row">
          <div class="h2h-stat">
            <span class="h2h-num">{{ h2h.homeWins }}</span>
            <span class="h2h-label">{{ homeTeam?.title }}</span>
          </div>
          <div class="h2h-stat center">
            <span class="h2h-num draws">{{ h2h.draws }}</span>
            <span class="h2h-label">{{ $t('standings.drawn') }}</span>
          </div>
          <div class="h2h-stat">
            <span class="h2h-num">{{ h2h.awayWins }}</span>
            <span class="h2h-label">{{ awayTeam?.title }}</span>
          </div>
        </div>
      </div>

      <!-- ⑦ WhatsApp Share -->
      <div class="share-row">
        <SharedUiButtonBase
          variant="success"
          icon-left="mdi:whatsapp"
          size="lg"
          @click="shareWhatsApp"
        >
          {{ $t('match.share') }}
        </SharedUiButtonBase>
      </div>
    </template>
  </div>
</template>

<script setup>
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const route = useRoute();
const { locale, t } = useI18n();
const slug = computed(() => route.params.slug);

// ── Data ───────────────────────────────────────────────────────────────────────
const { data: match, pending, error } = await useAsyncData(
  `match-${slug.value}`,
  () => queryCollection('matches').where('slug', '=', slug.value).first().catch(() => null)
);

const { data: teamsData } = await useAsyncData(
  `match-teams-${slug.value}`,
  () => queryCollection('teams').all().then(r => r || []).catch(() => [])
);

const { data: playersData } = await useAsyncData(
  `match-players-${slug.value}`,
  () => queryCollection('players').all().then(r => r || []).catch(() => [])
);

const { data: allMatchesData } = await useAsyncData(
  `match-allmatches-${slug.value}`,
  () => queryCollection('matches').where('status', '=', 'played').all().then(r => r || []).catch(() => [])
);

const teams = computed(() => teamsData.value || []);
const players = computed(() => playersData.value || []);
const allMatches = computed(() => allMatchesData.value || []);

// ── Team helpers ───────────────────────────────────────────────────────────────
const teamMap = computed(() => {
  const m = {};
  teams.value.forEach(t => { m[t.slug] = t; });
  return m;
});
const homeTeam = computed(() => teamMap.value[match.value?.homeTeam]);
const awayTeam = computed(() => teamMap.value[match.value?.awayTeam]);

// ── Player helpers ─────────────────────────────────────────────────────────────
const playerMap = computed(() => {
  const m = {};
  players.value.forEach(p => { m[p.slug] = p; });
  return m;
});
const getPlayerName = (slug) => playerMap.value[slug]?.title || slug;
const getPlayerPhoto = (slug) => playerMap.value[slug]?.photo || null;
const getPlayerTeamName = (slug) => {
  const teamSlug = playerMap.value[slug]?.team;
  return teamMap.value[teamSlug]?.title || '';
};

// ── Goals ──────────────────────────────────────────────────────────────────────
const homeGoals = computed(() =>
  (match.value?.goalScorers || []).filter(g => g.team === match.value?.homeTeam)
    .sort((a, b) => a.minute - b.minute)
);
const awayGoals = computed(() =>
  (match.value?.goalScorers || []).filter(g => g.team === match.value?.awayTeam)
    .sort((a, b) => a.minute - b.minute)
);

// ── Countdown ──────────────────────────────────────────────────────────────────
const countdown = ref({ hours: '00', minutes: '00', seconds: '00' });
let countdownInterval = null;

const updateCountdown = () => {
  if (!match.value?.date || match.value?.status !== 'upcoming') return;
  const diff = differenceInSeconds(parseISO(match.value.date), new Date());
  if (diff <= 0) {
    countdown.value = { hours: '00', minutes: '00', seconds: '00' };
    return;
  }
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  countdown.value = {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
};

onMounted(() => {
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
});
onUnmounted(() => clearInterval(countdownInterval));

// ── Voting ─────────────────────────────────────────────────────────────────────
const { submitVote, getVotes, hasVoted } = useVotes();
const voteResults = ref({});
const alreadyVoted = ref(false);
const votedFor = ref(null);
const votingFor = ref(null);

onMounted(async () => {
  if (match.value?.slug) {
    alreadyVoted.value = hasVoted(match.value.slug);
    votedFor.value = process.client ? localStorage.getItem(`vote_${match.value.slug}`) : null;
    voteResults.value = await getVotes(match.value.slug);
  }
});

const totalVotes = computed(() =>
  Object.values(voteResults.value).reduce((sum, v) => sum + v, 0)
);

const getVotePercent = (playerSlug) => {
  if (!totalVotes.value) return 0;
  return Math.round(((voteResults.value[playerSlug] || 0) / totalVotes.value) * 100);
};

const castVote = async (playerSlug) => {
  if (alreadyVoted.value || !match.value?.slug) return;
  votingFor.value = playerSlug;
  const { error } = await submitVote(match.value.slug, playerSlug);
  votingFor.value = null;
  if (!error) {
    alreadyVoted.value = true;
    votedFor.value = playerSlug;
    voteResults.value = await getVotes(match.value.slug);
  }
};

// ── Head to Head ───────────────────────────────────────────────────────────────
const h2h = computed(() => {
  if (!match.value) return { total: 0, homeWins: 0, draws: 0, awayWins: 0 };
  const ht = match.value.homeTeam;
  const at = match.value.awayTeam;
  const meetings = allMatches.value.filter(m =>
    (m.homeTeam === ht && m.awayTeam === at) ||
    (m.homeTeam === at && m.awayTeam === ht)
  );
  let homeWins = 0, draws = 0, awayWins = 0;
  meetings.forEach(m => {
    const hs = m.homeTeam === ht ? m.homeScore : m.awayScore;
    const as = m.homeTeam === ht ? m.awayScore : m.homeScore;
    if (hs > as) homeWins++;
    else if (hs === as) draws++;
    else awayWins++;
  });
  return { total: meetings.length, homeWins, draws, awayWins };
});

// ── Date formatting ────────────────────────────────────────────────────────────
const dateFnsLocale = computed(() => locale.value === 'ar' ? ar : enUS);
const formatMatchDate = (dateStr) => {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'EEEE، d MMMM yyyy', { locale: dateFnsLocale.value }); }
  catch { return dateStr; }
};

// ── Video embed ────────────────────────────────────────────────────────────────
const embedUrl = (url) => {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
};

// ── WhatsApp share ─────────────────────────────────────────────────────────────
const shareWhatsApp = () => {
  if (!match.value) return;
  const hs = match.value.homeScore ?? 0;
  const as = match.value.awayScore ?? 0;
  const ht = homeTeam.value?.title || match.value.homeTeam;
  const at = awayTeam.value?.title || match.value.awayTeam;
  const text = locale.value === 'ar'
    ? `${ht} ${hs}–${as} ${at} 🏆 | الجولة ${match.value.week} | شاهد التفاصيل: ${window.location.href}`
    : `${ht} ${hs}–${as} ${at} 🏆 | Week ${match.value.week} | Details: ${window.location.href}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
};

// ── SEO ────────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => match.value
    ? `${homeTeam.value?.title} vs ${awayTeam.value?.title} | دوري القرية`
    : 'Match Details',
});
</script>

<style lang="scss" scoped>
.page-wrap {
  padding: 0 0 calc(var(--bottom-nav-height) + 34px);
  max-width: 800px;
  margin: 0 auto;
  padding-top: var(--header-height);

  @media (max-width: 576px) {
    padding-top: var(--header-height-mobile);
  }
}

// ── Back ───────────────────────────────────────────────────────────────────────
.back-row {
  padding: 16px 20px 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 6px 0;
  transition: color 0.15s;
  &:hover { color: var(--primary); }
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
.skeleton-hero {
  margin: 20px;
  height: 220px;
  border-radius: 20px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
  @keyframes sh { to { background-position: -200% 0; } }
}

// ── Scoreboard hero ────────────────────────────────────────────────────────────
.scoreboard-hero {
  margin: 16px 20px 0;
  border-radius: 20px;
  padding: 28px 20px 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #0a1628 0%, #111827 60%, #0d1f0d 100%);
  border: 1px solid rgba(34,197,94,0.15);

  &.status-live {
    border-color: rgba(34,197,94,0.4);
    box-shadow: 0 0 30px rgba(34,197,94,0.12);
  }
}

// Pitch background decoration
.pitch-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
}
.pitch-circle {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 200px; height: 200px;
  border-radius: 50%;
  border: 2px solid white;
}
.pitch-line {
  position: absolute;
  top: 0; bottom: 0;
  left: 50%; width: 2px;
  background: white;
}

// Status
.hero-status {
  text-align: center;
  margin-bottom: 20px;
}
.badge-live {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(34,197,94,0.15); color: #4ade80;
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 8px; padding: 5px 12px;
  font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;
}
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #4ade80;
  animation: pulse-g 1.5s infinite;
}
@keyframes pulse-g {
  0%,100% { opacity:1; transform: scale(1); }
  50% { opacity:.4; transform: scale(.6); }
}
.badge-ft {
  display: inline-flex; align-items: center;
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5);
  border-radius: 8px; padding: 5px 12px;
  font-size: 0.75rem; font-weight: 700; letter-spacing: 1px;
}
.badge-upcoming {
  color: rgba(255,255,255,0.6); font-size: 0.8rem;
}

// Teams + score
.hero-teams {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-team {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  &:hover .hero-logo { transform: scale(1.05); }
}

.hero-logo {
  width: 64px; height: 64px;
  border-radius: 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  transition: transform 0.2s;
  img { width: 100%; height: 100%; object-fit: contain; }
}
.hero-initial { font-size: 1.4rem; font-weight: 800; color: #4ade80; }

.hero-team-name {
  font-size: 0.95rem; font-weight: 700; color: #fff;
  text-align: center;
}
.hero-team-label {
  font-size: 0.65rem; color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 0.5px;
}

.hero-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 100px;
}

.score-num {
  font-size: 3rem; font-weight: 900; color: rgba(255,255,255,0.7);
  line-height: 1;
  &.winner { color: #4ade80; }
}
.score-dash { font-size: 2rem; color: rgba(255,255,255,0.3); line-height: 1; }

.score-meta {
  font-size: 0.7rem; color: rgba(255,255,255,0.35);
  text-align: center;
}

// Countdown
.countdown {
  display: flex; align-items: center; gap: 6px;
}
.countdown-unit {
  display: flex; flex-direction: column; align-items: center;
}
.countdown-num {
  font-size: 1.8rem; font-weight: 800; color: #4ade80; line-height: 1;
}
.countdown-label {
  font-size: 0.6rem; color: rgba(255,255,255,0.35); text-transform: uppercase;
}
.countdown-sep { font-size: 1.5rem; color: rgba(255,255,255,0.3); margin-bottom: 12px; }

// ── Section cards ──────────────────────────────────────────────────────────────
.section-card {
  margin: 16px 20px 0;
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

// ── Goals grid ─────────────────────────────────────────────────────────────────
.goals-grid {
  display: grid;
  grid-template-columns: 1fr 2px 1fr;
  gap: 12px;
}
.goals-divider { background: var(--border-color); }
.goals-col { display: flex; flex-direction: column; gap: 8px; }
.goal-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.85rem;
  &.away { flex-direction: row-reverse; }
}
.goal-player { font-weight: 600; color: var(--text-primary); }
.goal-minute { font-size: 0.75rem; color: var(--text-muted); }
.goal-icon { color: var(--primary); flex-shrink: 0; }

// ── MOTM Winner ───────────────────────────────────────────────────────────────
.motm-winner {
  position: relative;
  text-align: center;
  padding: 16px 0;
}
.winner-glow {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, rgba(234,179,8,0.2) 0%, transparent 70%);
  pointer-events: none;
}
.winner-avatar {
  width: 80px; height: 80px; border-radius: 50%;
  border: 3px solid #ca8a04;
  background: var(--bg-elevated);
  margin: 0 auto 8px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.winner-initial { font-size: 1.5rem; font-weight: 800; color: #ca8a04; }
.winner-star { color: #ca8a04; margin-bottom: 4px; }
.winner-name { display: block; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.winner-label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

.vote-results { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
.vote-result-row {
  display: flex; align-items: center; gap: 10px;
}
.vr-name { font-size: 0.8rem; font-weight: 600; min-width: 90px; color: var(--text-primary); }
.vr-bar { flex: 1; }
.vr-pct { font-size: 0.78rem; font-weight: 700; color: var(--primary); min-width: 35px; text-align: end; }

// ── Voting candidates ──────────────────────────────────────────────────────────
.vote-prompt { color: var(--text-muted); font-size: 0.85rem; margin: 0 0 16px; }
.vote-done-msg {
  display: flex; align-items: center; gap: 6px;
  color: var(--primary); font-size: 0.85rem; font-weight: 600; margin: 0 0 16px;
}

.vote-candidates {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.candidate-card {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  transition: all 0.2s;

  &.voted {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
}
.candidate-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--bg-elevated); border: 2px solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; margin-bottom: 4px;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.cand-initial { font-size: 1.1rem; font-weight: 800; color: var(--primary); }
.candidate-name { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }
.candidate-team { font-size: 0.7rem; color: var(--text-muted); }
.cand-pct { font-size: 0.8rem; font-weight: 700; color: var(--primary); }

.mt-2 { margin-top: 6px; }

// ── Empty album ────────────────────────────────────────────────────────────────
.empty-album {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; color: var(--text-muted); padding: 32px;
}
.empty-icon { color: var(--text-muted); opacity: 0.4; }

// ── Video ──────────────────────────────────────────────────────────────────────
.video-wrap {
  border-radius: 12px; overflow: hidden;
  position: relative; padding-top: 56.25%;
  background: #000;
  iframe {
    position: absolute; inset: 0;
    width: 100%; height: 100%; border: none;
  }
}

// ── H2H ───────────────────────────────────────────────────────────────────────
.h2h-row {
  display: flex; align-items: center; justify-content: space-around;
  gap: 12px;
}
.h2h-stat {
  text-align: center;
  &.center .h2h-num { color: var(--text-muted); }
}
.h2h-num {
  display: block; font-size: 2rem; font-weight: 800; color: var(--primary); line-height: 1;
}
.h2h-label { font-size: 0.75rem; color: var(--text-muted); }

// ── Share ──────────────────────────────────────────────────────────────────────
.share-row {
  margin: 20px 20px 0;
  display: flex; justify-content: center;
}

// ── Mobile ─────────────────────────────────────────────────────────────────────
@media (max-width: 600px) {
  .scoreboard-hero { margin: 12px 14px 0; padding: 20px 14px 18px; }
  .section-card { margin: 12px 14px 0; padding: 16px; }
  .share-row { margin: 12px 14px 0; }
  .back-row { padding: 12px 14px 0; }

  .hero-logo { width: 52px; height: 52px; border-radius: 10px; }
  .hero-team-name { font-size: 0.82rem; }
  .score-num { font-size: 2.4rem; }

  .vote-candidates { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .candidate-card { padding: 10px 6px; }
  .candidate-avatar { width: 44px; height: 44px; }
  .candidate-name { font-size: 0.72rem; }
}
</style>