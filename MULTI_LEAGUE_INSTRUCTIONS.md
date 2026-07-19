# Multi-League Expansion — Green Ball Platform

> **Status:** PLAN + SQL READY — waiting for your confirmation before app code changes  
> **Date:** 2026-07-18  
> **Purpose:** Turn the single-league Village Football site into a multi-league platform (Green Ball portal + per-league sites under `/[league-slug]/...`)

This file is the **source of truth** if context is lost mid-implementation. Any agent continuing this work should read this fully before editing code.

---

## 1. Product goal (what users see)

### Today
| URL | What it is |
|-----|------------|
| `/` | League home (next match, standings, teams) |
| `/fixtures`, `/standings`, `/teams`, … | League pages |
| `/admin` | Admin for the one league |

### Target
| URL | What it is |
|-----|------------|
| `/` | **Green Ball portal** — brand homepage, list of leagues, pick a league |
| `/al-jarwiyya` | Home of the **existing** league (migrated data) |
| `/al-jarwiyya/fixtures` | Fixtures for that league |
| `/al-jarwiyya/standings` | Standings for that league |
| `/al-jarwiyya/teams` | Teams list |
| `/al-jarwiyya/teams/alnour` | Team detail |
| `/al-jarwiyya/players/ahmed-hassan` | Player detail |
| `/al-jarwiyya/matches/ga-alnour-vs-aytam` | Match detail |
| `/al-jarwiyya/bracket`, `/al-jarwiyya/stats` | Same as today, scoped |
| `/account` | Global user account (all leagues) |
| `/install` | PWA install (global) |
| `/admin` | Admin (global + league switcher + create leagues) |

**Default migrated league slug:** `al-jarwiyya` (confirmed)

---

## 2. Decisions — CONFIRMED (2026-07-18)

| # | Topic | Decision |
|---|--------|----------|
| D1 | Existing league slug | **`al-jarwiyya`** → `/al-jarwiyya` |
| D2 | Auth | **Global** users (one account for all leagues) |
| D3 | Prediction points | **Global** total on `profiles` for v1 |
| D4 | Admin v1 | Global `profiles.role = 'admin'` manages **all** leagues; create leagues from admin dashboard |
| D5 | Push notifications | Global send for v1; optional `push_subscriptions.league_id` later |
| D6 | Seasons | Per league (`league_id` on `seasons`) |
| D7 | Settings | One settings row **per league** |
| D8 | Reserved URL slugs | `admin`, `account`, `install`, `api`, … blocked in SQL |
| D9 | Team/player/match slugs | Unique **per league** → `/al-jarwiyya/teams/alnour` |
| D10 | Logo click inside league | **League home** (`/al-jarwiyya`), not portal |
| D11 | Portal brand | Green Ball / الكرة الخضراء |
| D12 | Admin create league | **Yes** — `/admin/leagues` CRUD + auto settings row |

---

## 3. Database design

### New tables

#### `leagues`
Platform registry of competitions.

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `slug` | TEXT UNIQUE | URL segment, kebab-case |
| `name` / `name_en` | TEXT | Arabic-first |
| `description` / `description_en` | TEXT | Portal cards |
| `logo`, `cover_image` | TEXT | URLs |
| `location` | TEXT | e.g. صافيتا |
| `primary_color` | TEXT | Brand accent for league |
| `is_active` | BOOL | Hide inactive from portal |
| `is_featured` | BOOL | Highlight on portal |
| `sort_order` | INT | Portal ordering |
| `season_label` | TEXT | Display e.g. `2026` |
| timestamps | | |

#### `league_members` (future-ready)
| Column | Notes |
|--------|--------|
| `league_id`, `user_id` | Unique pair |
| `role` | `member` \| `moderator` \| `admin` |

### Columns added to existing tables

| Table | Change |
|-------|--------|
| `teams` | `league_id NOT NULL` · PK → `(league_id, slug)` |
| `players` | `league_id NOT NULL` · PK → `(league_id, slug)` · FK `(league_id, team)` → teams |
| `matches` | `league_id NOT NULL` · PK → `(league_id, slug)` · composite FKs for home/away |
| `settings` | `league_id NOT NULL UNIQUE` · drop single-row constraint |
| `seasons` | `league_id NOT NULL` · unique `(league_id, slug)` · one active season per league |
| `managers` | `league_id NOT NULL` · composite FK to team |
| `votes` | `league_id NOT NULL` · unique per league+match+user |
| `match_predictions` | same as votes |
| `push_subscriptions` | optional `league_id` (nullable) |

