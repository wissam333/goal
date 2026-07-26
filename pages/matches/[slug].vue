<template>
  <div class="page-wrap">
    <!-- Back button -->
    <!-- <div class="back-row">
      <button class="back-btn" @click="navigateTo('/fixtures')">
        <Icon :name="locale === 'ar' ? 'mdi:arrow-right' : 'mdi:arrow-left'" size="18" />
        {{ $t('fixtures.back') }}
      </button>
    </div> -->

    <!-- Loading -->
    <template v-if="pending">
      <div class="skeleton-hero" />
      <div class="container">
        <div class="skeleton-section" />
        <div class="skeleton-section tall" />
        <div class="skeleton-section" />
        <div class="skeleton-section short" />
      </div>
    </template>

    <!-- Error -->
    <SharedUiFeedbackEmptyState
      v-else-if="error || !match"
      :title="$t('error.noData')"
      icon="mdi:soccer-field"
    />

    <template v-else>
      <!-- ① Scoreboard Hero -->
      <div class="scoreboard-hero" :class="`status-${liveStatus}`">
        <div class="pitch-center-line" aria-hidden="true" />

        <!-- Status badge -->
        <div class="hero-status">
          <span v-if="liveStatus === 'live'" class="badge-live">
            <span class="live-dot" /> LIVE
          </span>
          <span v-else-if="liveStatus === 'played'" class="badge-ft">FT</span>
          <span v-else class="badge-upcoming">
            {{ $t("match.upcoming") }} ·
            {{ showTime ? formatMatchDate(match.date) : "" }}
          </span>
        </div>

        <!-- Venue -->
        <div class="hero-venue">
          <span v-if="match.venue">
            <Icon name="mdi:map-marker-outline" size="12" />
            {{ match.venue }}
          </span>
        </div>

        <!-- Teams + Score -->
        <div class="hero-teams">
          <!-- Home -->
          <div
            class="hero-team home"
            :class="{
              'is-winner': liveStatus !== 'upcoming' && isTeamWinner(match, match.homeTeam),
              'is-loser': liveStatus !== 'upcoming' && matchWinner && !isTeamWinner(match, match.homeTeam),
            }"
            @click="navigateTo(`/teams/${match.homeTeam}`)"
          >
            <span
              v-if="liveStatus !== 'upcoming' && isTeamWinner(match, match.homeTeam)"
              class="winner-crown"
              aria-hidden="true"
            >🏆</span>
            <div class="hero-logo">
              <NuxtImg
                v-if="homeTeam?.logo"
                :src="homeTeam.logo"
                :alt="homeTeam.title"
                width="64"
                height="64"
                format="webp"
                loading="lazy"
              />
              <span v-else class="hero-initial">{{
                homeTeam?.title?.charAt(0)
              }}</span>
            </div>
            <span class="hero-team-name">{{ homeTeam?.title }}</span>
            <span class="hero-team-label">{{ $t("match.home") }}</span>
          </div>

          <!-- Score -->
          <div class="hero-score">
            <template v-if="liveStatus !== 'upcoming'">
              <div class="score-circle" :class="{ 'has-winner': !!matchWinner }">
                <span
                  class="score-num"
                  :class="{ winner: isTeamWinner(match, match.homeTeam) }"
                >
                  {{ scoreParts.mainHome ?? 0 }}
                </span>
                <span class="score-dash">–</span>
                <span
                  class="score-num"
                  :class="{ winner: isTeamWinner(match, match.awayTeam) }"
                >
                  {{ scoreParts.mainAway ?? 0 }}
                </span>
              </div>
              <div v-if="scoreParts.badge || scoreParts.pens || matchWinner" class="score-extra">
                <span v-if="scoreParts.method === 'aet'" class="score-method-badge">
                  {{ $t("match.endedAet") }}
                </span>
                <span v-else-if="scoreParts.method === 'pen'" class="score-method-badge pen">
                  {{ $t("match.endedPen") }}
                </span>

                <!-- Penalty shootout breakdown with winner highlight -->
                <div v-if="scoreParts.pens" class="score-pens-board">
                  <span class="pens-label">{{ $t("match.penaltiesShort") }}</span>
                  <div class="pens-nums">
                    <span
                      class="pens-num"
                      :class="{ win: isTeamWinner(match, match.homeTeam) }"
                    >{{ scoreParts.pensHome }}</span>
                    <span class="pens-dash">–</span>
                    <span
                      class="pens-num"
                      :class="{ win: isTeamWinner(match, match.awayTeam) }"
                    >{{ scoreParts.pensAway }}</span>
                  </div>
                </div>
                <span v-else-if="scoreParts.subtitle" class="score-subtitle">
                  {{ scoreParts.subtitle }}
                </span>

                <div v-if="matchWinnerTitle" class="score-winner-banner">
                  <Icon name="mdi:trophy" size="14" />
                  <span>{{ $t("match.winner") }}: {{ matchWinnerTitle }}</span>
                  <span v-if="scoreParts.method === 'pen'" class="winner-how">
                    ({{ $t("match.wonOnPens") }})
                  </span>
                  <span v-else-if="scoreParts.method === 'aet'" class="winner-how">
                    ({{ $t("match.wonOnAet") }})
                  </span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="countdown">
                <div class="countdown-unit">
                  <span class="countdown-num">{{ countdown.hours }}</span>
                  <span class="countdown-label">{{ $t("match.hours") }}</span>
                </div>
                <span class="countdown-sep">:</span>
                <div class="countdown-unit">
                  <span class="countdown-num">{{ countdown.minutes }}</span>
                  <span class="countdown-label">{{ $t("match.minutes") }}</span>
                </div>
                <span class="countdown-sep">:</span>
                <div class="countdown-unit">
                  <span class="countdown-num">{{ countdown.seconds }}</span>
                  <span class="countdown-label">{{ $t("match.seconds") }}</span>
                </div>
              </div>
            </template>
          </div>

          <!-- Away -->
          <div
            class="hero-team away"
            :class="{
              'is-winner': liveStatus !== 'upcoming' && isTeamWinner(match, match.awayTeam),
              'is-loser': liveStatus !== 'upcoming' && matchWinner && !isTeamWinner(match, match.awayTeam),
            }"
            @click="navigateTo(`/teams/${match.awayTeam}`)"
          >
            <span
              v-if="liveStatus !== 'upcoming' && isTeamWinner(match, match.awayTeam)"
              class="winner-crown"
              aria-hidden="true"
            >🏆</span>
            <div class="hero-logo">
              <NuxtImg
                v-if="awayTeam?.logo"
                :src="awayTeam.logo"
                :alt="awayTeam.title"
                width="64"
                height="64"
                format="webp"
                loading="lazy"
              />
              <span v-else class="hero-initial">{{
                awayTeam?.title?.charAt(0)
              }}</span>
            </div>
            <span class="hero-team-name">{{ awayTeam?.title }}</span>
            <span class="hero-team-label">{{ $t("match.away") }}</span>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- ② Goal Scorers -->
        <div v-if="match.goalScorers?.length" class="section-card">
          <h3 class="section-title">
            <Icon name="mdi:soccer" size="18" />
            {{ $t("match.goals") }}
          </h3>
          <div class="goals-grid">
            <!-- Home goals -->
            <div class="goals-col goals-home">
              <div
                v-for="goal in homeGoals"
                :key="`${goal.player}-${goal.minute}`"
                class="goal-item"
              >
                <span class="goal-player">{{
                  getPlayerName(goal.player)
                }}</span>
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
                <span class="goal-player">{{
                  getPlayerName(goal.player)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ③ Cards -->
        <div v-if="match.cards?.length" class="section-card">
          <h3 class="section-title">
            <Icon name="mdi:card-bulleted-outline" size="18" />
            {{ $t("match.cards") }}
          </h3>
          <div class="goals-grid">
            <div class="goals-col goals-home">
              <div
                v-for="card in homeCards"
                :key="`${card.player}-${card.minute}`"
                class="goal-item"
              >
                <span class="goal-player">{{
                  getPlayerName(card.player)
                }}</span>
                <span class="goal-minute">{{ card.minute }}'</span>
                <Icon
                  :name="
                    card.type === 'red'
                      ? 'mdi:square-rounded'
                      : 'mdi:square-rounded-outline'
                  "
                  size="16"
                  :class="card.type === 'red' ? 'card-red' : 'card-yellow'"
                />
              </div>
            </div>
            <div class="goals-divider" />
            <div class="goals-col goals-away">
              <div
                v-for="card in awayCards"
                :key="`${card.player}-${card.minute}`"
                class="goal-item away"
              >
                <Icon
                  :name="
                    card.type === 'red'
                      ? 'mdi:square-rounded'
                      : 'mdi:square-rounded-outline'
                  "
                  size="16"
                  :class="card.type === 'red' ? 'card-red' : 'card-yellow'"
                />
                <span class="goal-minute">{{ card.minute }}'</span>
                <span class="goal-player">{{
                  getPlayerName(card.player)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ④ Prediction Vote -->
        <div
          v-if="liveStatus === 'upcoming' || totalPredictions"
          class="section-card"
        >
          <h3 class="section-title">
            <Icon name="mdi:chart-line" size="18" />
            {{ $t("match.predictTitle") }}
          </h3>

          <p
            v-if="liveStatus === 'upcoming' && !alreadyPredicted"
            class="vote-prompt"
          >
            {{ $t("match.predictPrompt") }}
            <span class="predict-guest-hint">{{ $t("match.predictGuestHint") }}</span>
          </p>
          <p
            v-else-if="liveStatus === 'upcoming' && alreadyPredicted"
            class="vote-done-msg"
          >
            <Icon name="mdi:check-circle" size="16" />
            {{ $t("match.predicted") }}
            <span v-if="!auth.user.value" class="predict-guest-hint">
              {{ $t("match.predictPointsHint") }}
            </span>
          </p>
          <p v-else class="vote-done-msg" style="color: var(--text-muted)">
            <Icon name="mdi:lock-outline" size="16" />
            التصويت مغلق
          </p>

          <div
            class="predict-candidates"
            :class="{ 'predict-candidates--with-draw': drawAllowed }"
          >
            <!-- Home -->
            <div
              class="predict-card"
              :class="{
                voted: predictedTeam === match.homeTeam,
              }"
              @click="
                liveStatus === 'upcoming' && castPrediction(match.homeTeam)
              "
            >
              <div class="predict-logo">
                <span class="predict-initial">{{
                  homeTeam?.title?.charAt(0)
                }}</span>
              </div>
              <span class="predict-team-name">{{ homeTeam?.title }}</span>
              <template v-if="totalPredictions">
                <SharedUiIndicatorsProgress
                  :value="getPredictionPercent(match.homeTeam)"
                  color="primary"
                  class="mt-2"
                />
                <span class="predict-pct"
                  >{{ getPredictionPercent(match.homeTeam) }}%</span
                >
              </template>
              <SharedUiButtonBase
                v-if="liveStatus === 'upcoming' && !alreadyPredicted"
                variant="outline"
                size="sm"
                icon-left="mdi:thumb-up-outline"
                :loading="predictingTeam === match.homeTeam"
              >
                {{ $t("match.predict") }}
              </SharedUiButtonBase>
            </div>

            <!-- Draw (only for group matches) -->
            <template v-if="drawAllowed">
              <div
                class="predict-card predict-card--draw"
                :class="{
                  voted: predictedTeam === DRAW_SLUG,
                }"
                @click="liveStatus === 'upcoming' && castPrediction(DRAW_SLUG)"
              >
                <div class="predict-logo predict-logo--draw">
                  <Icon
                    name="mdi:swap-horizontal-bold"
                    size="24"
                    class="draw-icon"
                  />
                </div>
                <span class="predict-team-name">{{
                  $t("match.predictDraw")
                }}</span>
                <template v-if="totalPredictions">
                  <SharedUiIndicatorsProgress
                    :value="getPredictionPercent(DRAW_SLUG)"
                    color="primary"
                    class="mt-2"
                  />
                  <span class="predict-pct"
                    >{{ getPredictionPercent(DRAW_SLUG) }}%</span
                  >
                </template>
                <SharedUiButtonBase
                  v-if="liveStatus === 'upcoming' && !alreadyPredicted"
                  variant="outline"
                  size="sm"
                  icon-left="mdi:thumb-up-outline"
                  :loading="predictingTeam === DRAW_SLUG"
                >
                  {{ $t("match.predict") }}
                </SharedUiButtonBase>
              </div>
            </template>

            <!-- VS separator (no-draw mode) -->
            <div v-else class="predict-vs">{{ $t("match.predictVs") }}</div>

            <!-- Away -->
            <div
              class="predict-card"
              :class="{
                voted: predictedTeam === match.awayTeam,
              }"
              @click="
                liveStatus === 'upcoming' && castPrediction(match.awayTeam)
              "
            >
              <div class="predict-logo">
                <span class="predict-initial">{{
                  awayTeam?.title?.charAt(0)
                }}</span>
              </div>
              <span class="predict-team-name">{{ awayTeam?.title }}</span>
              <template v-if="totalPredictions">
                <SharedUiIndicatorsProgress
                  :value="getPredictionPercent(match.awayTeam)"
                  color="primary"
                  class="mt-2"
                />
                <span class="predict-pct"
                  >{{ getPredictionPercent(match.awayTeam) }}%</span
                >
              </template>
              <SharedUiButtonBase
                v-if="liveStatus === 'upcoming' && !alreadyPredicted"
                variant="outline"
                size="sm"
                icon-left="mdi:thumb-up-outline"
                :loading="predictingTeam === match.awayTeam"
              >
                {{ $t("match.predict") }}
              </SharedUiButtonBase>
            </div>
          </div>
        </div>

        <!-- ④ Man of the Match — Vote (during or after match only) -->
        <div
          v-if="liveStatus === 'played' || liveStatus === 'live'"
          class="section-card"
        >
          <h3 class="section-title">
            <Icon name="mdi:star-outline" size="18" />
            {{ $t("match.motm") }}
          </h3>

          <!-- Winner banner (admin-set only) -->
          <div v-if="motmWinnerResolved" class="motm-winner">
            <div class="winner-glow" />
            <div class="winner-avatar">
              <img
                v-if="getPlayerPhoto(motmWinnerResolved)"
                :src="getPlayerPhoto(motmWinnerResolved)"
                :alt="getPlayerName(motmWinnerResolved)"
                width="80"
                height="80"
                loading="lazy"
                @error="onImgError"
              />
              <span v-else class="winner-initial">{{
                getPlayerName(motmWinnerResolved)?.charAt(0)
              }}</span>
            </div>
            <Icon name="mdi:star" size="24" class="winner-star" />
            <span class="winner-name">{{
              getPlayerName(motmWinnerResolved)
            }}</span>
            <span class="winner-label">{{ $t("match.motm") }}</span>
          </div>

          <!-- Active voting (hidden when admin sets a MOTM winner) -->
          <div v-if="!motmWinnerResolved">
            <p v-if="!alreadyVoted" class="vote-prompt">
              {{ $t("match.votePrompt") }}
            </p>
            <p v-else class="vote-done-msg">
              <Icon name="mdi:check-circle" size="16" />
              {{ $t("match.voted") }}
            </p>

            <div class="motm-teams">
              <!-- Home team -->
              <div class="motm-team-col">
                <div class="motm-team-header">
                  <span class="motm-team-initial">{{
                    homeTeam?.title?.charAt(0)
                  }}</span>
                  <span class="motm-team-label">{{ homeTeam?.title }}</span>
                </div>
                <div
                  v-for="player in homePlayers"
                  :key="player.slug"
                  class="motm-player-row"
                  :class="{ voted: alreadyVoted && votedFor === player.slug }"
                  @click="castVote(player.slug)"
                >
                  <span class="motm-player-num">{{ player.number }}</span>
                  <span class="motm-player-name">{{ player.title }}</span>
                  <span
                    v-if="Object.keys(voteResults).length"
                    class="motm-pct"
                  >{{ getVotePercent(player.slug) }}%</span>
                  <Icon
                    v-if="alreadyVoted && votedFor === player.slug"
                    name="mdi:check-circle"
                    size="16"
                    class="motm-check"
                  />
                  <SharedUiButtonBase
                    v-else-if="!alreadyVoted"
                    variant="outline"
                    size="xs"
                    :loading="votingFor === player.slug"
                    icon-left="mdi:thumb-up-outline"
                    class="motm-vote-btn"
                    @click.stop="castVote(player.slug)"
                  >
                    {{ $t("match.vote") }}
                  </SharedUiButtonBase>
                </div>
              </div>

              <!-- Away team -->
              <div class="motm-team-col">
                <div class="motm-team-header">
                  <span class="motm-team-initial">{{
                    awayTeam?.title?.charAt(0)
                  }}</span>
                  <span class="motm-team-label">{{ awayTeam?.title }}</span>
                </div>
                <div
                  v-for="player in awayPlayers"
                  :key="player.slug"
                  class="motm-player-row"
                  :class="{ voted: alreadyVoted && votedFor === player.slug }"
                  @click="castVote(player.slug)"
                >
                  <span class="motm-player-num">{{ player.number }}</span>
                  <span class="motm-player-name">{{ player.title }}</span>
                  <span
                    v-if="Object.keys(voteResults).length"
                    class="motm-pct"
                  >{{ getVotePercent(player.slug) }}%</span>
                  <Icon
                    v-if="alreadyVoted && votedFor === player.slug"
                    name="mdi:check-circle"
                    size="16"
                    class="motm-check"
                  />
                  <SharedUiButtonBase
                    v-else-if="!alreadyVoted"
                    variant="outline"
                    size="xs"
                    :loading="votingFor === player.slug"
                    icon-left="mdi:thumb-up-outline"
                    class="motm-vote-btn"
                    @click.stop="castVote(player.slug)"
                  >
                    {{ $t("match.vote") }}
                  </SharedUiButtonBase>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ⑤ Photo Album -->
        <div v-if="match.photos?.length" class="section-card">
          <h3 class="section-title">
            <Icon name="mdi:image-multiple-outline" size="18" />
            {{ $t("match.album") }}
          </h3>
          <ElementsAlbum :images="match.photos" :columns="3" />
        </div>

        <!-- ⑥ Video -->
        <div v-if="match.videos?.length" class="section-card">
          <h3 class="section-title">
            <Icon name="mdi:play-circle-outline" size="18" />
            {{ $t("match.video") }}
          </h3>
          <div class="video-grid">
            <div v-for="(v, i) in resolvedVideos" :key="i" class="video-wrap">
              <iframe
                :src="v.embedUrl"
                allowfullscreen
                loading="lazy"
                frameborder="0"
              ></iframe>
            </div>
          </div>
        </div>

        <!-- ⑦ Head to Head -->
        <div v-if="h2h.total > 0" class="section-card">
          <h3 class="section-title">
            <Icon name="mdi:history" size="18" />
            {{ $t("match.h2h") }}
          </h3>
          <div class="h2h-row">
            <div class="h2h-stat">
              <span class="h2h-num">{{ h2h.homeWins }}</span>
              <span class="h2h-label">{{ homeTeam?.title }}</span>
            </div>
            <div class="h2h-stat center">
              <span class="h2h-num draws">{{ h2h.draws }}</span>
              <span class="h2h-label">{{ $t("standings.drawn") }}</span>
            </div>
            <div class="h2h-stat">
              <span class="h2h-num">{{ h2h.awayWins }}</span>
              <span class="h2h-label">{{ awayTeam?.title }}</span>
            </div>
          </div>
        </div>

        <!-- ⑧ Share + result card -->
        <div class="share-section">
          <div class="share-label">{{ $t("match.share") }}</div>

          <!-- Result card (looks like the site — score, goals, cards) -->
          <div
            v-if="liveStatus !== 'upcoming'"
            class="result-card-actions"
          >
            <button
              type="button"
              class="result-card-btn primary"
              :disabled="cardExporting"
              @click="handleShareResultCard"
            >
              <Icon
                :name="cardExporting ? 'mdi:loading' : 'mdi:image-area'"
                size="18"
                :class="{ spin: cardExporting }"
              />
              <span>
                {{
                  cardExporting
                    ? $t("match.resultCardExporting")
                    : $t("match.shareResultCard")
                }}
              </span>
            </button>
            <button
              type="button"
              class="result-card-btn"
              :disabled="cardExporting"
              @click="handleDownloadResultCard"
            >
              <Icon name="mdi:download" size="18" />
              <span>{{ $t("match.downloadResultCard") }}</span>
            </button>
            <p class="result-card-hint">
              <Icon name="mdi:facebook" size="14" />
              {{ $t("match.shareResultCardHint") }}
            </p>
          </div>

          <div class="share-row">
            <button
              v-if="supportsShare"
              class="share-btn native"
              title="Share"
              @click="nativeShare"
            >
              <Icon name="mdi:share-variant" size="20" />
            </button>
            <button
              class="share-btn whatsapp"
              title="WhatsApp"
              @click="sharePlatform('whatsapp')"
            >
              <Icon name="mdi:whatsapp" size="20" />
            </button>
            <button
              class="share-btn messenger"
              title="Messenger"
              @click="sharePlatform('messenger')"
            >
              <Icon name="mdi:facebook-messenger" size="20" />
            </button>
            <button class="share-btn copy" title="Copy text" @click="copyShareText">
              <Icon name="mdi:content-paste" size="20" />
            </button>
            <button class="share-btn copy" title="Copy link" @click="copyLink">
              <Icon name="mdi:link-variant" size="20" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>

  <ClientOnly>
    <SharedUiDialogAppModal
      v-model="authModalOpen"
      :title="
        authTab === 'login' ? $t('auth.loginTitle') : $t('auth.registerTitle')
      "
      max-width="420px"
    >
      <div class="auth-tabs">
        <button
          class="auth-tab"
          :class="{ active: authTab === 'login' }"
          @click="authTab = 'login'"
        >
          {{ $t("auth.login") }}
        </button>
        <button
          class="auth-tab"
          :class="{ active: authTab === 'register' }"
          @click="authTab = 'register'"
        >
          {{ $t("auth.register") }}
        </button>
      </div>
      <p class="auth-subtitle">
        {{
          authTab === "login"
            ? $t("auth.loginSubtitle")
            : $t("auth.registerSubtitle")
        }}
      </p>
      <button
        class="google-btn"
        @click="handleMatchAuthGoogle"
        :disabled="matchAuthGoogleLoading"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>{{ $t("auth.googleLogin") }}</span>
      </button>
      <div class="auth-divider">
        <span>{{ $t("auth.or") }}</span>
      </div>
      <form @submit.prevent="handleMatchAuthSubmit" class="auth-form">
        <SharedUiFormBaseInput
          v-model="matchAuthEmail"
          type="email"
          :label="$t('auth.email')"
          :placeholder="$t('auth.email')"
          size="lg"
          required
        />
        <SharedUiFormBaseInput
          v-model="matchAuthPassword"
          type="password"
          :label="$t('auth.password')"
          :placeholder="$t('auth.password')"
          size="lg"
          required
        />
        <SharedUiFormBaseInput
          v-if="authTab === 'register'"
          v-model="matchAuthConfirm"
          type="password"
          :label="$t('auth.confirmPassword')"
          :placeholder="$t('auth.confirmPassword')"
          :error="matchAuthPasswordError"
          size="lg"
          required
        />
        <p v-if="matchAuthError" class="auth-error">{{ matchAuthError }}</p>
        <p v-if="matchAuthSuccess" class="auth-success">
          {{ matchAuthSuccess }}
        </p>
        <SharedUiButtonBase
          type="submit"
          variant="primary"
          size="lg"
          :loading="matchAuthBusy"
          class="auth-submit"
        >
          {{
            authTab === "login" ? $t("auth.signIn") : $t("auth.createAccount")
          }}
        </SharedUiButtonBase>
      </form>
      <p class="auth-switch">
        <template v-if="authTab === 'login'">
          {{ $t("auth.noAccount") }}
          <button class="auth-link" @click="authTab = 'register'">
            {{ $t("auth.createAccount") }}
          </button>
        </template>
        <template v-else>
          {{ $t("auth.hasAccount") }}
          <button class="auth-link" @click="authTab = 'login'">
            {{ $t("auth.signIn") }}
          </button>
        </template>
      </p>
    </SharedUiDialogAppModal>
  </ClientOnly>
</template>

<script setup>
import { format, parseISO, differenceInSeconds } from "date-fns";
import { enUS } from "date-fns/locale";
import { syrianAr } from "~/utils/syrianAr";

const route = useRoute();
const { locale, t } = useI18n();
const appTitle = useAppTitle();
const { fetchMatch, fetchTeams, fetchPlayers, fetchMatches } = useLeagueData();
const { isTeamWinner, formatScoreParts, formatScore, getWinnerSlug, getTeamOutcome } = useMatchResult();
const { league, leaguePath } = useCurrentLeague();
const auth = useAuth();
const slug = computed(() => route.params.slug);
const authModalOpen = ref(false);
const authTab = ref("login");
const matchAuthEmail = ref("");
const matchAuthPassword = ref("");
const matchAuthConfirm = ref("");
const matchAuthError = ref("");
const matchAuthSuccess = ref("");
const matchAuthBusy = ref(false);
const matchAuthGoogleLoading = ref(false);
const matchAuthPasswordError = ref("");

const handleMatchAuthGoogle = async () => {
  matchAuthGoogleLoading.value = true;
  await auth.signInWithGoogle();
  matchAuthGoogleLoading.value = false;
};

const handleMatchAuthSubmit = async () => {
  matchAuthError.value = "";
  matchAuthSuccess.value = "";
  matchAuthPasswordError.value = "";
  matchAuthBusy.value = true;
  if (authTab.value === "register") {
    if (matchAuthPassword.value !== matchAuthConfirm.value) {
      matchAuthError.value = t("auth.passwordMismatch");
      matchAuthBusy.value = false;
      return;
    }
    const { data, error: err } = await auth.signUp(
      matchAuthEmail.value,
      matchAuthPassword.value,
    );
    matchAuthBusy.value = false;
    if (err) {
      matchAuthError.value = err.message?.includes("already registered")
        ? t("auth.emailInUse")
        : err.message?.includes("weak")
          ? t("auth.weakPassword")
          : err.message || t("auth.emailInUse");
      return;
    }
    if (data?.session) {
      authModalOpen.value = false;
    } else {
      matchAuthSuccess.value = t("auth.registrationSuccess");
      authTab.value = "login";
    }
  } else {
    const { error: err } = await auth.signIn(
      matchAuthEmail.value,
      matchAuthPassword.value,
    );
    matchAuthBusy.value = false;
    if (err) {
      matchAuthError.value = t("auth.loginError");
      return;
    }
    authModalOpen.value = false;
  }
};

// ── Data ───────────────────────────────────────────────────────────────────────
// Phase 1: match + teams (teams is tiny, both needed immediately)
const {
  data: match,
  pending: pending1,
  error: error1,
  refresh: refreshMatch,
} = await useAsyncData(`match-${slug.value}`, () => fetchMatch(slug.value));
const {
  data: teamsData,
  pending: pending2,
  error: error2,
} = await useAsyncData(`match-teams-${slug.value}`, () => fetchTeams());

const pending = computed(() => pending1.value || pending2.value);
const error = computed(() => error1.value || error2.value);
const teams = computed(() => teamsData.value || []);

// Phase 2: players from the two teams only + H2H matches for this team
const ht = match.value?.homeTeam;
const at = match.value?.awayTeam;

const { data: playersData } = await useAsyncData(
  `match-players-${slug.value}`,
  () =>
    Promise.all([
      ht ? fetchPlayers({ team: ht }) : [],
      at ? fetchPlayers({ team: at }) : [],
    ]).then(([h, a]) => [...h, ...a]),
);

const { data: allMatchesData } = await useAsyncData(
  `match-h2h-${slug.value}`,
  () => (ht ? fetchMatches({ status: "played", team: ht }) : []),
);

const players = computed(() => playersData.value || []);
const allMatches = computed(() => allMatchesData.value || []);

// ── Live status (computed from date, overrides DB) ──────────────────────────────
const liveStatus = computed(() => {
  if (match.value?.status === "played") return "played";
  if (match.value?.status === "live") return "live";
  if (!match.value?.date) return "upcoming";
  const syriaTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Damascus",
  });
  const now = new Date(syriaTime);
  const matchDate = parseISO(match.value.date);
  const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
  if (now > matchEnd) return "played";
  if (now >= matchDate) return "live";
  return "upcoming";
});

