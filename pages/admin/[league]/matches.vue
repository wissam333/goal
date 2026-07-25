<template>
  <div>
    <SharedUiFeedbackAlert
      v-if="alert.show"
      v-model="alert.show"
      :type="alert.type"
      :title="alert.title"
      :message="alert.message"
      dismissible
      :duration="4000"
    />

    <SharedUiHeaderPage
      title="المباريات"
      subtitle="إدارة مباريات الدوري"
      icon="mdi:calendar-outline"
      :is-rtl="true"
    >
      <template #actions>
        <SharedUiButtonBase
          variant="primary"
          icon-left="mdi:calendar-plus-outline"
          @click="openAddModal"
        >
          إضافة مباراة
        </SharedUiButtonBase>
      </template>
    </SharedUiHeaderPage>

    <SharedUiTableDataTable
      :columns="matchColumns"
      :data="matchesDisplay"
      :loading="loading"
      :actions="matchActions"
      status-column-key="computedStatus"
      empty-text="لا توجد مباريات"
      empty-description="لم يتم إضافة أي مباريات بعد. أضف مباراة جديدة للبدء."
      empty-icon="mdi:calendar-remove"
      @action-click="handleMatchAction"
    >
      <template #cell-matchTitle="{ row }">
        <div class="d-flex align-items-center gap-1">
          <span class="team-label">{{ row.homeTitle }}</span>
          <span class="vs-text">vs</span>
          <span class="team-label">{{ row.awayTitle }}</span>
        </div>
      </template>
      <template #cell-group="{ value }">
        <span v-if="value === 'R16'" class="round-badge">دور الـ 16</span>
        <span v-else-if="value === 'QF'" class="round-badge">ربع النهائي</span>
        <span v-else-if="value === 'SF'" class="round-badge">نصف النهائي</span>
        <span v-else-if="value === 'FINAL'" class="round-badge final">النهائي</span>
        <span v-else class="round-badge group">المجموعة {{ value }}</span>
      </template>
      <template #cell-score="{ row }">
        <span v-if="row.computedStatus === 'played'" class="score-text">
          {{ formatScore(row) }}
        </span>
        <span v-else class="text-muted">—</span>
      </template>
      <template #cell-date="{ value }">
        <span class="date-text">{{ formatDate(value) }}</span>
      </template>
      <template #cell-computedStatus="{ row }">
        <span class="status-dt" :class="row.computedStatus">{{
          statusLabel(row.computedStatus)
        }}</span>
      </template>
    </SharedUiTableDataTable>

    <SharedUiDialogAppModal
      v-model="modalOpen"
      :title="editingMatch ? 'تعديل المباراة' : 'إضافة مباراة جديدة'"
      maxWidth="640px"
    >
      <form @submit.prevent="handleSave" class="modal-form">
        <div class="form-grid">
          <SharedUiFormBaseInput
            v-model="form.date"
            label="التاريخ"
            type="datetime-local"
          />
          <SharedUiFormBaseSelect
            v-model="form.group"
            label="الدور"
            :options="groupOptions"
            placeholder="اختر الدور"
          />
          <SharedUiFormBaseSelect
            v-if="['R16','QF','SF','FINAL'].includes(form.group)"
            v-model="form.bracketSlot"
            label="موقع السحب"
            :options="bracketSlotOptions"
            placeholder="اختر موقع المباراة"
          />
          <SharedUiFormBaseInput
            v-model="form.venue"
            label="الملعب"
            placeholder="الملعب الرئيسي"
          />
          <SharedUiFormBaseSelect
            v-model="form.homeTeam"
            label="الفريق المضيف"
            :options="filteredTeamOptions"
            placeholder="اختر الفريق"
          />
          <SharedUiFormBaseSelect
            v-model="form.awayTeam"
            label="الفريق الضيف"
            :options="filteredTeamOptions"
            placeholder="اختر الفريق"
          />
          <template v-if="form.date && computeStatus(form.date) !== 'upcoming'">
            <div class="scoreboard-block">
              <div class="score-section-label">نتيجة الوقت الأصلي (90 دقيقة)</div>
              <div class="scoreboard">
                <div class="score-team score-home">
                  <span
                    class="score-team-dot"
                    :style="{ background: getTeamColor(form.homeTeam) }"
                  ></span>
                  <span class="score-team-name">{{
                    getTeamTitle(form.homeTeam)
                  }}</span>
                </div>
                <div class="score-inputs">
                  <SharedUiFormBaseInput
                    v-model="form.homeScore"
                    type="number"
                    placeholder="0"
                    min="0"
                  />
                  <span class="score-dash">–</span>
                  <SharedUiFormBaseInput
                    v-model="form.awayScore"
                    type="number"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div class="score-team score-away">
                  <span
                    class="score-team-dot"
                    :style="{ background: getTeamColor(form.awayTeam) }"
                  ></span>
                  <span class="score-team-name">{{
                    getTeamTitle(form.awayTeam)
                  }}</span>
                </div>
              </div>

              <div class="result-method-block">
                <div class="score-section-label">كيف انتهت المباراة؟</div>
                <div class="result-method-tabs" role="tablist">
                  <button
                    type="button"
                    class="result-method-tab"
                    :class="{ active: form.resultMethod === 'ft' }"
                    @click="form.resultMethod = 'ft'"
                  >
                    الوقت الأصلي
                  </button>
                  <button
                    type="button"
                    class="result-method-tab"
                    :class="{ active: form.resultMethod === 'aet' }"
                    @click="form.resultMethod = 'aet'"
                  >
                    وقت إضافي
                  </button>
                  <button
                    type="button"
                    class="result-method-tab"
                    :class="{ active: form.resultMethod === 'pen' }"
                    @click="form.resultMethod = 'pen'"
                  >
                    ركلات ترجيح
                  </button>
                </div>
              </div>

              <template v-if="form.resultMethod === 'aet' || form.resultMethod === 'pen'">
                <div class="score-section-label">
                  النتيجة بعد الوقت الإضافي
                  <span class="score-hint">(المجموع الكلي شامل الـ 90 دقيقة)</span>
                </div>
                <div class="scoreboard scoreboard-sub">
                  <div class="score-inputs">
                    <SharedUiFormBaseInput
                      v-model="form.homeScoreAET"
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                    <span class="score-dash">–</span>
                    <SharedUiFormBaseInput
                      v-model="form.awayScoreAET"
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </template>

              <template v-if="form.resultMethod === 'pen'">
                <div class="score-section-label">ركلات الترجيح</div>
                <div class="scoreboard scoreboard-sub scoreboard-pen">
                  <div class="score-inputs">
                    <SharedUiFormBaseInput
                      v-model="form.homePenalties"
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                    <span class="score-dash">–</span>
                    <SharedUiFormBaseInput
                      v-model="form.awayPenalties"
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <span class="pen-badge">ر.ت.</span>
                </div>
              </template>
            </div>
          </template>
          <template v-if="form.homeTeam && form.awayTeam">
            <div class="motm-field-wrap">
              <SharedUiFormBaseSelect
                v-model="form.motmWinner"
                label="أفضل لاعب (MOTM)"
                :options="motmPlayerOptions"
                placeholder="اختر أفضل لاعب"
                searchable
                clearable
              />
            </div>
          </template>
        </div>

        <!-- Goal scorers -->
        <template v-if="form.date && computeStatus(form.date) !== 'upcoming'">
          <div class="goals-section">
            <div class="goals-title">
              <Icon name="mdi:soccer" size="16" />
              مسجلو الأهداف
              <span class="goals-count"
                >{{ goalScorers.length }} / {{ totalGoals }}</span
              >
            </div>

            <!-- Home team scorers -->
            <div class="goals-team-block">
              <div class="goals-team-header">
                <span
                  class="goals-team-dot"
                  :style="{ background: getTeamColor(form.homeTeam) }"
                ></span>
                <span class="goals-team-label">{{
                  getTeamTitle(form.homeTeam)
                }}</span>
              </div>
              <div
                v-for="gs in goalScorers.filter(
                  (g) => g.team === form.homeTeam,
                )"
                :key="gs._key"
                class="goals-row"
              >
                <SharedUiFormBaseSelect
                  v-model="gs.player"
                  :options="
                    homeTeamPlayers.map((p) => ({
                      label: `${p.title}${p.number ? ' (' + p.number + ')' : ''}`,
                      value: p.slug,
                    }))
                  "
                  placeholder="اختر اللاعب"
                  searchable
                  size="sm"
                  @change="
                    (val) => onPlayerSelect(goalScorers.value.indexOf(gs), val)
                  "
                />
                <SharedUiFormBaseInput
                  v-model="gs.minute"
                  type="number"
                  placeholder="دقيقة"
                  size="sm"
                />
                <button
                  class="goal-remove"
                  type="button"
                  @click="removeGoalScorer(gs)"
                  title="إزالة"
                >
                  <Icon name="mdi:close" size="14" />
                </button>
              </div>
            </div>

            <!-- Away team scorers -->
            <div class="goals-team-block">
              <div class="goals-team-header">
                <span
                  class="goals-team-dot"
                  :style="{ background: getTeamColor(form.awayTeam) }"
                ></span>
                <span class="goals-team-label">{{
                  getTeamTitle(form.awayTeam)
                }}</span>
              </div>
              <div
                v-for="gs in goalScorers.filter(
                  (g) => g.team === form.awayTeam,
                )"
                :key="gs._key"
                class="goals-row"
              >
                <SharedUiFormBaseSelect
                  v-model="gs.player"
                  :options="
                    awayTeamPlayers.map((p) => ({
                      label: `${p.title}${p.number ? ' (' + p.number + ')' : ''}`,
                      value: p.slug,
                    }))
                  "
                  placeholder="اختر اللاعب"
                  searchable
                  size="sm"
                  @change="
                    (val) => onPlayerSelect(goalScorers.value.indexOf(gs), val)
                  "
                />
                <SharedUiFormBaseInput
                  v-model="gs.minute"
                  type="number"
                  placeholder="دقيقة"
                  size="sm"
                />
                <button
                  class="goal-remove"
                  type="button"
                  @click="removeGoalScorer(gs)"
                  title="إزالة"
                >
                  <Icon name="mdi:close" size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Cards -->
          <div class="goals-section">
            <div class="goals-title">
              <Icon name="mdi:card" size="16" />
              البطاقات
              <span class="goals-count">اختياري</span>
            </div>

            <!-- Home team cards -->
            <div class="goals-team-block">
              <div class="goals-team-header">
                <span
                  class="goals-team-dot"
                  :style="{ background: getTeamColor(form.homeTeam) }"
                ></span>
                <span class="goals-team-label">{{
                  getTeamTitle(form.homeTeam)
                }}</span>
              </div>
              <div
                v-for="c in cards.filter((c) => c.team === form.homeTeam)"
                :key="c._key"
                class="goals-row"
              >
                <SharedUiFormBaseSelect
                  v-model="c.player"
                  :options="
                    homeTeamPlayers.map((p) => ({
                      label: `${p.title}${p.number ? ' (' + p.number + ')' : ''}`,
                      value: p.slug,
                    }))
                  "
                  placeholder="اختر اللاعب"
                  searchable
                  size="sm"
                  @change="
                    (val) => {
                      if (val) c.team = form.homeTeam;
                    }
                  "
                />
                <SharedUiFormBaseSelect
                  v-model="c.type"
                  :options="cardTypeOptions"
                  placeholder="النوع"
                  size="sm"
                  style="width: 100px; flex-shrink: 0"
                />
                <div style="width: 90px; flex-shrink: 0">
                  <SharedUiFormBaseInput
                    v-model="c.minute"
                    type="number"
                    placeholder="دقيقة"
                    size="sm"
                  />
                </div>
                <button
                  class="goal-remove"
                  type="button"
                  @click="removeCard(c)"
                  title="إزالة"
                >
                  <Icon name="mdi:close" size="14" />
                </button>
              </div>
              <button
                class="goals-add-btn"
                type="button"
                @click="addCard(form.homeTeam)"
              >
                <Icon name="mdi:plus" size="14" />
                إضافة بطاقة {{ getTeamTitle(form.homeTeam) }}
              </button>
            </div>

            <!-- Away team cards -->
            <div class="goals-team-block">
              <div class="goals-team-header">
                <span
                  class="goals-team-dot"
                  :style="{ background: getTeamColor(form.awayTeam) }"
                ></span>
                <span class="goals-team-label">{{
                  getTeamTitle(form.awayTeam)
                }}</span>
              </div>
              <div
                v-for="c in cards.filter((c) => c.team === form.awayTeam)"
                :key="c._key"
                class="goals-row"
              >
                <SharedUiFormBaseSelect
                  v-model="c.player"
                  :options="
                    awayTeamPlayers.map((p) => ({
                      label: `${p.title}${p.number ? ' (' + p.number + ')' : ''}`,
                      value: p.slug,
                    }))
                  "
                  placeholder="اختر اللاعب"
                  searchable
                  size="sm"
                  @change="
                    (val) => {
                      if (val) c.team = form.awayTeam;
                    }
                  "
                />
                <SharedUiFormBaseSelect
                  v-model="c.type"
                  :options="cardTypeOptions"
                  placeholder="النوع"
                  size="sm"
                  style="width: 100px; flex-shrink: 0"
                />
                <div style="width: 90px; flex-shrink: 0">
                  <SharedUiFormBaseInput
                    v-model="c.minute"
                    type="number"
                    placeholder="دقيقة"
                    size="sm"
                  />
                </div>
                <button
                  class="goal-remove"
                  type="button"
                  @click="removeCard(c)"
                  title="إزالة"
                >
                  <Icon name="mdi:close" size="14" />
                </button>
              </div>
              <button
                class="goals-add-btn"
                type="button"
                @click="addCard(form.awayTeam)"
              >
                <Icon name="mdi:plus" size="14" />
                إضافة بطاقة {{ getTeamTitle(form.awayTeam) }}
              </button>
            </div>
          </div>
        </template>
      </form>

      <template #actions>
        <div class="notif-actions" v-if="editingMatch">
          <SharedUiButtonBase
            variant="outline"
            size="sm"
            icon-left="mdi:bell-ring"
            :disabled="sendingNotif"
            @click="sendNotif('started')"
          >
            🔴 بدأت المباراة
          </SharedUiButtonBase>
          <SharedUiButtonBase
            variant="outline"
            size="sm"
            icon-left="mdi:bell-check"
            :disabled="sendingNotif"
            @click="sendNotif('result')"
          >
            📊 إشعار النتيجة
          </SharedUiButtonBase>
          <SharedUiButtonBase
            variant="outline"
            size="sm"
            icon-left="mdi:stop-circle-outline"
            :disabled="sendingNotif"
            @click="sendNotif('ended')"
          >
            ✅ انتهت المباراة
          </SharedUiButtonBase>
        </div>
        <SharedUiButtonBase variant="outline" @click="modalOpen = false">
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ editingMatch ? "حفظ التعديلات" : "إضافة" }}
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="albumModal.open"
      :title="
        'ألبوم الصور: ' +
        (albumModal.match
          ? albumModal.match.title || getMatchTitle(albumModal.match)
          : '')
      "
      maxWidth="640px"
    >
      <div v-if="!albumModal.photos.length" class="album-empty">
        <Icon
          name="mdi:camera-off-outline"
          size="40"
          class="album-empty-icon"
        />
        <span>لا توجد صور في الألبوم</span>
      </div>

      <div v-else class="album-grid-admin">
        <div
          v-for="(photo, i) in albumModal.photos"
          :key="i"
          class="album-item-admin"
        >
          <img :src="photo" alt="" class="album-img-admin" />
          <button
            class="album-remove-btn"
            @click="removeAlbumPhoto(i)"
            title="إزالة"
          >
            <Icon name="mdi:close" size="16" />
          </button>
        </div>
      </div>

      <div class="album-actions-row">
        <SharedUiButtonBase
          variant="outline"
          icon-left="mdi:camera-plus-outline"
          :disabled="uploading"
          @click="addAlbumPhoto"
        >
          {{ uploading ? "جاري الرفع..." : "إضافة صورة" }}
        </SharedUiButtonBase>
      </div>

      <template #actions>
        <SharedUiButtonBase variant="outline" @click="albumModal.open = false">
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          icon-left="mdi:content-save-outline"
          @click="saveAlbum"
        >
          حفظ الألبوم
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>

    <SharedUiDialogAppModal
      v-model="videoModal.open"
      :title="'الفيديو: ' + (videoModal.match ? videoModal.match.title || getMatchTitle(videoModal.match) : '')"
      maxWidth="540px"
    >
      <div v-if="!videoModal.urls.length" class="album-empty">
        <Icon name="mdi:play-circle-outline" size="40" class="album-empty-icon" />
        <span>لا توجد فيديوهات</span>
      </div>

      <div v-else class="video-list-admin">
        <div v-for="(v, i) in videoModal.urls" :key="i" class="video-item-admin">
          <SharedUiFormBaseInput
            v-model="v.url"
            placeholder="رابط يوتيوب أو فيسبوك"
            dir="ltr"
            size="sm"
          />
          <SharedUiButtonBase
            variant="error"
            icon-left="mdi:close"
            size="sm"
            @click="removeVideoUrl(i)"
          />
        </div>
      </div>

      <div class="album-actions-row">
        <SharedUiButtonBase
          variant="outline"
          icon-left="mdi:plus"
          @click="addVideoUrl"
        >
          إضافة رابط
        </SharedUiButtonBase>
      </div>

      <template #actions>
        <SharedUiButtonBase variant="outline" @click="videoModal.open = false">
          إلغاء
        </SharedUiButtonBase>
        <SharedUiButtonBase
          variant="primary"
          icon-left="mdi:content-save-outline"
          @click="saveVideoModal"
        >
          حفظ الفيديو
        </SharedUiButtonBase>
      </template>
    </SharedUiDialogAppModal>
  </div>
