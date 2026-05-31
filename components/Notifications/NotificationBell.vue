<template>
  <div class="notification-bell-wrapper" ref="wrapperRef">
    <button
      class="ctrl-btn bell-btn"
      :class="{ 'has-unread': unreadCount > 0 }"
      @click="toggleOpen"
      :aria-label="$t('notifications.title')"
    >
      <Icon
        :name="unreadCount > 0 ? 'mdi:bell-ring' : 'mdi:bell-outline'"
        size="18"
      />
      <span v-if="unreadCount > 0" class="bell-badge">{{
        unreadCount > 99 ? "99+" : unreadCount
      }}</span>
    </button>

    <Transition name="notif-dropdown">
      <div v-if="open && !isMobile" class="notif-dropdown" @click.stop>
        <div class="notif-header">
          <h4>{{ $t("notifications.title") }}</h4>
          <div class="notif-header-actions">
            <button
              v-if="permState !== 'granted'"
              class="subscribe-btn"
              @click.stop="handleSubscribe"
            >
              <Icon :name="permState === 'denied' ? 'mdi:bell-off' : 'mdi:bell-plus'" size="14" />
              {{ permState === 'denied' ? '🔕 الإشعارات مقفلة' : $t('notifications.allow') }}
            </button>
            <button
              v-if="unreadCount > 0"
              class="mark-read-btn"
              @click="center.markAllRead()"
            >
              {{ $t("notifications.markAllRead") }}
            </button>
          </div>
        </div>

        <div v-if="!center.notifications.value.length" class="notif-empty">
          <Icon name="mdi:bell-off-outline" size="24" />
          <p>{{ $t("notifications.empty") }}</p>
        </div>

        <div v-else class="notif-list">
          <div
            v-for="n in center.notifications.value.slice(0, 20)"
            :key="n.id"
            class="notif-item"
            :class="{ unread: !n.read }"
            @click="handleClick(n)"
          >
            <div class="notif-dot" v-if="!n.read" />
            <div class="notif-content">
              <p class="notif-title">{{ n.title }}</p>
              <p v-if="n.body" class="notif-body">{{ n.body }}</p>
              <span class="notif-time">{{ timeAgo(n.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-if="center.notifications.value.length > 20" class="notif-footer">
          <button @click="center.clear()">
            {{ $t("notifications.clearAll") }}
          </button>
        </div>
      </div>
    </Transition>

    <SharedUiDialogBottomSheet
      v-if="isMobile"
      v-model="open"
      :title="$t('notifications.title')"
    >
      <div class="notif-header-mobile">
        <button
          v-if="permState !== 'granted'"
          class="subscribe-btn"
          @click="handleSubscribe"
        >
          <Icon :name="permState === 'denied' ? 'mdi:bell-off' : 'mdi:bell-plus'" size="16" />
          {{ permState === 'denied' ? '🔕 الإشعارات مقفلة' : $t('notifications.allow') }}
        </button>
        <button
          v-if="unreadCount > 0"
          class="mark-read-btn"
          @click="center.markAllRead()"
        >
          {{ $t("notifications.markAllRead") }}
        </button>
        <button
          v-if="center.notifications.value.length > 0"
          class="clear-btn"
          @click="center.clear()"
        >
          {{ $t("notifications.clearAll") }}
        </button>
      </div>

      <div v-if="!center.notifications.value.length" class="notif-empty">
        <Icon name="mdi:bell-off-outline" size="24" />
        <p>{{ $t("notifications.empty") }}</p>
      </div>

      <div v-else class="notif-list">
        <div
          v-for="n in center.notifications.value.slice(0, 20)"
          :key="n.id"
          class="notif-item"
          :class="{ unread: !n.read }"
          @click="handleClick(n)"
        >
          <div class="notif-dot" v-if="!n.read" />
          <div class="notif-content">
            <p class="notif-title">{{ n.title }}</p>
            <p v-if="n.body" class="notif-body">{{ n.body }}</p>
            <span class="notif-time">{{ timeAgo(n.createdAt) }}</span>
          </div>
        </div>
      </div>
    </SharedUiDialogBottomSheet>
  </div>
</template>

<script setup>
const center = useNotificationCenter();
const push = usePushNotifications();
const open = ref(false);
const wrapperRef = ref(null);
const isMobile = ref(false);

const unreadCount = computed(() => center.unreadCount.value);
const permState = computed(() => push.supported ? push.permission.value : 'denied');

function toggleOpen() {
  open.value = !open.value;
}

async function handleSubscribe() {
  if (push.permission.value === 'granted') return
  if (push.permission.value === 'denied') {
    alert('يرجى تفعيل الإشعارات من إعدادات المتصفح')
    return
  }
  const result = await push.requestPermission()
  if (result === 'granted') {
    await push.subscribe()
    open.value = false
  }
}

function handleClick(n) {
  if (!n.read) center.markAsRead(n.id);
  if (n.url) navigateTo(n.url);
  open.value = false;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} ي`;
}

function onClickOutside(e) {
  if (!isMobile.value && wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    open.value = false;
  }
}

onMounted(() => {
  isMobile.value = window.innerWidth < 480;
  document.addEventListener("click", onClickOutside);
});
onUnmounted(() => {
  document.removeEventListener("click", onClickOutside);
});
</script>

<style scoped>
.notification-bell-wrapper {
  position: relative;
}
.bell-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s;
  flex-shrink: 0;
}
.bell-btn:hover {
  background: var(--primary-soft);
  color: var(--primary);
}
.bell-btn.has-unread {
  color: var(--primary, #22c55e);
}
.bell-badge {
  position: absolute;
  top: -4px;
  inset-inline-end: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #ef4444;
  color: #fff;
  border-radius: 8px;
  font-size: 0.625rem;
  line-height: 16px;
  text-align: center;
  font-weight: 700;
}
.notif-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  inset-inline-end: 0;
  width: 340px;
  max-height: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: top center;
}

.notif-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  inset-inline-end: 12px;
  width: 12px;
  height: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-inline-end: none;
  border-bottom: none;
  transform: rotate(45deg);
  z-index: -1;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}
.notif-header h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
}
.notif-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.subscribe-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--primary, #22c55e);
  color: #fff;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 8px;
  transition: all 0.15s;
  font-weight: 600;
  white-space: nowrap;
}
.subscribe-btn:hover {
  opacity: 0.9;
}
.mark-read-btn {
  background: none;
  border: none;
  color: var(--primary, #22c55e);
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.mark-read-btn:hover {
  background: var(--primary-soft);
}

.notif-header-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.notif-header-mobile .mark-read-btn {
  font-size: 0.85rem;
  padding: 6px 12px;
}
.clear-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.15s;
}
.clear-btn:hover {
  background: var(--bg-elevated);
}

.notif-empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--text-sub);
}
.notif-empty p {
  margin: 10px 0 0;
  font-size: 0.875rem;
}
.notif-list {
  overflow-y: auto;
  flex: 1;
}
.notif-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border-color);
}
.notif-item:last-child {
  border-bottom: none;
}
.notif-item:hover {
  background: var(--bg-elevated);
}
.notif-item.unread {
  background: var(--primary-soft, rgba(34, 197, 94, 0.05));
}
.notif-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background: var(--primary, #22c55e);
  margin-top: 7px;
}
.notif-content {
  flex: 1;
  min-width: 0;
}
.notif-title {
  margin: 0 0 3px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}
.notif-body {
  margin: 0 0 4px;
  font-size: 0.8125rem;
  color: var(--text-sub);
  line-height: 1.4;
}
.notif-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.notif-dropdown-enter-active {
  transition: all 0.2s ease-out;
}
.notif-dropdown-leave-active {
  transition: all 0.15s ease-in;
}
.notif-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
.notif-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}
</style>
