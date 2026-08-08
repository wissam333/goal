-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE COMPLETE SCHEMA & MIGRATIONS — Goal Village Football League
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/sql/new)
-- Sections marked "one-time" are safe to re-run (IF NOT EXISTS / idempotent)
-- Sections marked "data transform" are one-time data migrations
-- ═══════════════════════════════════════════════════════════════════════════════

-- ==============================================================================
-- SECTION 1: TABLES
-- ==============================================================================

-- 1a. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  prediction_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1b. Leagues
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

CREATE INDEX IF NOT EXISTS idx_leagues_active_sort ON leagues (is_active, sort_order, created_at DESC);

-- 1c. Teams
CREATE TABLE IF NOT EXISTS teams (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#22c55e',
  logo TEXT,
  founded INTEGER,
  "group" TEXT DEFAULT 'A',
  is_struck BOOLEAN DEFAULT false,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Players
CREATE TABLE IF NOT EXISTS players (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  team TEXT REFERENCES teams(slug) ON DELETE CASCADE,
  number INTEGER,
  position TEXT,
  photo TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  appearances INTEGER DEFAULT 0,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. Matches
CREATE TABLE IF NOT EXISTS matches (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ,
  "group" TEXT,
  bracket_slot TEXT,
  venue TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'played', 'live')),
  "homeTeam" TEXT REFERENCES teams("slug"),
  "awayTeam" TEXT REFERENCES teams("slug"),
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "homeScoreAET" INTEGER,
  "awayScoreAET" INTEGER,
  "homePenalties" INTEGER,
  "awayPenalties" INTEGER,
  "resultMethod" TEXT DEFAULT 'ft' CHECK ("resultMethod" IS NULL OR "resultMethod" IN ('ft', 'aet', 'pen')),
  "goalScorers" JSONB DEFAULT '[]'::jsonb,
  "motmWinner" TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  cards JSONB DEFAULT '[]'::jsonb,
  description TEXT DEFAULT '',
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1f. Votes (MOTM voting — one vote per voter per match)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_slug TEXT REFERENCES matches(slug) ON DELETE CASCADE,
  player_slug TEXT REFERENCES players(slug) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_slug, voter_id)
);

-- 1g. Match Predictions (who will win — one prediction per voter per match)
CREATE TABLE IF NOT EXISTS match_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_slug TEXT REFERENCES matches(slug) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  team_slug TEXT NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_slug, voter_id)
);

-- 1h. Settings (one row per league)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER NOT NULL,
  season TEXT DEFAULT '2026',
  "groups" JSONB DEFAULT '["A","B"]'::jsonb,
  "teamsPerGroup" INTEGER DEFAULT 4,
  ad JSONB DEFAULT NULL,
  knockout_draw JSONB DEFAULT NULL,
  tie_breakers JSONB DEFAULT '["pts","gd","gf"]'::jsonb,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1i. Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  snapshot JSONB DEFAULT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, slug)
);

-- 1j. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  league_id UUID REFERENCES leagues(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1k. Managers
CREATE TABLE IF NOT EXISTS managers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  role TEXT DEFAULT '',
  team_slug TEXT NOT NULL REFERENCES teams(slug) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1l. League Members
CREATE TABLE IF NOT EXISTS league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, user_id)
);

-- ==============================================================================
-- SECTION 2: SETTINGS PK (league_id as PK)
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_pkey' AND conrelid = 'settings'::regclass) THEN
    ALTER TABLE settings ADD PRIMARY KEY (league_id);
  END IF;
END $$;

ALTER TABLE settings DROP CONSTRAINT IF EXISTS single_row;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_league_id_key') THEN
    ALTER TABLE settings ADD CONSTRAINT settings_league_id_key UNIQUE (league_id);
  END IF;
END $$;

-- ==============================================================================
-- SECTION 3: ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Leagues
DROP POLICY IF EXISTS "anon_select_leagues" ON leagues;
DROP POLICY IF EXISTS "anon_insert_leagues" ON leagues;
DROP POLICY IF EXISTS "anon_update_leagues" ON leagues;
DROP POLICY IF EXISTS "anon_delete_leagues" ON leagues;
CREATE POLICY "anon_select_leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "anon_insert_leagues" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_leagues" ON leagues FOR UPDATE USING (true);
CREATE POLICY "anon_delete_leagues" ON leagues FOR DELETE USING (true);

-- Teams
DROP POLICY IF EXISTS "anon_select_teams" ON teams;
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
DROP POLICY IF EXISTS "anon_update_teams" ON teams;
DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_select_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE USING (true);
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE USING (true);