</template>

<script setup>
definePageMeta({ layout: "admin-layer2" });

const admin = useAdminData();
const { unprefixSlug } = useCurrentLeague();
const { awardPoints } = usePredictionPoints();
const {
  formatScore,
  getWinnerSlug,
  getOpenPlayScore,
  getOpenPlayGoalTotal,
  getOpenPlayTeamGoals,
  buildResultFields,
  validateResultForm,
} = useMatchResult();
const siteUrl = useRuntimeConfig().public.siteUrl;

const teams = ref([]);
const players = ref([]);
const matches = ref([]);
const votesData = ref([]);
const loading = ref(true);

const modalOpen = ref(false);
const editingMatch = ref(null);
const saving = ref(false);

const alert = reactive({
  show: false,
  type: "success",
  title: "",
  message: "",
});

const computeStatus = (dateStr) => {
  if (!dateStr) return "upcoming";
  const syriaTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Damascus",
  });
  const now = new Date(syriaTime);
  const matchDate = new Date(dateStr);
  const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
  if (now > matchEnd) return "played";
  if (now >= matchDate) return "live";
  return "upcoming";
};

const isPastMatch = (dateStr) => {
  return computeStatus(dateStr) === "played";
};

const notifCenter = useNotificationCenter();
const push = usePushNotifications();
const sendingNotif = ref(false);