// ── Team helpers ───────────────────────────────────────────────────────────────
const teamMap = computed(() => {
  const m = {};
  teams.value.forEach((t) => {
    m[t.slug] = t;
  });
  return m;
});
const homeTeam = computed(() => teamMap.value[match.value?.homeTeam]);
const awayTeam = computed(() => teamMap.value[match.value?.awayTeam]);

const DRAW_SLUG = "__draw__";
const drawAllowed = computed(() => {
  const g = match.value?.group;
  return g && !["R16", "QF", "SF", "FINAL"].includes(g);
});

// ── Realtime match updates ────────────────────────────────────────────────────
const { subscribe: subscribeMatch, unsubscribe: unsubscribeMatch } =
  useRealtime("matches", ["UPDATE"]);
onMounted(() => {
  subscribeMatch((payload) => {
    if (payload.new?.slug === slug.value) {
      refreshMatch();
    }
  });
});
onUnmounted(() => {
  unsubscribeMatch();
});

// ── Realtime vote updates ────────────────────────────────────────────────────
const { subscribe: subscribeVotes, unsubscribe: unsubscribeVotes } =
  useRealtime("votes", ["INSERT"]);
const { subscribe: subscribePredictions, unsubscribe: unsubscribePredictions } =
  useRealtime("match_predictions", ["INSERT"]);