-- Players
DROP POLICY IF EXISTS "anon_select_players" ON players;
DROP POLICY IF EXISTS "anon_insert_players" ON players;
DROP POLICY IF EXISTS "anon_update_players" ON players;
DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT USING (true);
CREATE POLICY "anon_insert_players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_players" ON players FOR UPDATE USING (true);
CREATE POLICY "anon_delete_players" ON players FOR DELETE USING (true);

-- Matches
DROP POLICY IF EXISTS "anon_select_matches" ON matches;
DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
DROP POLICY IF EXISTS "anon_update_matches" ON matches;
DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "anon_select_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE USING (true);

-- Votes
DROP POLICY IF EXISTS "anon_select_votes" ON votes;
DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
CREATE POLICY "anon_select_votes" ON votes FOR SELECT USING (true);
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT WITH CHECK (true);

-- Match Predictions
DROP POLICY IF EXISTS "anon_select_match_predictions" ON match_predictions;
DROP POLICY IF EXISTS "anon_insert_match_predictions" ON match_predictions;
DROP POLICY IF EXISTS "anon_delete_match_predictions" ON match_predictions;
CREATE POLICY "anon_select_match_predictions" ON match_predictions FOR SELECT USING (true);
CREATE POLICY "anon_insert_match_predictions" ON match_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_delete_match_predictions" ON match_predictions FOR DELETE USING (true);

-- Settings
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT USING (true);
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE USING (true);
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE USING (true);

-- Seasons
DROP POLICY IF EXISTS "anon_select_seasons" ON seasons;
DROP POLICY IF EXISTS "anon_insert_seasons" ON seasons;
DROP POLICY IF EXISTS "anon_update_seasons" ON seasons;
DROP POLICY IF EXISTS "anon_delete_seasons" ON seasons;
CREATE POLICY "anon_select_seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "anon_insert_seasons" ON seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_seasons" ON seasons FOR UPDATE USING (true);
CREATE POLICY "anon_delete_seasons" ON seasons FOR DELETE USING (true);

-- Push Subscriptions
DROP POLICY IF EXISTS "anon_insert_push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "anon_delete_push_subscriptions" ON push_subscriptions;
CREATE POLICY "anon_insert_push_subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_delete_push_subscriptions" ON push_subscriptions FOR DELETE USING (true);

