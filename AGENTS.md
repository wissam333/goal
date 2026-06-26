# AGENTS.md — Project State

## Overview
Village Football League site. Nuxt 3.21.2, Supabase data layer, manual dark/light mode, Arabic-first UI, PWA, push notifications, Realtime live updates, **full Supabase Auth** (email/password + Google OAuth). Admin dashboard at `/admin`. Deployed on **Vercel** (goal-safita.vercel.app) and **Cloudflare Workers** (goal.wissam-n-n-najjom.workers.dev).

## Architecture
- **SSR** (`nuxt build`) — Cloudflare Pages with Pages Functions (Vercel SSR works fully, Cloudflare SSR has Supabase query issues)
- **Data layer**: `useLeagueData` composable — reads from Supabase tables with localStorage fallback
- **Standings**: computed on-the-fly from match data (no stored standings)
- **Voting + Predictions**: tied to authenticated users via `votes` and `match_predictions` tables (user_id FK to auth.users)
- **Auth**: Full Supabase Auth (`useAuth.js`) — email/password + Google OAuth. Profiles table with roles (`user`, `admin`). `useAdminAuth.js` checks `role = 'admin'` for admin access.
- **Images**: `<NuxtImg>` with IPX; uploaded images stored as base64 in localStorage (or Supabase storage when configured)
- **Admin dashboard**: `/admin/*` — Supabase Auth-protected (admin role), CRUD for teams/players/matches/settings/users/seasons
- **Albums**: `<ElementsAlbum>` with `@fancyapps/ui` v6 lightbox
- **PWA**: `@vite-pwa/nuxt` injectManifest strategy — `sw/sw.js` (compiled to `.output/public/sw.js`), SVG icons, manifest, offline data cache
- **Realtime**: `useRealtime` composable wraps Supabase Realtime (`postgres_changes`) for live match updates on home, fixtures, match detail pages
- **Push notifications**: Custom SW via injectManifest, VAPID keys, Nitro API routes (`/api/notifications/subscribe|unsubscribe|send`), admin auto-trigger on match save
- **Group management**: Settings page groups editor (A, B, C...), match form reads groups + knockout stages (QF, SF, F), team dropdowns filter by selected group
- **OG Images**: Dynamic SVG generation via Nitro API route (`/api/og/*`), per-page ogImage in useSeoMeta

## Build Commands
- `npm run dev` — dev server
- `npm run build` — production SSR build (node-server preset)
- `npm run generate` — static generation

## Key Decisions
- **Color-mode**: Manual (no `@nuxtjs/color-mode`). Inline script in `<head>` reads localStorage and sets `dark` class + primary color before first paint. `useTheme` composable for toggling.
- **Primary theme colors**: Green (`#22c55e`), Red, Blue, Purple, Orange, Teal — switched via `useTheme().setColor()`.
- **Fancybox**: CSS/JS imported globally via client plugin `plugins/fancybox.client.ts`; uses event delegation.
- **i18n**: `@nuxtjs/i18n` with `no_prefix` strategy, `defaultLocale: "ar"`, lazy loading from `locales/ar.json` and `locales/en.json`.
- **Supabase auth**: enabled (`persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`) — real user auth with profiles and roles. Admin gated by `role = 'admin'` on profiles table.
- **Fallback polling**: 60s timer on home page as backup if Realtime misses an update.
- **Live status**: Match pages check `match.status` from DB first (respects admin-set status), falls back to time-based computation.
- **Route middleware**: No Nuxt middleware files — admin guard is client-side `onMounted` check in `layouts/admin.vue`.