onMounted(() => {
  subscribeVotes((payload) => {
    if (payload.new?.match_slug === slug.value) {
      getVotes(slug.value).then((r) => {
        voteResults.value = r;
      });
    }
  });
  subscribePredictions((payload) => {
    if (payload.new?.match_slug === slug.value) {
      getPredictions(slug.value).then((r) => {
        predictionResults.value = r;
      });
    }
  });
});
onUnmounted(() => {
  unsubscribeVotes();
  unsubscribePredictions();
});

// ── Player helpers ─────────────────────────────────────────────────────────────
const playerMap = computed(() => {
  const m = {};
  players.value.forEach((p) => {
    m[p.slug] = p;
  });
  return m;
});
const getPlayerName = (slug) => playerMap.value[slug]?.title || slug;
const getPlayerPhoto = (slug) => playerMap.value[slug]?.photo || null;
const getPlayerTeamName = (slug) => {
  const teamSlug = playerMap.value[slug]?.team;
  return teamMap.value[teamSlug]?.title || "";
};
const getTeamTitle = (teamSlug) => {
  return teamMap.value[teamSlug]?.title || teamMap.value[teamSlug.replace(/::[^-]+-/, '::')]?.title || teamSlug;
};

const homePlayers = computed(() =>
  players.value.filter((p) => p.team === match.value?.homeTeam).sort(
    (a, b) => (voteResults.value[b.slug] || 0) - (voteResults.value[a.slug] || 0),
  ),
);
const awayPlayers = computed(() =>
  players.value.filter((p) => p.team === match.value?.awayTeam).sort(
    (a, b) => (voteResults.value[b.slug] || 0) - (voteResults.value[a.slug] || 0),
  ),
);