-- League Members
DROP POLICY IF EXISTS "select_league_members" ON league_members;
DROP POLICY IF EXISTS "manage_league_members" ON league_members;
CREATE POLICY "select_league_members" ON league_members FOR SELECT USING (true);
CREATE POLICY "manage_league_members" ON league_members FOR ALL USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- SECTION 4: FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 4a. Admin check (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4b. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4c. Increment prediction points
CREATE OR REPLACE FUNCTION increment_prediction_points(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET prediction_points = COALESCE(prediction_points, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4d. Recalculate player goals from match goalScorers
-- Call via: SELECT recalculate_player_goals('league-uuid');
CREATE OR REPLACE FUNCTION recalculate_player_goals(p_league_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  WITH goal_counts AS (
    SELECT gs->>'player' AS player_slug, COUNT(*)::INT AS g
    FROM matches m, jsonb_array_elements(m."goalScorers") gs
    WHERE m.league_id = p_league_id AND m."goalScorers" IS NOT NULL AND m."goalScorers"::text <> '[]'
    GROUP BY gs->>'player'
  )
  UPDATE players p SET goals = gc.g
  FROM goal_counts gc
  WHERE p.slug = gc.player_slug AND p.league_id = p_league_id;
  UPDATE players SET goals = 0
  WHERE league_id = p_league_id AND goals != 0
    AND slug NOT IN (SELECT DISTINCT gs->>'player' FROM matches m, jsonb_array_elements(m."goalScorers") gs WHERE m.league_id = p_league_id);
END;
$$;

-- 4e. Managers table: ensure RLS disabled (admin-managed)
ALTER TABLE managers DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- SECTION 5: INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_teams_league ON teams (league_id);
CREATE INDEX IF NOT EXISTS idx_players_league ON players (league_id);
CREATE INDEX IF NOT EXISTS idx_players_team_league ON players(league_id, team);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches (league_id);
CREATE INDEX IF NOT EXISTS idx_matches_league_status ON matches (league_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_league_date ON matches (league_id, date);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(league_id, "homeTeam");
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(league_id, "awayTeam");
CREATE INDEX IF NOT EXISTS idx_matches_goalScorers_gin ON matches USING GIN ("goalScorers");
CREATE INDEX IF NOT EXISTS idx_seasons_league ON seasons (league_id);
CREATE INDEX IF NOT EXISTS idx_votes_match ON votes(league_id, match_slug);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(league_id, user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON match_predictions(league_id, match_slug);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON match_predictions(league_id, user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members (user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members (league_id);

-- ==============================================================================
-- SECTION 6: VIEWS
-- ==============================================================================

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

-- ==============================================================================
-- SECTION 7: SEED DATA
-- ==============================================================================

-- 7a. Default leagues
INSERT INTO leagues (slug, name, name_en, description, location, primary_color, is_active, is_featured, sort_order, season_label)
VALUES
  ('al-jarwiyya', 'دوري الجروية', 'Al-Jarwiyya League', 'دوري كرة القدم — الجروية', 'صافيتا', '#22c55e', true, true, 0, '2026'),
  ('biemra', 'دوري بعمرة', 'Biemra League', 'دوري كرة القدم — بعمرة', 'صافيتا', '#22c55e', true, true, 1, '2026')
ON CONFLICT (slug) DO NOTHING;

-- 7b. Settings per league
INSERT INTO settings (id, season, "groups", "teamsPerGroup", league_id)
SELECT 1, '2026', '["A","B","C","D"]'::jsonb, 4, id FROM leagues WHERE slug = 'al-jarwiyya'
ON CONFLICT (league_id) DO NOTHING;

INSERT INTO settings (id, season, "groups", "teamsPerGroup", league_id)
SELECT 1, '2026', '["A","B","C","D","E","F","G","H"]'::jsonb, 4, id FROM leagues WHERE slug = 'biemra'
ON CONFLICT (league_id) DO NOTHING;

-- 7c. Seed global admins as league admins
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id, role)
    SELECT l.id, p.id, 'admin'
    FROM profiles p, leagues l
    WHERE p.role = 'admin'
    ON CONFLICT (league_id, user_id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- 7d. Set admin role by email (uncomment and replace with actual email)
-- UPDATE profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1);

-- ==============================================================================
-- SECTION 8: DATA TRANSFORMS (one-time, run after seeding)
-- ⚠ These are idempotent — safe to re-run
-- ==============================================================================

-- 8a. Fix guest predictions unique constraint
UPDATE match_predictions SET voter_id = COALESCE(voter_id, user_id::text, id::text) WHERE voter_id IS NULL OR voter_id = '';
ALTER TABLE match_predictions ALTER COLUMN voter_id SET NOT NULL;
ALTER TABLE match_predictions DROP CONSTRAINT IF EXISTS match_predictions_match_slug_user_id_key;
ALTER TABLE match_predictions DROP CONSTRAINT IF EXISTS match_predictions_match_slug_voter_id_key;
ALTER TABLE match_predictions DROP CONSTRAINT IF EXISTS match_predictions_league_match_voter_key;

DELETE FROM match_predictions a
USING match_predictions b
WHERE a.league_id IS NOT DISTINCT FROM b.league_id
  AND a.match_slug = b.match_slug
  AND a.voter_id = b.voter_id
  AND a.ctid > b.ctid;

ALTER TABLE match_predictions ADD CONSTRAINT match_predictions_league_match_voter_key UNIQUE (league_id, match_slug, voter_id);
CREATE UNIQUE INDEX IF NOT EXISTS match_predictions_league_match_user_uidx ON match_predictions (league_id, match_slug, user_id) WHERE user_id IS NOT NULL;

-- 8b. Fix settings PK (each league has own row)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_pkey' AND conrelid = 'settings'::regclass) THEN
    ALTER TABLE settings ADD PRIMARY KEY (league_id);
  END IF;
END $$;

-- ==============================================================================
-- SECTION 9: SLUG SEPARATOR MIGRATION (one-time data transform)
-- ⚠ Only run this on existing databases with legacy - separator data
-- ==============================================================================

-- 9a. Teams: convert {ls}- to {ls}::
-- BEGIN;
-- SET session_replication_role = replica;
--
-- UPDATE teams SET slug = l.slug || '::' ||
--   CASE
--     WHEN teams.slug LIKE l.slug || '::%' THEN substring(teams.slug FROM length(l.slug) + 3)
--     WHEN teams.slug LIKE l.slug || '-%'  THEN substring(teams.slug FROM length(l.slug) + 2)
--     ELSE teams.slug
--   END
-- FROM leagues l WHERE teams.league_id = l.id;
--
-- -- 9b. Managers: prefix team_slug (same CASE logic)
-- UPDATE managers SET team_slug = l.slug || '::' || ...
--
-- -- 9c. Players: prefix slug + team (same CASE logic)
-- -- 9d. Votes: prefix match_slug + player_slug (join via matches)
-- -- 9e. Match Predictions: prefix match_slug + team_slug (join via matches)
-- -- 9f. Matches: prefix slug + homeTeam + awayTeam (same CASE logic)
--
-- -- 9g. JSON fields (goalScorers, cards, motmWinner): 3-layer regexp normalization
-- -- Strips {ls}::{ls}- → {ls}- → {ls}:: then re-adds {ls}::
-- -- The 3-layer chain makes it idempotent for any input format
-- UPDATE matches SET "goalScorers" = (
--   SELECT jsonb_agg(
--     jsonb_set(
--       jsonb_set(elem, '{player}',
--         to_jsonb(l.slug || '::' ||
--           REGEXP_REPLACE(
--             REGEXP_REPLACE(
--               REGEXP_REPLACE(elem->>'player', '^' || l.slug || '::' || l.slug || '-', ''),
--             '^' || l.slug || '-', ''),
--           '^(' || l.slug || '::)+', '')
--         )
--       ),
--     '{team}',
--       to_jsonb(l.slug || '::' ||
--         REGEXP_REPLACE(
--           REGEXP_REPLACE(
--             REGEXP_REPLACE(elem->>'team', '^' || l.slug || '::' || l.slug || '-', ''),
--           '^' || l.slug || '-', ''),
--         '^(' || l.slug || '::)+', '')
--       )
--     )
--   )
--   FROM jsonb_array_elements(matches."goalScorers") AS elem
-- )
-- FROM leagues l WHERE matches.league_id = l.id AND matches."goalScorers" IS NOT NULL AND matches."goalScorers"::text <> '[]';
--
-- -- Same pattern for cards and motmWinner (see full version in separate file if needed)
--
-- SET session_replication_role = origin;
-- COMMIT;

-- ==============================================================================
-- SECTION 10: POST-MIGRATION FIXES (one-time data fix)
-- ⚠ Only run this after the separator migration if data got double-prefixed
-- ==============================================================================

-- 10a. Fix double-prefixed JSON data (goalScorers, cards, motmWinner)
-- The separator migration could create {ls}::{ls}-{clean} instead of {ls}::{clean}
-- for slugs whose original value already had the league prefix.
-- Run the full version from fix-post-migration.sql if needed.

-- 10b. Fix corrupt team slug references in JSON (biemra league)
-- After migration, some goalScorers/cards had "biemra::club" / "biemra::b"
-- instead of "biemra::biemra-club" / "biemra::biemra-b"
UPDATE matches
SET "goalScorers" = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'team' = 'biemra::club' THEN jsonb_set(elem, '{team}', '"biemra::biemra-club"')
      WHEN elem->>'team' = 'biemra::b'    THEN jsonb_set(elem, '{team}', '"biemra::biemra-b"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(matches."goalScorers") AS elem
)
WHERE league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
  AND "goalScorers" IS NOT NULL
  AND ("goalScorers"::text LIKE '%biemra::club%' OR "goalScorers"::text LIKE '%biemra::b%');

UPDATE matches
SET cards = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'team' = 'biemra::club' THEN jsonb_set(elem, '{team}', '"biemra::biemra-club"')
      WHEN elem->>'team' = 'biemra::b'    THEN jsonb_set(elem, '{team}', '"biemra::biemra-b"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(matches.cards) AS elem
)
WHERE league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
  AND cards IS NOT NULL
  AND (cards::text LIKE '%biemra::club%' OR cards::text LIKE '%biemra::b%');

-- 10c. Remove "unknown" player entries from goalScorers/cards
UPDATE matches
SET "goalScorers" = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(matches."goalScorers") AS elem
  WHERE LOWER(elem->>'player') NOT LIKE '%unknown%'
    AND LOWER(elem->>'player') NOT LIKE '%غير معروف%'
)
WHERE "goalScorers" IS NOT NULL;

UPDATE matches
SET cards = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(matches.cards) AS elem
  WHERE LOWER(elem->>'player') NOT LIKE '%unknown%'
    AND LOWER(elem->>'player') NOT LIKE '%غير معروف%'
)
WHERE cards IS NOT NULL;

-- 10d. Remove "unknown" player entries from players table
DELETE FROM players
WHERE LOWER(title) LIKE '%unknown%'
  OR LOWER(title) LIKE '%غير معروف%'
  OR title IS NULL;

-- 10e. Deduplicate players (keep lowest slug alphabetically)
DELETE FROM players a
USING players b
WHERE a.league_id IS NOT DISTINCT FROM b.league_id
  AND a.slug <> b.slug
  AND (
    (a.title = b.title AND a.team IS NOT DISTINCT FROM b.team AND a.slug > b.slug)
    OR (a.title = b.title AND a.team IS NOT DISTINCT FROM b.team AND a.slug > b.slug)
  );

CREATE INDEX IF NOT EXISTS players_league_title_team_idx ON players (league_id, title, team);

-- ==============================================================================
-- END
-- ==============================================================================
