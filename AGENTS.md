# AGENTS.md — Project State

## Overview
Village Football League site. Nuxt 3.21.2, Supabase data layer (no Nuxt Studio), manual dark/light mode, Arabic-first UI. Admin dashboard at `/admin`.

## Architecture
- **Static generation** (`nuxt generate`) — all routes prerendered with mock data fallback
- **Data layer**: `useLeagueData` composable — reads from Supabase tables if configured, falls back to embedded mock data
- **Standings**: computed on-the-fly from match data (no stored standings)
- **Voting**: localStorage + Supabase (`votes` table)
- **Images**: `<NuxtImg>` with IPX; uploaded images stored as base64 in localStorage (or Supabase storage when configured)
- **Admin dashboard**: `/admin/*` — password-protected (`admin123`), CRUD for teams/players/matches/settings
- **Albums**: `<ElementsAlbum>` with `@fancyapps/ui` v6 lightbox
- **No PWA**, no Nuxt Studio, no `@nuxt/content`

## Build Commands
- `npm run dev` — dev server
- `npm run build` — production SSR build
- `npm run generate` — static generation (92 routes)

## Key Decisions
- **Color-mode**: Manual (no `@nuxtjs/color-mode`). Inline script in `<head>` reads localStorage and sets `dark` class + primary color before first paint. `useTheme` composable for toggling.
- **Primary theme colors**: Green (`#22c55e`), Red, Blue, Purple, Orange, Teal — switched via `useTheme().setColor()`.
- **Fancybox**: CSS/JS imported globally via client plugin `plugins/fancybox.client.ts`; uses event delegation.
- **i18n**: `@nuxtjs/i18n` with `no_prefix` strategy, `defaultLocale: "ar"`, lazy loading from `locales/ar.json` and `locales/en.json`.

## Critical Config
- **Supabase**: `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env` (or Vercel env vars)
- **Supabase tables**: `teams`, `players`, `matches`, `votes`, `settings` — run `supabase-migration.sql` in SQL Editor
- **Admin password**: `admin123` — change in `composables/useAdminAuth.js`
- **Nitro**: `compressPublicAssets: true`, `prerender.failOnError: false`

## Completed Work
- Initial project setup (Nuxt 3, content, modules)
- Green theme with RTL/Arabic-first i18n
- All public pages (index, standings, fixtures, teams/[slug], teams/index, players/[slug], matches/[slug], bracket, stats)
- Fancybox album gallery (Album.vue, fancybox.client.ts)
- Locale files (ar.json, en.json) with all ~120 translation keys
- **Replaced `@nuxt/content` + Nuxt Studio with Supabase data layer**
- **Created `useLeagueData` composable** with embedded mock data (12 teams, 48 players, 37 matches)
- **Rewrote all 9 pages** from `queryCollection()` to `useLeagueData()`
- **Manual dark/light mode** (works on Vercel — no flash, no broken CSS)
- **Theme color switcher** (6 preset colors via `useTheme.js`)
- **Admin dashboard** (`/admin/login`, `/admin`, `/admin/teams`, `/admin/matches`, `/admin/settings`)
- **Image upload** with client-side compression (`browser-image-compression`)
- **Publish button** — triggers Vercel Deploy Hook via one click
- **Fixed `:root.dark` CSS** — removed `nuxt-beastcss`/`nuxt-vitalizer` that were pruning dark mode styles on production
- **Fixed console errors**: removed `/admin/players` link (404), disabled `appManifest` (500 payload)
- **Removed WhatsApp group link** from footer
- **Added multi-platform share** (Messenger, WhatsApp, Facebook, Telegram, Copy) to match page
- **Fixed hero card colors** for light/dark mode on index page
- **Seed data in `supabase-migration.sql`** (INSERT statements with full 12 teams, 48 players, 37 matches)
- **Fallback logic**: `useLeagueData` fallback functions used when Supabase returns empty/null (not just when client is missing)
- Build succeeds with 10 prerendered routes

## Known Issues
- Dev mode: non-fatal `#app-manifest` pre-transform warnings (Nuxt 3.21 artifact, harmless)
- Team logos: `alnasr.svg` and `alqadsia.svg` missing in `public/teams/` (will show fallback initials)
- Admin uploads store images as base64 in localStorage (for mock mode) — when Supabase storage is configured, switch to uploading files
- Admin password is hardcoded in `useAdminAuth.js` — change for production
- `useSupabase.js` static `_client` cache: first call returning `null` permanently prevents Supabase from reconnecting (affects dev SSR timing)
- `useAdminData.js` has separate mock data (4 teams) from public fallback (12 teams) — admin CRUD won't match public pages in mock mode

## Next Steps
1. Run `supabase-migration.sql` in Supabase SQL Editor to create tables
2. Deploy to Vercel (set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel env vars)
3. Create remaining team SVG logos (`alnasr.svg`, `alqadsia.svg`)
4. Optionally set up Supabase Storage bucket `team-images` for image uploads
5. Add sample match photos for Fancybox testing