const motmWinnerResolved = computed(() => {
  return match.value?.motmWinner || null;
});

const sortedCandidates = computed(() => {
  const allPlayers = [...homePlayers.value, ...awayPlayers.value];
  const withVotes = allPlayers.map((p) => ({
    slug: p.slug,
    teamTitle: getPlayerTeamName(p.slug),
    votes: voteResults.value[p.slug] || 0,
    pct: getVotePercent(p.slug),
  }));
  return withVotes.sort(
    (a, b) => b.votes - a.votes || a.slug.localeCompare(b.slug),
  );
});

// ── Goals ──────────────────────────────────────────────────────────────────────
const homeGoals = computed(() =>
  (match.value?.goalScorers || [])
    .filter((g) => g.team === match.value?.homeTeam)
    .sort((a, b) => a.minute - b.minute),
);
const awayGoals = computed(() =>
  (match.value?.goalScorers || [])
    .filter((g) => g.team === match.value?.awayTeam)
    .sort((a, b) => a.minute - b.minute),
);

const homeCards = computed(() =>
  (match.value?.cards || []).filter((c) => c.team === match.value?.homeTeam),
);
const awayCards = computed(() =>
  (match.value?.cards || []).filter((c) => c.team === match.value?.awayTeam),
);

// ── Countdown ──────────────────────────────────────────────────────────────────
const countdown = ref({ hours: "00", minutes: "00", seconds: "00" });
let countdownInterval = null;

