-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/unvcleinbpoygnhylvvw/sql/new)

-- ═══════════════════════════════════════════════════════════════
-- INCREMENTAL MIGRATIONS (safe to re-run)
-- ═══════════════════════════════════════════════════════════════

-- 0a. Add ad column to settings (if table already exists from a previous run)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ad JSONB DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════
-- SCHEMA
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS match_predictions CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 1. Teams table
CREATE TABLE teams (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#22c55e',
  logo TEXT,
  founded INTEGER,
  "group" TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Players table
CREATE TABLE players (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  team TEXT REFERENCES teams(slug) ON DELETE CASCADE,
  number INTEGER,
  position TEXT,
  photo TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  appearances INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Matches table
CREATE TABLE matches (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ,
  "group" TEXT,
  venue TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'played', 'live')),
  "homeTeam" TEXT REFERENCES teams("slug"),
  "awayTeam" TEXT REFERENCES teams("slug"),
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "goalScorers" JSONB DEFAULT '[]'::jsonb,
  "motmWinner" TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Votes table (for MOTM voting — one vote per voter per match)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_slug TEXT REFERENCES matches(slug) ON DELETE CASCADE,
  player_slug TEXT REFERENCES players(slug) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_slug, voter_id)
);

-- 5. Match predictions table (who will win — one prediction per voter per match)
CREATE TABLE match_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_slug TEXT REFERENCES matches(slug) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  team_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_slug, voter_id)
);

-- 6. Settings table
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'دوري القرية السنوي',
  season TEXT DEFAULT '2026',
  "groups" JSONB DEFAULT '["A","B"]'::jsonb,
  "teamsPerGroup" INTEGER DEFAULT 4,
  ad JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
DROP POLICY IF EXISTS "anon_select_players" ON players;
DROP POLICY IF EXISTS "anon_select_matches" ON matches;
DROP POLICY IF EXISTS "anon_select_votes" ON votes;
DROP POLICY IF EXISTS "anon_select_match_predictions" ON match_predictions;
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
DROP POLICY IF EXISTS "anon_insert_match_predictions" ON match_predictions;
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
DROP POLICY IF EXISTS "anon_update_teams" ON teams;
DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
DROP POLICY IF EXISTS "anon_insert_players" ON players;
DROP POLICY IF EXISTS "anon_update_players" ON players;
DROP POLICY IF EXISTS "anon_delete_players" ON players;
DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
DROP POLICY IF EXISTS "anon_update_matches" ON matches;
DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
DROP POLICY IF EXISTS "anon_insert_match_predictions" ON match_predictions;
DROP POLICY IF EXISTS "anon_delete_match_predictions" ON match_predictions;
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;

CREATE POLICY "anon_select_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "anon_select_players" ON players FOR SELECT USING (true);
CREATE POLICY "anon_select_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "anon_select_votes" ON votes FOR SELECT USING (true);
CREATE POLICY "anon_select_match_predictions" ON match_predictions FOR SELECT USING (true);
CREATE POLICY "anon_select_settings" ON settings FOR SELECT USING (true);
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_match_predictions" ON match_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_teams"   ON teams   FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_teams"   ON teams   FOR UPDATE USING (true);
CREATE POLICY "anon_delete_teams"   ON teams   FOR DELETE USING (true);
CREATE POLICY "anon_insert_players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_players" ON players FOR UPDATE USING (true);
CREATE POLICY "anon_delete_players" ON players FOR DELETE USING (true);
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE USING (true);
CREATE POLICY "anon_delete_match_predictions" ON match_predictions FOR DELETE USING (true);
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE USING (true);
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════════
-- CLEAR EXISTING DATA (order respects FK constraints)
-- ═══════════════════════════════════════════════════════════════

DELETE FROM match_predictions;
DELETE FROM votes;
DELETE FROM matches;
DELETE FROM players;
DELETE FROM teams;
DELETE FROM settings;