async function sendNotif(type) {
  if (!editingMatch.value) return;
  const homeTitle =
    teams.value.find((t) => t.slug === editingMatch.value.homeTeam)?.title ||
    editingMatch.value.homeTeam;
  const awayTitle =
    teams.value.find((t) => t.slug === editingMatch.value.awayTeam)?.title ||
    editingMatch.value.awayTeam;
  const matchSlug = editingMatch.value.slug;
  const matchLeague = matchSlug.includes('::') ? matchSlug.split('::')[0] : '';
  const matchUrl = matchLeague ? `${siteUrl}/${matchLeague}/matches/${matchSlug}` : `${siteUrl}/matches/${matchSlug}`;

  if (type === "started") {
    const title = "🔴 المباراة بدأت";
    const body = `انطلقت مباراة ${homeTitle} vs ${awayTitle}`;
    sendingNotif.value = true;
    notifCenter.add({ title, body, url: matchUrl });
    try {
      await $fetch("/api/notifications/send", {
        method: "POST",
        body: { title, body, url: matchUrl },
      });
      showAlert("success", "تم الإرسال", `تم إرسال إشعار "${title}"`);
    } catch {
      showAlert("error", "خطأ", "فشل إرسال الإشعار");
    } finally {
      sendingNotif.value = false;
    }
    return;
  }

  if (type === "ended") {
    if (!form.homeTeam || !form.awayTeam) {
      showAlert("error", "خطأ", "يرجى اختيار الفريق المضيف والفريق الضيف");
      return;
    }
    if (form.homeTeam === form.awayTeam) {
      showAlert("error", "خطأ", "يجب أن يختلف الفريق المضيف عن الفريق الضيف");
      return;
    }

    sendingNotif.value = true;
    const resultErr = validateResultForm(form);
    if (resultErr) {
      showAlert("error", "خطأ", resultErr);
      sendingNotif.value = false;
      return;
    }

    const matchDate = form.date ? new Date(form.date).toISOString() : null;
    const resultFields = buildResultFields(form, { isUpcoming: false });
    const matchObj = {
      slug: editingMatch.value?.slug || generateSlug(),
      title: generateTitle(),
      date: matchDate,
      group: form.group || "A",
      venue: form.venue || "الملعب الرئيسي",
      status: "played",
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      ...resultFields,
      goalScorers: goalScorers.value.map((g) => ({
        player: g.player,
        team: g.team,
        minute: g.minute ? Number(g.minute) : null,
      })),
      cards: cards.value
        .filter((c) => c.player)
        .map((c) => ({
          player: c.player,
          team: c.team,
          type: c.type,
          minute: c.minute ? Number(c.minute) : null,
        })),
      motmWinner: form.motmWinner || null,
      photos: editingMatch.value?.photos || [],
      videos: editingMatch.value?.videos || [],
    };

    try {
      await admin.saveMatch(matchObj);
      await syncPlayerGoals();

      if (matchObj.status === "played") {
        const { awarded } = await awardPoints(matchObj.slug);
        if (awarded > 0) console.log(`Awarded points to ${awarded} users`);
      }

      const title = "✅ انتهت المباراة";
      const body = `انتهت مباراة ${homeTitle} ${formatScore(matchObj)} ${awayTitle}`;
      notifCenter.add({ title, body, url: matchUrl });
      await $fetch("/api/notifications/send", {
        method: "POST",
        body: { title, body, url: matchUrl },
      });

      modalOpen.value = false;
      await loadData();
      showAlert(
        "success",
        "تم الحفظ والإرسال",
        `تم حفظ المباراة وإرسال إشعار "${title}"`,
      );
    } catch {
      showAlert("error", "خطأ", "فشل حفظ المباراة أو إرسال الإشعار");
    } finally {
      sendingNotif.value = false;
    }
    return;
  }

  // result
  if (!form.homeTeam || !form.awayTeam) {
    showAlert("error", "خطأ", "يرجى اختيار الفريق المضيف والفريق الضيف");
    return;
  }
  if (form.homeTeam === form.awayTeam) {
    showAlert("error", "خطأ", "يجب أن يختلف الفريق المضيف عن الفريق الضيف");
    return;
  }

  if (computeStatus(form.date) !== "upcoming") {
    const resultErr = validateResultForm(form);
    if (resultErr) {
      showAlert("error", "خطأ", resultErr);
      return;
    }
  }

  sendingNotif.value = true;
  const matchDate = form.date ? new Date(form.date).toISOString() : null;
  const matchStatus = computeStatus(matchDate);
  const resultFields = buildResultFields(form, {
    isUpcoming: matchStatus === "upcoming",
  });
  const matchObj = {
    slug: editingMatch.value?.slug || generateSlug(),
    title: generateTitle(),
    date: matchDate,
    group: form.group || "A",
    venue: form.venue || "الملعب الرئيسي",
    status: matchStatus,
    homeTeam: form.homeTeam,
    awayTeam: form.awayTeam,
    ...resultFields,
    goalScorers: goalScorers.value.map((g) => ({
      player: g.player,
      team: g.team,
      minute: g.minute ? Number(g.minute) : null,
    })),
    cards: cards.value
      .filter((c) => c.player)
      .map((c) => ({
        player: c.player,
        team: c.team,
        type: c.type,
        minute: c.minute ? Number(c.minute) : null,
      })),
    motmWinner: form.motmWinner || null,
    photos: editingMatch.value?.photos || [],
  };

  try {
    await admin.saveMatch(matchObj);
    await syncPlayerGoals();

    if (matchObj.status === "played") {
      const { awarded } = await awardPoints(matchObj.slug);
      if (awarded > 0) console.log(`Awarded points to ${awarded} users`);
    }

    const title = "✅ نتيجة المباراة";
    const body = `${homeTitle} ${formatScore(matchObj)} ${awayTitle}`;
    notifCenter.add({ title, body, url: matchUrl });
    await $fetch("/api/notifications/send", {
      method: "POST",
      body: { title, body, url: matchUrl },
    });

    modalOpen.value = false;
    await loadData();
    showAlert(
      "success",
      "تم الحفظ والإرسال",
      `تم حفظ المباراة وإرسال إشعار "${title}"`,
    );
  } catch {
    showAlert("error", "خطأ", "فشل حفظ المباراة أو إرسال الإشعار");
  } finally {
    sendingNotif.value = false;
  }
}