const updateCountdown = () => {
  if (!match.value?.date || liveStatus.value !== "upcoming") {
    clearInterval(countdownInterval);
    countdownInterval = null;
    return;
  }
  const diff = differenceInSeconds(parseISO(match.value.date), new Date());
  if (diff <= 0) {
    countdown.value = { hours: "00", minutes: "00", seconds: "00" };
    clearInterval(countdownInterval);
    countdownInterval = null;
    return;
  }
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  countdown.value = {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
  };
};

onMounted(() => {
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
});
onUnmounted(() => clearInterval(countdownInterval));

// ── MOTM Voting ────────────────────────────────────────────────────────────────
const { submitVote, getVotes, hasVoted } = useVotes();
const voteResults = ref({});
const alreadyVoted = ref(false);
const votedFor = ref(null);
const votingFor = ref(null);

onMounted(async () => {
  if (match.value?.slug) {
    alreadyVoted.value = await hasVoted(match.value.slug);
    votedFor.value = import.meta.client
      ? localStorage.getItem(`vote_${match.value.slug}`)
      : null;
    voteResults.value = await getVotes(match.value.slug);
  }
});

const totalVotes = computed(() =>
  Object.values(voteResults.value).reduce((sum, v) => sum + v, 0),
);

const getVotePercent = (playerSlug) => {
  if (!totalVotes.value) return 0;
  return Math.round(
    ((voteResults.value[playerSlug] || 0) / totalVotes.value) * 100,
  );
};

const castVote = async (playerSlug) => {
  if (!auth.user.value) {
    authModalOpen.value = true;
    return;
  }
  if (alreadyVoted.value || !match.value?.slug) return;
  votingFor.value = playerSlug;
  const { error } = await submitVote(match.value.slug, playerSlug);
  votingFor.value = null;
  if (!error) {
    alreadyVoted.value = true;
    votedFor.value = playerSlug;
  }
};

// ── Prediction Voting ──────────────────────────────────────────────────────────
const { submitPrediction, getPredictions, hasPredicted, getPredictedTeam } =
  useMatchPredictions();
const predictionResults = ref({});
const alreadyPredicted = ref(false);
const predictedTeam = ref(null);
const predictingTeam = ref(null);