## Critical Config
- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` in `.env` (or Cloudflare Pages env vars)
- **Supabase tables**: `teams`, `players`, `matches`, `votes`, `match_predictions`, `settings`, `push_subscriptions`, `profiles`, `seasons` — run `supabase-migration.sql` in SQL Editor
- **Realtime**: Tables must be added to `supabase_realtime` publication via `alter publication supabase_realtime add table <name>;` for live updates to work
- **Admin auth**: Uses Supabase Auth + `profiles.role = 'admin'` check. No hardcoded password.
- **VAPID keys**: in `.env` (generated via `web-push`), exposed via `runtimeConfig`
- **Nitro**: `compressPublicAssets: true`, `prerender.failOnError: false`
- **PWA**: `rollupFormat: "iife"` + `rollupOptions: { treeshake: false }` in `nuxt.config.ts` to prevent Vite removing `self.__WB_MANIFEST`. `globPatterns` excludes `html` to prevent stale SSR pages in SW cache.
- **Runtime config**: `siteUrl` (NUXT_PUBLIC_SITE_URL, defaults to Cloudflare domain), `leagueName`, `season` hardcoded in `nuxt.config.ts`

## Completed Work
### Initial setup
- Initial project setup (Nuxt 3, content, modules)
- Green theme with RTL/Arabic-first i18n
- All public pages (index, standings, fixtures, teams/[slug], teams/index, players/[slug], matches/[slug], bracket, stats, account, install)
- Theme color switcher (6 preset colors via `useTheme.js`)
- Admin dashboard (`/admin/login`, `/admin`, `/admin/teams`, `/admin/matches`, `/admin/settings`, `/admin/seasons`, `/admin/users`)
- Fancybox album gallery (Album.vue, fancybox.client.ts)
- Locale files (ar.json, en.json) with ~265 translation keys including auth
- PWA setup (`@vite-pwa/nuxt`): SVG icons, manifest, service worker, offline cache

### Data layer
- Replaced `@nuxt/content` + Nuxt Studio with Supabase data layer
- Created `useLeagueData` composable with fallback functions (when Supabase returns empty/null)
- Rewrote all pages from `queryCollection()` to `useLeagueData()`
- Seed data in `supabase-migration.sql` (16 teams, 4 groups A-D, 64 players, 24 group-stage matches)
- Group management: settings groups editor, team/match forms read settings groups + knockout stages

### Auth System
- Full Supabase Auth: `useAuth.js` composable with `signIn`, `signUp`, `signInWithGoogle`, `signOut`
- `useAuthModal.js` for modal state management, `AuthModal.vue` component (incomplete template)
- Inline auth modals in `Navbar.vue` and `matches/[slug].vue` for voting/prediction gating
- `useAdminAuth.js` — checks Supabase session + `profiles.role = 'admin'`, no hardcoded password
- `pages/admin/login.vue` — email/password login for admins
- `pages/admin/users.vue` — admin user management (role badges)
- `pages/account.vue` — user profile, predictions list, votes list (client-only, `ssr: false`)
- Profiles auto-created via DB trigger (`handle_new_user()`) + client-side fallback

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
- Auto-refresh match results: 60s fallback poll + Realtime for instant updates
- Prediction results always visible on match detail page (even after match starts, voting locked)
- Prediction points: `usePredictionPoints.js` awards points for correct outcome/MOTM predictions via Supabase RPC

### Notifications & Realtime
- Push notification system: Web Push via `@vite-pwa/nuxt` injectManifest, custom SW (`sw/sw.js`), VAPID keys, Nitro API routes, `usePushNotifications` + `useNotificationCenter` composables, `NotificationsPushPrompt` + `NotificationsNotificationBell` UI components, admin auto-trigger on match saves
- Notification error fix: added `typeof Notification !== 'undefined'` guard in `usePushNotifications.js` to prevent ReferenceError in WebViews
- Realtime subscriptions: `useRealtime` composable (`composables/useRealtime.js`) wraps Supabase `postgres_changes`
  - **Match detail page**: subscribes to UPDATE on `matches` table, refreshes match data when current match slug matches
  - **Match detail page**: subscribes to INSERT on `votes` + `match_predictions` tables, re-fetches vote/prediction counts when current match receives a new vote/prediction
  - **Home page**: subscribes to INSERT + UPDATE on `matches`, refreshes next/last match data
  - **Fixtures page**: subscribes to INSERT + UPDATE + DELETE on `matches`, refreshes all matches

### OG Images
- Dynamic SVG OG images generated via Nitro API route (`/api/og/[type]/[slug]`)
- Per-page `useSeoMeta` sets dynamic `ogImage`, `ogTitle`, `ogDescription` for match, team, player detail pages
- Fallback to static `/logo.png` for generic pages
- Default `ogImage` fixed to `/logo.png` in app.vue and layouts/default.vue

### Admin & Fixes (June 2026)
- **Notification URLs**: Added `siteUrl` runtimeConfig (Cloudflare domain), fixed admin matches.vue and settings.vue to send absolute URLs in push notifications — clicking notification opens Cloudflare site regardless of where API runs
- **Admin user delete**: Added delete button per user in `/admin/users`, created `/api/admin/delete-user` endpoint using service key — deletes votes, predictions, then auth user (cascades to profile)
- **Team slug auto-slugify**: Admin teams form now auto-generates slug from title on new teams, sanitizes slug on input (lowercase, hyphens), tracks manual edits to avoid overwriting
- **PWA HTML cache fix**: Removed `html` from `injectManifest.globPatterns` — SW no longer pre-caches HTML pages, preventing stale SSR content. Static assets (JS, CSS, images) still cached

## Known Issues
- Cloudflare Pages SSR: Supabase queries return empty (no errors) — likely runtime issue with `@supabase/supabase-js` in Workers environment. Vercel SSR works fine.
- Team logos: `alnasr.svg` and `alqadsia.svg` missing in `public/teams/` (will show fallback initials)
- `useSupabase.js` static `_client` cache: first call returning `null` permanently prevents Supabase from reconnecting
- Admin uploads still store images as base64 in localStorage — switch to Supabase storage when configured
- Dev mode: non-fatal `#app-manifest` pre-transform warnings (Nuxt 3.21 artifact, harmless)
- Realtime requires tables added to `supabase_realtime` publication (run SQL, not configurable via Dashboard UI easily)
- `Auth/AuthModal.vue` component template is incomplete — inline modals in Navbar.vue and matches/[slug].vue are the working implementations
- Admin route guard is client-side `onMounted` in layout, not a true Nuxt middleware — brief content flash on unauthenticated access
- No CSP headers — inline scripts in nuxt.config.ts without nonce/hash
- OG images are SVG format — not supported by Facebook (falls back to static `/logo.png`)