### View
- `league_portal_stats` — teams/matches counts for portal cards

### Data migration (what SQL does)
1. Create `leagues` + insert default `al-jarwiyya` (name from existing `settings` if present)
2. Add `league_id` to all tables
3. Backfill every existing row → default league
4. Rebuild PKs/FKs/uniques for multi-tenant safety
5. Seed global admins into `league_members` for default league
6. **Does not delete** teams/players/matches/votes

---

## 4. SQL step (YOU do this first)

### File
`migrate.sql` (repo root) — **rewritten for free plan / no backup**

### Safety guarantees in SQL
- One big `BEGIN … COMMIT` → any error rolls **everything** back
- **Never** deletes teams / players / matches / votes / predictions / settings
- **Never** drops tables
- Snapshots row counts at start → **aborts if any count changes**
- Re-run safe (skips work already done)
- Orphan votes: **keeps** rows, skips FK instead of deleting

### Steps (no backup)
1. Supabase → **SQL Editor** → New query
2. Paste **entire** `migrate.sql` → **Run**
3. Wait for success (often 10–60s)
4. Check VERIFY:
   - slug `al-jarwiyya` exists
   - all `*_null_league` = `0`
   - teams/players/matches counts look normal
   - `teams_pk_column` shows both `league_id` and `slug`
5. Reply **“SQL done, proceed with code”** (or paste the full error)

### If SQL fails
- Transaction rolled back → old schema/data unchanged
- Site keeps working
- Paste the error — do **not** run old `supabase-migration.sql` (it drops tables)

### After SQL succeeds (before code deploy)
- Public **reads** still OK (single league)
- Avoid admin **create/edit** of teams/matches until app code is updated (upsert conflict target changes)
- Optional later:
```sql
alter publication supabase_realtime add table leagues;
```

---

## 5. App architecture plan (code — after SQL confirm)

### 5.1 Routing map

```
pages/
  index.vue                          ← NEW portal (Green Ball home)
  account.vue                        ← stays global
  install.vue                        ← stays global
  admin/…                            ← stays global (+ league switcher)
  [league]/
    index.vue                        ← current pages/index.vue (league home)
    fixtures.vue
    standings.vue
    bracket.vue
    stats.vue
    teams/index.vue
    teams/[slug].vue
    players/[slug].vue
    matches/[slug].vue
    managers/[id].vue
```

**Nuxt dynamic segment:** `pages/[league]/index.vue` → `/al-jarwiyya`  
Validate league exists (404 if unknown / inactive).

### 5.2 Core composable: `useCurrentLeague`

New file: `composables/useCurrentLeague.js`

Responsibilities:
- Read `route.params.league`
- Fetch/cache league row from Supabase (`leagues` table)
- Expose `{ league, leagueId, leagueSlug, pending, error }`
- Provide `leaguePath('/fixtures')` → `/${slug}/fixtures`
- Reject reserved slugs

All data fetches filter by `leagueId`.

### 5.3 Data layer changes

#### `useLeagueData.js`
Every `fromSupabase` call that hits teams/players/matches/settings must:
```js
eq: { league_id: leagueId, ...existingFilters }
```
Or accept `leagueId` argument / read from `useCurrentLeague()`.

#### `useAdminData.js`
- Add league context (selected admin league in `useState`)
- All CRUD includes `league_id`
- Upserts use composite conflict: `onConflict: 'league_id,slug'` where needed

#### `useSeasons.js`
- Filter by `league_id`
- `startNewSeason` only archives/resets **that** league’s data (critical bug-fix: today it wipes global tables)

#### `useVotes.js` / `useMatchPredictions.js`
- Insert/select with `league_id`
- Unique constraints are per league

#### `useRealtime.js`
- Optionally filter postgres_changes by league if payload includes `league_id`

### 5.4 Navigation / layouts

| Component | Change |
|-----------|--------|
| `Navbar.vue` | Links prefixed with current league; logo → league home **or** portal; show league name |
| `Footer.vue` | Same |
| `MobileBottomBar` (if any) | League-prefixed routes |
| Portal layout | Lighter chrome: Green Ball brand, no league nav until inside a league |
| Optional `layouts/league.vue` | Wrap `[league]/*` pages |

Helper:
```js
// utils/leagueRoutes.js or inside composable
const leaguePath = (path = '') => `/${leagueSlug}${path.startsWith('/') ? path : '/' + path}`
```

