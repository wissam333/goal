-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/unvcleinbpoygnhylvvw/sql/new)

-- 1. Teams table
CREATE TABLE IF NOT EXISTS teams (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Matches table
CREATE TABLE IF NOT EXISTS matches (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ,
  "group" TEXT,
  venue TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'played', 'live')),
  homeTeam TEXT REFERENCES teams(slug),
  awayTeam TEXT REFERENCES teams(slug),
  homeScore INTEGER,
  awayScore INTEGER,
  goalScorers JSONB DEFAULT '[]'::jsonb,
  motmCandidates JSONB DEFAULT '[]'::jsonb,
  motmWinner TEXT,
  album JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Votes table (existing - for MOTM voting)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_slug TEXT REFERENCES matches(slug) ON DELETE CASCADE,
  player_slug TEXT REFERENCES players(slug) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_slug, player_slug)
);

-- 5. Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'دوري القرية السنوي',
  season TEXT DEFAULT '2026',
  "groups" JSONB DEFAULT '["A","B"]'::jsonb,
  "teamsPerGroup" INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings row
INSERT INTO settings (id, name, season)
VALUES (1, 'دوري القرية السنوي', '2026')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access for all tables
CREATE POLICY "anon_select_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "anon_select_players" ON players FOR SELECT USING (true);
CREATE POLICY "anon_select_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "anon_select_votes" ON votes FOR SELECT USING (true);
CREATE POLICY "anon_select_settings" ON settings FOR SELECT USING (true);

-- Allow anonymous insert for votes (for MOTM voting)
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT WITH CHECK (true);

-- Admin CRUD policies (anonymous — admin password is enforced client-side)
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
