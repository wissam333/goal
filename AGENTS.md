# AGENTS.md — Project State

## Overview
Village Football League site. Nuxt 3.21.2, Supabase data layer, manual dark/light mode, Arabic-first UI, PWA, push notifications, Realtime live updates. Admin dashboard at `/admin`. Deployed on **Vercel** (goal-safita.vercel.app) and **Cloudflare Workers** (goal.wissam-n-n-najjom.workers.dev).

## Architecture
- **SSR** (`nuxt build`) — Cloudflare Pages with Pages Functions (Vercel SSR works fully, Cloudflare SSR has Supabase query issues)
- **Data layer**: `useLeagueData` composable — reads from Supabase tables
- **Standings**: computed on-the-fly from match data (no stored standings)
- **Voting**: localStorage + Supabase (`votes` table, `match_predictions` table)
- **Images**: `<NuxtImg>` with IPX; uploaded images stored as base64 in localStorage (or Supabase storage when configured)
- **Admin dashboard**: `/admin/*` — password-protected (`admin123`), CRUD for teams/players/matches/settings
- **Albums**: `<ElementsAlbum>` with `@fancyapps/ui` v6 lightbox
- **PWA**: `@vite-pwa/nuxt` injectManifest strategy — `sw/sw.js` (compiled to `.output/public/sw.js`), SVG icons, manifest, offline data cache
- **Realtime**: `useRealtime` composable wraps Supabase Realtime (`postgres_changes`) for live match updates on home, fixtures, match detail pages
- **Push notifications**: Custom SW via injectManifest, VAPID keys, Nitro API routes (`/api/notifications/subscribe|unsubscribe|send`), admin auto-trigger on match save
- **Group management**: Settings page groups editor (A, B, C...), match form reads groups + knockout stages (QF, SF, F), team dropdowns filter by selected group

## Build Commands
- `npm run dev` — dev server
- `npm run build` — production SSR build (node-server preset)
- `npm run generate` — static generation

## Key Decisions
- **Color-mode**: Manual (no `@nuxtjs/color-mode`). Inline script in `<head>` reads localStorage and sets `dark` class + primary color before first paint. `useTheme` composable for toggling.
- **Primary theme colors**: Green (`#22c55e`), Red, Blue, Purple, Orange, Teal — switched via `useTheme().setColor()`.
- **Fancybox**: CSS/JS imported globally via client plugin `plugins/fancybox.client.ts`; uses event delegation.
- **i18n**: `@nuxtjs/i18n` with `no_prefix` strategy, `defaultLocale: "ar"`, lazy loading from `locales/ar.json` and `locales/en.json`.
- **Supabase auth**: Disabled `persistSession`, `autoRefreshToken`, `detectSessionInUrl` in `useSupabase.js` to prevent stale refresh token errors (anon key only, no user auth).
- **Fallback polling**: 60s timer on home page as backup if Realtime misses an update.
- **Live status**: Match pages check `match.status` from DB first (respects admin-set status), falls back to time-based computation.