const totalPredictions = computed(() =>
  Object.values(predictionResults.value).reduce((sum, v) => sum + v, 0),
);

const getPredictionPercent = (teamSlug) => {
  if (!totalPredictions.value) return 0;
  return Math.round(
    ((predictionResults.value[teamSlug] || 0) / totalPredictions.value) * 100,
  );
};

const castPrediction = async (teamSlug) => {
  if (alreadyPredicted.value || !match.value?.slug) return;
  if (liveStatus.value !== "upcoming") return;
  predictingTeam.value = teamSlug;
  const { error } = await submitPrediction(match.value.slug, teamSlug);
  predictingTeam.value = null;
  if (!error) {
    alreadyPredicted.value = true;
    predictedTeam.value = teamSlug;
    // Optimistic count bump
    predictionResults.value = {
      ...predictionResults.value,
      [teamSlug]: (predictionResults.value[teamSlug] || 0) + 1,
    };
  } else if (error === "already_predicted") {
    alreadyPredicted.value = true;
    predictedTeam.value =
      (await getPredictedTeam(match.value.slug)) || teamSlug;
  }
};

onMounted(async () => {
  if (match.value?.slug) {
    predictionResults.value = await getPredictions(match.value.slug);
    alreadyPredicted.value = await hasPredicted(match.value.slug);
    predictedTeam.value = await getPredictedTeam(match.value.slug);
  }
});

// ── Head to Head ───────────────────────────────────────────────────────────────
const h2h = computed(() => {
  if (!match.value) return { total: 0, homeWins: 0, draws: 0, awayWins: 0 };
  const ht = match.value.homeTeam;
  const at = match.value.awayTeam;
  const meetings = allMatches.value.filter(
    (m) =>
      (m.homeTeam === ht && m.awayTeam === at) ||
      (m.homeTeam === at && m.awayTeam === ht),
  );
  let homeWins = 0,
    draws = 0,
    awayWins = 0;
  meetings.forEach((m) => {
    const outcome = getTeamOutcome(m, m.homeTeam === ht ? ht : at);
    if (outcome === 'W') {
      if (m.homeTeam === ht) homeWins++;
      else awayWins++;
    } else if (outcome === 'D') draws++;
    else if (outcome === 'L') {
      if (m.homeTeam === ht) awayWins++;
      else homeWins++;
    }
  });
  return { total: meetings.length, homeWins, draws, awayWins };
});

// ── Date formatting ────────────────────────────────────────────────────────────
const dateFnsLocale = computed(() => (locale.value === "ar" ? syrianAr : enUS));
const showTime = ref(false);
onMounted(() => {
  showTime.value = true;
});

const formatMatchDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "EEEE، d MMMM yyyy", {
      locale: dateFnsLocale.value,
    });
  } catch {
    return dateStr;
  }
};

// ── Video embed ────────────────────────────────────────────────────────────────
const resolvedVideos = ref([])

const embedUrl = (url) => {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com"))
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=734`;
  return url;
};

const resolveVideos = async (videos) => {
  if (!videos?.length) { resolvedVideos.value = []; return }
  const resolved = await Promise.all(videos.map(async (v) => {
    let url = v.url
    if (url.includes("/share/") && (url.includes("facebook.com") || url.includes("fb.com") || url.includes("fb.watch"))) {
      try {
        const { url: resolvedUrl } = await $fetch(`/api/resolve-url?url=${encodeURIComponent(url)}`)
        if (resolvedUrl && resolvedUrl !== url) url = resolvedUrl
      } catch {}
    }
    return { embedUrl: embedUrl(url) }
  }))
  resolvedVideos.value = resolved
}

watch(() => match.value?.videos, (videos) => {
  resolveVideos(videos)
}, { immediate: true })

const scoreParts = computed(() =>
  formatScoreParts(match.value, locale.value),
);

const matchWinner = computed(() =>
  match.value ? getWinnerSlug(match.value) : null,
);

const matchWinnerTitle = computed(() => {
  if (!matchWinner.value) return "";
  if (matchWinner.value === match.value?.homeTeam) {
    return homeTeam.value?.title || match.value.homeTeam;
  }
  return awayTeam.value?.title || match.value?.awayTeam || "";
});

// ── Share + result card ────────────────────────────────────────────────────────
const {
  exporting: cardExporting,
  getCardUrl,
  downloadResultCard,
  shareResultCard,
} = useMatchResultCard();

const currentLeagueSlug = computed(() => {
  const fromRoute = route.params.league;
  if (fromRoute && typeof fromRoute === "string") return fromRoute;
  try {
    return useCurrentLeague()?.leagueSlug?.value || "";
  } catch {
    return "";
  }
});

const resultCardUrl = computed(() => {
  if (!match.value?.slug) return "/logo.png";
  return getCardUrl(match.value.slug, {
    league: currentLeagueSlug.value,
    locale: locale.value,
  });
});

const shareText = () => {
  if (!match.value) return "";
  const score = formatScore(match.value, locale.value);
  const ht = homeTeam.value?.title || match.value.homeTeam;
  const at = awayTeam.value?.title || match.value.awayTeam;
  const name = league.value?.name || appTitle.name.value || "دوري القرية";
  const lines = [`#${name.replace(/\s+/g, '_')}`, "", `${ht} ${score} ${at} 🏆`];

  if (match.value.date) {
    try {
      const dt = parseISO(match.value.date);
      const datePart = format(dt, "EEEE، d MMMM yyyy", { locale: dateFnsLocale.value });
      const timePart = format(dt, "h:mm a");
      lines.push(`🕐 ${datePart} - ${timePart}`);
    } catch {
      lines.push(match.value.date);
    }
  }

  const goals = match.value.goalScorers || [];
  if (goals.length) {
    lines.push("");
    lines.push(locale.value === "ar" ? "الأهداف:" : "Goals:");
    for (const g of [...goals].sort(
      (a, b) => (Number(a.minute) || 0) - (Number(b.minute) || 0),
    )) {
      const min =
        g.minute !== null && g.minute !== undefined && g.minute !== ""
          ? `${g.minute}' `
          : "";
      lines.push(`⚽ ${min}${getPlayerName(g.player)} (${getTeamTitle(g.team)})`);
    }
  }

  const cardsList = match.value.cards || [];
  if (cardsList.length) {
    lines.push("");
    lines.push(locale.value === "ar" ? "البطاقات:" : "Cards:");
    for (const c of [...cardsList].sort(
      (a, b) => (Number(a.minute) || 0) - (Number(b.minute) || 0),
    )) {
      const icon = c.type === "red" ? "🟥" : "🟨";
      const min =
        c.minute !== null && c.minute !== undefined && c.minute !== ""
          ? `${c.minute}' `
          : "";
      lines.push(`${icon} ${min}${getPlayerName(c.player)} (${getTeamTitle(c.team)})`);
    }
  }

  if (motmWinnerResolved.value) {
    lines.push("");
    lines.push(`🏅 ${getPlayerName(motmWinnerResolved.value)} (${locale.value === "ar" ? "أفضل لاعب" : "MOTM"})`);
    lines.push("");
  }

  return lines.join("\n");
};