function triggerMatchNotifications(oldMatch, matchObj, newStatus) {
  const homeTitle =
    teams.value.find((t) => t.slug === matchObj.homeTeam)?.title ||
    matchObj.homeTeam;
  const awayTitle =
    teams.value.find((t) => t.slug === matchObj.awayTeam)?.title ||
    matchObj.awayTeam;
  const matchTitle = `${homeTitle} vs ${awayTitle}`;
  let notifTitle = "";
  let notifBody = "";
  const notifSlug = matchObj.slug;
  const notifLeague = notifSlug.includes('::') ? notifSlug.split('::')[0] : '';
  let notifUrl = notifLeague ? `${siteUrl}/${notifLeague}/matches/${notifSlug}` : `${siteUrl}/matches/${notifSlug}`;

  if (!oldMatch) {
    notifTitle = "⚽ مباراة جديدة";
    notifBody = `تمت إضافة ${matchTitle}`;
  } else if (oldMatch.status !== "live" && newStatus === "live") {
    notifTitle = "🔴 المباراة بدأت";
    notifBody = `انطلقت مباراة ${matchTitle}`;
  } else if (oldMatch.status !== "played" && newStatus === "played") {
    notifTitle = "✅ انتهت المباراة";
    notifBody = `${matchTitle} (${formatScore(matchObj)})`;
  } else if (
    oldMatch.status === "played" &&
    newStatus === "played" &&
    (oldMatch.homeScore !== matchObj.homeScore ||
      oldMatch.awayScore !== matchObj.awayScore ||
      oldMatch.homeScoreAET !== matchObj.homeScoreAET ||
      oldMatch.awayScoreAET !== matchObj.awayScoreAET ||
      oldMatch.homePenalties !== matchObj.homePenalties ||
      oldMatch.awayPenalties !== matchObj.awayPenalties ||
      oldMatch.resultMethod !== matchObj.resultMethod)
  ) {
    notifTitle = "🔄 تم تحديث النتيجة";
    notifBody = `تحديث نتيجة ${matchTitle}: ${formatScore(matchObj)}`;
  }

  if (!notifTitle) return;

  notifCenter.add({ title: notifTitle, body: notifBody, url: notifUrl });
  sendPushNotification(notifTitle, notifBody, notifUrl);
}

