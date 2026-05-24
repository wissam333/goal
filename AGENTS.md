# AGENTS.md — Project State

## Overview
Village Football League site. Nuxt 3.21.2, `@nuxt/content` v3, GitHub-linked Nuxt Studio for content editing, Fancybox album gallery, Arabic-first UI.

## Architecture
- **SSR** (`nuxt build`) — required by Nuxt Studio for auth routes
- **Prerendered routes**: `/`, `/standings`, `/fixtures`, `/bracket`, `/stats`
- **Dynamic routes** (SSR-only, not prerendered): `/teams/**`, `/players/**`, `/matches/**`
- **Standings**: computed on-the-fly from match data (no stored standings)
- **Voting**: localStorage + Supabase
- **Images**: `<NuxtImg>` with IPX; team logos are SVGs in `public/teams/`
- **Albums**: `<ElementsAlbum>` with `@fancyapps/ui` v6 lightbox
- **No PWA** — removed due to service worker conflict with Studio

## Build Commands
- `npm run dev` — dev server (may show non-fatal `#app-manifest` pre-transform warnings)
- `npm run build` — production SSR build (prerenders static routes)
- No typecheck or lint commands configured

## Key Decisions
- **Color-mode** v3.5.2 (not v4) — v4 requires Nuxt 4+. Config: `classSuffix: ""`, `preference: "dark"`, `fallback: "dark"`, `storageKey: "league-color-mode"`. Uses `:root.dark` SCSS selector.
- **Fancybox**: CSS/JS imported globally via client plugin `plugins/fancybox.client.ts`; uses event delegation (`Fancybox.bind("[data-fancybox]", ...)`)
- **i18n**: `@nuxtjs/i18n` with `no_prefix` strategy, `defaultLocale: "ar"`, lazy loading from `locales/ar.json` and `locales/en.json`

## Critical Config
- **Supabase**: `runtimeConfig.public.supabaseUrl` / `supabaseKey` from env
- **Studio**: requires `STUDIO_GITHUB_CLIENT_ID`, `STUDIO_GITHUB_CLIENT_SECRET`, `STUDIO_GITHUB_TOKEN` env vars. OAuth callback: `https://{domain}/__nuxt_studio/auth/github`
- **Nuxt Studio**: accessed at `/_studio`; uses `nuxt-studio` module; repository: `wissam333/goal#main`
- **Nitro**: `compressPublicAssets: true`, `prerender.failOnError: false`

## Completed Work
- Initial project setup (Nuxt 3, content, modules)
- Green theme with RTL/Arabic-first i18n
- All pages (index, standings, fixtures, teams/[slug], teams/index, players/[slug], matches/[slug], bracket, stats)
- Content schema with 3 Zod-typed collections (matches, teams, players) + Arabic `.describe()` labels
- Fancybox album gallery (Album.vue, fancybox.client.ts)
- Color-mode dark/light with v3.5.2
- Locale files (ar.json, en.json) with all ~120 translation keys
- Removed dead code (imagegallery.vue, PWA config)
- All fixes applied (EmptyState, bracket tabs, stats cards, hydration, duplicate declarations)
- Production build succeeds (37 prerendered routes)

## Known Issues
- Dev mode: non-fatal `#app-manifest` pre-transform warnings (Nuxt 3.21 artifact, harmless)
- Dev mode: `nuxt-studio` component-meta missing warning (install `nuxt-component-meta` to fix)
- Team logos: only `alnour.svg` and `aytam.svg` exist in `public/teams/`; `alnasr.svg`, `alqadsia.svg` missing (will show 404s)
- Some old shared components (BarcodeInput, VideoUpload, FileUpload, etc.) from prior project are unused but harmless

## Next Steps
1. Create remaining team SVG logos (`alnasr.svg`, `alqadsia.svg`)
2. Deploy to Vercel and verify Studio access
3. Set up local Studio OAuth for content editing
4. Add sample match photos to content files for Fancybox testing