const supportsShare = computed(
  () => typeof navigator !== "undefined" && !!navigator.share,
);

const nativeShare = async () => {
  try {
    await navigator.share({
      title: document.title,
      text: shareText(),
      url: window.location.href,
    });
  } catch {}
};

const sharePlatform = (platform) => {
  const text = shareText();
  const url = window.location.href;
  const urls = {
    messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=291494419107518`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + "\n" + url)}`,
  };
  window.open(urls[platform], "_blank", "width=600,height=500");
};

const copyShareText = async () => {
  const text = shareText() + "\n" + window.location.href;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
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

const handleDownloadResultCard = async () => {
  if (!match.value?.slug) return;
  const ok = await downloadResultCard(match.value.slug, {
    league: currentLeagueSlug.value,
    locale: locale.value,
  });
  if (!ok && import.meta.client) {
    window.open(resultCardUrl.value, "_blank");
  }
};

const handleShareResultCard = async () => {
  if (!match.value?.slug) return;
  const title =
    `${homeTeam.value?.title || ""} ${scoreParts.value.compact || ""} ${awayTeam.value?.title || ""}`.trim();
  await shareResultCard(match.value.slug, {
    league: currentLeagueSlug.value,
    locale: locale.value,
    title: title || "Green Ball",
    text: shareText(),
    pageUrl: typeof window !== "undefined" ? window.location.href : "",
  });
};

const onImgError = (e) => {
  e.target.src = "/default-avatar.jpg";
  e.target.onerror = null;
};

// ── SEO (rich Facebook / WhatsApp link preview) ────────────────────────────────
const seoTitle = computed(() => {
  const name = league.value?.name || appTitle.name.value || "دوري القرية";
  if (!match.value) return "Match Details";
  const ht = homeTeam.value?.title || match.value.homeTeam;
  const at = awayTeam.value?.title || match.value.awayTeam;
  if (liveStatus.value === "upcoming") return `${ht} vs ${at} | ${name}`;
  const score = formatScore(match.value, locale.value);
  return `${ht} ${score} ${at} | ${name}`;
});

const seoDescription = computed(() => shareText());

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogImage: () => resultCardUrl.value,
  ogImageAlt: () => seoTitle.value,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
  twitterImage: () => resultCardUrl.value,
});
</script>

<style lang="scss" scoped>
.page-wrap {
  padding-bottom: calc(var(--bottom-nav-height) + 32px);
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
  &:hover {
    color: var(--primary);
  }
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
.skeleton-hero {
  margin: 20px;
  height: 220px;
  border-radius: 20px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;
}

.skeleton-section {
  height: 120px;
  border-radius: 14px;
  margin-bottom: 16px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sh 1.4s linear infinite;

  &.tall {
    height: 200px;
  }
  &.short {
    height: 80px;
  }
}

@keyframes sh {
  to {
    background-position: -200% 0;
  }
}

// ── Scoreboard hero ────────────────────────────────────────────────────────────
.scoreboard-hero {
  margin: 16px 20px 0;
  border-radius: 20px;
  padding: 28px 20px 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #e8f5e9 0%, #c8e6c9 60%, #e8f5e9 100%);
  border: 1px solid var(--primary-mid);

  :root.dark & {
    background: linear-gradient(145deg, #0a1628 0%, #111827 60%, #0d1f0d 100%);
    border: 1px solid rgba(34, 197, 94, 0.15);
  }

  &.status-live {
    box-shadow: 0 0 30px rgba(34, 197, 94, 0.12);
  }
}

.pitch-center-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(0, 80, 0, 0.08);
  pointer-events: none;

  :root.dark & {
    background: rgba(255, 255, 255, 0.06);
  }
}

// Status
.hero-status {
  text-align: center;
  margin-bottom: 20px;
}
.badge-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-soft);
  color: var(--primary);
  border: 1px solid var(--primary-mid);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
}
.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse-g 1.5s infinite;
}
@keyframes pulse-g {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.6);
  }
}
.badge-ft {
  display: inline-flex;
  align-items: center;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;

  :root.dark & {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
  }
}
.badge-upcoming {
  color: var(--text-muted);
  font-size: 0.8rem;

  :root.dark & {
    color: rgba(255, 255, 255, 0.6);
  }
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
  position: relative;
  transition: opacity 0.2s, transform 0.2s;

  &:hover .hero-logo {
    transform: scale(1.05);
  }

  &.is-winner {
    .hero-team-name {
      color: var(--primary);
      font-weight: 800;
    }
    .hero-logo {
      box-shadow: 0 0 0 3px var(--primary);
    }
  }

  &.is-loser {
    opacity: 0.55;
  }
}

.winner-crown {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1rem;
  line-height: 1;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.hero-logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
.hero-initial {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary);
}

.hero-team-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;

  :root.dark & {
    color: #fff;
  }
}
.hero-team-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  :root.dark & {
    color: rgba(255, 255, 255, 0.4);
  }
}

.hero-venue {
  text-align: center;
  margin-bottom: 14px;
  font-size: 0.82rem;
  color: var(--text-muted);

  :root.dark & {
    color: rgba(255, 255, 255, 0.4);
  }

  .iconify {
    margin-inline-end: 4px;
  }
}

.hero-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.score-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 2px solid rgba(0, 80, 0, 0.12);

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.score-num {
  font-size: 3.4rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;

  :root.dark & {
    color: rgba(255, 255, 255, 0.85);
  }

  &.winner {
    color: var(--primary);
  }
}
.score-dash {
  font-size: 2rem;
  color: var(--border-color);
  line-height: 1;
}

.score-extra {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 220px;
  text-align: center;
}

.score-method-badge {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-soft);
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.2px;

  &.pen {
    color: #ca8a04;
    background: rgba(234, 179, 8, 0.15);
  }
}

.score-pens {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.score-pens-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.28);
}

.pens-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #ca8a04;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pens-nums {
  display: flex;
  align-items: center;
  gap: 10px;
  direction: ltr;
}

.pens-num {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--text-muted);
  min-width: 1.2em;
  text-align: center;

  &.win {
    color: var(--primary);
  }
}

.pens-dash {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-muted);
}

.score-winner-banner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 800;
  max-width: 260px;
  text-align: center;
  flex-wrap: wrap;
  justify-content: center;
}

.winner-how {
  font-weight: 600;
  opacity: 0.85;
  font-size: 0.7rem;
}

.score-subtitle {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

// Countdown
.countdown {
  display: flex;
  align-items: center;
  gap: 6px;
}
.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.countdown-num {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}
.countdown-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-transform: uppercase;

  :root.dark & {
    color: rgba(255, 255, 255, 0.35);
  }
}
.countdown-sep {
  font-size: 1.5rem;
  color: var(--border-color);
  margin-bottom: 12px;
}

