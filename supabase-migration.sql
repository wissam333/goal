-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/unvcleinbpoygnhylvvw/sql/new)

-- ═══════════════════════════════════════════════════════════════
-- SCHEMA
-- ═══════════════════════════════════════════════════════════════

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
  "motmCandidates" JSONB DEFAULT '[]'::jsonb,
  "motmWinner" TEXT,
  album JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Votes table (for MOTM voting)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_slug TEXT REFERENCES matches(slug) ON DELETE CASCADE,
  player_slug TEXT REFERENCES players(slug) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_slug, player_slug)
);

-- 5. Settings table
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'دوري القرية السنوي',
  season TEXT DEFAULT '2026',
  "groups" JSONB DEFAULT '["A","B"]'::jsonb,
  "teamsPerGroup" INTEGER DEFAULT 4,
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
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
DROP POLICY IF EXISTS "anon_select_players" ON players;
DROP POLICY IF EXISTS "anon_select_matches" ON matches;
DROP POLICY IF EXISTS "anon_select_votes" ON votes;
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
DROP POLICY IF EXISTS "anon_update_teams" ON teams;
DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
DROP POLICY IF EXISTS "anon_insert_players" ON players;
DROP POLICY IF EXISTS "anon_update_players" ON players;
DROP POLICY IF EXISTS "anon_delete_players" ON players;
DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
DROP POLICY IF EXISTS "anon_update_matches" ON matches;
DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;

CREATE POLICY "anon_select_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "anon_select_players" ON players FOR SELECT USING (true);
CREATE POLICY "anon_select_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "anon_select_votes" ON votes FOR SELECT USING (true);
CREATE POLICY "anon_select_settings" ON settings FOR SELECT USING (true);
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_teams"   ON teams   FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_teams"   ON teams   FOR UPDATE USING (true);
CREATE POLICY "anon_delete_teams"   ON teams   FOR DELETE USING (true);
CREATE POLICY "anon_insert_players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_players" ON players FOR UPDATE USING (true);
CREATE POLICY "anon_delete_players" ON players FOR DELETE USING (true);
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE USING (true);
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE USING (true);
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════════
-- CLEAR EXISTING DATA (order respects FK constraints)
-- ═══════════════════════════════════════════════════════════════

DELETE FROM votes;
DELETE FROM matches;
DELETE FROM players;
DELETE FROM teams;
DELETE FROM settings;

-- ═══════════════════════════════════════════════════════════════
-- SEED: TEAMS (12 teams, groups A & B)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO teams (slug, title, color, "group") VALUES
  ('alnour',    'النور',    '#22c55e', 'A'),
  ('aytam',     'الأيتام',  '#3b82f6', 'A'),
  ('alqadsia',  'القادسية', '#ef4444', 'A'),
  ('alhilal',   'الهلال',   '#8b5cf6', 'A'),
  ('alahli',    'الأهلي',   '#14b8a6', 'A'),
  ('alraed',    'الرائد',   '#6366f1', 'A'),
  ('alnasr',    'النصر',    '#eab308', 'B'),
  ('alittihad', 'الاتحاد',  '#f97316', 'B'),
  ('alshabab',  'الشباب',   '#ec4899', 'B'),
  ('alfateh',   'الفتح',    '#06b6d4', 'B'),
  ('altaawoun', 'التعاون',  '#84cc16', 'B'),
  ('altai',     'الطائي',   '#f59e0b', 'B');

-- ═══════════════════════════════════════════════════════════════
-- SEED: PLAYERS (4 per team = 48)
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
  ('abdullah-omar',   'عبدالله عمر', 'altai',      1, 'حارس',  0, 0, 7);

-- ═══════════════════════════════════════════════════════════════
-- SEED: MATCHES (37 total)
-- ═══════════════════════════════════════════════════════════════