async function sendPushNotification(title, body, url) {
  try {
    await $fetch("/api/notifications/send", {
      method: "POST",
      body: { title, body, url },
    });
  } catch {
    // silent — push may not be configured
  }
}

const form = reactive({
  date: "",
  group: "",
  bracketSlot: "",
  venue: "الملعب الرئيسي",
  homeTeam: "",
  awayTeam: "",
  homeScore: null,
  awayScore: null,
  homeScoreAET: null,
  awayScoreAET: null,
  homePenalties: null,
  awayPenalties: null,
  resultMethod: "ft",
  motmWinner: "",
});

const defaultForm = () => ({
  date: "",
  group: "",
  bracketSlot: "",
  venue: "الملعب الرئيسي",
  homeTeam: "",
  awayTeam: "",
  homeScore: null,
  awayScore: null,
  homeScoreAET: null,
  awayScoreAET: null,
  homePenalties: null,
  awayPenalties: null,
  resultMethod: "ft",
  motmWinner: "",
});

const loadData = async () => {
  loading.value = true;
  teams.value = await admin.getTeams();
  players.value = await admin.getPlayers();
  matches.value = await admin.getMatches();
  const s = await admin.getSettings();
  if (s?.groups?.length) settings.value.groups = [...s.groups];
  if (s?.knockout_draw) settings.value.draw = s.knockout_draw;
  loading.value = false;
};

onMounted(() => {
  loadData();
});

const goalScorers = ref([]);
const cards = ref([]);

const cardTypeOptions = [
  { label: "صفراء", value: "yellow" },
  { label: "حمراء", value: "red" },
];

const addCard = (team) => {
  cards.value.push({
    player: "",
    team: team || "",
    type: "yellow",
    minute: "",
    _key: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
  });
};

const removeCard = (card) => {
  const idx = cards.value.indexOf(card);
  if (idx !== -1) cards.value.splice(idx, 1);
};

const loadVotes = async (matchSlug) => {
  if (!matchSlug) return;
  const supabase = useSupabase();
  if (!supabase) return;
  const { data } = await supabase
    .from("votes")
    .select("player_slug")
    .eq("match_slug", matchSlug);
  votesData.value = data || [];
};

const removeGoalScorer = (scorer) => {
  const idx = goalScorers.value.indexOf(scorer);
  if (idx !== -1) goalScorers.value.splice(idx, 1);
};

const addGoalScorer = (team) => {
  goalScorers.value.push({
    player: "",
    team: team || "",
    minute: "",
    _key: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
  });
};

const totalGoals = computed(() => getOpenPlayGoalTotal(form));

// Auto-create empty goal scorer rows when open-play score changes (FT or AET)
watch(
  [
    () => form.homeScore,
    () => form.awayScore,
    () => form.homeScoreAET,
    () => form.awayScoreAET,
    () => form.resultMethod,
  ],
  () => {
    if (!form.homeTeam || !form.awayTeam) return;
    const { home: nh, away: na } = getOpenPlayTeamGoals(form);
    while (
      goalScorers.value.filter((g) => g.team === form.homeTeam).length < nh
    ) {
      goalScorers.value.push({
        player: "",
        team: form.homeTeam,
        minute: "",
        _key: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      });
    }
    while (
      goalScorers.value.filter((g) => g.team === form.awayTeam).length < na
    ) {
      goalScorers.value.push({
        player: "",
        team: form.awayTeam,
        minute: "",
        _key: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      });
    }
  },
);

const onPlayerSelect = (index, playerSlug) => {
  if (playerSlug) {
    const player = players.value.find((p) => p.slug === playerSlug);
    goalScorers.value[index].team = player?.team || "";
  }
};

const syncPlayerGoals = async () => {
  const supabase = useSupabase()
  if (!supabase) return
  const _route = useRoute()
  const { leagueId } = useCurrentLeague()
  let lid = leagueId.value
  if (!lid && _route.params.league) {
    const { data } = await supabase.from('leagues').select('id').eq('slug', _route.params.league).maybeSingle()
    if (data) lid = data.id
  }
  if (!lid) return
  await supabase.rpc('recalculate_player_goals', { p_league_id: lid })
};