-- ═══════════════════════════════════════════════════════════════
-- SEED: TEAMS (16 teams, 8 per group)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO teams (slug, title, color, "group") VALUES
  ('alnour',    'النور',    '#22c55e', 'A'),
  ('aytam',     'الأيتام',  '#3b82f6', 'A'),
  ('alqadsia',  'القادسية', '#ef4444', 'A'),
  ('alhilal',   'الهلال',   '#8b5cf6', 'A'),
  ('alahli',    'الأهلي',   '#14b8a6', 'A'),
  ('alraed',    'الرائد',   '#6366f1', 'A'),
  ('alwehdah',  'الوحدة',   '#a855f7', 'A'),
  ('alokhdood', 'الأخدود',  '#dc2626', 'A'),
  ('alnasr',    'النصر',    '#eab308', 'B'),
  ('alittihad', 'الاتحاد',  '#f97316', 'B'),
  ('alshabab',  'الشباب',   '#ec4899', 'B'),
  ('alfateh',   'الفتح',    '#06b6d4', 'B'),
  ('altaawoun', 'التعاون',  '#84cc16', 'B'),
  ('altai',     'الطائي',   '#f59e0b', 'B'),
  ('alkhaleej', 'الخليج',   '#0ea5e9', 'B'),
  ('alriyadh',  'الرياض',   '#64748b', 'B');

