# Plan: Auto-Live Match + Auto-Notification

## Goal
1. Home page (and fixtures) auto-updates match status to "Live" without refresh
2. Push notification fires automatically when a match starts

## Changes

### `pages/index.vue`

1. **Import** `useNotificationCenter`
2. **Add reactive timer** — `now` ref updated every 10s via `setInterval` in `onMounted`, cleaned up in `onUnmounted`
3. **Update `computeStatus`** — use `now.value` instead of `new Date()` so computed properties re-evaluate on each tick
4. **Add match-watcher** — separate 30s interval that:
   - Reads previously notified match IDs from localStorage (`notifiedMatchStarts`)
   - Checks all matches loaded in `matchesData` for newly live ones
   - For each newly live match: calls `/api/notifications/send` + adds in-app notification via `notifCenter`
   - Records sent match IDs in localStorage
5. **Add `matchesData`** — fetch all matches (not just played) alongside existing data so the watcher has the full schedule

### `pages/fixtures.vue`

1. **Add reactive timer** — same `now` ref + interval pattern
2. **Update `computeStatus`** — use `now.value` instead of `new Date()`

### No admin changes needed
`triggerMatchNotifications` already fires on admin save for manual live/played/score.

## Deduplication
- `notifiedMatchStarts` array in localStorage prevents re-sending the same start notification
- Only the presence checks — service worker adds system notification

## Edge Cases
- If multiple users are on the home page when a match turns live, only the first tick fires the notification (localStorage write is synchronous, next tick reads it)
- If no one is on the site when a match turns live, the notification fires on the next page visit (tick-based check)
- Match must be in `status !== 'played'` and date has arrived to trigger