const goalScorerPlayerOptions = computed(() => {
  if (!form.homeTeam && !form.awayTeam) return [];
  const home = teams.value.find((t) => t.slug === form.homeTeam);
  const away = teams.value.find((t) => t.slug === form.awayTeam);
  const homePlayers = players.value.filter((p) => p.team === form.homeTeam);
  const awayPlayers = players.value.filter((p) => p.team === form.awayTeam);
  return [
    {
      label: home?.title || form.homeTeam,
      options: homePlayers.map((p) => ({
        label: `${p.title}${p.number ? " (" + p.number + ")" : ""}`,
        value: p.slug,
      })),
    },
    {
      label: away?.title || form.awayTeam,
      options: awayPlayers.map((p) => ({
        label: `${p.title}${p.number ? " (" + p.number + ")" : ""}`,
        value: p.slug,
      })),
    },
  ];
});

const sortedMatches = computed(() => {
  return [...matches.value].sort((a, b) => new Date(b.date) - new Date(a.date));
});

const matchesDisplay = computed(() =>
  sortedMatches.value.map((m) => ({
    ...m,
    matchTitle: getMatchTitle(m),
    homeTitle: getTeamTitle(m.homeTeam),
    awayTitle: getTeamTitle(m.awayTeam),
    computedStatus: computeStatus(m.date),
  })),
);

const getMatchTitle = (match) => {
  const home = teams.value.find((t) => t.slug === match.homeTeam);
  const away = teams.value.find((t) => t.slug === match.awayTeam);
  if (!home || !away) return "";
  const prefix =
    match.group === "R16"
      ? "دور الـ 16: "
      : match.group === "QF"
        ? "ربع النهائي: "
        : match.group === "SF"
          ? "نصف النهائي: "
          : match.group === "FINAL"
            ? "النهائي: "
            : "";
  return `${prefix}${home.title} vs ${away.title}`;
};

const motmPlayerOptions = computed(() => {
  if (!form.homeTeam && !form.awayTeam) return [];
  const voteCount = {};
  votesData.value.forEach((v) => {
    voteCount[v.player_slug] = (voteCount[v.player_slug] || 0) + 1;
  });
  const home = teams.value.find((t) => t.slug === form.homeTeam);
  const away = teams.value.find((t) => t.slug === form.awayTeam);
  const homePlayers = players.value.filter((p) => p.team === form.homeTeam);
  const awayPlayers = players.value.filter((p) => p.team === form.awayTeam);
  return [
    {
      label: home?.title || form.homeTeam,
      options: homePlayers.map((p) => ({
        label: `${p.title} (${p.number})`,
        value: p.slug,
        badge: voteCount[p.slug] ? `${voteCount[p.slug]} صوت` : "0",
      })),
    },
    {
      label: away?.title || form.awayTeam,
      options: awayPlayers.map((p) => ({
        label: `${p.title} (${p.number})`,
        value: p.slug,
        badge: voteCount[p.slug] ? `${voteCount[p.slug]} صوت` : "0",
      })),
    },
  ];
});

const settings = ref({ groups: ["A", "B"], draw: null });

const groupOptions = computed(() => {
  const groups = (settings.value.groups || ["A", "B"]).map((g) => ({
    label: `المجموعة ${g}`,
    value: g,
  }));
  return [
    ...groups,
    { label: "دور الـ 16", value: "R16" },
    { label: "ربع النهائي", value: "QF" },
    { label: "نصف النهائي", value: "SF" },
    { label: "النهائي", value: "FINAL" },
  ];
});

const bracketSlotOptions = computed(() => {
  const draw = settings.value.draw;
  if (!draw?.slots?.length) return [];
  const round = form.group;
  if (!round || !['R16', 'QF', 'SF', 'FINAL'].includes(round)) return [];
  return draw.slots
    .filter(s => s.round === round)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(s => ({
      label: s.id.toUpperCase().replace('-', ' '),
      value: s.id,
    }));
});

function computeStandingsForGroup(group) {
  const groupTeams = teams.value.filter((t) => t.group === group);
  if (!groupTeams.length) return [];
  const table = {};
  groupTeams.forEach((t) => {
    table[t.slug] = { slug: t.slug, pts: 0, gf: 0, ga: 0 };
  });
  const groupMatches = matches.value.filter(
    (m) => m.group === group && m.homeScore != null,
  );
  for (const m of groupMatches) {
    const h = table[m.homeTeam];
    const a = table[m.awayTeam];
    if (!h || !a) continue;
    const open = getOpenPlayScore(m);
    const hg = open.home ?? 0;
    const ag = open.away ?? 0;
    h.gf += hg;
    h.ga += ag;
    a.gf += ag;
    a.ga += hg;
    const winner = getWinnerSlug(m);
    if (winner === m.homeTeam) {
      h.pts += 3;
    } else if (winner === m.awayTeam) {
      a.pts += 3;
    } else {
      h.pts += 1;
      a.pts += 1;
    }
  }
  return Object.values(table).sort(
    (x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga),
  );
}

function getQualifiedTeams() {
  const groups = settings.value.groups || ["A", "B"];
  const slugs = [];
  for (const g of groups) {
    const standings = computeStandingsForGroup(g);
    slugs.push(...standings.slice(0, 2).map((t) => t.slug));
  }
  return slugs;
}

function getStageWinners(stage) {
  return matches.value
    .filter((m) => m.group === stage && m.homeScore != null)
    .map((m) => getWinnerSlug(m))
    .filter(Boolean);
}

function getStageParticipants(stage) {
  const set = new Set();
  for (const m of matches.value.filter((m) => m.group === stage)) {
    set.add(m.homeTeam);
    set.add(m.awayTeam);
  }
  return [...set];
}

const filteredTeamOptions = computed(() => {
  if (!form.group)
    return teams.value.map((t) => ({ label: t.title, value: t.slug }));

  const isGroupStage = !["R16", "QF", "SF", "FINAL"].includes(form.group);
  if (isGroupStage) {
    return teams.value
      .filter((t) => t.group === form.group)
      .map((t) => ({ label: t.title, value: t.slug }));
  }

  let eligible = [];
  if (form.group === "R16") {
    eligible = getQualifiedTeams();
  } else if (form.group === "QF") {
    const winners = getStageWinners("R16");
    eligible = winners.length ? winners : getStageParticipants("R16");
  } else if (form.group === "SF") {
    const winners = getStageWinners("QF");
    eligible = winners.length ? winners : getStageParticipants("QF");
  } else if (form.group === "FINAL") {
    const winners = getStageWinners("SF");
    eligible = winners.length ? winners : getStageParticipants("SF");
  }

  const current = [form.homeTeam, form.awayTeam].filter(Boolean);
  return teams.value
    .filter((t) => eligible.includes(t.slug) || current.includes(t.slug))
    .map((t) => ({ label: t.title, value: t.slug }));
});