-- GROUP A — Matchday 1 (Apr 10)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('ga1-alnour-vs-aytam',     'النور vs الأيتام',      '2026-04-10T17:00:00+00:00', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'aytam', 2, 0, '[{"player":"ahmed-hassan","team":"alnour","minute":23},{"player":"khaled-omar","team":"alnour","minute":67}]'::jsonb, '["ahmed-hassan","khaled-omar","nour-saeed"]'::jsonb, 'ahmed-hassan'),
('ga1-alqadsia-vs-alhilal', 'القادسية vs الهلال',    '2026-04-10T19:00:00+00:00', 'A', 'الملعب الفرعي',  'played', 'alqadsia', 'alhilal', 1, 1, '[{"player":"badr-shamari","team":"alqadsia","minute":15},{"player":"hasan-ali","team":"alhilal","minute":78}]'::jsonb, '["badr-shamari","hasan-ali","saed-ahmed"]'::jsonb, 'badr-shamari'),
('ga1-alahli-vs-alraed',    'الأهلي vs الرائد',       '2026-04-10T17:00:00+00:00', 'A', 'ملعب النادي',     'played', 'alahli', 'alraed', 3, 1, '[{"player":"ali-nour","team":"alahli","minute":12},{"player":"fahd-saeed","team":"alahli","minute":34},{"player":"ali-nour","team":"alahli","minute":55},{"player":"majed-fahd","team":"alraed","minute":89}]'::jsonb, '["ali-nour","fahd-saeed","khaled-ibrahim"]'::jsonb, 'ali-nour');