**Hard rule:** no more hard-coded `to="/fixtures"` inside league pages — always `leaguePath('/fixtures')`.

### 5.5 Portal homepage (`pages/index.vue` becomes portal)

Content ideas (Arabic-first):
- Green Ball logo + tagline
- Hero / about the platform
- Grid of active leagues (from `leagues` or `league_portal_stats`)
  - Logo, name, location, season, teams count, live badge
  - CTA → `/${league.slug}`
- Featured league highlight
- Footer / install PWA / account

Keep visual language (green theme, RTL, dark mode) consistent with brand.

### 5.6 Admin changes

1. **League switcher** in `layouts/admin.vue` (dropdown of leagues)
2. Persist selected `adminLeagueId` in `useState` + localStorage
3. All admin pages operate on selected league
4. New admin page: **`/admin/leagues`**
   - CRUD leagues (slug, names, logo, active, featured, sort)
   - Create league → auto-create empty `settings` row for it
5. Seasons / teams / matches already work once filtered by league

### 5.7 SEO / OG / PWA

| Item | Plan |
|------|------|
| `useSeoMeta` | Include league name in titles inside league routes |
| OG images | Pass league in `/api/og/...` when relevant |
| Sitemap | Portal + each league root + key pages |
| Push URL | Already uses `siteUrl`; match links become `/al-jarwiyya/matches/...` |
| PWA start_url | Keep `/` (portal) |

### 5.8 Notifications

When admin saves a match and sends push:
```js
url: `${siteUrl}/${leagueSlug}/matches/${match.slug}`
```
Example: `${siteUrl}/al-jarwiyya/matches/ga-alnour-vs-aytam`  
Not bare `/matches/...`.

### 5.9 Auth pages
- `/account` stays global
- Show user’s votes/predictions **with league badge** (join via `league_id`)
- Login modal works on portal and inside leagues

### 5.10 Redirects (important for existing users/bookmarks)

Add Nitro redirects or middleware:
```
/fixtures          → /al-jarwiyya/fixtures   (temporary 301)
/standings         → /al-jarwiyya/standings
/teams             → /al-jarwiyya/teams
/teams/:slug       → /al-jarwiyya/teams/:slug
/matches/:slug     → /al-jarwiyya/matches/:slug
/players/:slug     → /al-jarwiyya/players/:slug
/bracket           → /al-jarwiyya/bracket
/stats             → /al-jarwiyya/stats
```
Default redirect target = migrated league slug (`al-jarwiyya`).  
Remove redirects later once SEO settled, or keep permanently.

Implementation options:
- `server/middleware/legacy-redirects.ts`
- or `routeRules` in `nuxt.config.ts`

---

## 6. Implementation phases (ordered)

### Phase 0 — SQL ✅ (this PR docs)
- [x] Write `migrate.sql`
- [x] Write this instructions file
- [ ] **You run SQL in Supabase and confirm**

### Phase 1 — Foundation (code)
1. `composables/useCurrentLeague.js`
2. `composables/useLeagues.js` (list/create for portal + admin)
3. Update `useLeagueData.js` + `useAdminData.js` + `useSeasons.js` to require `league_id`
4. Update votes/predictions composables
5. Legacy redirects middleware

### Phase 2 — Routing move
1. Move public league pages under `pages/[league]/`
2. Create portal `pages/index.vue`
3. Update all internal links to `leaguePath()`
4. Navbar/Footer/Mobile nav aware of context
5. 404 when league slug invalid

### Phase 3 — Admin multi-league
1. League switcher in admin layout
2. `/admin/leagues` CRUD
3. Auto-create settings on new league
4. Scope seasons wipe to one league only

### Phase 4 — Polish
1. i18n keys for portal
2. SEO titles
3. Push notification absolute URLs with league prefix
4. Account page shows league on each vote/prediction
5. Update `AGENTS.md` architecture notes
6. Smoke test checklist (below)

---

## 7. Files that will change (checklist for agents)

### Must change
- `composables/useLeagueData.js`
- `composables/useAdminData.js`
- `composables/useSeasons.js`
- `composables/useVotes.js`
- `composables/useMatchPredictions.js`
- `composables/useRealtime.js` (filter if needed)
- `composables/useAppTitle.js` (league-aware title)
- `components/Shared/Navbar.vue`
- `components/Shared/Footer.vue`
- `layouts/admin.vue`
- `pages/index.vue` → portal (move old content to `[league]/index.vue`)
- All current public pages under `pages/` (fixtures, standings, teams, matches, players, bracket, stats, managers)
- `pages/admin/*` (filter by selected league)
- `pages/account.vue` (show league context)
- Push send call sites in admin matches/settings
- `nuxt.config.ts` (routeRules redirects optional)
- `i18n/locales/ar.json`, `en.json`
- `AGENTS.md`