## Next Steps
1. Fix Cloudflare Pages SSR data issue (Supabase queries empty on Workers)
2. Enable Realtime: run `alter publication supabase_realtime add table matches; alter publication supabase_realtime add table votes; alter publication supabase_realtime add table match_predictions;` in Supabase SQL Editor
3. Create remaining team SVG logos (`alnasr.svg`, `alqadsia.svg`)
4. Optionally set up Supabase Storage bucket `team-images` for image uploads
5. Test push notifications in production: admin saves a match → push received on all subscribed browsers
6. Complete `Auth/AuthModal.vue` template or remove in favor of inline modals

---

# Project Review — June 2026

## Overall Rating: 8.5/10

This is a sophisticated, production-ready village football league site. The architecture is well thought-out: Nuxt 3 SSR, Supabase data layer with localStorage fallback, Realtime subscriptions, PWA with push notifications, Arabic-first i18n, manual dark/light mode with 6 theme colors. The UI is polished with skeletons, confetti, animations, and responsive design throughout. The feature set is genuinely impressive: standings, fixtures, bracket visualization, match detail with countdown/H2H/video/photos, predictions/voting, stats dashboard, admin CRUD, seasons management, and push notifications.

### What's done well
- Comprehensive feature set covering the full league lifecycle
- Clean composable architecture with separation of concerns
- Error resilience (localStorage fallbacks, hydration guards, error pages)
- Polish: skeleton loaders, animations, champion confetti, responsive tables
- RTL/Arabic-first done properly without hacks
- Real-time updates via Supabase Realtime
- Full PWA with custom service worker
- Match prediction + MOTM voting system
- Admin dashboard with full CRUD

---

## Weaknesses

