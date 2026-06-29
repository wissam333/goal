-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/unvcleinbpoygnhylvvw/sql/new)

-- ═══════════════════════════════════════════════════════════════
-- AUTH MIGRATION (run once after enabling Google OAuth in Dashboard)
-- ═══════════════════════════════════════════════════════════════

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  prediction_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER function to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Add user_id to votes and match_predictions
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE match_predictions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Update unique constraints for user-based voting
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_match_slug_voter_id_key;
ALTER TABLE votes ADD CONSTRAINT votes_match_slug_user_id_key UNIQUE(match_slug, user_id);

ALTER TABLE match_predictions DROP CONSTRAINT IF EXISTS match_predictions_match_slug_voter_id_key;
ALTER TABLE match_predictions ADD CONSTRAINT match_predictions_match_slug_user_id_key UNIQUE(match_slug, user_id);

-- 4. Auto-create profile on user signup
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

-- 5. Set your admin user's role (REPLACE with your admin email)
-- UPDATE profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com' LIMIT 1);

-- ═══════════════════════════════════════════════════════════════
-- INCREMENTAL MIGRATIONS (safe to re-run)
-- ═══════════════════════════════════════════════════════════════

-- 0a. Add ad column to settings (if table already exists from a previous run)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ad JSONB DEFAULT NULL;

-- 0b. Add videos column to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- 0c. Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  snapshot JSONB DEFAULT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  videos JSONB DEFAULT '[]'::jsonb,
  cards JSONB DEFAULT '[]'::jsonb,
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
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "anon_select_seasons" ON seasons;
DROP POLICY IF EXISTS "anon_insert_seasons" ON seasons;
DROP POLICY IF EXISTS "anon_update_seasons" ON seasons;
DROP POLICY IF EXISTS "anon_delete_seasons" ON seasons;

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
CREATE POLICY "anon_select_seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "anon_insert_seasons" ON seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_seasons" ON seasons FOR UPDATE USING (true);
CREATE POLICY "anon_delete_seasons" ON seasons FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════════
-- CLEAR EXISTING DATA (order respects FK constraints)
-- ═══════════════════════════════════════════════════════════════

DELETE FROM seasons;
DELETE FROM match_predictions;
DELETE FROM votes;
DELETE FROM matches;
DELETE FROM players;
DELETE FROM teams;
DELETE FROM settings;

-- ═══════════════════════════════════════════════════════════════
-- SEED: TEAMS (16 teams, 4 groups of 4)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO teams (slug, title, color, "group") VALUES
  -- Group A
  ('alnour',    'النور',    '#22c55e', 'A'),
  ('aytam',     'الأيتام',  '#3b82f6', 'A'),
  ('alqadsia',  'القادسية', '#ef4444', 'A'),
  ('alhilal',   'الهلال',   '#8b5cf6', 'A'),
  -- Group B
  ('alahli',    'الأهلي',   '#14b8a6', 'B'),
  ('alraed',    'الرائد',   '#6366f1', 'B'),
  ('alwehdah',  'الوحدة',   '#a855f7', 'B'),
  ('alokhdood', 'الأخدود',  '#dc2626', 'B'),
  -- Group C
  ('alnasr',    'النصر',    '#eab308', 'C'),
  ('alittihad', 'الاتحاد',  '#f97316', 'C'),
  ('alshabab',  'الشباب',   '#ec4899', 'C'),
  ('alfateh',   'الفتح',    '#06b6d4', 'C'),
  -- Group D
  ('altaawoun', 'التعاون',  '#84cc16', 'D'),
  ('altai',     'الطائي',   '#f59e0b', 'D'),
  ('alkhaleej', 'الخليج',   '#0ea5e9', 'D'),
  ('alriyadh',  'الرياض',   '#64748b', 'D');

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

