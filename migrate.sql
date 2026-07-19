-- ═══════════════════════════════════════════════════════════════
-- MULTI-LEAGUE MIGRATION — FULL VERSION
-- ═══════════════════════════════════════════════════════════════
-- What this does:
--   1. Creates leagues table (full schema: description, cover, location, etc.)
--   2. Creates default league: al-jarwiyya (from current settings)
--   3. Adds league_id column to all existing tables
--   4. Backfills with al-jarwiyya ID
--   5. Adds FK constraints + NOT NULL
--   6. Seeds global admins into league_members
--   7. Creates league_portal_stats view
--
-- Does NOT drop tables or delete data.
-- Safe to re-run. BEGIN/COMMIT rolls back on any error.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. LEAGUES TABLE (full schema)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  logo TEXT,
  cover_image TEXT,
  location TEXT,
  primary_color TEXT DEFAULT '#22c55e',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  season_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leagues_slug_key') THEN
    ALTER TABLE leagues ADD CONSTRAINT leagues_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leagues_slug_format') THEN
    ALTER TABLE leagues ADD CONSTRAINT leagues_slug_format CHECK (
      slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      AND slug NOT IN (
        'admin', 'account', 'install', 'api', 'auth',
        'login', 'logout', 'assets', 'static', 'sw',
        'manifest', 'robots', 'favicon', 'og', 'notifications'
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leagues_active_sort
  ON leagues (is_active, sort_order, created_at DESC);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leagues" ON leagues;
DROP POLICY IF EXISTS "anon_insert_leagues" ON leagues;
DROP POLICY IF EXISTS "anon_update_leagues" ON leagues;
DROP POLICY IF EXISTS "anon_delete_leagues" ON leagues;
CREATE POLICY "anon_select_leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "anon_insert_leagues" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_leagues" ON leagues FOR UPDATE USING (true);
CREATE POLICY "anon_delete_leagues" ON leagues FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────
-- 2. DEFAULT LEAGUE: al-jarwiyya
-- ─────────────────────────────────────────────────────────────
INSERT INTO leagues (slug, name, name_en, description, location, primary_color, is_active, is_featured, sort_order, season_label)
VALUES (
  'al-jarwiyya',
  COALESCE((SELECT name FROM settings ORDER BY id LIMIT 1), 'دوري الجروية'),
  'Al-Jarwiyya League',
  'دوري كرة القدم — الجروية',
  'صافيتا',
  '#22c55e',
  true, true, 0,
  COALESCE((SELECT season FROM settings ORDER BY id LIMIT 1), '2026')
)
ON CONFLICT (slug) DO UPDATE SET
  name_en = COALESCE(leagues.name_en, EXCLUDED.name_en),
  description = COALESCE(leagues.description, EXCLUDED.description),
  description_en = COALESCE(leagues.description_en, EXCLUDED.description_en),
  location = COALESCE(leagues.location, EXCLUDED.location),
  season_label = COALESCE(leagues.season_label, EXCLUDED.season_label),
  updated_at = NOW();

-- ─────────────────────────────────────────────────────────────
-- 3. ADD league_id COLUMNS + BACKFILL
-- ─────────────────────────────────────────────────────────────
ALTER TABLE teams ADD COLUMN IF NOT EXISTS league_id UUID;
UPDATE teams SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
WHERE league_id IS NULL;

ALTER TABLE players ADD COLUMN IF NOT EXISTS league_id UUID;
UPDATE players SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
WHERE league_id IS NULL;

ALTER TABLE matches ADD COLUMN IF NOT EXISTS league_id UUID;
UPDATE matches SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
WHERE league_id IS NULL;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS league_id UUID;
UPDATE settings SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
WHERE league_id IS NULL;

ALTER TABLE seasons ADD COLUMN IF NOT EXISTS league_id UUID;
UPDATE seasons SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
WHERE league_id IS NULL;

ALTER TABLE votes ADD COLUMN IF NOT EXISTS league_id UUID;
UPDATE votes SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
WHERE league_id IS NULL;

ALTER TABLE match_predictions ADD COLUMN IF NOT EXISTS league_id UUID;
UPDATE match_predictions SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
WHERE league_id IS NULL;

DO $$
BEGIN
  IF to_regclass('public.managers') IS NOT NULL THEN
    ALTER TABLE managers ADD COLUMN IF NOT EXISTS league_id UUID;
    UPDATE managers SET league_id = (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1)
    WHERE league_id IS NULL;
  END IF;
  IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
    ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS league_id UUID;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. FK CONSTRAINTS
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_league_id_fkey') THEN
    ALTER TABLE teams ADD CONSTRAINT teams_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_league_id_fkey') THEN
    ALTER TABLE players ADD CONSTRAINT players_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_league_id_fkey') THEN
    ALTER TABLE matches ADD CONSTRAINT matches_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_league_id_fkey') THEN
    ALTER TABLE settings ADD CONSTRAINT settings_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seasons_league_id_fkey') THEN
    ALTER TABLE seasons ADD CONSTRAINT seasons_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votes_league_id_fkey') THEN
    ALTER TABLE votes ADD CONSTRAINT votes_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_predictions_league_id_fkey') THEN
    ALTER TABLE match_predictions ADD CONSTRAINT match_predictions_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
  IF to_regclass('public.managers') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'managers_league_id_fkey') THEN
    ALTER TABLE managers ADD CONSTRAINT managers_league_id_fkey
      FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. NOT NULL
-- ─────────────────────────────────────────────────────────────
ALTER TABLE teams ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE players ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE matches ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE seasons ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE votes ALTER COLUMN league_id SET NOT NULL;
ALTER TABLE match_predictions ALTER COLUMN league_id SET NOT NULL;

DO $$
BEGIN
  IF to_regclass('public.managers') IS NOT NULL THEN
    ALTER TABLE managers ALTER COLUMN league_id SET NOT NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teams_league ON teams (league_id);
CREATE INDEX IF NOT EXISTS idx_players_league ON players (league_id);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches (league_id);
CREATE INDEX IF NOT EXISTS idx_matches_league_status ON matches (league_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_league_date ON matches (league_id, date);
CREATE INDEX IF NOT EXISTS idx_seasons_league ON seasons (league_id);

-- ─────────────────────────────────────────────────────────────
-- 7. SETTINGS: one row per league
-- ─────────────────────────────────────────────────────────────
ALTER TABLE settings DROP CONSTRAINT IF EXISTS single_row;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_league_id_key') THEN
    ALTER TABLE settings ADD CONSTRAINT settings_league_id_key UNIQUE (league_id);
  END IF;
END $$;

ALTER TABLE settings DROP COLUMN IF EXISTS name;

-- ─────────────────────────────────────────────────────────────
-- 8. SEASONS: unique slug per league
-- ─────────────────────────────────────────────────────────────
ALTER TABLE seasons DROP CONSTRAINT IF EXISTS seasons_slug_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seasons_league_slug_key') THEN
    ALTER TABLE seasons ADD CONSTRAINT seasons_league_slug_key UNIQUE (league_id, slug);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 9. LEAGUE MEMBERS TABLE + SEED ADMINS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members (user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members (league_id);

ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_league_members" ON league_members;
DROP POLICY IF EXISTS "manage_league_members" ON league_members;
CREATE POLICY "select_league_members" ON league_members FOR SELECT USING (true);
CREATE POLICY "manage_league_members" ON league_members FOR ALL USING (true) WITH CHECK (true);

-- Seed global admins as al-jarwiyya admins
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id, role)
    SELECT (SELECT id FROM leagues WHERE slug = 'al-jarwiyya' LIMIT 1), p.id, 'admin'
    FROM profiles p
    WHERE p.role = 'admin'
    ON CONFLICT (league_id, user_id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 10. PORTAL STATS VIEW
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS league_portal_stats CASCADE;
CREATE VIEW league_portal_stats AS
SELECT
  l.id, l.slug, l.name, l.name_en,
  l.description, l.description_en,
  l.logo, l.cover_image, l.location,
  l.primary_color, l.is_active, l.is_featured,
  l.sort_order, l.season_label,
  (SELECT COUNT(*) FROM teams t WHERE t.league_id = l.id) AS teams_count,
  (SELECT COUNT(*) FROM matches m WHERE m.league_id = l.id) AS matches_count,
  (SELECT COUNT(*) FROM matches m WHERE m.league_id = l.id AND m.status = 'played') AS played_count,
  (SELECT COUNT(*) FROM matches m WHERE m.league_id = l.id AND m.status = 'live') AS live_count,
  (SELECT COUNT(*) FROM matches m WHERE m.league_id = l.id AND m.status = 'upcoming') AS upcoming_count,
  l.created_at, l.updated_at
FROM leagues l;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════════════════
SELECT 'leagues' AS tbl, COUNT(*) FROM leagues
UNION ALL SELECT 'teams', COUNT(*) FROM teams
UNION ALL SELECT 'players', COUNT(*) FROM players
UNION ALL SELECT 'matches', COUNT(*) FROM matches
UNION ALL SELECT 'settings', COUNT(*) FROM settings
UNION ALL SELECT 'seasons', COUNT(*) FROM seasons
UNION ALL SELECT 'votes', COUNT(*) FROM votes
UNION ALL SELECT 'match_predictions', COUNT(*) FROM match_predictions
ORDER BY tbl;

SELECT id, slug, name, is_active, season_label FROM leagues;

SELECT
  (SELECT COUNT(*) FROM teams WHERE league_id IS NULL) AS teams_null,
  (SELECT COUNT(*) FROM players WHERE league_id IS NULL) AS players_null,
  (SELECT COUNT(*) FROM matches WHERE league_id IS NULL) AS matches_null;