### New files
- `migrate.sql` ✅
- `MULTI_LEAGUE_INSTRUCTIONS.md` ✅
- `composables/useCurrentLeague.js`
- `composables/useLeagues.js`
- `pages/[league]/…` (moved pages)
- `pages/admin/leagues.vue`
- `server/middleware/legacy-league-redirects.ts` (or routeRules)
- optional `layouts/league.vue`

### Do not break
- Auth (`useAuth.js`) — remains global
- PWA SW strategy
- Supabase env vars
- Existing production data (SQL migration only attaches `league_id`)

---

## 8. Smoke test checklist (after code deploy)

### Portal
- [ ] `/` loads Green Ball home
- [ ] League cards show (at least Safita)
- [ ] Click league → `/al-jarwiyya` loads with existing data

### League pages
- [ ] Standings / fixtures / teams / stats / bracket work under `/al-jarwiyya/...`
- [ ] Match detail, vote, predict work
- [ ] Team and player pages work
- [ ] Navbar links stay inside `/al-jarwiyya/...`
- [ ] Logo/home inside league goes to `/al-jarwiyya` (league home, not portal)

### Migration integrity
- [ ] Team count same as before migration
- [ ] Match scores unchanged
- [ ] Settings name/season still correct

### Admin
- [ ] Login works
- [ ] League switcher lists leagues
- [ ] Editing teams only affects selected league
- [ ] Create second test league → empty settings, no data bleed
- [ ] New season only resets selected league

### Legacy
- [ ] Old `/fixtures` redirects to `/al-jarwiyya/fixtures`
- [ ] Admin can create a new league from `/admin/leagues`

### Auth
- [ ] Same user can vote in two leagues independently
- [ ] Account page lists activity from both

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Composite PK breaks Supabase upserts | Use `onConflict: 'league_id,slug'` |
| Forgotten query without `league_id` mixes leagues | Centralize filters in `useLeagueData` / `useAdminData` only |
| `startNewSeason` wipes all leagues | **Must** filter deletes by `league_id` |
| SEO broken bookmarks | 301 redirects from old paths |
| League slug collision with `admin` | SQL CHECK + app validation |
| Realtime updates cross-league UI | Filter client handler by current `league_id` |
| Cloudflare SSR empty data | Pre-existing issue; not introduced by multi-league |

---

## 10. Questions — ANSWERED

1. **Slug:** `al-jarwiyya`  
2. **Portal brand:** Green Ball / الكرة الخضراء  
3. **Logo click:** league home (`/al-jarwiyya`)  
4. **Admin:** global admins + **create leagues in admin dashboard**  
5. **Migrate current data** into `al-jarwiyya`; create more leagues later via admin  
6. **Prediction points:** global for v1  

---

## 11. What you should do right now

1. Run the safe `migrate.sql` in SQL Editor (no backup required; full rollback on error)  
2. Paste VERIFY results (expect league slug `al-jarwiyya`)  
3. Say **“SQL done, proceed”** → agent starts Phase 1–4 code  
   (includes `/admin/leagues` to create new leagues)

---

## 12. Continuity note for next agent

If resuming after context loss:

```
1. Read MULTI_LEAGUE_INSTRUCTIONS.md fully
2. Confirm migrate.sql was applied (SELECT * FROM leagues)
3. Continue from first unchecked Phase item
4. Never re-run destructive parts of old supabase-migration.sql
   (that file DROPs tables — multi-league uses migrate.sql only)
5. Keep Arabic-first UI and existing design system
6. Do not introduce TypeScript in .vue files (project preference)
```

### Quick DB sanity after SQL
```sql
SELECT slug, name FROM leagues;
SELECT league_id, COUNT(*) FROM teams GROUP BY 1;
SELECT league_id, COUNT(*) FROM matches GROUP BY 1;
SELECT * FROM settings;
```

---

## 13. Out of scope for this expansion (later)

- Per-league custom domains
- Billing / league subscriptions
- Fantasy across leagues
- Strict RLS per league member role (currently open write policies like rest of app)
- Moving push send to Edge Functions
- TypeScript conversion

---

**End of plan.** Waiting for your confirmation + SQL run before code edits.