### Technical Debt
1. **No TypeScript in .vue files** — All pages use `<script setup>` but no TS. Nuxt 3 is built for TS. (i dont want this)
2. **No tests** — Zero unit, integration, or E2E tests. No vitest, no playwright.
3. **Duplicate standings logic** — `calculateStandings` appears in `index.vue`, `bracket.vue`, and `standings.vue` with near-identical code.
4. **`useSupabase.js` singleton is fragile** — Static `_client` returning `null` permanently breaks all future Supabase calls (already noted).
5. **`useAdminData.js` duplicates `useLeagueData.js`** — Same Supabase query logic in two composables.
6. **`process.client` used instead of `import.meta.client`** — Inconsistent hydration check in `matches/[slug].vue:1042`.
7. **Bootstrap CSS from CDN** — Only used for grid classes. Adds ~30KB, not tree-shaken, not needed.
8. **i18n `lazy: false`** — Both locale files loaded upfront, wastes bandwidth.
9. **Module-level `cachedName` in `useAppTitle.js`** — Can leak across SSR requests.

### Security
10. **Hardcoded admin password `admin123`** — In `useAdminAuth.js` (already noted, but critical).
11. **No auth on API routes** — `/api/notifications/send` has no protection, anyone can trigger push notifications.
12. **No CSP headers** — Inline scripts in `nuxt.config.ts` without nonce/hash.
13. **Secrets in runtime config** — VAPID keys inlined into `<head>` script via template string.

### UX/Performance
14. **All images `loading="lazy"`** — Above-the-fold images should use `loading="eager"` for LCP.
15. **`onMounted` data fetching visible** — `account.vue` shows empty UI while fetching predictions/votes.
16. **No structured data (JSON-LD)** — Search engines can't understand match/team/player entities.
17. **No social OG image generation** — Dynamic OG images per match/team/player would improve shareability.
18. **Inline `<head>` script is fragile** — Template literal injection in `nuxt.config.ts:157` is hard to debug and maintain.

### Architecture
19. **No Pinia** — Uses only `useState` scattered across composables. Manageable for now but doesn't scale.
20. **Error swallowing** — Many `catch` blocks just `void(err)` with no logging or user feedback.
21. **`error.vue` uses `clearError` immediately** — Missing `clearError({ redirect: '/' })` redirect prevents showing error details.
22. **All match pages use 3+ separate `useAsyncData` calls** — Could be batched into one for fewer network round-trips.

---

## Cool Ideas to Build

### Feature Ideas
1. **Bracket Prediction Game** — Users predict the entire knockout bracket before it starts. Award points for correct picks.
2. **Live Match Timeline** — Real-time commentary feed during matches (admin adds minute-by-minute events).
3. **Predictions Leaderboard** — Public ranking of users by prediction accuracy across all matches.
4. **AI Match Summary** — Auto-generate match summary text using LLM from goal scorers/cards data.
5. **Player Career Timeline** — Interactive chart showing goals, cards, MOTM wins across seasons.
6. **Head-to-Head Chart** — Visual bar/line chart showing historical H2H results between two teams.
7. **Live Streaming Embed** — Embed YouTube/Facebook live stream directly on match page when match is live.
8. **Digital Attendance Tracker** — QR code check-in system for physical match attendance.

### Engagement Ideas
9. **Fantasy League** — Users draft players, earn points based on real performance (goals, clean sheets, MOTM).
10. **Match Day Chat** — Real-time chat room per match (would need WebSocket or Supabase Realtime).
11. **Photo Voting** — Fans vote for best match photo of the week (already have photo uploads).
12. **Player of the Tournament** — Cumulative MOTM voting across the entire season.
13. **Village Social Feed** — Fans can post comments, photos, and reactions during match days.

### Admin/Scalability Ideas
14. **Admin Audit Log** — Track who made what change in the admin panel (useful for multiple admins).
15. **Auto-Archive Seasons** — When new season starts, archive old data for historical browsing.
16. **Match Day Email Blast** — Send email notifications to subscribed users before matches.
17. **Performance Dashboard** — Real-time site analytics (page views, active users, push notification stats).
18. **Multi-language Commentary** — Allow community volunteers to submit play-by-play text in Arabic/English.

### Technical Ideas
19. **Tauri/Capacitor Mobile App** — Wrap the PWA into a native Android/iOS app for better push notifications.
20. **Supabase Edge Functions** — Move push notification sending to Edge Functions for reliability.