-- ═══════════════════════════════════════════════════════════════
-- SEED: PLAYERS (4 per team = 64)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO players (slug, title, team, number, position, goals, assists, appearances) VALUES
  -- النور
  ('ahmed-hassan',    'أحمد حسن',    'alnour',    10, 'مهاجم', 6, 2, 7),
  ('khaled-omar',     'خالد عمر',    'alnour',     7, 'وسط',   3, 4, 7),
  ('yasser-ali',      'ياسر علي',    'alnour',     5, 'مدافع', 0, 1, 7),
  ('nour-saeed',      'نور سعيد',    'alnour',     1, 'حارس',  0, 0, 7),
  -- الأيتام
  ('faris-nour',      'فارس نور',    'aytam',      9, 'مهاجم', 4, 2, 7),
  ('hadi-mahmoud',    'هادي محمود',  'aytam',      8, 'وسط',   2, 3, 7),
  ('sami-ibrahim',    'سامي إبراهيم','aytam',      4, 'مدافع', 1, 0, 7),
  ('marwan-hassan',   'مروان حسن',   'aytam',      1, 'حارس',  0, 0, 7),
  -- القادسية
  ('badr-shamari',    'بدر الشمري',  'alqadsia',  10, 'مهاجم', 5, 3, 7),
  ('abdullah-mohammed','عبدالله محمد','alqadsia',  6, 'وسط',   2, 1, 7),
  ('faisal-ahmed',    'فيصل أحمد',   'alqadsia',   3, 'مدافع', 0, 2, 7),
  ('lama-saad',       'لمى سعد',     'alqadsia',   1, 'حارس',  0, 0, 7),
  -- الهلال
  ('hasan-ali',       'حسن علي',     'alhilal',   11, 'مهاجم', 4, 1, 7),
  ('mohammed-saad',   'محمد سعد',    'alhilal',    8, 'وسط',   1, 2, 7),
  ('omar-hassan',     'عمر حسن',     'alhilal',    5, 'مدافع', 0, 0, 7),
  ('saed-ahmed',      'سعيد أحمد',   'alhilal',    1, 'حارس',  0, 0, 7),
  -- الأهلي
  ('ali-nour',        'علي نور',     'alahli',     9, 'مهاجم', 3, 2, 7),
  ('fahd-saeed',      'فهد سعيد',    'alahli',     7, 'وسط',   2, 1, 7),
  ('naser-mohammed',  'ناصر محمد',   'alahli',     4, 'مدافع', 0, 1, 7),
  ('khaled-ibrahim',  'خالد إبراهيم','alahli',     1, 'حارس',  0, 0, 7),
  -- الرائد
  ('majed-fahd',      'ماجد فهد',    'alraed',    10, 'مهاجم', 2, 0, 7),
  ('sultan-isa',      'سلطان عيسى',  'alraed',     6, 'وسط',   1, 2, 7),
  ('abdulrahman-ali', 'عبدالرحمن علي','alraed',    3, 'مدافع', 0, 0, 7),
  ('faisal-omar',     'فيصل عمر',    'alraed',     1, 'حارس',  0, 0, 7),
  -- الوحدة
  ('mohammed-nour',   'محمد نور',    'alwehdah',  10, 'مهاجم', 0, 0, 0),
  ('khaled-raed',     'خالد رائد',   'alwehdah',   7, 'وسط',   0, 0, 0),
  ('abdullah-fahd',   'عبدالله فهد', 'alwehdah',   5, 'مدافع', 0, 0, 0),
  ('saeed-mohammed',  'سعيد محمد',   'alwehdah',   1, 'حارس',  0, 0, 0),
  -- الأخدود
  ('nawaf-mohammed',  'نواف محمد',   'alokhdood', 10, 'مهاجم', 0, 0, 0),
  ('fahd-sultan',     'فهد سلطان',   'alokhdood',  7, 'وسط',   0, 0, 0),
  ('yasser-naser',    'ياسر ناصر',   'alokhdood',  4, 'مدافع', 0, 0, 0),
  ('majed-ali',       'ماجد علي',    'alokhdood',  1, 'حارس',  0, 0, 0),
  -- النصر
  ('omar-abdullah',   'عمر عبدالله', 'alnasr',     9, 'مهاجم', 5, 3, 7),
  ('zakaria-youssef', 'زكريا يوسف',  'alnasr',     7, 'وسط',   2, 4, 7),
  ('tamer-hassan',    'تامر حسن',    'alnasr',     5, 'مدافع', 1, 0, 7),
  ('mohammed-ali',    'محمد علي',    'alnasr',     1, 'حارس',  0, 0, 7),
  -- الاتحاد
  ('abdullah-saad',   'عبدالله سعد', 'alittihad', 10, 'مهاجم', 4, 1, 7),
  ('yousef-nour',     'يوسف نور',    'alittihad',  8, 'وسط',   1, 3, 7),
  ('hasan-fahd',      'حسن فهد',     'alittihad',  4, 'مدافع', 0, 1, 7),
  ('ali-mohammed',    'علي محمد',    'alittihad',  1, 'حارس',  0, 0, 7),
  -- الشباب
  ('nawaf-isa',       'نواف عيسى',   'alshabab',  11, 'مهاجم', 3, 2, 7),
  ('saad-ali',        'سعد علي',     'alshabab',   6, 'وسط',   2, 0, 7),
  ('mohammed-omar',   'محمد عمر',    'alshabab',   3, 'مدافع', 0, 0, 7),
  ('fahd-ahmed',      'فهد أحمد',    'alshabab',   1, 'حارس',  0, 0, 7),
  -- الفتح
  ('ahmed-saeed',     'أحمد سعيد',   'alfateh',    9, 'مهاجم', 2, 1, 7),
  ('khaled-fahd',     'خالد فهد',    'alfateh',    7, 'وسط',   0, 2, 7),
  ('abdulrahman-nour','عبدالرحمن نور','alfateh',   5, 'مدافع', 0, 0, 7),
  ('saeed-ali',       'سعيد علي',    'alfateh',    1, 'حارس',  0, 0, 7),
  -- التعاون
  ('faisal-mohammed', 'فيصل محمد',   'altaawoun', 10, 'مهاجم', 3, 1, 7),
  ('omar-saad',       'عمر سعد',     'altaawoun',  8, 'وسط',   1, 2, 7),
  ('nour-hassan',     'نور حسن',     'altaawoun',  4, 'مدافع', 0, 0, 7),
  ('mishaal-hasan',   'مشعل حسن',    'altaawoun',  1, 'حارس',  0, 0, 7),
  -- الطائي
  ('saad-fahd',       'سعد فهد',     'altai',     11, 'مهاجم', 2, 0, 7),
  ('rakan-ali',       'راكان علي',   'altai',      7, 'وسط',   1, 1, 7),
  ('mohammed-ahmed',  'محمد أحمد',   'altai',      5, 'مدافع', 1, 0, 7),
  ('abdullah-omar',   'عبدالله عمر', 'altai',      1, 'حارس',  0, 0, 7),
  -- الخليج
  ('hasan-ahmed',     'حسن أحمد',    'alkhaleej', 10, 'مهاجم', 0, 0, 0),
  ('fahd-abdullah',   'فهد عبدالله', 'alkhaleej',  8, 'وسط',   0, 0, 0),
  ('mohammed-isa',    'محمد عيسى',   'alkhaleej',  4, 'مدافع', 0, 0, 0),
  ('khaled-saeed',    'خالد سعيد',   'alkhaleej',  1, 'حارس',  0, 0, 0),
  -- الرياض
  ('abdulaziz-nour',  'عبدالعزيز نور','alriyadh',  9, 'مهاجم', 0, 0, 0),
  ('majed-saad',      'ماجد سعد',    'alriyadh',   6, 'وسط',   0, 0, 0),
  ('faisal-hasan',    'فيصل حسن',    'alriyadh',   3, 'مدافع', 0, 0, 0),
  ('nasser-ali',      'ناصر علي',    'alriyadh',   1, 'حارس',  0, 0, 0);

-- ═══════════════════════════════════════════════════════════════
-- SETTINGS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO settings (id, name, season)
VALUES (1, 'دوري القرية السنوي', '2026')
ON CONFLICT (id) DO NOTHING;