## Critical Config
- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` in `.env` (or Cloudflare Pages env vars)
- **Supabase tables**: `teams`, `players`, `matches`, `votes`, `settings`, `push_subscriptions` — run `supabase-migration.sql` in SQL Editor
- **Realtime**: Tables must be added to `supabase_realtime` publication via `alter publication supabase_realtime add table <name>;` for live updates to work
- **Admin password**: `admin123` — change in `composables/useAdminAuth.js`
- **VAPID keys**: in `.env` (generated via `web-push`), exposed via `runtimeConfig`
- **Nitro**: `compressPublicAssets: true`, `prerender.failOnError: false`
- **PWA**: `rollupFormat: "iife"` + `rollupOptions: { treeshake: false }` in `nuxt.config.ts` to prevent Vite removing `self.__WB_MANIFEST`

## Completed Work
### Initial setup
- Initial project setup (Nuxt 3, content, modules)
- Green theme with RTL/Arabic-first i18n
- All public pages (index, standings, fixtures, teams/[slug], teams/index, players/[slug], matches/[slug], bracket, stats)
- Theme color switcher (6 preset colors via `useTheme.js`)
- Admin dashboard (`/admin/login`, `/admin`, `/admin/teams`, `/admin/matches`, `/admin/settings`)
- Fancybox album gallery (Album.vue, fancybox.client.ts)
- Locale files (ar.json, en.json) with all ~120 translation keys
- PWA setup (`@vite-pwa/nuxt`): SVG icons, manifest, service worker, offline cache

### Data layer
- Replaced `@nuxt/content` + Nuxt Studio with Supabase data layer
- Created `useLeagueData` composable with fallback functions (when Supabase returns empty/null)
- Rewrote all 9 pages from `queryCollection()` to `useLeagueData()`
- Seed data in `supabase-migration.sql` (16 teams, 4 groups A-D, 64 players, 24 group-stage matches)
- Group management: settings groups editor, team/match forms read settings groups + knockout stages

### UI & Fixes
- Fixed `:root.dark` CSS — removed `nuxt-beastcss`/`nuxt-vitalizer` that pruned dark mode styles on production
- Fixed console errors: removed `/admin/players` link (404), disabled `appManifest` (500 payload)
- Fixed hero card colors for light/dark mode on index page
- Hydration mismatch fix: `now = ref(0)` with `onMounted` guard on index.vue and fixtures.vue
- Error page with details (`error.vue`) + server-side error logger (`server/plugins/error-logger.ts`)
- In-app browser detection banner (`PwaInstallNotice.vue`): detects FB, Messenger, Instagram, WeChat, LINE
- Logo replacement: loader, Navbar, Footer — `<img src="/logo.png">` instead of soccer ball icon
- Footer: bigger logo (48×48), text under logo, Google Maps location link
- Multi-platform share (Messenger, WhatsApp, Facebook, Telegram, Copy) on match page
- Standings table responsive: horizontal scroll on mobile, sticky team column, smaller padding/fonts
- Live score display on home page hero section for live matches

### Match Engine
- Match saving: `admin/matches.vue` saves scores for live matches (not just played); removed notification auto-trigger from save button
- Live status: `liveStatus` computed checks `match.value.status` from DB first, time-based fallback
- Auto-refresh match results: 30s timer originally, now 60s fallback poll + Realtime for instant updates
- Prediction results always visible on match detail page (even after match starts, voting locked)

### Notifications & Realtime
- Push notification system: Web Push via `@vite-pwa/nuxt` injectManifest, custom SW (`sw/sw.js`), VAPID keys, Nitro API routes, `usePushNotifications` + `useNotificationCenter` composables, `NotificationsPushPrompt` + `NotificationsNotificationBell` UI components, admin auto-trigger on match saves
- Notification error fix: added `typeof Notification !== 'undefined'` guard in `usePushNotifications.js` to prevent ReferenceError in WebViews
- Realtime subscriptions: `useRealtime` composable (`composables/useRealtime.js`) wraps Supabase `postgres_changes`
  - **Match detail page**: subscribes to UPDATE on `matches` table, refreshes match data when current match slug matches
  - **Match detail page**: subscribes to INSERT on `votes` + `match_predictions` tables, re-fetches vote/prediction counts when current match receives a new vote/prediction
  - **Home page**: subscribes to INSERT + UPDATE on `matches`, refreshes next/last match data
  - **Fixtures page**: subscribes to INSERT + UPDATE + DELETE on `matches`, refreshes all matches
- Supabase auth fix: disabled session persistence to stop stale refresh token errors

## Known Issues
- Cloudflare Pages SSR: Supabase queries return empty (no errors) — likely runtime issue with `@supabase/supabase-js` in Workers environment. Vercel SSR works fine.
- Team logos: `alnasr.svg` and `alqadsia.svg` missing in `public/teams/` (will show fallback initials)
- Admin password is hardcoded in `useAdminAuth.js` — change for production
- `useSupabase.js` static `_client` cache: first call returning `null` permanently prevents Supabase from reconnecting
- Admin uploads still store images as base64 in localStorage — switch to Supabase storage when configured
- Dev mode: non-fatal `#app-manifest` pre-transform warnings (Nuxt 3.21 artifact, harmless)
- Realtime requires tables added to `supabase_realtime` publication (run SQL, not configurable via Dashboard UI easily)

## Next Steps
1. Fix Cloudflare Pages SSR data issue (Supabase queries empty on Workers)
2. Enable Realtime: run `alter publication supabase_realtime add table matches; alter publication supabase_realtime add table votes; alter publication supabase_realtime add table match_predictions;` in Supabase SQL Editor
3. Create remaining team SVG logos (`alnasr.svg`, `alqadsia.svg`)
4. Optionally set up Supabase Storage bucket `team-images` for image uploads
5. Test push notifications in production: admin saves a match → push received on all subscribed browsers
