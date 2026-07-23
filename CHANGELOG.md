# Changelog — Multi-League Slug Fixes

## Problem
Original slug prefixing used `-` separator (e.g., `biemra-biemra`). When a team/player slug happened to start with the league slug (e.g., team `biemra-b` in league `biemra`), the `startsWith("{ls}-")` guard had a false positive, treating the slug as already prefixed when it wasn't. This caused:
- Teams not being prefixed (migration skipped them), creating mismatches with match references
- Goal scorer/card/motm JSON values getting double-prefixed (`biemra::biemra-player1`)
- Admin team slug changes failing on `managers` FK constraint

## Changes

### 1. Separator `-` → `::` (all files)
`::` never appears in slugs (slug regex `[^\w-]` strips colons), so `startsWith("{ls}::")` is unambiguous.

**Files:**
- `composables/useCurrentLeague.js` — `prefixSlug`/`unprefixSlug`
- `composables/useAdminData.js` — `saveTeam`/`savePlayer`/`saveMatch` guards
- `composables/useLeagueData.js` — `stripPrefixes`/`prefix`
- `composables/useMatchPredictions.js` — `prefixSlug`
- `server/api/predictions/submit.post.ts` — DB slug concat
- `pages/[league]/fixtures.vue` — label map `F` → `FINAL`

### 2. Match slug prefix stripped (useLeagueData.js:139)
`fetchMatches()` now also strips prefix from `slug` field (was only stripping `homeTeam`/`awayTeam`). URLs no longer show `biemra::`.

### 3. Team slug cascade handles managers FK (teams.vue:855-874)
Changed from update-in-place to insert-new/update-refs/delete-old pattern:
1. Insert team row with new slug
2. Update managers/matches/players to point to new slug
3. Delete old team row

This avoids FK violation when `managers.team_slug` references `teams.slug`.

### 4. Migration SQL fixed for JSON double-prefix (separator migration:105-141)
Steps 7-9 now use `REGEXP_REPLACE` to strip any existing `{ls}::{ls}-` or `{ls}-` before adding `{ls}::`, instead of blind concat.

## SQL Files

| File | Purpose |
|------|---------|
| `supabase-separator-migration.sql` | Main migration: converts all `{ls}-` → `{ls}::`, handles false negatives via CASE branches. Run once. |
| `fix-post-migration.sql` | Fixes data broken by incorrect `-%` branch: (1) restores mangled team slugs, (2) fixes double-prefixed JSON in goalScorers/cards/motm. Run after migration. |

## Run Order
1. `fix-post-migration.sql` (fix existing broken data)
2. `supabase-separator-migration.sql` (convert to `::` — safe to re-run)

## Edge Cases
- **Team/player slug starts with league slug** (e.g., `biemra-club` in `biemra`): the `-%` CASE branch in the migration treats these as already-prefixed and strips the prefix, mangling the slug. Fixed by `fix-post-migration.sql` which cross-references match data to restore correct slug.
- **JSON false negatives** (player slug starts with league slug): `fix-post-migration.sql` normalizes JSON values, making them consistent with the players table. Both are wrong (missing the prefix) but consistent, so lookups work.