const matchColumns = [
  { key: "matchTitle", label: "المباراة", sortable: true },
  { key: "group", label: "الدور", width: "110px" },
  { key: "score", label: "النتيجة", width: "90px" },
  { key: "date", label: "التاريخ", sortable: true },
  { key: "computedStatus", label: "الحالة", width: "100px" },
];

const matchActions = [
  {
    key: "album",
    icon: "mdi:image-multiple-outline",
    label: "الألبوم",
    class: "btn-info",
  },
  {
    key: "video",
    icon: "mdi:play-circle-outline",
    label: "الفيديو",
    class: "btn-info",
  },
  {
    key: "edit",
    icon: "mdi:pencil-outline",
    label: "تعديل",
    class: "btn-warning",
  },
  {
    key: "delete",
    icon: "mdi:delete-outline",
    label: "حذف",
    class: "btn-danger",
  },
];

const albumModal = reactive({
  open: false,
  match: null,
  photos: [],
});

const handleMatchAction = ({ action, row }) => {
  if (action.key === "album") openAlbumModal(row);
  else if (action.key === "video") openVideoModal(row);
  else if (action.key === "edit") openEditModal(row);
  else if (action.key === "delete") confirmDelete(row);
};

const openAlbumModal = (row) => {
  const match = matches.value.find((m) => m.slug === row.slug);
  if (!match) return;
  albumModal.match = match;
  albumModal.photos = [...(match.photos || [])];
  albumModal.open = true;
};

const uploading = ref(false);

const addAlbumPhoto = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    uploading.value = true;
    try {
      const { compressImage } = useImageCompression();
      const blob = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
      });
      const url = await admin.uploadPhoto(blob, albumModal.match.slug);
      albumModal.photos.push(url);
    } catch {
      showAlert("error", "خطأ", "فشل رفع الصورة");
    } finally {
      uploading.value = false;
    }
  };
  input.click();
};

const removeAlbumPhoto = async (index) => {
  const url = albumModal.photos[index];
  if (url?.startsWith("http")) {
    await admin.deletePhoto(url);
  }
  albumModal.photos.splice(index, 1);
};

const saveAlbum = async () => {
  if (!albumModal.match) return;
  try {
    const match = { ...albumModal.match, photos: albumModal.photos };
    await admin.saveMatch(match);
    albumModal.open = false;
    await loadData();
    showAlert("success", "تم الحفظ", "تم تحديث ألبوم الصور بنجاح");
  } catch {
    showAlert("error", "خطأ", "فشل حفظ الألبوم");
  }
};

const videoModal = reactive({
  open: false,
  match: null,
  urls: [],
});

const openVideoModal = (row) => {
  const match = matches.value.find((m) => m.slug === row.slug);
  if (!match) return;
  videoModal.match = match;
  videoModal.urls = [...(match.videos || [])];
  videoModal.open = true;
};

const addVideoUrl = () => {
  videoModal.urls.push({ url: "" });
};

const removeVideoUrl = (index) => {
  videoModal.urls.splice(index, 1);
};

const saveVideoModal = async () => {
  if (!videoModal.match) return;
  try {
    const match = { ...videoModal.match, videos: videoModal.urls.filter((v) => v.url.trim()) };
    await admin.saveMatch(match);
    videoModal.open = false;
    await loadData();
    showAlert("success", "تم الحفظ", "تم تحديث الفيديو بنجاح");
  } catch {
    showAlert("error", "خطأ", "فشل حفظ الفيديو");
  }
};

const getTeamTitle = (slug) => {
  const team = teams.value.find((t) => t.slug === slug);
  return team ? team.title : slug;
};

const getTeamColor = (slug) => {
  const team = teams.value.find((t) => t.slug === slug);
  return team?.color || "#22c55e";
};

const homeTeamPlayers = computed(() =>
  players.value.filter((p) => p.team === form.homeTeam),
);

const awayTeamPlayers = computed(() =>
  players.value.filter((p) => p.team === form.awayTeam),
);