INSERT INTO settings (id, name, season, "groups", "teamsPerGroup")
VALUES (1, 'دوري القرية السنوي', '2026', '["A","B","C","D"]', 4)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- SEASONS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO seasons (name, slug, is_active, started_at)
VALUES ('2026', '2026', true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- SEED: MATCHES (24 group-stage matches, 6 per group)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers") VALUES

-- ── GROUP A ──────────────────────────────────────────────
-- MD1
('ga-alnour-vs-aytam',    'النور vs الأيتام',    '2026-02-15T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'aytam',    2, 1, '[{"player":"ahmed-hassan","team":"alnour","minute":23},{"player":"yasser-ali","team":"alnour","minute":67},{"player":"faris-nour","team":"aytam","minute":45}]'),
('ga-aytam-vs-alqadsia',  'الأيتام vs القادسية', '2026-02-16T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'aytam', 'alqadsia', 0, 2, '[{"player":"badr-shamari","team":"alqadsia","minute":31},{"player":"faisal-ahmed","team":"alqadsia","minute":78}]'),
-- MD2
('ga-alnour-vs-alqadsia', 'النور vs القادسية',   '2026-02-22T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alqadsia', 1, 1, '[{"player":"khaled-omar","team":"alnour","minute":55},{"player":"abdullah-mohammed","team":"alqadsia","minute":72}]'),
('ga-aytam-vs-alhilal',   'الأيتام vs الهلال',   '2026-02-23T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'aytam', 'alhilal',  2, 2, '[{"player":"hadi-mahmoud","team":"aytam","minute":12},{"player":"sami-ibrahim","team":"aytam","minute":88},{"player":"hasan-ali","team":"alhilal","minute":41},{"player":"mohammed-saad","team":"alhilal","minute":63}]'),
-- MD3
('ga-alnour-vs-alhilal',  'النور vs الهلال',     '2026-03-01T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alhilal',  3, 0, '[{"player":"ahmed-hassan","team":"alnour","minute":17},{"player":"khaled-omar","team":"alnour","minute":34},{"player":"ahmed-hassan","team":"alnour","minute":71}]'),
('ga-alqadsia-vs-alhilal','القادسية vs الهلال',  '2026-03-02T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alqadsia', 'alhilal', 1, 0, '[{"player":"badr-shamari","team":"alqadsia","minute":59}]'),

-- ── GROUP B ──────────────────────────────────────────────
-- MD1
('gb-alahli-vs-alraed',    'الأهلي vs الرائد',    '2026-02-15T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alahli', 'alraed',    2, 0, '[{"player":"ali-nour","team":"alahli","minute":28},{"player":"fahd-saeed","team":"alahli","minute":64}]'),
('gb-alraed-vs-alwehdah',  'الرائد vs الوحدة',    '2026-02-16T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alraed', 'alwehdah',  0, 1, '[{"player":"mohammed-nour","team":"alwehdah","minute":83}]'),
-- MD2
('gb-alahli-vs-alwehdah',  'الأهلي vs الوحدة',    '2026-02-22T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alahli', 'alwehdah',  3, 1, '[{"player":"ali-nour","team":"alahli","minute":15},{"player":"fahd-saeed","team":"alahli","minute":42},{"player":"naser-mohammed","team":"alahli","minute":76},{"player":"khaled-raed","team":"alwehdah","minute":89}]'),
('gb-alraed-vs-alokhdood', 'الرائد vs الأخدود',  '2026-02-23T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alraed', 'alokhdood', 2, 0, '[{"player":"majed-fahd","team":"alraed","minute":33},{"player":"sultan-isa","team":"alraed","minute":51}]'),
-- MD3
('gb-alahli-vs-alokhdood', 'الأهلي vs الأخدود',   '2026-03-01T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alahli', 'alokhdood', 1, 1, '[{"player":"ali-nour","team":"alahli","minute":44},{"player":"nawaf-mohammed","team":"alokhdood","minute":77}]'),
('gb-alwehdah-vs-alokhdood','الوحدة vs الأخدود',  '2026-03-02T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alwehdah', 'alokhdood', 3, 2, '[{"player":"mohammed-nour","team":"alwehdah","minute":9},{"player":"khaled-raed","team":"alwehdah","minute":48},{"player":"abdullah-fahd","team":"alwehdah","minute":90},{"player":"nawaf-mohammed","team":"alokhdood","minute":22},{"player":"fahd-sultan","team":"alokhdood","minute":39}]'),

-- ── GROUP C ──────────────────────────────────────────────
-- MD1
('gc-alnasr-vs-alittihad',  'النصر vs الاتحاد',  '2026-02-15T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alnasr', 'alittihad',  2, 2, '[{"player":"omar-abdullah","team":"alnasr","minute":19},{"player":"zakaria-youssef","team":"alnasr","minute":56},{"player":"abdullah-saad","team":"alittihad","minute":38},{"player":"yousef-nour","team":"alittihad","minute":73}]'),
('gc-alittihad-vs-alshabab','الاتحاد vs الشباب', '2026-02-16T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alittihad', 'alshabab', 1, 0, '[{"player":"abdullah-saad","team":"alittihad","minute":66}]'),
-- MD2
('gc-alnasr-vs-alshabab',   'النصر vs الشباب',   '2026-02-22T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alnasr', 'alshabab',  3, 1, '[{"player":"omar-abdullah","team":"alnasr","minute":11},{"player":"tamer-hassan","team":"alnasr","minute":47},{"player":"zakaria-youssef","team":"alnasr","minute":80},{"player":"nawaf-isa","team":"alshabab","minute":62}]'),
('gc-alittihad-vs-alfateh', 'الاتحاد vs الفتح',   '2026-02-23T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alittihad', 'alfateh',  2, 0, '[{"player":"abdullah-saad","team":"alittihad","minute":25},{"player":"hasan-fahd","team":"alittihad","minute":54}]'),
-- MD3
('gc-alnasr-vs-alfateh',    'النصر vs الفتح',    '2026-03-01T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alnasr', 'alfateh',   4, 0, '[{"player":"omar-abdullah","team":"alnasr","minute":5},{"player":"zakaria-youssef","team":"alnasr","minute":30},{"player":"omar-abdullah","team":"alnasr","minute":58},{"player":"tamer-hassan","team":"alnasr","minute":85}]'),
('gc-alshabab-vs-alfateh',  'الشباب vs الفتح',   '2026-03-02T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alshabab', 'alfateh',  1, 1, '[{"player":"nawaf-isa","team":"alshabab","minute":44},{"player":"ahmed-saeed","team":"alfateh","minute":90}]'),

-- ── GROUP D ──────────────────────────────────────────────
-- MD1
('gd-altaawoun-vs-altai',    'التعاون vs الطائي',    '2026-02-15T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altaawoun', 'altai',     2, 1, '[{"player":"faisal-mohammed","team":"altaawoun","minute":37},{"player":"omar-saad","team":"altaawoun","minute":68},{"player":"saad-fahd","team":"altai","minute":82}]'),
('gd-altai-vs-alkhaleej',    'الطائي vs الخليج',     '2026-02-16T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altai', 'alkhaleej',    1, 1, '[{"player":"rakan-ali","team":"altai","minute":14},{"player":"hasan-ahmed","team":"alkhaleej","minute":61}]'),
-- MD2
('gd-altaawoun-vs-alkhaleej','التعاون vs الخليج',    '2026-02-22T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altaawoun', 'alkhaleej', 3, 0, '[{"player":"faisal-mohammed","team":"altaawoun","minute":26},{"player":"nour-hassan","team":"altaawoun","minute":49},{"player":"omar-saad","team":"altaawoun","minute":74}]'),
('gd-altai-vs-alriyadh',     'الطائي vs الرياض',     '2026-02-23T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altai', 'alriyadh',     2, 0, '[{"player":"saad-fahd","team":"altai","minute":33},{"player":"mohammed-ahmed","team":"altai","minute":77}]'),
-- MD3
('gd-altaawoun-vs-alriyadh', 'التعاون vs الرياض',    '2026-03-01T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altaawoun', 'alriyadh',  0, 0, '[]'),
('gd-alkhaleej-vs-alriyadh', 'الخليج vs الرياض',     '2026-03-02T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'alkhaleej', 'alriyadh', 1, 0, '[{"player":"fahd-abdullah","team":"alkhaleej","minute":53}]');

-- ═══════════════════════════════════════════════════════════════
-- PUSH NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "anon_delete_push_subscriptions" ON push_subscriptions;

CREATE POLICY "anon_insert_push_subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_delete_push_subscriptions" ON push_subscriptions
  FOR DELETE USING (true);

-- ── SUPABASE STORAGE: match-photos bucket ─────────────────
-- Create bucket via Supabase Dashboard: Storage → Create bucket → name "match-photos", public
-- Then run these RLS policies in the SQL Editor:

-- CREATE POLICY "Public Read match-photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'match-photos');
--
-- CREATE POLICY "Auth Upload match-photos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'match-photos' AND auth.role() = 'authenticated'
--   );

-- ═══════════════════════════════════════════════════════════════
-- PREDICTION POINTS (run after enabling Auth migration above)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_prediction_points(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET prediction_points = COALESCE(prediction_points, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- RETROACTIVE: Award MOTM points for past matches
-- Run this ONCE after deploying the MOTM points fix.
-- Awards 1 point per user for each correct MOTM prediction in played matches.
-- ═══════════════════════════════════════════════════════════════
-- One-time retroactive: correct MOTM predictions
UPDATE profiles
SET prediction_points = COALESCE(prediction_points, 0) + sub.cnt
FROM (
  SELECT v.user_id, COUNT(*)::int AS cnt
  FROM matches m
  JOIN votes v ON v.match_slug = m.slug AND v.player_slug = m."motmWinner"
  WHERE m.status = 'played'
    AND m."motmWinner" IS NOT NULL
    AND v.user_id IS NOT NULL
  GROUP BY v.user_id
) sub
WHERE profiles.id = sub.user_id;

-- One-time retroactive: correct match winner predictions (including draws)
UPDATE profiles
SET prediction_points = COALESCE(prediction_points, 0) + sub.cnt
FROM (
  SELECT mp.user_id, COUNT(*)::int AS cnt
  FROM matches m
  JOIN match_predictions mp ON mp.match_slug = m.slug
    AND mp.team_slug = CASE
      WHEN m."homeScore" > m."awayScore" THEN m."homeTeam"
      WHEN m."awayScore" > m."homeScore" THEN m."awayTeam"
      ELSE '__draw__'
    END
  WHERE m.status = 'played'
    AND m."homeScore" IS NOT NULL
    AND m."awayScore" IS NOT NULL
    AND mp.user_id IS NOT NULL
  GROUP BY mp.user_id
) sub
WHERE profiles.id = sub.user_id;

-- ═══════════════════════════════════════════════════════════════
-- MANAGERS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS managers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  team_slug TEXT NOT NULL REFERENCES teams(slug) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE managers DISABLE ROW LEVEL SECURITY;