:root.dark .countdown-sep {
  color: rgba(255, 255, 255, 0.3);
}

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
.goals-divider {
  background: var(--border-color);
}
.goals-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.goal-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  &.away {
    flex-direction: row-reverse;
  }
}
.goal-player {
  font-weight: 600;
  color: var(--text-primary);
}
.goal-minute {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.goal-icon {
  color: var(--primary);
  flex-shrink: 0;
}
.card-yellow {
  color: #eab308;
}
.card-red {
  color: #ef4444;
}

// ── MOTM Winner ───────────────────────────────────────────────────────────────
.motm-winner {
  position: relative;
  text-align: center;
  padding: 20px 0 16px;
}
.winner-glow {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(234, 179, 8, 0.2) 0%,
    transparent 70%
  );
  pointer-events: none;
}
.winner-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #ca8a04;
  background: var(--bg-elevated);
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.winner-initial {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ca8a04;
}
.winner-star {
  color: #ca8a04;
  margin-bottom: 4px;
}
.winner-name {
  display: block;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}
.winner-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.vote-results {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vote-result-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.vr-name {
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 90px;
  color: var(--text-primary);
}
.vr-bar {
  flex: 1;
}
.vr-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  min-width: 35px;
  text-align: end;
}

// ── Voting ─────────────────────────────────────────────────────────────────────
.vote-prompt {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.vote-done-msg {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0 0 16px;
}
.predict-guest-hint {
  display: block;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
}

.motm-teams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.motm-team-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.motm-team-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--bg-elevated);
}
.motm-team-initial {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--primary);
  color: #fff;
  flex-shrink: 0;
}
.motm-team-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}
.motm-player-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  &:hover {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
  &:active {
    transform: scale(0.98);
  }
  &.voted {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
}
.motm-player-num {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--bg-elevated);
  color: var(--text-muted);
  flex-shrink: 0;
}
.motm-player-name {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}
.motm-pct {
  font-size: 0.72rem;
  color: var(--text-muted);
  flex-shrink: 0;
}
.motm-check {
  color: var(--primary);
  flex-shrink: 0;
}
.motm-vote-btn {
  flex-shrink: 0;
}
.motm-results-after {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vr-team {
  font-size: 0.7rem;
  color: var(--text-muted);
  min-width: 60px;
}

.mt-2 {
  margin-top: 6px;
}

// ── Prediction ─────────────────────────────────────────────────────────────────
.predict-candidates {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;

  &--with-draw {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
.predict-card {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  cursor: pointer;

  &.voted {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
}
.predict-logo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 4px;
}
.predict-initial {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--primary);
}
.predict-team-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}
.predict-pct {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
}
.predict-vs {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-muted);
  white-space: nowrap;
}

.predict-card--draw {
  border-style: dashed;
}
.predict-logo--draw {
  background: var(--primary-soft);
  border-color: var(--primary-mid);
}
.draw-icon {
  color: var(--primary);
}

// ── Video ──────────────────────────────────────────────────────────────────────
.video-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.video-wrap {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  padding-top: 56.25%;
  background: #000;
  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
}

// ── H2H ───────────────────────────────────────────────────────────────────────
.h2h-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 12px;
}
.h2h-stat {
  text-align: center;
  &.center .h2h-num {
    color: var(--text-muted);
  }
}
.h2h-num {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}
.h2h-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

// ── Share ──────────────────────────────────────────────────────────────────────
.share-section {
  margin: 20px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.share-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.result-card-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 4px;
}

.result-card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  width: min(100%, 320px);
  transition: background 0.15s, border-color 0.15s, transform 0.15s;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }

  &.primary {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
    box-shadow: 0 6px 18px rgba(34, 197, 94, 0.28);
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.result-card-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.share-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.spin {
  animation: spin-rc 0.8s linear infinite;
}

@keyframes spin-rc {
  to {
    transform: rotate(360deg);
  }
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

  &:hover {
    transform: translateY(-2px);
  }
  &:active {
    transform: scale(0.95);
  }

  &.native {
    background: var(--primary);
    &:hover {
      background: color-mix(in srgb, var(--primary) 85%, #000);
    }
  }
  &.messenger {
    background: #006aff;
    &:hover {
      background: #0052cc;
    }
  }
  &.whatsapp {
    background: #25d366;
    &:hover {
      background: #1da851;
    }
  }
  &.facebook {
    background: #1877f2;
    &:hover {
      background: #166fe5;
    }
  }
  &.telegram {
    background: #0088cc;
    &:hover {
      background: #0077b5;
    }
  }
  &.twitter {
    background: #1da1f2;
    &:hover {
      background: #1a8cd8;
    }
  }
  &.copy {
    background: var(--text-muted);
    &:hover {
      background: var(--text-sub);
    }
  }
}

// ── Mobile ─────────────────────────────────────────────────────────────────────
@media (max-width: 600px) {
  .scoreboard-hero {
    margin: 12px 14px 0;
    padding: 20px 14px 18px;
  }
  .section-card {
    margin: 12px 0px 0;
    padding: 12px 8px;
  }
  .share-section {
    margin: 12px 14px 0;
  }
  .back-row {
    padding: 12px 14px 0;
  }

  .hero-logo {
    width: 52px;
    height: 52px;
    border-radius: 10px;
  }
  .hero-team-name {
    font-size: 0.82rem;
  }
  .score-circle {
    width: 140px;
    height: 140px;
    gap: 16px;
  }
  .score-num {
    font-size: 2.6rem;
  }
  .score-dash {
    font-size: 1.4rem;
  }

  .motm-teams {
    gap: 6px;
  }
  .motm-team-col {
    min-width: 0;
    overflow: hidden;
  }
  .motm-player-row {
    padding: 8px 6px;
    gap: 4px;
    border-radius: 10px;
    min-height: 40px;
  }
  .motm-player-num {
    width: 20px;
    height: 20px;
    font-size: 0.6rem;
  }
  .motm-player-name {
    font-size: 0.72rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .motm-vote-btn {
    display: none;
  }
  .motm-player-name {
    font-size: 0.88rem;
  }
  .motm-player-num {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
    border-radius: 8px;
  }
  .motm-team-header {
    padding: 10px 14px;
    border-radius: 14px;
  }
  .motm-team-initial {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }
  .motm-team-label {
    font-size: 0.9rem;
  }
  .motm-check {
    transform: scale(1.2);
  }
  .motm-vote-btn {
    min-width: 52px;
    justify-content: center;
  }
  .vote-result-row {
    gap: 8px;
  }
  .vr-name {
    min-width: 70px;
    font-size: 0.75rem;
  }
  .predict-card {
    padding: 10px 6px;
  }
  .predict-logo {
    width: 44px;
    height: 44px;
  }
  .predict-team-name {
    font-size: 0.72rem;
  }
  .predict-candidates {
    gap: 8px;
  }
  .predict-candidates--with-draw {
    gap: 6px;
  }
  .draw-icon {
    font-size: 20px !important;
  }
}
</style>

<style lang="scss">
.auth-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}
.auth-tab {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &.active {
    background: var(--bg-surface);
    color: var(--text-primary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
}
.auth-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin: 4px 0 20px;
}
.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: var(--bg-surface);
    border-color: var(--primary-mid);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.auth-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}
.auth-success {
  color: #22c55e;
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}
.auth-submit {
  width: 100%;
  margin-top: 4px;
}
.auth-switch {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 16px 0 0;
}
.auth-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.82rem;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
}
</style>