const statusLabel = (status) => {
  const labels = { upcoming: "قادمة", played: "مُقامة", live: "مباشر" };
  return labels[status] || status;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateSlug = () => {
  const prefix =
    form.group === "R16"
      ? "r16"
      : form.group === "QF"
        ? "qf"
        : form.group === "SF"
          ? "sf"
          : form.group === "FINAL"
            ? "f"
            : `g${(form.group || "a").toLowerCase()}`;
  return `${prefix}-${unprefixSlug(form.homeTeam)}-vs-${unprefixSlug(form.awayTeam)}`;
};

const resetForm = () => {
  Object.assign(form, defaultForm());
  editingMatch.value = null;
  votesData.value = [];
  goalScorers.value = [];
  cards.value = [];
};

const openAddModal = () => {
  resetForm();
  modalOpen.value = true;
};

const toLocalDateTimeStr = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const openEditModal = (match) => {
  editingMatch.value = match;
  form.date = match.date ? toLocalDateTimeStr(match.date) : "";
  form.group = match.group;
  form.venue = match.venue || "الملعب الرئيسي";
  form.homeTeam = match.homeTeam;
  form.awayTeam = match.awayTeam;
  form.homeScore = match.homeScore;
  form.awayScore = match.awayScore;
  form.homeScoreAET = match.homeScoreAET ?? null;
  form.awayScoreAET = match.awayScoreAET ?? null;
  form.homePenalties = match.homePenalties ?? null;
  form.awayPenalties = match.awayPenalties ?? null;
  form.resultMethod = match.resultMethod || "ft";
  form.motmWinner = match.motmWinner || "";
  form.bracketSlot = match.bracket_slot || "";
  if (match.goalScorers?.length) {
    goalScorers.value = JSON.parse(JSON.stringify(match.goalScorers)).map(
      (g) => ({
        ...g,
        _key:
          g._key || Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      }),
    );
  } else {
    goalScorers.value = [];
  }
  if (match.cards?.length) {
    cards.value = JSON.parse(JSON.stringify(match.cards)).map((c) => ({
      ...c,
      _key: c._key || Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    }));
  } else {
    cards.value = [];
  }
  loadVotes(match.slug);
  modalOpen.value = true;
};

const showAlert = (type, title, message) => {
  alert.type = type;
  alert.title = title;
  alert.message = message;
  alert.show = true;
};

const handleSave = async () => {
  if (!form.homeTeam || !form.awayTeam) {
    showAlert("error", "خطأ", "يرجى اختيار الفريق المضيف والفريق الضيف");
    return;
  }
  if (form.homeTeam === form.awayTeam) {
    showAlert("error", "خطأ", "يجب أن يختلف الفريق المضيف عن الفريق الضيف");
    return;
  }

  const matchDate = form.date ? new Date(form.date).toISOString() : null;
  const matchStatus = computeStatus(matchDate);

  if (matchStatus !== "upcoming") {
    const resultErr = validateResultForm(form);
    if (resultErr) {
      showAlert("error", "خطأ", resultErr);
      return;
    }
  }

  saving.value = true;
  const resultFields = buildResultFields(form, {
    isUpcoming: matchStatus === "upcoming",
  });
  const matchObj = {
    slug: editingMatch.value?.slug || generateSlug(),
    title: generateTitle(),
    date: matchDate,
    group: form.group || "A",
    venue: form.venue || "الملعب الرئيسي",
    status: matchStatus,
    homeTeam: form.homeTeam,
    awayTeam: form.awayTeam,
    ...resultFields,
    motmWinner: form.motmWinner || null,
    bracket_slot: form.bracketSlot || null,
    photos: editingMatch.value?.photos || [],
    videos: editingMatch.value?.videos || [],
  };

  matchObj.goalScorers = goalScorers.value.map((g) => ({
    player: g.player || "unknown",
    team: g.team,
    minute: g.minute ? Number(g.minute) : null,
  }));

  // Save cards
  matchObj.cards = cards.value
    .filter((c) => c.player)
    .map((c) => ({
      player: c.player,
      team: c.team,
      type: c.type,
      minute: c.minute ? Number(c.minute) : null,
    }));

  try {
    await admin.saveMatch(matchObj);
    // Auto-update player goal stats from all matches
    await syncPlayerGoals();
    modalOpen.value = false;
    await loadData();
    showAlert(
      "success",
      "تم الحفظ",
      editingMatch.value
        ? "تم تحديث المباراة بنجاح"
        : "تمت إضافة المباراة بنجاح",
    );
  } catch {
    showAlert("error", "خطأ", "فشل حفظ المباراة");
  } finally {
    saving.value = false;
  }
};

const generateTitle = () => {
  const home = teams.value.find((t) => t.slug === form.homeTeam);
  const away = teams.value.find((t) => t.slug === form.awayTeam);
  if (!home || !away) return "";
  const prefix =
    form.group === "QF"
      ? "ربع النهائي: "
      : form.group === "SF"
        ? "نصف النهائي: "
        : form.group === "FINAL"
          ? "النهائي: "
          : "";
  return `${prefix}${home.title} vs ${away.title}`;
};

const confirmDelete = (match) => {
  if (
    !confirm(`هل أنت متأكد من حذف مباراة ${match.title || match.matchTitle}؟`)
  )
    return;
  handleDelete(match);
};

const handleDelete = async (match) => {
  try {
    await admin.deleteMatch(match.slug);
    await loadData();
    showAlert("success", "تم الحذف", "تم حذف المباراة بنجاح");
  } catch {
    showAlert("error", "خطأ", "فشل حذف المباراة");
  }
};
</script>

<style lang="scss" scoped>
.matches-actions {
  margin-bottom: 20px;
}

.team-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.vs-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  margin: 0 2px;
}

.score-text {
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.date-text {
  font-size: 0.8rem;
  color: var(--text-sub);
  white-space: nowrap;
}

.round-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-muted);
  white-space: nowrap;

  &.final {
    background: rgba(234, 179, 8, 0.12);
    color: #ca8a04;
  }

  &.group {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
  }
}

.status-dt {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 99px;
  white-space: nowrap;
  display: inline-block;

  &.upcoming {
    background: rgba(37, 99, 235, 0.12);
    color: #2563eb;
  }
  &.played {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }
  &.live {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }
}

.modal-form {
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
}

.motm-field-wrap {
  grid-column: 1 / -1;
  margin-top: 8px;
}

.text-muted {
  color: var(--text-muted);
}

.album-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 16px;
  color: var(--text-muted);
}

.album-empty-icon {
  opacity: 0.4;
}

.album-grid-admin {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.album-item-admin {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--border-color);
}

.album-img-admin {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.album-remove-btn {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.album-remove-btn:hover {
  background: rgba(239, 68, 68, 0.85);
}

.album-actions-row {
  display: flex;
  gap: 10px;
}

.video-list-admin {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-item-admin {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-actions {
  display: flex;
  gap: 6px;
}

.goal-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 0.15s;
}

.goal-remove:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: #ef4444;
}

/* Scoreboard */
.scoreboard-block {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-section-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.score-hint {
  font-weight: 500;
  opacity: 0.8;
  font-size: 0.72rem;
}

.scoreboard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.scoreboard-sub {
  padding: 12px;
}

.scoreboard-pen {
  border-color: rgba(234, 179, 8, 0.35);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.08), var(--bg-elevated));
}

.pen-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ca8a04;
  background: rgba(234, 179, 8, 0.15);
  padding: 4px 8px;
  border-radius: 6px;
}

.result-method-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-method-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.result-method-tab {
  flex: 1;
  min-width: 100px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }
}

.score-team {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.score-home {
  justify-content: flex-start;
}
.score-away {
  justify-content: flex-end;
}

.score-team-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.score-team-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.score-inputs :deep(input) {
  width: 56px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 800;
}

.score-dash {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-muted);
}

/* Goals / Cards sections */
.goals-section {
  margin: 16px 0 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goals-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.goals-count {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--text-muted);
}

.goals-team-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
}

.goals-team-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.goals-team-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.goals-team-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
}

.goals-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.goals-row > :first-child {
  flex: 1;
}

.goals-row > :nth-child(2) {
  width: 80px;
  flex-shrink: 0;
}

.goals-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: none;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
  cursor: pointer;
  align-self: flex-start;
  transition: all 0.15s;
}
.goals-add-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
</style>