-- GROUP A — Matchday 2 (Apr 13)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('ga2-alnour-vs-alqadsia',  'النور vs القادسية',     '2026-04-13T17:00:00+00:00', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alqadsia', 1, 1, '[{"player":"khaled-omar","team":"alnour","minute":44},{"player":"badr-shamari","team":"alqadsia","minute":62}]'::jsonb, '["khaled-omar","badr-shamari","nour-saeed"]'::jsonb, 'khaled-omar'),
('ga2-aytam-vs-alahli',     'الأيتام vs الأهلي',     '2026-04-13T19:00:00+00:00', 'A', 'الملعب الفرعي',  'played', 'aytam', 'alahli', 2, 2, '[{"player":"faris-nour","team":"aytam","minute":10},{"player":"hadi-mahmoud","team":"aytam","minute":30},{"player":"fahd-saeed","team":"alahli","minute":55},{"player":"ali-nour","team":"alahli","minute":80}]'::jsonb, '["faris-nour","ali-nour","fahd-saeed"]'::jsonb, 'faris-nour'),
('ga2-alhilal-vs-alraed',   'الهلال vs الرائد',      '2026-04-13T17:00:00+00:00', 'A', 'ملعب النادي',     'played', 'alhilal', 'alraed', 2, 0, '[{"player":"hasan-ali","team":"alhilal","minute":28},{"player":"mohammed-saad","team":"alhilal","minute":73}]'::jsonb, '["hasan-ali","mohammed-saad","omar-hassan"]'::jsonb, 'hasan-ali');

-- GROUP A — Matchday 3 (Apr 17)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('ga3-alnour-vs-alahli',    'النور vs الأهلي',       '2026-04-17T17:00:00+00:00', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alahli', 3, 0, '[{"player":"ahmed-hassan","team":"alnour","minute":8},{"player":"ahmed-hassan","team":"alnour","minute":41},{"player":"khaled-omar","team":"alnour","minute":76}]'::jsonb, '["ahmed-hassan","khaled-omar","nour-saeed"]'::jsonb, 'ahmed-hassan'),
('ga3-alqadsia-vs-alraed',  'القادسية vs الرائد',    '2026-04-17T19:00:00+00:00', 'A', 'الملعب الفرعي',  'played', 'alqadsia', 'alraed', 2, 0, '[{"player":"badr-shamari","team":"alqadsia","minute":33},{"player":"abdullah-mohammed","team":"alqadsia","minute":70}]'::jsonb, '["badr-shamari","abdullah-mohammed","lama-saad"]'::jsonb, 'badr-shamari'),
('ga3-aytam-vs-alhilal',    'الأيتام vs الهلال',     '2026-04-17T17:00:00+00:00', 'A', 'ملعب النادي',     'played', 'aytam', 'alhilal', 1, 1, '[{"player":"sami-ibrahim","team":"aytam","minute":15},{"player":"hasan-ali","team":"alhilal","minute":60}]'::jsonb, '["sami-ibrahim","hasan-ali","marwan-hassan"]'::jsonb, 'sami-ibrahim');

-- GROUP A — Matchday 4 (Apr 20)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('ga4-alnour-vs-alhilal',   'النور vs الهلال',       '2026-04-20T17:00:00+00:00', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alhilal', 2, 1, '[{"player":"ahmed-hassan","team":"alnour","minute":14},{"player":"yasser-ali","team":"alnour","minute":52},{"player":"hasan-ali","team":"alhilal","minute":81}]'::jsonb, '["ahmed-hassan","yasser-ali","hasan-ali"]'::jsonb, 'ahmed-hassan'),
('ga4-alqadsia-vs-alahli',  'القادسية vs الأهلي',    '2026-04-20T19:00:00+00:00', 'A', 'الملعب الفرعي',  'played', 'alqadsia', 'alahli', 0, 0, '[]'::jsonb, '["lama-saad","khaled-ibrahim","faisal-ahmed"]'::jsonb, 'lama-saad'),
('ga4-aytam-vs-alraed',     'الأيتام vs الرائد',     '2026-04-20T17:00:00+00:00', 'A', 'ملعب النادي',     'played', 'aytam', 'alraed', 2, 1, '[{"player":"faris-nour","team":"aytam","minute":25},{"player":"faris-nour","team":"aytam","minute":67},{"player":"sultan-isa","team":"alraed","minute":88}]'::jsonb, '["faris-nour","sultan-isa","hadi-mahmoud"]'::jsonb, 'faris-nour');

-- GROUP A — Matchday 5 (Apr 24)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('ga5-alnour-vs-alraed',    'النور vs الرائد',       '2026-04-24T17:00:00+00:00', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alraed', 3, 0, '[{"player":"ahmed-hassan","team":"alnour","minute":11},{"player":"khaled-omar","team":"alnour","minute":39},{"player":"ahmed-hassan","team":"alnour","minute":74}]'::jsonb, '["ahmed-hassan","khaled-omar","yasser-ali"]'::jsonb, 'ahmed-hassan'),
('ga5-alqadsia-vs-aytam',   'القادسية vs الأيتام',   '2026-04-24T19:00:00+00:00', 'A', 'الملعب الفرعي',  'played', 'alqadsia', 'aytam', 2, 0, '[{"player":"badr-shamari","team":"alqadsia","minute":18},{"player":"abdullah-mohammed","team":"alqadsia","minute":55}]'::jsonb, '["badr-shamari","abdullah-mohammed","faisal-ahmed"]'::jsonb, 'badr-shamari'),
('ga5-alhilal-vs-alahli',   'الهلال vs الأهلي',      '2026-04-24T17:00:00+00:00', 'A', 'ملعب النادي',     'played', 'alhilal', 'alahli', 0, 0, '[]'::jsonb, '["saed-ahmed","khaled-ibrahim","omar-hassan"]'::jsonb, 'saed-ahmed');

-- GROUP B — Matchday 1 (Apr 11)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('gb1-alnasr-vs-alittihad',   'النصر vs الاتحاد',     '2026-04-11T17:00:00+00:00', 'B', 'الملعب الرئيسي', 'played', 'alnasr', 'alittihad', 1, 0, '[{"player":"omar-abdullah","team":"alnasr","minute":63}]'::jsonb, '["omar-abdullah","mohammed-ali","abdullah-saad"]'::jsonb, 'omar-abdullah'),
('gb1-alshabab-vs-alfateh',  'الشباب vs الفتح',      '2026-04-11T19:00:00+00:00', 'B', 'الملعب الفرعي',  'played', 'alshabab', 'alfateh', 2, 0, '[{"player":"nawaf-isa","team":"alshabab","minute":22},{"player":"saad-ali","team":"alshabab","minute":71}]'::jsonb, '["nawaf-isa","saad-ali","fahd-ahmed"]'::jsonb, 'nawaf-isa'),
('gb1-altaawoun-vs-altai',   'التعاون vs الطائي',     '2026-04-11T17:00:00+00:00', 'B', 'ملعب النادي',     'played', 'altaawoun', 'altai', 0, 0, '[]'::jsonb, '["mishaal-hasan","abdullah-omar","faisal-mohammed"]'::jsonb, 'mishaal-hasan');

-- GROUP B — Matchday 2 (Apr 14)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('gb2-alnasr-vs-alshabab',   'النصر vs الشباب',      '2026-04-14T17:00:00+00:00', 'B', 'الملعب الرئيسي', 'played', 'alnasr', 'alshabab', 2, 1, '[{"player":"omar-abdullah","team":"alnasr","minute":8},{"player":"zakaria-youssef","team":"alnasr","minute":45},{"player":"nawaf-isa","team":"alshabab","minute":33}]'::jsonb, '["omar-abdullah","zakaria-youssef","nawaf-isa"]'::jsonb, 'omar-abdullah'),
('gb2-alittihad-vs-altaawoun','الاتحاد vs التعاون',   '2026-04-14T19:00:00+00:00', 'B', 'الملعب الفرعي',  'played', 'alittihad', 'altaawoun', 2, 1, '[{"player":"abdullah-saad","team":"alittihad","minute":20},{"player":"abdullah-saad","team":"alittihad","minute":65},{"player":"faisal-mohammed","team":"altaawoun","minute":82}]'::jsonb, '["abdullah-saad","yousef-nour","faisal-mohammed"]'::jsonb, 'abdullah-saad'),
('gb2-alfateh-vs-altai',     'الفتح vs الطائي',      '2026-04-14T17:00:00+00:00', 'B', 'ملعب النادي',     'played', 'alfateh', 'altai', 1, 0, '[{"player":"ahmed-saeed","team":"alfateh","minute":43}]'::jsonb, '["ahmed-saeed","saeed-ali","rakan-ali"]'::jsonb, 'ahmed-saeed');

-- GROUP B — Matchday 3 (Apr 18)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('gb3-alnasr-vs-altaawoun',  'النصر vs التعاون',     '2026-04-18T17:00:00+00:00', 'B', 'الملعب الرئيسي', 'played', 'alnasr', 'altaawoun', 3, 1, '[{"player":"omar-abdullah","team":"alnasr","minute":5},{"player":"tamer-hassan","team":"alnasr","minute":41},{"player":"omar-abdullah","team":"alnasr","minute":77},{"player":"omar-saad","team":"altaawoun","minute":60}]'::jsonb, '["omar-abdullah","tamer-hassan","omar-saad"]'::jsonb, 'omar-abdullah'),
('gb3-alshabab-vs-altai',    'الشباب vs الطائي',     '2026-04-18T19:00:00+00:00', 'B', 'الملعب الفرعي',  'played', 'alshabab', 'altai', 1, 0, '[{"player":"nawaf-isa","team":"alshabab","minute":47}]'::jsonb, '["nawaf-isa","fahd-ahmed","abdullah-omar"]'::jsonb, 'nawaf-isa'),
('gb3-alittihad-vs-alfateh', 'الاتحاد vs الفتح',     '2026-04-18T17:00:00+00:00', 'B', 'ملعب النادي',     'played', 'alittihad', 'alfateh', 1, 1, '[{"player":"abdullah-saad","team":"alittihad","minute":28},{"player":"khaled-fahd","team":"alfateh","minute":73}]'::jsonb, '["abdullah-saad","khaled-fahd","saeed-ali"]'::jsonb, 'khaled-fahd');

-- GROUP B — Matchday 4 (Apr 21)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('gb4-alnasr-vs-alfateh',    'النصر vs الفتح',       '2026-04-21T17:00:00+00:00', 'B', 'الملعب الرئيسي', 'played', 'alnasr', 'alfateh', 0, 0, '[]'::jsonb, '["mohammed-ali","saeed-ali","zakaria-youssef"]'::jsonb, 'mohammed-ali'),
('gb4-alshabab-vs-altaawoun','الشباب vs التعاون',    '2026-04-21T19:00:00+00:00', 'B', 'الملعب الفرعي',  'played', 'alshabab', 'altaawoun', 0, 0, '[]'::jsonb, '["fahd-ahmed","mishaal-hasan","mohammed-omar"]'::jsonb, 'fahd-ahmed'),
('gb4-alittihad-vs-altai',   'الاتحاد vs الطائي',    '2026-04-21T17:00:00+00:00', 'B', 'ملعب النادي',     'played', 'alittihad', 'altai', 2, 0, '[{"player":"abdullah-saad","team":"alittihad","minute":14},{"player":"yousef-nour","team":"alittihad","minute":53}]'::jsonb, '["abdullah-saad","yousef-nour","ali-mohammed"]'::jsonb, 'abdullah-saad');

-- GROUP B — Matchday 5 (Apr 25)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('gb5-alnasr-vs-altai',       'النصر vs الطائي',     '2026-04-25T17:00:00+00:00', 'B', 'الملعب الرئيسي', 'played', 'alnasr', 'altai', 3, 0, '[{"player":"omar-abdullah","team":"alnasr","minute":16},{"player":"zakaria-youssef","team":"alnasr","minute":44},{"player":"omar-abdullah","team":"alnasr","minute":71}]'::jsonb, '["omar-abdullah","zakaria-youssef","mohammed-ali"]'::jsonb, 'omar-abdullah'),
('gb5-alshabab-vs-alittihad','الشباب vs الاتحاد',    '2026-04-25T19:00:00+00:00', 'B', 'الملعب الفرعي',  'played', 'alshabab', 'alittihad', 1, 2, '[{"player":"saad-ali","team":"alshabab","minute":38},{"player":"abdullah-saad","team":"alittihad","minute":22},{"player":"hasan-fahd","team":"alittihad","minute":79}]'::jsonb, '["abdullah-saad","saad-ali","hasan-fahd"]'::jsonb, 'abdullah-saad'),
('gb5-alfateh-vs-altaawoun', 'الفتح vs التعاون',     '2026-04-25T17:00:00+00:00', 'B', 'ملعب النادي',     'played', 'alfateh', 'altaawoun', 1, 1, '[{"player":"ahmed-saeed","team":"alfateh","minute":32},{"player":"faisal-mohammed","team":"altaawoun","minute":69}]'::jsonb, '["ahmed-saeed","faisal-mohammed","saeed-ali"]'::jsonb, 'faisal-mohammed');

-- QUARTER-FINALS (May 2–3)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('qf1-alnour-vs-alshabab',   'ربع النهائي: النور vs الشباب',   '2026-05-02T17:00:00+00:00', 'QF', 'الملعب الرئيسي', 'played', 'alnour', 'alshabab', 2, 0, '[{"player":"ahmed-hassan","team":"alnour","minute":35},{"player":"khaled-omar","team":"alnour","minute":72}]'::jsonb, '["ahmed-hassan","khaled-omar","nour-saeed"]'::jsonb, 'ahmed-hassan'),
('qf2-alittihad-vs-alqadsia','ربع النهائي: الاتحاد vs القادسية','2026-05-02T19:00:00+00:00', 'QF', 'الملعب الفرعي',  'played', 'alittihad', 'alqadsia', 0, 0, '[]'::jsonb, '["abdullah-saad","badr-shamari","lama-saad"]'::jsonb, 'lama-saad'),
('qf3-alnasr-vs-alraed',     'ربع النهائي: النصر vs الرائد',   '2026-05-03T17:00:00+00:00', 'QF', 'الملعب الرئيسي', 'played', 'alnasr', 'alraed', 2, 0, '[{"player":"omar-abdullah","team":"alnasr","minute":18},{"player":"zakaria-youssef","team":"alnasr","minute":66}]'::jsonb, '["omar-abdullah","zakaria-youssef","mohammed-ali"]'::jsonb, 'omar-abdullah'),
('qf4-alahli-vs-aytam',      'ربع النهائي: الأهلي vs الأيتام', '2026-05-03T19:00:00+00:00', 'QF', 'الملعب الفرعي',  'played', 'alahli', 'aytam', 1, 2, '[{"player":"naser-mohammed","team":"alahli","minute":41},{"player":"faris-nour","team":"aytam","minute":22},{"player":"hadi-mahmoud","team":"aytam","minute":76}]'::jsonb, '["faris-nour","hadi-mahmoud","naser-mohammed"]'::jsonb, 'faris-nour');

-- SEMI-FINALS (May 9–10)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('sf1-alnour-vs-alqadsia', 'نصف النهائي: النور vs القادسية', '2026-05-09T17:00:00+00:00', 'SF', 'الملعب الرئيسي', 'played', 'alnour', 'alqadsia', 1, 0, '[{"player":"ahmed-hassan","team":"alnour","minute":83}]'::jsonb, '["ahmed-hassan","nour-saeed","badr-shamari"]'::jsonb, 'nour-saeed'),
('sf2-alnasr-vs-aytam',    'نصف النهائي: النصر vs الأيتام',  '2026-05-10T19:00:00+00:00', 'SF', 'الملعب الرئيسي', 'played', 'alnasr', 'aytam', 2, 1, '[{"player":"omar-abdullah","team":"alnasr","minute":27},{"player":"omar-abdullah","team":"alnasr","minute":60},{"player":"faris-nour","team":"aytam","minute":40}]'::jsonb, '["omar-abdullah","faris-nour","zakaria-youssef"]'::jsonb, 'omar-abdullah');

-- FINAL (June 6 — upcoming)
INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers", "motmCandidates", "motmWinner") VALUES
('f-alnour-vs-alnasr', 'النهائي: النور vs النصر', '2026-06-06T20:00:00+00:00', 'F', 'الملعب الرئيسي', 'upcoming', 'alnour', 'alnasr', NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL);

-- ═══════════════════════════════════════════════════════════════
-- SETTINGS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO settings (id, name, season)
VALUES (1, 'دوري القرية السنوي', '2026')
ON CONFLICT (id) DO NOTHING;
